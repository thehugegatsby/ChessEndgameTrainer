/**
 * @fileoverview Syzygy Tablebase API Integration
 * @description Using lichess.org hosted tablebase service for endgame positions
 * 
 * AI_NOTE: CRITICAL ENDGAME EVALUATION SERVICE!
 * - Provides PERFECT play for positions with ≤7 pieces
 * - Uses Lichess public API (free, no auth required)
 * - Returns Win/Draw/Loss (WDL) + Distance to Zeroing (DTZ)
 * - Cache prevents API spam (5min timeout)
 * 
 * WDL VALUES (always from White's perspective!):
 * - 2 = Win
 * - 1 = Cursed win (win but 50-move rule applies)
 * - 0 = Draw
 * - -1 = Blessed loss (loss saved by 50-move rule)
 * - -2 = Loss
 * 
 * PERFORMANCE:
 * - API calls take 100-500ms typically
 * - Caches results for 5 minutes
 * - Max 7 pieces (Syzygy limitation)
 */

import { getLogger } from '@shared/services/logging';
import { validateAndSanitizeFen } from '@shared/utils/fenValidator';

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

/**
 * Tablebase Service Class
 * 
 * AI_NOTE: SINGLETON PATTERN (yet again!)
 * - Single instance exported at bottom
 * - In-memory cache with auto-expiry
 * - No persistent storage (refreshes on reload)
 * 
 * API ENDPOINT: https://tablebase.lichess.ovh/standard
 * - Free public API, no rate limits documented
 * - Returns JSON with category, dtz, moves array
 * - Supports standard chess only (no variants)
 */
class TablebaseService {
  private readonly baseUrl = 'https://tablebase.lichess.ovh/standard';
  private readonly maxPieces = 7; // Syzygy supports up to 7 pieces
  private cache = new Map<string, TablebaseResult>();
  private readonly cacheTimeout = 300000; // 5 minutes cache
  
  /**
   * Check if a position is suitable for tablebase lookup
   * 
   * AI_NOTE: PIECE COUNTING LOGIC
   * - Extracts board part of FEN (before first space)
   * - Removes all non-letters (numbers, slashes)
   * - Each letter = 1 piece (K,Q,R,B,N,P)
   * - Must be ≤7 pieces total for Syzygy
   * 
   * Example: "8/8/8/8/8/8/1K1k4/8 w - - 0 1" = 2 pieces (K,k)
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
   * 
   * AI_NOTE: API RESPONSE MAPPING
   * Lichess API returns string categories, but our code
   * expects numeric WDL values. This maintains compatibility
   * with existing evaluation logic.
   * 
   * IMPORTANT: These values are ALWAYS from White's perspective!
   * Black must negate them: wdl * -1
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
   * Query tablebase for a position
   */
  async queryPosition(fen: string): Promise<TablebaseEvaluation> {
    // Validate and sanitize FEN to prevent injection attacks
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      return {
        isTablebasePosition: false,
        pieceCount: 0,
        error: `Invalid FEN format: ${validation.errors.join(', ')}`
      };
    }
    
    const sanitizedFen = validation.sanitized;
    const pieceCount = this.getPieceCount(sanitizedFen);
    
    // Check if position is suitable for tablebase
    if (!this.isTablebasePosition(sanitizedFen)) {
      return {
        isTablebasePosition: false,
        pieceCount,
        error: `Position has ${pieceCount} pieces, tablebase supports max ${this.maxPieces}`
      };
    }
    
    // Check cache first (use sanitized FEN as key)
    const cacheKey = sanitizedFen;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        isTablebasePosition: true,
        result: cached,
        pieceCount
      };
    }
    
    try {
  
      // AI_NOTE: TIMEOUT HANDLING for reliability
      // - 5 second timeout prevents hanging requests
      // - AbortController works in modern browsers
      // - Prevents UI freezing on slow connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}?fen=${encodeURIComponent(sanitizedFen)}`, {
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
      
      
      // AI_NOTE: API RESPONSE PARSING
      // Lichess returns:
      // - category: 'win'/'draw'/'loss' etc
      // - dtz: Distance to Zeroing (50-move rule)
      // - moves: Array of legal moves with their outcomes
      // - precise_dtz: Whether DTZ is exact
      // 
      // IMPORTANT FIX: Check if API returned valid data
      // If data is empty object {}, the API call failed
      if (!data || Object.keys(data).length === 0 || !data.category) {
        throw new Error('Invalid tablebase response - empty or missing category');
      }
      
      // We normalize to our internal format for consistency
      const category = data.category;
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
      
      // AI_NOTE: SMART CACHING STRATEGY
      // - Cache hit = instant response (0ms)
      // - Cache miss = API call (100-500ms)
      // - Auto-expires after 5 minutes
      // - Prevents API spam for same position
      // 
      // Memory impact: ~1KB per position
      // Max ~100 positions = 100KB (negligible)
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
      // AI_NOTE: ERROR HANDLING
      // Common failures:
      // - Network timeout (5s limit)
      // - API down/maintenance
      // - Invalid FEN format
      // - CORS issues (should be pre-configured)
      // 
      // We DON'T cache errors - allows retry on next request
      const logger = getLogger();
      logger.warn('❌ Tablebase query failed:', error.message);
      
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
   * 
   * AI_NOTE: OPTIMAL MOVE SORTING
   * 1. Sort by WDL (wins > draws > losses)
   * 2. Within same WDL, sort by DTZ (faster wins)
   * 
   * Example ordering:
   * - Win in 10 moves (wdl=2, dtz=10)
   * - Win in 20 moves (wdl=2, dtz=20)
   * - Draw (wdl=0)
   * - Loss in 30 moves (wdl=-2, dtz=-30)
   * 
   * This gives OPTIMAL play according to tablebase!
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

/**
 * AI_NOTE: SINGLETON EXPORT
 * - Use tablebaseService.queryPosition(fen) everywhere
 * - Don't create new instances (memory waste)
 * - Shared cache across all components
 * 
 * TYPICAL USAGE:
 * const eval = await tablebaseService.queryPosition(fen);
 * if (eval.isTablebasePosition && eval.result) {
 *   const logger = getLogger();
 *   logger.info('Tablebase says:', eval.result.category);
 * }
 */
// Export singleton instance
export const tablebaseService = new TablebaseService();

// Export for testing
export { TablebaseService }; 