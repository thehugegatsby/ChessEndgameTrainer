/**
 * TablebaseService - Main Service Implementation
 * 
 * Orchestrates the tablebase functionality by combining
 * the API client and transformer. Includes in-memory LRU caching
 * for improved performance and reduced API calls.
 */

import type {
  TablebaseServiceInterface,
  TablebaseEvaluation,
  TablebaseMove,
  TablebaseApiResponse,
  TablebaseOutcome,
} from '../types/interfaces';
import { TablebaseError } from '../types/interfaces';
import { FenUtils } from '../types/models';
import { tablebaseApiClient, ApiError } from './TablebaseApiClient';
import { tablebaseTransformer } from './TablebaseTransformer';
import { getLogger } from '../../../shared/services/logging/Logger';

const logger = getLogger().setContext('TablebaseService');

/**
 * Cache entry for tablebase results
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  fen: string;
}

/**
 * Simple in-memory LRU cache implementation
 */
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number; // Time to live in ms

  constructor(maxSize: number = 100, ttlMinutes: number = 5) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  set(key: string, data: T, fen?: string): void {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      fen: fen ?? ''
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class TablebaseService implements TablebaseServiceInterface {
  private readonly evaluationCache: LRUCache<TablebaseEvaluation>;
  private readonly movesCache: LRUCache<TablebaseMove[]>;

  constructor() {
    // Initialize caches: 100 evaluations, 50 move lists, 5-minute TTL
    this.evaluationCache = new LRUCache<TablebaseEvaluation>(100, 5);
    this.movesCache = new LRUCache<TablebaseMove[]>(50, 5);
  }

  /**
   * Evaluate a chess position
   * 
   * @param fen - Position in FEN notation
   * @returns Evaluation from the player's perspective
   * @throws {TablebaseError} for various error conditions
   */
  async evaluate(fen: string): Promise<TablebaseEvaluation> {
    const cacheKey = this.getCacheKey(fen);
    
    // Check cache first
    const cached = this.evaluationCache.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit for evaluation', { fen });
      return cached;
    }

    try {
      // Validate FEN
      tablebaseTransformer.validateFen(fen);
      
      // Query API
      logger.debug('Fetching evaluation from API', { fen });
      const apiResponse = await tablebaseApiClient.query(fen);
      
      // Transform to player's perspective
      const evaluation = tablebaseTransformer.normalizePositionEvaluation(
        apiResponse,
        fen
      );
      
      // Cache the result
      this.evaluationCache.set(cacheKey, evaluation, fen);
      
      logger.info('Successfully evaluated position', {
        fen,
        outcome: evaluation.outcome
      });
      
      return evaluation;
      
    } catch (error) {
      // Convert errors to TablebaseError
      throw this.handleError(error);
    }
  }

  /**
   * Get the best moves for a position
   * 
   * @param fen - Position in FEN notation
   * @param limit - Maximum number of moves to return
   * @returns Best moves from the player's perspective
   * @throws {TablebaseError} for various error conditions
   */
  async getBestMoves(fen: string, limit: number = 3): Promise<TablebaseMove[]> {
    const cacheKey = `${this.getCacheKey(fen)}-moves-${limit}`;
    
    // Check cache first
    const cached = this.movesCache.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit for best moves', { fen, limit });
      return cached;
    }

    try {
      // Validate FEN
      tablebaseTransformer.validateFen(fen);
      
      // Query API
      logger.debug('Fetching best moves from API', { fen });
      const apiResponse = await tablebaseApiClient.query(fen);
      
      // Transform moves to player's perspective
      const moves = this.transformMoves(apiResponse, fen);
      
      // Sort moves by quality
      const sortedMoves = this.sortMovesByQuality(moves);
      
      // Return top moves
      const bestMoves = sortedMoves.slice(0, limit);
      
      // Cache the result
      this.movesCache.set(cacheKey, bestMoves, fen);
      
      logger.info('Successfully retrieved best moves', {
        fen,
        moveCount: bestMoves.length,
        limit
      });
      
      return bestMoves;
      
    } catch (error) {
      // Convert errors to TablebaseError
      throw this.handleError(error);
    }
  }

  /**
   * Transform API moves to domain moves with correct perspective
   */
  private transformMoves(
    apiResponse: TablebaseApiResponse,
    fen: string
  ): TablebaseMove[] {
    const isBlackToMove = FenUtils.isBlackToMove(fen);
    
    return apiResponse.moves.map(apiMove => {
      // Transform WDL perspective for this move
      const normalizedWdl = isBlackToMove ? -apiMove.wdl : apiMove.wdl;
      
      // Determine outcome based on normalized WDL
      let outcome: TablebaseOutcome;
      if (normalizedWdl > 0) outcome = 'win';
      else if (normalizedWdl < 0) outcome = 'loss';
      else outcome = 'draw';
      
      return {
        uci: apiMove.uci,
        san: apiMove.san,
        outcome,
        dtm: apiMove.dtm ?? undefined,
        dtz: apiMove.dtz ?? undefined,
      } satisfies TablebaseMove;
    });
  }

  /**
   * Sort moves by quality (best first)
   * 
   * Sorting logic:
   * 1. Group by outcome (wins > draws > losses)
   * 2. Within wins: prefer faster mate (lower DTM)
   * 3. Within losses: prefer slower mate (higher DTM) for better defense
   * 4. Within draws: no particular ordering
   */
  private sortMovesByQuality(moves: TablebaseMove[]): TablebaseMove[] {
    return [...moves].sort((a, b) => {
      // Convert outcome to numeric value for sorting
      const outcomeValue = (outcome: TablebaseOutcome): number => {
        switch (outcome) {
          case 'win': return 1;
          case 'draw': return 0;
          case 'loss': return -1;
        }
      };
      
      const valueA = outcomeValue(a.outcome);
      const valueB = outcomeValue(b.outcome);
      
      if (valueA !== valueB) {
        return valueB - valueA; // Higher value first (wins > draws > losses)
      }
      
      // Within the same outcome, use DTM for tie-breaking
      if (a.outcome === 'win') {
        // For wins: prefer faster mate (lower DTM)
        const aDtm = Math.abs(a.dtm ?? Infinity);
        const bDtm = Math.abs(b.dtm ?? Infinity);
        return aDtm - bDtm;
      }
      
      if (a.outcome === 'loss') {
        // For losses: prefer slower mate (higher DTM) - better defense
        const aDtm = Math.abs(a.dtm ?? 0);
        const bDtm = Math.abs(b.dtm ?? 0);
        return bDtm - aDtm;
      }
      
      // For draws: maintain original order
      return 0;
    });
  }

  /**
   * Convert various errors to TablebaseError
   */
  private handleError(error: unknown): TablebaseError {
    // Already a TablebaseError
    if (error instanceof TablebaseError) {
      return error;
    }
    
    // API errors
    if (error instanceof ApiError) {
      if (error.status === 404 || error.code === 'NOT_FOUND') {
        return new TablebaseError(
          'Position not in tablebase',
          'NOT_FOUND'
        );
      }
      
      if (error.code === 'TIMEOUT') {
        return new TablebaseError(
          'Tablebase service temporarily unavailable',
          'UNAVAILABLE'
        );
      }
      
      return new TablebaseError(
        error.message,
        'API_ERROR'
      );
    }
    
    // Validation errors
    if (error instanceof Error && error.message.includes('FEN')) {
      return new TablebaseError(
        error.message,
        'INVALID_FEN'
      );
    }
    
    // Generic errors
    if (error instanceof Error) {
      return new TablebaseError(
        error.message,
        'API_ERROR'
      );
    }
    
    // Unknown errors
    return new TablebaseError(
      'An unknown error occurred',
      'API_ERROR'
    );
  }

  /**
   * Generate cache key from FEN
   * Normalizes FEN to ignore move counters
   */
  private getCacheKey(fen: string): string {
    // Remove halfmove clock and fullmove number for consistent caching
    return fen.split(' ').slice(0, 4).join(' ');
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.evaluationCache.clear();
    this.movesCache.clear();
    logger.info('Caches cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    evaluationCacheSize: number;
    movesCacheSize: number;
  } {
    return {
      evaluationCacheSize: this.evaluationCache.size(),
      movesCacheSize: this.movesCache.size()
    };
  }

  /**
   * Prefetch multiple positions (for performance)
   * 
   * @param fens - Array of FEN positions to prefetch
   */
  async prefetch(fens: string[]): Promise<void> {
    logger.debug('Prefetching positions', { count: fens.length });
    
    // Use Promise.allSettled to not fail on individual errors
    const results = await Promise.allSettled(
      fens.map(fen => this.evaluate(fen))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info('Prefetch completed', { 
      total: fens.length,
      successful,
      failed 
    });
  }
}

// Export singleton instance
export const tablebaseService = new TablebaseService();