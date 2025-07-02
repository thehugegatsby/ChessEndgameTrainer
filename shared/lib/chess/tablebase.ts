// Syzygy Tablebase API Integration
// Using lichess.org hosted tablebase service

export interface TablebaseResult {
  wdl: number; // Win/Draw/Loss: 2=win, 1=cursed win, 0=draw, -1=blessed loss, -2=loss
  dtz: number | null; // Distance to Zeroing move (50-move rule)
  precise: boolean; // Whether the result is precise
  category: 'win' | 'draw' | 'loss' | 'cursed-win' | 'blessed-loss';
  moves?: TablebaseMove[]; // Best moves with their evaluations
}

export interface TablebaseMove {
  uci: string; // UCI move notation (e.g., "e2e4")
  san: string; // Standard algebraic notation (e.g., "e4")
  wdl: number;
  dtz: number | null;
  precise: boolean;
}

export interface TablebaseEvaluation {
  isTablebasePosition: boolean;
  result?: TablebaseResult;
  error?: string;
  pieceCount: number;
}

class TablebaseService {
  private readonly baseUrl = 'https://tablebase.lichess.ovh/standard';
  private readonly maxPieces = 7; // Syzygy supports up to 7 pieces
  private cache = new Map<string, TablebaseResult>();
  private readonly cacheTimeout = 300000; // 5 minutes cache
  
  /**
   * Check if a position is suitable for tablebase lookup
   */
  private isTablebasePosition(fen: string): boolean {
    // Count pieces (excluding spaces and position info)
    const position = fen.split(' ')[0];
    const pieceCount = position.replace(/[^a-zA-Z]/g, '').length;
    
    return pieceCount <= this.maxPieces;
  }
  
  /**
   * Get piece count from FEN
   */
  private getPieceCount(fen: string): number {
    const position = fen.split(' ')[0];
    return position.replace(/[^a-zA-Z]/g, '').length;
  }
  
  /**
   * Convert category to WDL value for backward compatibility
   */
  private categoryToWdl(category: string): number {
    switch (category) {
      case 'win': return 2;
      case 'cursed-win': return 1;
      case 'draw': return 0;
      case 'blessed-loss': return -1;
      case 'loss': return -2;
      default: return 0;
    }
  }
  
  /**
   * Convert WDL value to human-readable category
   */
  private getCategory(wdl: number): TablebaseResult['category'] {
    switch (wdl) {
      case 2: return 'win';
      case 1: return 'cursed-win';
      case 0: return 'draw';
      case -1: return 'blessed-loss';
      case -2: return 'loss';
      default: return 'draw';
    }
  }
  
  /**
   * Query tablebase for a position
   */
  async queryPosition(fen: string): Promise<TablebaseEvaluation> {
    const pieceCount = this.getPieceCount(fen);
    
    // Check if position is suitable for tablebase
    if (!this.isTablebasePosition(fen)) {
      return {
        isTablebasePosition: false,
        pieceCount,
        error: `Position has ${pieceCount} pieces, tablebase supports max ${this.maxPieces}`
      };
    }
    
    // Check cache first
    const cacheKey = fen;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        isTablebasePosition: true,
        result: cached,
        pieceCount
      };
    }
    
    try {
  
      // Create timeout controller for older Node.js versions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}?fen=${encodeURIComponent(fen)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Tablebase API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Parse tablebase response - Lichess API uses 'category' directly
      const category = data.category || 'draw';
      const wdl = this.categoryToWdl(category);
      
      const result: TablebaseResult = {
        wdl: wdl,
        dtz: data.dtz || null,
        precise: data.precise_dtz !== undefined, // Lichess API has precise_dtz field
        category: category as TablebaseResult['category'],
        moves: data.moves ? data.moves.map((move: any) => ({
          uci: move.uci,
          san: move.san,
          wdl: this.categoryToWdl(move.category || 'draw'),
          dtz: move.dtz || null,
          precise: move.precise_dtz !== undefined
        })) : undefined
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      // Clean up cache after timeout
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheTimeout);
      

      
      return {
        isTablebasePosition: true,
        result,
        pieceCount
      };
      
    } catch (error: any) {
      console.warn('❌ Tablebase query failed:', error.message);
      
      // Don't cache errors, allow retry
      return {
        isTablebasePosition: true,
        error: error.message || 'Tablebase query failed',
        pieceCount
      };
    }
  }
  
  /**
   * Get human-readable evaluation text
   */
  getEvaluationText(result: TablebaseResult): string {
    switch (result.category) {
      case 'win':
        return result.dtz ? `Gewinn in ${result.dtz} Zügen` : 'Theoretisch gewonnen';
      case 'cursed-win':
        return result.dtz ? `Gewinn in ${result.dtz} Zügen (50-Zug-Regel)` : 'Gewinn mit 50-Zug-Regel';
      case 'draw':
        return 'Theoretisches Remis';
      case 'blessed-loss':
        return result.dtz ? `Verlust in ${Math.abs(result.dtz!)} Zügen (50-Zug-Regel)` : 'Verlust mit 50-Zug-Regel';
      case 'loss':
        return result.dtz ? `Verlust in ${Math.abs(result.dtz!)} Zügen` : 'Theoretisch verloren';
      default:
        return 'Unbekannte Bewertung';
    }
  }
  
  /**
   * Get best moves from tablebase
   */
  getBestMoves(result: TablebaseResult): TablebaseMove[] {
    if (!result.moves) return [];
    
    // Sort moves by WDL (best first), then by DTZ (shortest path)
    return result.moves.sort((a, b) => {
      if (a.wdl !== b.wdl) return b.wdl - a.wdl; // Higher WDL first
      if (a.dtz !== null && b.dtz !== null) {
        return Math.abs(a.dtz) - Math.abs(b.dtz); // Shorter DTZ first
      }
      return 0;
    });
  }
  
  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const tablebaseService = new TablebaseService();

// Export for testing
export { TablebaseService }; 