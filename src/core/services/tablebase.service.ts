import type { TablebaseResult, Result } from '../types';
import { createOk, createError } from '../types';

export type TablebaseError =
  | { code: 'NETWORK_ERROR'; message: string }
  | { code: 'TIMEOUT'; message: string }
  | { code: 'OUT_OF_SCOPE'; message: string }
  | { code: 'INVALID_RESPONSE'; message: string }
  | { code: 'RATE_LIMITED'; message: string };

interface CacheEntry {
  result: TablebaseResult;
  expiry: number;
}

interface LichessTablebaseResponse {
  wdl: number;
  dtz: number | null;
  moves: Array<{
    uci: string;
    san: string;
    wdl: number;
    dtz: number | null;
  }>;
}

/**
 * TablebaseService - Handles tablebase API calls with caching
 * Uses Lichess tablebase API for endgame evaluation
 */
export class TablebaseService {
  private cache = new Map<string, CacheEntry>();
  private readonly apiUrl = 'https://tablebase.lichess.ovh/standard';
  private readonly timeoutMs = 3000; // 3 seconds
  private readonly cacheTtlMs = 600000; // 10 minutes
  private readonly maxCacheSize = 100; // Limit cache size
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // 100ms between requests

  async lookup(fen: string): Promise<Result<TablebaseResult, TablebaseError>> {
    // Check cache first
    const cached = this.getFromCache(fen);
    if (cached) {
      return createOk(cached);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.delay(this.minRequestInterval - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(
        `${this.apiUrl}?fen=${encodeURIComponent(fen)}`,
        { 
          signal: controller.signal,
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'ChessEndgameTrainer/1.0'
          }
        }
      );

      clearTimeout(timeoutId);
      this.requestCount++;

      if (!response.ok) {
        if (response.status === 400) {
          return createError({
            code: 'OUT_OF_SCOPE',
            message: 'Position not in tablebase (too many pieces or invalid)'
          });
        }
        if (response.status === 429) {
          return createError({
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please wait.'
          });
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as LichessTablebaseResponse;
      const result = this.parseResponse(data);
      
      // Cache successful result
      this.addToCache(fen, result);

      return createOk(result);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return createError({
          code: 'TIMEOUT',
          message: 'Tablebase request timed out'
        });
      }
      
      return createError({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown network error'
      });
    }
  }

  /**
   * Get best move for a position
   */
  async getBestMove(fen: string): Promise<Result<string, TablebaseError>> {
    const result = await this.lookup(fen);
    if (!result.ok) {
      return result;
    }
    return createOk(result.value.bestMove);
  }

  /**
   * Check if position is in tablebase (6 pieces or fewer)
   */
  isInTablebaseScope(fen: string): boolean {
    // Count pieces in FEN
    const piecePart = fen.split(' ')[0];
    if (!piecePart) return false;
    const pieceCount = (piecePart.match(/[pnbrqkPNBRQK]/g) || []).length;
    return pieceCount <= 6;
  }

  // ========== Cache Management ==========
  
  private getFromCache(fen: string): TablebaseResult | undefined {
    const entry = this.cache.get(fen);
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(fen);
      return undefined;
    }
    return entry.result;
  }

  private addToCache(fen: string, result: TablebaseResult): void {
    // Implement simple LRU by removing oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(fen, {
      result,
      expiry: Date.now() + this.cacheTtlMs
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  // ========== Response Parsing ==========
  
  private parseResponse(data: LichessTablebaseResponse): TablebaseResult {
    // Lichess tablebase response format
    if (!data.moves || !Array.isArray(data.moves) || data.moves.length === 0) {
      // Position is terminal (checkmate/stalemate)
      return {
        bestMove: '',
        wdl: data.wdl ?? 0,
        dtz: data.dtz ?? undefined
      };
    }

    // Find best move (first move is best according to Lichess)
    const bestMove = data.moves[0];
    if (!bestMove) {
      return {
        bestMove: '',
        wdl: 0,
        dtz: undefined
      };
    }
    return {
      bestMove: bestMove.uci,
      wdl: bestMove.wdl ?? 0,
      dtz: bestMove.dtz ?? undefined
    };
  }

  // ========== Helpers ==========
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Interpret WDL score
   */
  interpretWdl(wdl: number): 'win' | 'draw' | 'loss' {
    if (wdl > 0) return 'win';
    if (wdl < 0) return 'loss';
    return 'draw';
  }

  /**
   * Get human-readable evaluation
   */
  getEvaluation(result: TablebaseResult): string {
    const outcome = this.interpretWdl(result.wdl);
    
    if (outcome === 'win') {
      return result.dtz 
        ? `Win in ${Math.abs(result.dtz)} moves`
        : 'Winning position';
    }
    if (outcome === 'loss') {
      return result.dtz
        ? `Loss in ${Math.abs(result.dtz)} moves`
        : 'Losing position';
    }
    return 'Draw';
  }
}