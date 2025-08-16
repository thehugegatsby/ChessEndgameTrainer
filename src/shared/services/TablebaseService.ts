/**
 * Optimized Tablebase Service - Single API Call Architecture
 *
 * @remarks
 * This service uses the Lichess Tablebase API's "moves" field to get all move
 * evaluations in a single API call, instead of making N+1 calls.
 *
 * Key improvements:
 * - 1 API call instead of 20-40 for getTopMoves
 * - Caches complete tablebase entries including moves
 * - Correct WDL perspective handling
 * - No chess.js dependency for move generation
 * - FEN normalization for improved cache hit rate
 *
 * Important limitations:
 * - DTM (Distance to Mate) values are only available for positions with ≤5 pieces
 * - Positions with 6-7 pieces only have DTZ (Distance to Zeroing) values
 * - Rate limiting applies (~130 rapid requests trigger limits)
 */

import { validateAndSanitizeFen } from '../utils/fenValidator';
import { getLogger } from '../services/logging';
import { APP_CONFIG } from '@/config/constants';
import { type Result, ok, err, isErr, AppError } from '@shared/utils/result';
// Removed unused imports - Zod validation now handled by LichessApiClient
import { LichessApiClient, LichessApiError, LichessApiTimeoutError } from './api/LichessApiClient';
import type { CacheManager } from '../lib/cache/types';
import { LRUCacheManager } from '../lib/cache/LRUCacheManager';
import { HTTP_CONFIG, HTTP_RETRY } from '@shared/constants/http.constants';
import { CACHE_SIZES, CACHE_TTL } from '@shared/constants/cache';
import { INPUT_LIMITS } from '@shared/constants/validation.constants';
import { CHESS_EVALUATION } from '@shared/constants/multipliers';
import { HTTP_STATUS } from '../../constants/api.constants';
import type {
  LichessTablebaseResponse,
  TablebaseEntry,
  TablebaseCategory,
  TablebaseCacheEntry,
  TablebaseMoveInternal,
  TablebaseMove,
  TablebaseResult,
  TablebaseEvaluation,
  TablebaseMovesResult,
} from '../types/tablebase';

// Re-export types for backward compatibility
export type { TablebaseMove, TablebaseResult, TablebaseEvaluation, TablebaseMovesResult };

const logger = getLogger().setContext('TablebaseService');

// Tablebase configuration constants
const MAX_PIECES_IN_TABLEBASE = 7; // Lichess uses 7-piece Syzygy tablebases

class TablebaseService {
  private readonly cacheManager: CacheManager<string, TablebaseCacheEntry>;
  private readonly maxPieces = MAX_PIECES_IN_TABLEBASE;
  private readonly cacheTtl = CACHE_TTL.EXTENDED;
  private pendingRequests = new Map<string, Promise<TablebaseEntry | null>>();

  private readonly apiClient: LichessApiClient;

  constructor(
    apiClient?: LichessApiClient,
    cacheManager?: CacheManager<string, TablebaseCacheEntry>
  ) {
    // Use provided client or create default instance
    this.apiClient =
      apiClient ||
      new LichessApiClient({
        baseUrl: APP_CONFIG.TABLEBASE_API_URL,
        timeoutMs: HTTP_CONFIG.REQUEST_TIMEOUT_SHORT,
        maxRetries: HTTP_RETRY.MAX_RETRIES,
        maxBackoffMs:
          HTTP_RETRY.BACKOFF_BASE_DELAY *
          Math.pow(HTTP_RETRY.BACKOFF_FACTOR, HTTP_RETRY.MAX_BACKOFF_EXPONENT),
      });

    // Use provided cache manager or create default LRU cache
    this.cacheManager =
      cacheManager ||
      new LRUCacheManager<string, TablebaseCacheEntry>(
        CACHE_SIZES.LARGE, // maxSize (same as before)
        this.cacheTtl // defaultTtlMs (extended timeout)
      );
  }

  // Metrics for monitoring
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    apiErrors: new Map<number, number>(),
    requestsDeduplicated: 0,

    recordCacheHit() {
      this.cacheHits++;
    },
    recordCacheMiss() {
      this.cacheMisses++;
    },
    recordApiCall() {
      this.apiCalls++;
    },
    recordApiError(status: number) {
      this.apiErrors.set(status, (this.apiErrors.get(status) || 0) + 1);
    },
    recordDeduplication() {
      this.requestsDeduplicated++;
    },

    getMetrics() {
      const total = this.cacheHits + this.cacheMisses;
      return {
        cacheHitRate: total > 0 ? this.cacheHits / total : 0,
        totalApiCalls: this.apiCalls,
        errorBreakdown: Object.fromEntries(this.apiErrors),
        dedupedRequests: this.requestsDeduplicated,
      };
    },
  };

  /**
   * Get tablebase evaluation for a position
   * @param {string} fen - Position in FEN notation
   * @returns {Promise<TablebaseEvaluation>} Evaluation result
   *
   * @example
   * const eval = await tablebaseService.getEvaluation(fen);
   * if (eval.isAvailable) {
   *   logger.info(`Position is ${eval.result.category}`);
   * }
   */
  async getEvaluation(fen: string): Promise<TablebaseEvaluation> {
    // Adapter pattern: internal Result, external legacy API
    const result = await this._getEvaluationInternal(fen);

    if (isErr(result)) {
      return {
        isAvailable: false,
        error: result.error.message,
      };
    }

    if (!result.value) {
      return { isAvailable: false };
    }

    return {
      isAvailable: true,
      result: result.value,
    };
  }

  /**
   * Internal implementation using Result pattern
   * @private
   */
  private async _getEvaluationInternal(
    fen: string
  ): Promise<Result<TablebaseResult | null, AppError>> {
    try {
      const entry = await this._getOrFetchTablebaseEntry(fen);

      if (!entry) {
        return ok(null);
      }

      return ok({
        wdl: entry.position.wdl,
        dtz: entry.position.dtz,
        dtm: entry.position.dtm,
        category: entry.position.category,
        precise: entry.position.precise,
        evaluation: entry.position.evaluation,
      });
    } catch (error) {
      logger.error('Failed to get evaluation', error as Error, { fen });
      return err(
        new AppError(error instanceof Error ? error.message : 'Unknown error', {
          fen,
          operation: 'getEvaluation',
        })
      );
    }
  }

  /**
   * Get top moves from tablebase
   * @param {string} fen - Position in FEN notation
   * @param {number} limit - Maximum number of moves to return
   * @returns {Promise<TablebaseMovesResult>} Top moves with evaluations
   *
   * @remarks
   * This now makes only ONE API call and returns moves from the cached entry.
   * The Lichess API already provides all moves sorted by quality.
   *
   * @example
   * const moves = await tablebaseService.getTopMoves(fen, 5);
   * if (moves.isAvailable) {
   *   logger.info(`Best move: ${moves.moves[0].san}`);
   * }
   */
  async getTopMoves(fen: string, limit: number = 3): Promise<TablebaseMovesResult> {
    // Adapter pattern: internal Result, external legacy API
    const result = await this._getTopMovesInternal(fen, limit);

    if (isErr(result)) {
      return {
        isAvailable: false,
        error: result.error.message,
      };
    }

    if (!result.value) {
      return {
        isAvailable: false,
        error: 'No moves available for this position',
      };
    }

    return {
      isAvailable: true,
      moves: result.value,
    };
  }

  /**
   * Internal implementation using Result pattern
   * @private
   */
  private async _getTopMovesInternal(
    fen: string,
    limit: number = 3
  ): Promise<Result<TablebaseMove[] | null, AppError>> {
    try {
      const entry = await this._getOrFetchTablebaseEntry(fen);

      if (!entry || !entry.moves.length) {
        return ok(null);
      }

      // Sort moves using hierarchical ranking: WDL → DTZ → DTM
      const sortedMoves = [...entry.moves].sort((a, b) => this._compareTablebaseMoves(a, b));

      // Take only the best moves (same WDL as the absolute best)
      const bestWdl = sortedMoves[0]?.wdl ?? 0;
      const bestMoves = sortedMoves.filter(move => move.wdl === bestWdl);

      // Return up to 'limit' of the best moves
      const topInternalMoves = bestMoves.slice(0, limit);

      // Convert internal moves to external format (without zeroing field)
      const topMoves: TablebaseMove[] = topInternalMoves.map(move => ({
        uci: move.uci,
        san: move.san,
        wdl: move.wdl,
        dtz: move.dtz,
        dtm: move.dtm,
        category: move.category,
      }));

      // ENHANCED DEBUG LOGGING
      logger.info('TablebaseService.getTopMoves DETAILED OUTPUT', {
        fen,
        requestedLimit: limit,
        totalMovesFromAPI: entry.moves.length,
        bestWdl,
        movesWithBestWdl: bestMoves.length,
        returnedMoves: topMoves.length,
        returnedMoveDetails: topMoves.map(m => ({
          san: m.san,
          wdl: m.wdl,
          dtm: m.dtm,
          category: m.category,
        })),
        sortingApplied: (() => {
          if (bestWdl < 0) return 'Defensive (highest DTM first)';
          if (bestWdl > 0) return 'Offensive (lowest DTM first)';
          return 'Draw';
        })(),
      });

      return ok(topMoves);
    } catch (error) {
      logger.error('Failed to get top moves', error as Error, { fen });
      return err(
        new AppError(error instanceof Error ? error.message : 'Unknown error', {
          fen,
          limit,
          operation: 'getTopMoves',
        })
      );
    }
  }

  /**
   * Normalize FEN for tablebase lookup
   * @private
   * @param {string} fen - Full FEN string
   * @returns {string} Normalized FEN (first 4 fields only)
   *
   * @remarks
   * Tablebase only cares about:
   * 1. Piece placement
   * 2. Side to move
   * 3. Castling rights
   * 4. En passant square
   *
   * Halfmove clock and fullmove number are irrelevant for tablebase lookup
   */
  private _normalizeFen(fen: string): string {
    return fen.split(' ').slice(0, 4).join(' ');
  }

  /**
   * Core method to fetch or retrieve cached tablebase data
   * @private
   * @param {string} fen - Position to look up
   * @returns {Promise<TablebaseEntry | null>} Complete tablebase data or null
   *
   * @remarks
   * This method:
   * 1. Validates and normalizes the FEN
   * 2. Checks the cache
   * 3. Makes ONE API call if needed
   * 4. Transforms the response to our internal format
   * 5. Caches the complete entry including all moves
   */
  private _getOrFetchTablebaseEntry(fen: string): Promise<TablebaseEntry | null> {
    // Validate FEN
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      throw new Error(`Invalid FEN: ${validation.errors.join(', ')}`);
    }
    const sanitizedFen = validation.sanitized;
    const normalizedFen = this._normalizeFen(sanitizedFen);

    // Check piece count
    const pieceCount = this._countPieces(sanitizedFen);
    if (pieceCount > this.maxPieces) {
      logger.debug('Too many pieces for tablebase', {
        fen: sanitizedFen,
        pieceCount,
      });
      return Promise.resolve(null);
    }

    // Check cache with normalized FEN
    const cached = this.cacheManager.get(normalizedFen);
    if (cached) {
      logger.debug('Cache hit for tablebase entry', { fen: normalizedFen });
      this.metrics.recordCacheHit();
      return Promise.resolve(cached.entry);
    }
    this.metrics.recordCacheMiss();

    // Check if request already in flight (request deduplication)
    const pending = this.pendingRequests.get(normalizedFen);
    if (pending) {
      logger.debug('Request already in flight, waiting', {
        fen: normalizedFen,
      });
      this.metrics.recordDeduplication();
      return pending;
    }

    // Create new request with proper cleanup on both success and failure
    const request = this._fetchAndTransform(sanitizedFen, normalizedFen);

    // Store the promise with cleanup handler
    const promiseWithCleanup = request.finally(() => {
      // Remove from pending requests on both success and failure
      this.pendingRequests.delete(normalizedFen);
    });

    this.pendingRequests.set(normalizedFen, promiseWithCleanup);
    return promiseWithCleanup;
  }

  /**
   * Fetch from API and transform response
   * @private
   * @param {string} fen - Original sanitized FEN for API call
   * @param {string} normalizedFen - Normalized FEN for caching
   */
  private async _fetchAndTransform(
    fen: string,
    normalizedFen: string
  ): Promise<TablebaseEntry | null> {
    this.metrics.recordApiCall();

    try {
      // Use the dedicated API client instead of direct fetch
      const validatedData = await this.apiClient.lookup(fen, INPUT_LIMITS.NUMBERS.MAX_VARIATIONS);

      // Transform to our internal format
      const entry = this._transformApiResponse(validatedData, fen);

      // Cache the transformed entry with normalized FEN
      this._cacheEntry(normalizedFen, entry);

      logger.info('Successfully fetched and cached tablebase entry', {
        fen,
        positionCategory: entry.position.category,
        moveCount: entry.moves.length,
      });

      return entry;
    } catch (error) {
      if (error instanceof LichessApiError) {
        // Record the HTTP error for metrics
        this.metrics.recordApiError(error.statusCode);

        // Handle 404 specially - position not in tablebase
        if (error.statusCode === HTTP_STATUS.NOT_FOUND) {
          logger.info('Position not in tablebase, caching null', {
            fen: normalizedFen,
          });
          this._cacheEntry(normalizedFen, null);
          return null;
        }

        // For other API errors, log and re-throw
        logger.error('Lichess API error', {
          fen,
          statusCode: error.statusCode,
          message: error.message,
        });
        throw new Error(`Tablebase API error: ${error.message}`);
      }

      if (error instanceof LichessApiTimeoutError) {
        logger.error('Tablebase API timeout', { fen, message: error.message });
        throw new Error(`Tablebase API timeout: ${error.message}`);
      }

      // Handle validation errors and other unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Unexpected error during API call',
        error instanceof Error ? error : new Error(String(error)),
        { fen }
      );
      throw new Error(`Unexpected tablebase error: ${errorMessage}`);
    }
  }

  /**
   * Transform Lichess API response to internal format
   * @private
   *
   * @remarks
   * Critical transformations:
   * 1. Convert category strings to typed categories
   * 2. Calculate WDL values from categories
   * 3. Invert move evaluations to player-to-move perspective
   * 4. Handle Black's perspective correctly
   */
  private _transformApiResponse(api: LichessTablebaseResponse, fen: string): TablebaseEntry {
    const isBlackToMove = fen.split(' ')[1] === 'b';

    // Transform position evaluation
    const positionCategory = api.category as TablebaseCategory;
    const positionWdl = this._categoryToWdl(positionCategory);

    // WDL is already from the perspective of the side to move
    // No need to negate for Black positions - the API gives the result from the mover's perspective

    // Transform moves with correct perspective (moves array guaranteed by schema)
    const moves: TablebaseMoveInternal[] = (api.moves || []).map(apiMove => {
      // API gives evaluation AFTER the move (from opponent's perspective)
      // We need to invert it to get the evaluation FROM the mover's perspective
      const moveCategory = this._invertCategory(apiMove.category) as TablebaseCategory;
      let moveWdl = this._categoryToWdl(moveCategory);

      // For Black, we need to negate WDL since it's from White's perspective
      if (isBlackToMove) {
        moveWdl = -moveWdl;
      }

      return {
        uci: apiMove.uci,
        san: apiMove.san,
        category: moveCategory,
        wdl: moveWdl,
        dtz: apiMove.dtz,
        dtm: apiMove.dtm,
        zeroing: apiMove.zeroing || false,
      };
    });

    return {
      position: {
        category: positionCategory,
        wdl: positionWdl,
        dtz: api.dtz,
        dtm: api.dtm ?? null,
        precise: api.precise_dtz !== undefined && api.precise_dtz !== null,
        evaluation: this._getEvaluationText(positionCategory, api.dtz),
      },
      moves,
      fen,
      timestamp: Date.now(),
    };
  }

  /**
   * Cache an entry with TTL
   * @private
   */
  private _cacheEntry(fen: string, entry: TablebaseEntry | null): void {
    const cacheEntry: TablebaseCacheEntry = {
      entry,
      expiry: Date.now() + this.cacheTtl, // Keep expiry for compatibility with existing types
    };

    // Use cache manager with TTL - it handles size limits and cleanup automatically
    this.cacheManager.set(fen, cacheEntry, this.cacheTtl);
  }

  /**
   * Convert category to WDL value
   * @private
   */
  private _categoryToWdl(category: string): number {
    switch (category) {
      case 'win':
        return 2;
      case 'cursed-win':
      case 'maybe-win':
        return 1;
      case 'draw':
      case 'unknown':
        return 0;
      case 'blessed-loss':
      case 'maybe-loss':
        return -1;
      case 'loss':
        return CHESS_EVALUATION.WDL_LOSS;
      default:
        return 0;
    }
  }

  /**
   * Invert category for perspective change
   * @private
   */
  private _invertCategory(category: string): string {
    switch (category) {
      case 'win':
        return 'loss';
      case 'loss':
        return 'win';
      case 'cursed-win':
        return 'blessed-loss';
      case 'blessed-loss':
        return 'cursed-win';
      case 'maybe-win':
        return 'maybe-loss';
      case 'maybe-loss':
        return 'maybe-win';
      case 'draw':
      case 'unknown':
      default:
        return category;
    }
  }

  /**
   * Compare two tablebase moves using hierarchical ranking
   * @private
   * @param {TablebaseMoveInternal} a - First move to compare
   * @param {TablebaseMoveInternal} b - Second move to compare
   * @returns {number} Negative if a is better, positive if b is better, 0 if equal
   *
   * @remarks
   * Implements training-optimized hierarchical move ranking:
   * 1. WDL (Win/Draw/Loss) - Primary ranking criterion
   * 2. DTM (Distance to Mate) - Secondary tiebreaker (prioritized for training)
   * 3. DTZ (Distance to Zeroing) - Final tiebreaker
   *
   * This hierarchy prioritizes instructive, fast mate paths over theoretical
   * 50-move rule safety, making it ideal for endgame training.
   *
   * For winning positions: Lower DTM/DTZ is better (faster path to goal)
   * For losing positions: Higher DTM/DTZ is better (defensive strategy - prolong game)
   * For draws: DTM/DTZ are irrelevant for ranking
   */
  private _compareTablebaseMoves(a: TablebaseMoveInternal, b: TablebaseMoveInternal): number {
    // 1. Primary criterion: WDL (Win/Draw/Loss)
    // Higher WDL value is always better regardless of DTM/DTZ
    if (a.wdl !== b.wdl) {
      return b.wdl - a.wdl; // Descending order: Win(2) > Draw(0) > Loss(-2)
    }

    // From here on, WDL values are equal, so we use DTM as tiebreaker

    // 2. Secondary criterion: DTM (Distance to Mate) - Training Priority
    const aDtm = a.dtm ?? 0; // Use 0 for null DTM (positions with >5 pieces)
    const bDtm = b.dtm ?? 0;

    if (aDtm !== bDtm) {
      if (a.wdl > 0) {
        // Winning positions: Lower absolute DTM is better (faster mate - more instructive)
        return Math.abs(aDtm) - Math.abs(bDtm);
      } else if (a.wdl < 0) {
        // Losing positions: Higher absolute DTM is better (defensive strategy)
        return Math.abs(bDtm) - Math.abs(aDtm);
      }
      // For draws (wdl === 0): DTM doesn't affect ranking, continue to DTZ
    }

    // 3. Final criterion: DTZ (Distance to Zeroing) - 50-move rule safety
    const aDtz = a.dtz ?? 0;
    const bDtz = b.dtz ?? 0;

    if (aDtz !== bDtz) {
      if (a.wdl > 0) {
        // Winning positions: Lower absolute DTZ is better (safer against 50-move rule)
        return Math.abs(aDtz) - Math.abs(bDtz);
      } else if (a.wdl < 0) {
        // Losing positions: Higher absolute DTZ is better (defensive strategy)
        return Math.abs(bDtz) - Math.abs(aDtz);
      }
      // For draws: DTZ doesn't affect ranking
    }

    // 4. All criteria are equal - moves are equivalent
    return 0;
  }

  /**
   * Generate evaluation text in German
   * @private
   */
  private _getEvaluationText(category: string, dtz?: number | null): string {
    switch (category) {
      case 'win':
        return dtz ? `Gewinn in ${Math.abs(dtz)} Zügen` : 'Theoretisch gewonnen';
      case 'cursed-win':
        return dtz ? `Gewinn in ${Math.abs(dtz)} Zügen (50-Zug-Regel)` : 'Gewinn mit 50-Zug-Regel';
      case 'maybe-win':
        return 'Wahrscheinlicher Gewinn';
      case 'draw':
        return 'Theoretisches Remis';
      case 'blessed-loss':
        return dtz
          ? `Verlust in ${Math.abs(dtz)} Zügen (50-Zug-Regel)`
          : 'Verlust mit 50-Zug-Regel';
      case 'maybe-loss':
        return 'Wahrscheinlicher Verlust';
      case 'loss':
        return dtz ? `Verlust in ${Math.abs(dtz)} Zügen` : 'Theoretisch verloren';
      case 'unknown':
        return 'Unbekannte Bewertung';
      default:
        return 'Bewertung nicht verfügbar';
    }
  }

  /**
   * Count pieces in FEN
   * @private
   */
  private _countPieces(fen: string): number {
    const piecesPart = fen.split(' ')[0];
    if (!piecesPart) {
      throw new Error('Invalid FEN: missing pieces part');
    }
    return piecesPart.replace(/[^a-zA-Z]/g, '').length;
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.cacheManager.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get service metrics for monitoring
   * @returns {object} Current metrics
   */
  getMetrics(): {
    cacheHitRate: number;
    totalApiCalls: number;
    errorBreakdown: Record<string, number>;
    dedupedRequests: number;
  } {
    return this.metrics.getMetrics();
  }
}

/**
 * Singleton instance of optimized TablebaseService
 *
 * @example
 * import { tablebaseService } from '@shared/services/TablebaseService';
 *
 * // Get position evaluation (1 API call)
 * const eval = await tablebaseService.getEvaluation(fen);
 *
 * // Get top moves (uses same API call, no additional requests!)
 * const moves = await tablebaseService.getTopMoves(fen, 5);
 */
export const tablebaseService = new TablebaseService();

// Also export the class for dependency injection
export { TablebaseService };
