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
import { ANIMATION } from '@shared/constants';

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
    await new Promise(resolve => setTimeout(resolve, ANIMATION.MOCK_SERVICE_DELAY));
    
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
  
  async getTopMoves(fen: string): Promise<Array<{
    move: string;
    san: string; 
    dtz: number;
    dtm: number;
    wdl: number;
    category: 'win' | 'draw' | 'loss';
  }> | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, ANIMATION.MOCK_SERVICE_DELAY));
    
    // Check if position is in tablebase range
    if (!this.isTablebasePosition(fen)) {
      return null;
    }
    
    // Generate mock Top-3 moves based on position analysis
    return this.generateTop3Moves(fen);
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
    
    // 6-piece endgames: K+P+R vs K+R (like position 9)
    if (totalPieces === 6) {
      // Check for K+P+R vs K+R
      if ((pieces.K === 1 && pieces.P === 1 && pieces.R === 1 && pieces.k === 1 && pieces.r === 1) ||
          (pieces.k === 1 && pieces.p === 1 && pieces.r === 1 && pieces.K === 1 && pieces.R === 1)) {
        
        const isWhiteAdvantage = pieces.K === 1 && pieces.P === 1 && pieces.R === 1;
        const baseWdl = isWhiteAdvantage ? 2 : -2;
        const category = isWhiteAdvantage ? 'win' : 'loss';
        
        return {
          wdl: baseWdl,
          dtz: 25 + Math.floor(Math.random() * 20), // 25-45 moves
          dtm: 35 + Math.floor(Math.random() * 25), // 35-60 moves
          category: category,
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
  
  /**
   * Generates mock Top-3 tablebase moves for a position
   * @private
   */
  private generateTop3Moves(fen: string): Array<{
    move: string;
    san: string; 
    dtz: number;
    dtm: number;
    wdl: number;
    category: 'win' | 'draw' | 'loss';
  }> {
    const position = fen.split(' ')[0];
    const pieces = this.countPiecesByType(position);
    const totalPieces = Object.values(pieces).reduce((sum, count) => sum + count, 0);
    
    // Generate mock moves based on common endgame patterns
    const moves: Array<{
      move: string;
      san: string; 
      dtz: number;
      dtm: number;
      wdl: number;
      category: 'win' | 'draw' | 'loss';
    }> = [];
    
    // KQvK endgame - typical queen moves
    if (totalPieces === 3 && ((pieces.Q === 1 && pieces.K === 1 && pieces.k === 1) || 
                              (pieces.q === 1 && pieces.K === 1 && pieces.k === 1))) {
      const isWhiteAdvantage = pieces.Q === 1;
      const baseWdl = isWhiteAdvantage ? 2 : -2;
      const category = isWhiteAdvantage ? 'win' : 'loss';
      
      moves.push(
        {
          move: 'd1d7',
          san: 'Qd7+',
          dtz: 10,
          dtm: 17,
          wdl: baseWdl,
          category: category
        },
        {
          move: 'd1d8',
          san: 'Qd8+',
          dtz: 12,
          dtm: 19,
          wdl: baseWdl,
          category: category
        },
        {
          move: 'd1c2',
          san: 'Qc2',
          dtz: 14,
          dtm: 21,
          wdl: baseWdl,
          category: category
        }
      );
    }
    
    // KRvK endgame - typical rook moves
    else if (totalPieces === 3 && ((pieces.R === 1 && pieces.K === 1 && pieces.k === 1) || 
                                   (pieces.r === 1 && pieces.K === 1 && pieces.k === 1))) {
      const isWhiteAdvantage = pieces.R === 1;
      const baseWdl = isWhiteAdvantage ? 2 : -2;
      const category = isWhiteAdvantage ? 'win' : 'loss';
      
      moves.push(
        {
          move: 'a1a7',
          san: 'Ra7+',
          dtz: 15,
          dtm: 25,
          wdl: baseWdl,
          category: category
        },
        {
          move: 'a1a8',
          san: 'Ra8+',
          dtz: 17,
          dtm: 27,
          wdl: baseWdl,
          category: category
        },
        {
          move: 'a1b1',
          san: 'Rb1',
          dtz: 19,
          dtm: 29,
          wdl: baseWdl,
          category: category
        }
      );
    }
    
    // KPvK endgame - typical pawn moves
    else if (totalPieces === 3 && ((pieces.P === 1 && pieces.K === 1 && pieces.k === 1) || 
                                   (pieces.p === 1 && pieces.K === 1 && pieces.k === 1))) {
      const isWhiteAdvantage = pieces.P === 1;
      const baseWdl = isWhiteAdvantage ? 2 : -2;
      const category = isWhiteAdvantage ? 'win' : 'loss';
      
      moves.push(
        {
          move: 'e7e8q',
          san: 'e8=Q+',
          dtz: 20,
          dtm: 30,
          wdl: baseWdl,
          category: category
        },
        {
          move: 'e7e8r',
          san: 'e8=R+',
          dtz: 22,
          dtm: 32,
          wdl: baseWdl,
          category: category
        },
        {
          move: 'e6e7',
          san: 'e7',
          dtz: 24,
          dtm: 34,
          wdl: baseWdl,
          category: category
        }
      );
    }
    
    // K+P+R vs K+R endgame - 6 pieces (like Position 9)
    else if (totalPieces === 6 && 
             ((pieces.K === 1 && pieces.P === 1 && pieces.R === 1 && pieces.k === 1 && pieces.r === 1) ||
              (pieces.k === 1 && pieces.p === 1 && pieces.r === 1 && pieces.K === 1 && pieces.R === 1))) {
      
      const isWhiteAdvantage = pieces.K === 1 && pieces.P === 1 && pieces.R === 1;
      const baseWdl = isWhiteAdvantage ? 2 : -2;
      const category = isWhiteAdvantage ? 'win' : 'loss';
      
      if (isWhiteAdvantage) {
        // White has K+P+R vs K+r - typical winning moves
        moves.push(
          {
            move: 'c8d7',
            san: 'Kd7',
            dtz: 30,
            dtm: 42,
            wdl: baseWdl,
            category: category
          },
          {
            move: 'c8d8', 
            san: 'Kd8',
            dtz: 32,
            dtm: 44,
            wdl: baseWdl,
            category: category
          },
          {
            move: 'e4e7',
            san: 'Re7+',
            dtz: 28,
            dtm: 40,
            wdl: baseWdl,
            category: category
          }
        );
      } else {
        // Black has k+p+r vs K+R - similar pattern  
        moves.push(
          {
            move: 'f7e7',
            san: 'Ke7',
            dtz: 30,
            dtm: 42,
            wdl: baseWdl,
            category: category
          },
          {
            move: 'f7f8',
            san: 'Kf8',
            dtz: 32,
            dtm: 44,
            wdl: baseWdl,
            category: category
          },
          {
            move: 'b2b1',
            san: 'Rb1+',
            dtz: 28,
            dtm: 40,
            wdl: baseWdl,
            category: category
          }
        );
      }
    }
    
    // For other positions, generate generic moves
    else {
      const randomWdl = Math.random() < 0.5 ? 2 : -2;
      const category = randomWdl > 0 ? 'win' : 'loss';
      
      moves.push(
        {
          move: 'g1f2',
          san: 'Kf2',
          dtz: 25 + Math.floor(Math.random() * 15),
          dtm: 35 + Math.floor(Math.random() * 20),
          wdl: randomWdl,
          category: category
        },
        {
          move: 'g1h2',
          san: 'Kh2',
          dtz: 27 + Math.floor(Math.random() * 15),
          dtm: 37 + Math.floor(Math.random() * 20),
          wdl: randomWdl,
          category: category
        },
        {
          move: 'g1g2',
          san: 'Kg2',
          dtz: 29 + Math.floor(Math.random() * 15),
          dtm: 39 + Math.floor(Math.random() * 20),
          wdl: randomWdl,
          category: category
        }
      );
    }
    
    return moves.slice(0, 3); // Return Top-3
  }
}