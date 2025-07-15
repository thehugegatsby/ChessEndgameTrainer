/**
 * Simple Tablebase Service - Direct Lichess API Integration
 * No overengineering, just what we need.
 */

import { validateAndSanitizeFen } from '../utils/fenValidator';

export interface TablebaseResult {
  wdl: number; // Win/Draw/Loss: 2=win, 1=cursed win, 0=draw, -1=blessed loss, -2=loss
  dtz: number | null; // Distance to Zeroing move
  dtm: number | null; // Distance to Mate (for compatibility)
  category: 'win' | 'draw' | 'loss' | 'cursed-win' | 'blessed-loss';
  precise: boolean; // Whether the result is precise
  evaluation: string; // Human readable text
}

export interface TablebaseEvaluation {
  isAvailable: boolean;
  result?: TablebaseResult;
  error?: string;
}

interface CacheEntry {
  result: TablebaseResult;
  expiry: number;
}

/**
 * Simple Tablebase Service - no adapters, no interfaces, just works
 */
class TablebaseService {
  private cache = new Map<string, CacheEntry>();
  private readonly maxPieces = 7;
  private readonly cacheTtl = 300000; // 5 minutes
  
  /**
   * Get tablebase evaluation for position
   */
  async getEvaluation(fen: string): Promise<TablebaseEvaluation> {
    // CRITICAL FIX: Validate FEN to prevent security risks
    const validation = validateAndSanitizeFen(fen);
    if (!validation.isValid) {
      return { 
        isAvailable: false, 
        error: `Invalid FEN: ${validation.errors.join(', ')}` 
      };
    }
    
    const sanitizedFen = validation.sanitized;
    
    // Quick piece count check using sanitized FEN
    const pieceCount = sanitizedFen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
    if (pieceCount > this.maxPieces) {
      return { isAvailable: false };
    }
    
    // Check cache using sanitized FEN with expiry check
    const cachedEntry = this.cache.get(sanitizedFen);
    if (cachedEntry && cachedEntry.expiry > Date.now()) {
      return { isAvailable: true, result: cachedEntry.result };
    }
    
    try {
      // HIGH FIX: Use AbortController for proper timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(sanitizedFen)}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.category) {
        return { isAvailable: false, error: 'Invalid response' };
      }
      
      const result: TablebaseResult = {
        wdl: this.categoryToWdl(data.category),
        dtz: data.dtz || null,
        dtm: null, // Lichess doesn't provide DTM
        category: data.category,
        precise: data.precise_dtz !== undefined,
        evaluation: this.getEvaluationText(data.category, data.dtz)
      };
      
      // MEDIUM FIX: Cache with expiry timestamp instead of setTimeout
      this.cache.set(sanitizedFen, { 
        result, 
        expiry: Date.now() + this.cacheTtl 
      });
      
      return { isAvailable: true, result };
      
    } catch (error) {
      // Handle specific timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        return { 
          isAvailable: false, 
          error: 'Request timeout (5s)' 
        };
      }
      
      return { 
        isAvailable: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
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
  
  private getEvaluationText(category: string, dtz?: number): string {
    switch (category) {
      case 'win':
        return dtz ? `Gewinn in ${dtz} Zügen` : 'Theoretisch gewonnen';
      case 'cursed-win':
        return dtz ? `Gewinn in ${dtz} Zügen (50-Zug-Regel)` : 'Gewinn mit 50-Zug-Regel';
      case 'draw':
        return 'Theoretisches Remis';
      case 'blessed-loss':
        return dtz ? `Verlust in ${Math.abs(dtz)} Zügen (50-Zug-Regel)` : 'Verlust mit 50-Zug-Regel';
      case 'loss':
        return dtz ? `Verlust in ${Math.abs(dtz)} Zügen` : 'Theoretisch verloren';
      default:
        return 'Unbekannte Bewertung';
    }
  }
  
  /**
   * For testing
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton
export const tablebaseService = new TablebaseService();