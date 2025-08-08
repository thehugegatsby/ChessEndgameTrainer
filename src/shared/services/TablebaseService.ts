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

import { validateAndSanitizeFen } from "../utils/fenValidator";
import { getLogger } from "../services/logging";
import { APP_CONFIG } from "@/config/constants";
import { z } from "zod";
import { LichessTablebaseResponseSchema } from "../types/tablebaseSchemas";
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
} from "../types/tablebase";

// Re-export types for backward compatibility
export type {
  TablebaseMove,
  TablebaseResult,
  TablebaseEvaluation,
  TablebaseMovesResult,
};

const logger = getLogger().setContext("TablebaseService");

class TablebaseService {
  private cache = new Map<string, TablebaseCacheEntry>();
  private readonly maxPieces = 7; // Lichess uses 7-piece Syzygy tablebases
  private readonly cacheTtl = 300000; // 5 minutes
  private pendingRequests = new Map<string, Promise<TablebaseEntry | null>>();

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
    try {
      const entry = await this._getOrFetchTablebaseEntry(fen);

      if (!entry) {
        return { isAvailable: false };
      }

      return {
        isAvailable: true,
        result: {
          wdl: entry.position.wdl,
          dtz: entry.position.dtz,
          dtm: entry.position.dtm,
          category: entry.position.category,
          precise: entry.position.precise,
          evaluation: entry.position.evaluation,
        },
      };
    } catch (error) {
      logger.error("Failed to get evaluation", error as Error, { fen });
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
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
  async getTopMoves(
    fen: string,
    limit: number = 3,
  ): Promise<TablebaseMovesResult> {
    try {
      const entry = await this._getOrFetchTablebaseEntry(fen);

      if (!entry || !entry.moves.length) {
        return {
          isAvailable: false,
          error: "No moves available for this position",
        };
      }

      // Sort moves by quality (WDL value, then DTZ)
      // Higher WDL = better for the player, then lower DTZ = faster to goal
      const sortedMoves = [...entry.moves].sort((a, b) => {
        // Primary sort: by WDL (higher is better)
        if (a.wdl !== b.wdl) {
          return b.wdl - a.wdl;
        }

        // Secondary sort: for moves that are "wins" from opponent's perspective after our move,
        // we want to choose the move that gives the opponent the LONGEST path to win (best defense)
        if (a.wdl > 0) {
          // These are "winning" positions for the opponent after our move
          // For optimal defense: prefer moves that give opponent HIGHER DTM (slower win for them)
          const aDtx = a.dtm ?? a.dtz ?? 0;
          const bDtx = b.dtm ?? b.dtz ?? 0;
          return Math.abs(aDtx) - Math.abs(bDtx); // FIXED: Lower DTM first for faster wins
        } else if (a.wdl < 0) {
          // Losing - prefer slower loss (larger absolute DTM value)
          const aDtx = a.dtm ?? a.dtz ?? 0;
          const bDtx = b.dtm ?? b.dtz ?? 0;
          return Math.abs(bDtx) - Math.abs(aDtx);
        }

        // Draw - prefer maintaining draw (DTZ doesn't matter much)
        return 0;
      });

      // Take only the best moves (same WDL as the absolute best)
      const bestWdl = sortedMoves[0]?.wdl ?? 0;
      const bestMoves = sortedMoves.filter((move) => move.wdl === bestWdl);

      // Return up to 'limit' of the best moves
      const topInternalMoves = bestMoves.slice(0, limit);

      // Convert internal moves to external format (without zeroing field)
      const topMoves: TablebaseMove[] = topInternalMoves.map((move) => ({
        uci: move.uci,
        san: move.san,
        wdl: move.wdl,
        dtz: move.dtz,
        dtm: move.dtm,
        category: move.category,
      }));

      // ENHANCED DEBUG LOGGING
      logger.info("TablebaseService.getTopMoves DETAILED OUTPUT", {
        fen,
        requestedLimit: limit,
        totalMovesFromAPI: entry.moves.length,
        bestWdl,
        movesWithBestWdl: bestMoves.length,
        returnedMoves: topMoves.length,
        returnedMoveDetails: topMoves.map((m) => ({
          san: m.san,
          wdl: m.wdl,
          dtm: m.dtm,
          category: m.category,
        })),
        sortingApplied:
          bestWdl < 0
            ? "Defensive (highest DTM first)"
            : bestWdl > 0
              ? "Offensive (lowest DTM first)"
              : "Draw",
      });

      return {
        isAvailable: true,
        moves: topMoves,
      };
    } catch (error) {
      logger.error("Failed to get top moves", error as Error, { fen });
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
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
    return fen.split(" ").slice(0, 4).join(" ");
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
  private async _getOrFetchTablebaseEntry(
    fen: string,
  ): Promise<TablebaseEntry | null> {
    // Validate FEN
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      throw new Error(`Invalid FEN: ${validation.errors.join(", ")}`);
    }
    const sanitizedFen = validation.sanitized;
    const normalizedFen = this._normalizeFen(sanitizedFen);

    // Check piece count
    const pieceCount = this._countPieces(sanitizedFen);
    if (pieceCount > this.maxPieces) {
      logger.debug("Too many pieces for tablebase", {
        fen: sanitizedFen,
        pieceCount,
      });
      return null;
    }

    // Check cache with normalized FEN
    const cached = this.cache.get(normalizedFen);
    if (cached && cached.expiry > Date.now()) {
      logger.debug("Cache hit for tablebase entry", { fen: normalizedFen });
      this.metrics.recordCacheHit();
      return cached.entry;
    }
    this.metrics.recordCacheMiss();

    // Check if request already in flight (request deduplication)
    const pending = this.pendingRequests.get(normalizedFen);
    if (pending) {
      logger.debug("Request already in flight, waiting", {
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
    normalizedFen: string,
  ): Promise<TablebaseEntry | null> {
    const MAX_RETRIES = 3;
    this.metrics.recordApiCall();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Always request moves to get complete tablebase entry
        const response = await fetch(
          `${APP_CONFIG.TABLEBASE_API_URL}/standard?fen=${encodeURIComponent(fen)}&moves=20`,
          { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          this.metrics.recordApiError(response.status);

          if (response.status === 404) {
            // Position not in tablebase - cache this to avoid repeated queries
            logger.info("Position not in tablebase, caching null", {
              fen: normalizedFen,
            });
            this._cacheEntry(normalizedFen, null);
            return null;
          }

          // Rate limiting - retry with exponential backoff
          if (response.status === 429) {
            const delay = Math.min(
              1000 * Math.pow(2, attempt) + Math.random() * 1000,
              10000,
            );
            logger.warn(`Rate limited, retrying in ${delay}ms`, {
              attempt,
              delay,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          // Don't retry other client errors
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Client error: ${response.status}`);
          }

          throw new Error(`API error: ${response.status}`);
        }

        const responseData = await response.json();

        // Validate the API response structure
        let validatedData: LichessTablebaseResponse;
        try {
          validatedData = LichessTablebaseResponseSchema.parse(responseData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            logger.error("Malformed Lichess API response", {
              fen,
              errors: error.issues,
              received: responseData,
            });
            throw new Error("Malformed API response");
          }
          throw error;
        }

        // Transform to our internal format
        const entry = this._transformApiResponse(validatedData, fen);

        // Cache the transformed entry with normalized FEN
        this._cacheEntry(normalizedFen, entry);

        logger.info("Successfully fetched and cached tablebase entry", {
          fen,
          positionCategory: entry.position.category,
          moveCount: entry.moves.length,
        });

        return entry;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.warn(`Tablebase API attempt ${attempt}/${MAX_RETRIES} failed`, {
          fen,
          error: errorMessage,
        });

        // Don't retry client errors
        if (
          error instanceof Error &&
          error.message.startsWith("Client error")
        ) {
          throw error;
        }

        // Last attempt failed
        if (attempt === MAX_RETRIES) {
          logger.error("API call failed after max retries", { error, fen });
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Request timeout after ${MAX_RETRIES} retries`);
          }
          throw new Error(
            `Max retries (${MAX_RETRIES}) exceeded. Last error: ${errorMessage}`,
          );
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }

    // Should never reach here
    throw new Error("Unexpected error in fetch loop");
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
  private _transformApiResponse(
    api: LichessTablebaseResponse,
    fen: string,
  ): TablebaseEntry {
    const isBlackToMove = fen.split(" ")[1] === "b";

    // Transform position evaluation
    const positionCategory = api.category as TablebaseCategory;
    let positionWdl = this._categoryToWdl(positionCategory);

    // WDL is already from the perspective of the side to move
    // No need to negate for Black positions - the API gives the result from the mover's perspective
    // Handle -0 case to ensure it's just 0
    if (positionWdl === -0) {
      positionWdl = 0;
    }

    // Transform moves with correct perspective (moves array guaranteed by schema)
    const moves: TablebaseMoveInternal[] = (api.moves || []).map((apiMove) => {
      // API gives evaluation AFTER the move (from opponent's perspective)
      // We need to invert it to get the evaluation FROM the mover's perspective
      const moveCategory = this._invertCategory(
        apiMove.category,
      ) as TablebaseCategory;
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
    this.cache.set(fen, {
      entry,
      expiry: Date.now() + this.cacheTtl,
    });

    // Clean up old entries if cache is getting large
    if (this.cache.size > 200) {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (value.expiry < now) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Convert category to WDL value
   * @private
   */
  private _categoryToWdl(category: string): number {
    switch (category) {
      case "win":
        return 2;
      case "cursed-win":
      case "maybe-win":
        return 1;
      case "draw":
      case "unknown":
        return 0;
      case "blessed-loss":
      case "maybe-loss":
        return -1;
      case "loss":
        return -2;
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
      case "win":
        return "loss";
      case "loss":
        return "win";
      case "cursed-win":
        return "blessed-loss";
      case "blessed-loss":
        return "cursed-win";
      case "maybe-win":
        return "maybe-loss";
      case "maybe-loss":
        return "maybe-win";
      case "draw":
      case "unknown":
      default:
        return category;
    }
  }

  /**
   * Generate evaluation text in German
   * @private
   */
  private _getEvaluationText(category: string, dtz?: number | null): string {
    switch (category) {
      case "win":
        return dtz
          ? `Gewinn in ${Math.abs(dtz)} Zügen`
          : "Theoretisch gewonnen";
      case "cursed-win":
        return dtz
          ? `Gewinn in ${Math.abs(dtz)} Zügen (50-Zug-Regel)`
          : "Gewinn mit 50-Zug-Regel";
      case "maybe-win":
        return "Wahrscheinlicher Gewinn";
      case "draw":
        return "Theoretisches Remis";
      case "blessed-loss":
        return dtz
          ? `Verlust in ${Math.abs(dtz)} Zügen (50-Zug-Regel)`
          : "Verlust mit 50-Zug-Regel";
      case "maybe-loss":
        return "Wahrscheinlicher Verlust";
      case "loss":
        return dtz
          ? `Verlust in ${Math.abs(dtz)} Zügen`
          : "Theoretisch verloren";
      case "unknown":
        return "Unbekannte Bewertung";
      default:
        return "Bewertung nicht verfügbar";
    }
  }

  /**
   * Count pieces in FEN
   * @private
   */
  private _countPieces(fen: string): number {
    const piecesPart = fen.split(" ")[0];
    return piecesPart.replace(/[^a-zA-Z]/g, "").length;
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get service metrics for monitoring
   * @returns {object} Current metrics
   */
  getMetrics() {
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
