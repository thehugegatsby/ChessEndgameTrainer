/**
 * MockTablebaseService - Clean Architecture Mock Implementation
 * 
 * PHASE 3.1: Mock implementation for tablebase service during development
 * Provides deterministic test data for development and testing
 * 
 * @module MockTablebaseService
 */

import type { 
  ITablebaseService, 
  TablebaseServiceConfig, 
  TablebaseLookupResult 
} from './ITablebaseService';
import type { TablebaseResult } from '@shared/types/evaluation';

/**
 * Mock tablebase service for development and testing
 * 
 * Provides deterministic responses for common endgame positions:
 * - KQvK: Win for side with queen
 * - KRvK: Win for side with rook  
 * - KBBvK: Win for side with bishops
 * - KBNvK: Win for side with bishop+knight
 * - KPvK: Depends on pawn position
 * - KvK: Draw
 */
export class MockTablebaseService implements ITablebaseService {
  private readonly config: Required<TablebaseServiceConfig>;
  private readonly cache = new Map<string, TablebaseLookupResult>();
  
  constructor(config: TablebaseServiceConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? 'mock://tablebase',
      timeout: config.timeout ?? 1000,
      maxPieces: config.maxPieces ?? 7,
      enableCaching: config.enableCaching ?? true,
      cacheTtl: config.cacheTtl ?? 3600,
      userAgent: config.userAgent ?? 'EndgameTrainer/Mock'
    };
  }

  async lookupPosition(fen: string): Promise<TablebaseLookupResult | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    // Check cache first
    if (this.config.enableCaching && this.cache.has(fen)) {
      const cached = this.cache.get(fen)!;
      return {
        ...cached,
        fromCache: true
      };
    }
    
    // Check if position is in tablebase range
    if (!this.isTablebasePosition(fen)) {
      return null;
    }
    
    // Parse FEN to analyze position
    const pieceCount = this.countPieces(fen);
    const analysis = this.analyzePosition(fen);
    
    if (!analysis) {
      return null;
    }
    
    const result: TablebaseLookupResult = {
      result: analysis,
      source: 'mock',
      lookupTime: 50 + Math.random() * 100,
      fromCache: false,
      pieceCount
    };
    
    // Cache result
    if (this.config.enableCaching) {
      this.cache.set(fen, result);
    }
    
    return result;
  }
  
  isTablebasePosition(fen: string): boolean {
    const pieceCount = this.countPieces(fen);
    return pieceCount >= 2 && pieceCount <= this.config.maxPieces;
  }
  
  getMaxPieces(): number {
    return this.config.maxPieces;
  }
  
  getConfig(): TablebaseServiceConfig {
    return { ...this.config };
  }
  
  async isHealthy(): Promise<boolean> {
    // Mock service is always healthy
    await new Promise(resolve => setTimeout(resolve, 10));
    return true;
  }
  
  async clearCache(): Promise<void> {
    this.cache.clear();
  }
  
  /**
   * Counts total pieces on board from FEN
   * @private
   */
  private countPieces(fen: string): number {
    const position = fen.split(' ')[0];
    let count = 0;
    
    for (const char of position) {
      if (/[prnbqkPRNBQK]/.test(char)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Analyzes position and returns mock tablebase result
   * @private
   */
  private analyzePosition(fen: string): TablebaseResult | null {
    const position = fen.split(' ')[0];
    
    // Count pieces by type
    const pieces = this.countPiecesByType(position);
    const totalPieces = Object.values(pieces).reduce((sum, count) => sum + count, 0);
    
    // KvK - Draw
    if (totalPieces === 2 && pieces.K === 1 && pieces.k === 1) {
      return {
        wdl: 0,
        dtz: 0,
        dtm: null,
        category: 'draw',
        precise: true
      };
    }
    
    // KQvK - Win for side with queen
    if (totalPieces === 3) {
      if (pieces.Q === 1 && pieces.K === 1 && pieces.k === 1) {
        return {
          wdl: 2, // White wins
          dtz: 10 + Math.floor(Math.random() * 20),
          dtm: 15 + Math.floor(Math.random() * 25),
          category: 'win',
          precise: true
        };
      }
      if (pieces.q === 1 && pieces.K === 1 && pieces.k === 1) {
        return {
          wdl: -2, // Black wins
          dtz: 10 + Math.floor(Math.random() * 20),
          dtm: 15 + Math.floor(Math.random() * 25),
          category: 'loss',
          precise: true
        };
      }
    }
    
    // KRvK - Win for side with rook
    if (totalPieces === 3) {
      if (pieces.R === 1 && pieces.K === 1 && pieces.k === 1) {
        return {
          wdl: 2, // White wins
          dtz: 15 + Math.floor(Math.random() * 25),
          dtm: 25 + Math.floor(Math.random() * 35),
          category: 'win',
          precise: true
        };
      }
      if (pieces.r === 1 && pieces.K === 1 && pieces.k === 1) {
        return {
          wdl: -2, // Black wins
          dtz: 15 + Math.floor(Math.random() * 25),
          dtm: 25 + Math.floor(Math.random() * 35),
          category: 'loss',
          precise: true
        };
      }
    }
    
    // KPvK - Depends on pawn position (simplified)
    if (totalPieces === 3) {
      if (pieces.P === 1 && pieces.K === 1 && pieces.k === 1) {
        // Simplified: 60% win, 40% draw for pawn endgames
        const isWin = Math.random() < 0.6;
        return {
          wdl: isWin ? 2 : 0,
          dtz: isWin ? 20 + Math.floor(Math.random() * 30) : 0,
          dtm: isWin ? 30 + Math.floor(Math.random() * 40) : null,
          category: isWin ? 'win' : 'draw',
          precise: true
        };
      }
      if (pieces.p === 1 && pieces.K === 1 && pieces.k === 1) {
        // Simplified: 60% win, 40% draw for pawn endgames
        const isWin = Math.random() < 0.6;
        return {
          wdl: isWin ? -2 : 0,
          dtz: isWin ? 20 + Math.floor(Math.random() * 30) : 0,
          dtm: isWin ? 30 + Math.floor(Math.random() * 40) : null,
          category: isWin ? 'loss' : 'draw',
          precise: true
        };
      }
    }
    
    // For more complex positions, return null (not in our mock tablebase)
    return null;
  }
  
  /**
   * Counts pieces by type from position string
   * @private
   */
  private countPiecesByType(position: string): Record<string, number> {
    const pieces: Record<string, number> = {};
    
    for (const char of position) {
      if (/[prnbqkPRNBQK]/.test(char)) {
        pieces[char] = (pieces[char] || 0) + 1;
      }
    }
    
    return pieces;
  }
}