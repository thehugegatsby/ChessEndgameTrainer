/**
 * ChessAwareCache - Intelligent caching for chess position evaluations
 * 
 * Uses chess-specific heuristics to prioritize cache retention:
 * - Endgame positions (fewer pieces) are more likely to be revisited
 * - Critical positions (high evaluation, mate threats) are preserved longer
 * - LRU eviction within priority groups
 */

import { CACHE } from '@shared/constants';

interface CacheEntry<T> {
  value: T;
  lastAccessed: number;
  priority: number;
  pieceCount: number;
  isCritical: boolean;
}


export class ChessAwareCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  
  // Priority thresholds
  private static readonly ENDGAME_THRESHOLD = 7; // 7 pieces or less
  private static readonly CRITICAL_SCORE_THRESHOLD = 500; // Centipawns
  
  constructor(maxSize = CACHE.CHESS_AWARE_CACHE_SIZE) {
    this.maxSize = maxSize;
  }

  /**
   * Get a cached evaluation result
   */
  get(fen: string): T | null {
    const entry = this.cache.get(fen);
    if (entry) {
      // Update access time for LRU
      entry.lastAccessed = Date.now();
      return entry.value;
    }
    return null;
  }

  /**
   * Store an evaluation result with chess-aware prioritization
   */
  set(fen: string, value: T): void {
    const pieceCount = this.countPieces(fen);
    const isCritical = this.isCriticalPosition(value);
    const priority = this.calculatePriority(pieceCount, isCritical);
    
    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize && !this.cache.has(fen)) {
      this.evictIntelligently(priority);
    }
    
    const entry: CacheEntry<T> = {
      value,
      lastAccessed: Date.now(),
      priority,
      pieceCount,
      isCritical
    };
    
    this.cache.set(fen, entry);
  }

  /**
   * Check if position is in cache
   */
  has(fen: string): boolean {
    return this.cache.has(fen);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
    endgamePositions: number;
    criticalPositions: number;
    avgPieceCount: number;
  } {
    const entries = Array.from(this.cache.values());
    const endgameCount = entries.filter(e => e.pieceCount <= ChessAwareCache.ENDGAME_THRESHOLD).length;
    const criticalCount = entries.filter(e => e.isCritical).length;
    const avgPieceCount = entries.length > 0 
      ? entries.reduce((sum, e) => sum + e.pieceCount, 0) / entries.length 
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      endgamePositions: endgameCount,
      criticalPositions: criticalCount,
      avgPieceCount: Math.round(avgPieceCount * 10) / 10
    };
  }

  /**
   * Count pieces on the board from FEN
   */
  private countPieces(fen: string): number {
    const boardPart = fen.split(' ')[0];
    return (boardPart.match(/[pnbrqkPNBRQK]/g) || []).length;
  }

  /**
   * Determine if this is a critical position worth preserving
   */
  private isCriticalPosition(value: T): boolean {
    // Check if value has evaluation-like properties
    if (typeof value === 'object' && value !== null) {
      const evaluation = value as any;
      
      // High evaluation magnitude
      if (typeof evaluation.score === 'number' && 
          Math.abs(evaluation.score) > ChessAwareCache.CRITICAL_SCORE_THRESHOLD) {
        return true;
      }
      
      // Mate positions
      if (typeof evaluation.mate === 'number') {
        return true;
      }
      
      // Tablebase positions
      if (evaluation.isTablebasePosition === true) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate cache priority for a position
   * Higher priority = more likely to be retained
   */
  private calculatePriority(pieceCount: number, isCritical: boolean): number {
    let priority = 0;
    
    // Base priority favors positions with fewer pieces
    // Endgame positions are exponentially more valuable
    if (pieceCount <= ChessAwareCache.ENDGAME_THRESHOLD) {
      priority += 100 + (ChessAwareCache.ENDGAME_THRESHOLD - pieceCount) * 20;
    } else {
      priority += Math.max(0, 50 - pieceCount);
    }
    
    // Critical positions get significant boost
    if (isCritical) {
      priority += 200;
    }
    
    return priority;
  }

  /**
   * Intelligent eviction that preserves high-priority positions
   */
  private evictIntelligently(incomingPriority: number): void {
    const entries = Array.from(this.cache.entries());
    
    // Find candidates for eviction (lower priority than incoming entry)
    const candidates = entries.filter(([_, entry]) => 
      entry.priority < incomingPriority
    );
    
    // If no low-priority candidates, fall back to LRU across all entries
    const evictionPool = candidates.length > 0 ? candidates : entries;
    
    if (evictionPool.length === 0) return;
    
    // Among candidates, evict the least recently used
    const lruEntry = evictionPool.reduce((oldest, [fen, entry]) => {
      return entry.lastAccessed < oldest[1].lastAccessed ? [fen, entry] : oldest;
    });
    
    this.cache.delete(lruEntry[0]);
  }

}