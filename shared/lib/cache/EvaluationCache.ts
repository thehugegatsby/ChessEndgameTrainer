/**
 * @fileoverview Conservative Evaluation Caching Layer  
 * @version 1.0.0
 * @description Non-invasive caching wrapper for Engine evaluations
 * 
 * SAFETY PRINCIPLES:
 * - Does NOT modify existing Engine/Worker API
 * - Wraps existing methods with identical signatures
 * - Fails gracefully if cache has issues
 * - Preserves all existing error handling
 * - Compatible with existing tests
 */

import { LRUCache, type CacheStats } from './LRUCache';
import type { Engine } from '../chess/engine';
import { Move as ChessJsMove } from 'chess.js';

interface CachedEvaluation {
  score: number;
  mate: number | null;
  timestamp: number;
  depth?: number;
}

interface CachedBestMove {
  move: ChessJsMove | null;
  timestamp: number;
  timeLimit: number;
}

interface DeduplicationEntry {
  promise: Promise<any>;
  timestamp: number;
}

export interface EvaluationCacheStats extends CacheStats {
  deduplicationHits: number;
  deduplicationMisses: number;
  memoryUsageBytes: number;
  engineEvals?: number;
  tablebasePositions?: number;
  estimatedBytes?: number;
}

/**
 * Conservative caching layer that wraps Engine methods
 * without modifying the underlying implementation
 */
export class EvaluationCache {
  private evaluationCache: LRUCache<CachedEvaluation>;
  private bestMoveCache: LRUCache<CachedBestMove>;
  private pendingRequests: Map<string, DeduplicationEntry>;
  
  // Cache configuration
  private readonly EVALUATION_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly BEST_MOVE_TTL = 10 * 60 * 1000;  // 10 minutes (more volatile)
  private readonly DEDUPLICATION_TTL = 10 * 1000;   // 10 seconds
  
  // Statistics
  private deduplicationHits = 0;
  private deduplicationMisses = 0;

  constructor(
    evaluationCacheSize: number = 1000,
    bestMoveCacheSize: number = 500
  ) {
    this.evaluationCache = new LRUCache(evaluationCacheSize);
    this.bestMoveCache = new LRUCache(bestMoveCacheSize);
    this.pendingRequests = new Map();
    
    // Cleanup pending requests periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupStaleRequests(), 30000);
    }
  }

  /**
   * Cached wrapper for Engine.evaluatePosition()
   * Preserves exact API and error handling
   */
  async evaluatePositionCached(
    engine: Engine,
    fen: string
  ): Promise<{ score: number; mate: number | null }> {
    const cacheKey = `eval:${fen}`;
    
    try {
      // Check for pending request (deduplication)
      const pending = this.pendingRequests.get(cacheKey);
      if (pending && (Date.now() - pending.timestamp) < this.DEDUPLICATION_TTL) {
        this.deduplicationHits++;
        return await pending.promise;
      }

      // Check cache
      const cached = this.evaluationCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.EVALUATION_TTL) {
        return { score: cached.score, mate: cached.mate };
      }

      // Create promise for this request
      const promise = this.executeEvaluation(engine, fen);
      
      // Store in pending requests for deduplication
      this.pendingRequests.set(cacheKey, {
        promise,
        timestamp: Date.now()
      });
      this.deduplicationMisses++;

      const result = await promise;
      
      // Cache successful result
      if (result !== null) {
        this.evaluationCache.set(cacheKey, {
          score: result.score,
          mate: result.mate,
          timestamp: Date.now()
        });
      }

      // Remove from pending
      this.pendingRequests.delete(cacheKey);
      
      return result;
      
    } catch (error) {
      // Remove from pending on error
      this.pendingRequests.delete(cacheKey);
      
      // Fall through to original method - preserve exact error behavior
      return await engine.evaluatePosition(fen);
    }
  }

  /**
   * Cached wrapper for Engine.getBestMove()
   * Preserves exact API and error handling
   */
  async getBestMoveCached(
    engine: Engine,
    fen: string,
    timeLimit: number = 1000
  ): Promise<ChessJsMove | null> {
    const cacheKey = `bestmove:${fen}:${timeLimit}`;
    
    try {
      // Check for pending request (deduplication)
      const pending = this.pendingRequests.get(cacheKey);
      if (pending && (Date.now() - pending.timestamp) < this.DEDUPLICATION_TTL) {
        this.deduplicationHits++;
        return await pending.promise;
      }

      // Check cache
      const cached = this.bestMoveCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.BEST_MOVE_TTL) {
        return cached.move;
      }

      // Create promise for this request
      const promise = this.executeBestMove(engine, fen, timeLimit);
      
      // Store in pending requests for deduplication
      this.pendingRequests.set(cacheKey, {
        promise,
        timestamp: Date.now()
      });
      this.deduplicationMisses++;

      const result = await promise;
      
      // Cache result (even if null)
      this.bestMoveCache.set(cacheKey, {
        move: result,
        timestamp: Date.now(),
        timeLimit
      });

      // Remove from pending
      this.pendingRequests.delete(cacheKey);
      
      return result;
      
    } catch (error) {
      // Remove from pending on error
      this.pendingRequests.delete(cacheKey);
      
      // Fall through to original method - preserve exact error behavior
      return await engine.getBestMove(fen, timeLimit);
    }
  }

  /**
   * Execute the actual evaluation (wrapped for error handling)
   */
  private async executeEvaluation(
    engine: Engine,
    fen: string
  ): Promise<{ score: number; mate: number | null }> {
    return await engine.evaluatePosition(fen);
  }

  /**
   * Execute the actual best move request (wrapped for error handling)
   */
  private async executeBestMove(
    engine: Engine,
    fen: string,
    timeLimit: number
  ): Promise<ChessJsMove | null> {
    return await engine.getBestMove(fen, timeLimit);
  }

  /**
   * Clean up stale pending requests
   */
  private cleanupStaleRequests(): void {
    const now = Date.now();
    for (const [key, entry] of this.pendingRequests.entries()) {
      if (now - entry.timestamp > this.DEDUPLICATION_TTL * 2) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): EvaluationCacheStats {
    const evalStats = this.evaluationCache.getStats();
    const bestMoveStats = this.bestMoveCache.getStats();
    
    const totalHits = evalStats.hits + bestMoveStats.hits;
    const totalMisses = evalStats.misses + bestMoveStats.misses;
    const totalAttempts = totalHits + totalMisses;
    
    return {
      hits: totalHits,
      misses: totalMisses,
      size: evalStats.size + bestMoveStats.size,
      maxSize: evalStats.maxSize + bestMoveStats.maxSize,
      hitRate: totalAttempts > 0 ? totalHits / totalAttempts : 0,
      deduplicationHits: this.deduplicationHits,
      deduplicationMisses: this.deduplicationMisses,
      memoryUsageBytes: this.evaluationCache.getMemoryUsage() + this.bestMoveCache.getMemoryUsage(),
      engineEvals: evalStats.size,
      tablebasePositions: 0, // Not tracking tablebase separately for now
      estimatedBytes: this.evaluationCache.getMemoryUsage() + this.bestMoveCache.getMemoryUsage()
    };
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.evaluationCache.clear();
    this.bestMoveCache.clear();
    this.pendingRequests.clear();
    this.deduplicationHits = 0;
    this.deduplicationMisses = 0;
  }

  /**
   * Warm up cache with common positions
   */
  async warmupCache(engine: Engine, positions: string[]): Promise<void> {
    
    const promises = positions.slice(0, 10).map(async (fen) => {
      try {
        await this.evaluatePositionCached(engine, fen);
      } catch (error) {
      }
    });
    
    await Promise.allSettled(promises);
  }

  // Legacy cache interface methods for tests
  
  /**
   * Set engine evaluation in cache
   */
  setEngineEval(fen: string, evaluation: { score: number; mate: number | null }): void {
    const cached: CachedEvaluation = {
      score: evaluation.score,
      mate: evaluation.mate,
      timestamp: Date.now()
    };
    this.evaluationCache.set(`engine:${fen}`, cached);
  }

  /**
   * Get engine evaluation from cache
   */
  getEngineEval(fen: string): { score: number; mate: number | null } | null {
    const cached = this.evaluationCache.get(`engine:${fen}`);
    if (!cached) return null;
    return { score: cached.score, mate: cached.mate };
  }

  /**
   * Check if engine evaluation exists in cache
   */
  hasEngineEval(fen: string): boolean {
    return this.evaluationCache.has(`engine:${fen}`);
  }

  /**
   * Set tablebase data in cache
   */
  setTablebase(fen: string, data: any): void {
    // Store data directly for test compatibility
    this.evaluationCache.set(`tb:${fen}`, data as any);
  }

  /**
   * Get tablebase data from cache
   */
  getTablebase(fen: string): any {
    const cached = this.evaluationCache.get(`tb:${fen}`) as any;
    return cached || null;
  }

  /**
   * Check if tablebase data exists in cache
   */
  hasTablebase(fen: string): boolean {
    return this.evaluationCache.has(`tb:${fen}`);
  }

  /**
   * Clear engine evaluations from cache
   */
  clearEngineEvals(): void {
    // Clear all entries that start with "engine:"
    const keys = Array.from(this.evaluationCache.keys?.() || []);
    keys.forEach(key => {
      if (typeof key === 'string' && key.startsWith('engine:')) {
        this.evaluationCache.delete(key);
      }
    });
  }

  /**
   * Clear tablebase data from cache
   */
  clearTablebase(): void {
    // Clear all entries that start with "tb:"
    const keys = Array.from(this.evaluationCache.keys?.() || []);
    keys.forEach(key => {
      if (typeof key === 'string' && key.startsWith('tb:')) {
        this.evaluationCache.delete(key);
      }
    });
  }

  /**
   * Get memory usage of cache
   */
  getMemoryUsage(): number {
    return (this.evaluationCache.getMemoryUsage?.() || 0) + (this.bestMoveCache.getMemoryUsage?.() || 0);
  }
}

// Singleton instance for global use
let globalEvaluationCache: EvaluationCache | null = null;

/**
 * Get global cache instance (lazy initialization)
 */
export function getEvaluationCache(): EvaluationCache {
  if (!globalEvaluationCache) {
    globalEvaluationCache = new EvaluationCache();
  }
  return globalEvaluationCache;
}