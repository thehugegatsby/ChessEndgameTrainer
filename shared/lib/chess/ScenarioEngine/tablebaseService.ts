/**
 * @fileoverview Tablebase Service for Chess Analysis
 * @version 1.0.0
 * @description Handles tablebase queries and evaluation
 * Optimized for mobile and Android performance
 */

import { tablebaseService as coreTablebaseService, TablebaseResult } from '../tablebase';
import { getLogger } from '@shared/services/logging';
import type { TablebaseInfo, TablebaseCategory } from './types';

/**
 * Service for handling tablebase operations
 * Mobile-optimized with proper error handling and caching
 */
export class TablebaseService {
  private cache = new Map<string, TablebaseInfo>();
  private readonly maxCacheSize = 100; // Limit cache for mobile memory

  /**
   * Gets comprehensive tablebase information for a position
   * Includes caching for mobile performance
   */
  async getTablebaseInfo(fen: string): Promise<TablebaseInfo> {
    // Check cache first (mobile optimization)
    if (this.cache.has(fen)) {
      return this.cache.get(fen)!;
    }

         try {
       const result = await coreTablebaseService.queryPosition(fen);
       
       if (!result || !result.isTablebasePosition) {
         const info: TablebaseInfo = {
           isTablebasePosition: false,
           error: 'Position not in tablebase'
         };
         this.setCached(fen, info);
         return info;
       }

       // Get best moves if available
       let bestMoves: Array<{ move: string; evaluation: string }> = [];
       try {
         if (result.result?.moves) {
           bestMoves = result.result.moves.map(move => ({
             move: move.uci || '',
             evaluation: this.formatMoveEvaluation(move)
           }));
         }
       } catch (error) {
         const logger = getLogger();
         logger.warn('[TablebaseService] Failed to get best moves:', error);
       }

             const info: TablebaseInfo = {
         isTablebasePosition: true,
         result: {
           wdl: result.result?.wdl || 0,
           dtz: result.result?.dtz || undefined,
           category: result.result?.category || 'draw',
           precise: result.result?.precise || false
         },
         bestMoves
       };

      this.setCached(fen, info);
      return info;

    } catch (error) {
      const logger = getLogger();
      logger.warn('[TablebaseService] Tablebase query failed:', error);
      
      const info: TablebaseInfo = {
        isTablebasePosition: false,
        error: error instanceof Error ? error.message : 'Unknown tablebase error'
      };
      
      this.setCached(fen, info);
      return info;
    }
  }

  /**
   * Checks if a position is in tablebase
   * Quick check without full evaluation
   */
     async isTablebasePosition(fen: string): Promise<boolean> {
     try {
       const result = await coreTablebaseService.queryPosition(fen);
       return result?.isTablebasePosition || false;
     } catch (error) {
       return false;
     }
   }

  /**
   * Flips tablebase category from one perspective to another
   * Useful for move analysis
   */
  flipTablebaseCategory(category: TablebaseCategory): TablebaseCategory {
    switch (category) {
      case 'win': return 'loss';
      case 'loss': return 'win';
      case 'cursed-win': return 'blessed-loss';
      case 'blessed-loss': return 'cursed-win';
      case 'draw': return 'draw';
      default: return category;
    }
  }

  /**
   * Formats move evaluation for display
   * Mobile-friendly short format
   */
  private formatMoveEvaluation(move: any): string {
    if (move.mate !== undefined) {
      return move.mate > 0 ? `M${move.mate}` : `M${Math.abs(move.mate)}`;
    }
    
    if (move.wdl !== undefined) {
      if (move.wdl > 0) return 'Win';
      if (move.wdl < 0) return 'Loss';
      return 'Draw';
    }
    
    return 'Unknown';
  }

  /**
   * Caches tablebase information with size limit
   * Mobile memory optimization
   */
  private setCached(fen: string, info: TablebaseInfo): void {
    // Clear old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(fen, info);
  }

  /**
   * Clears the tablebase cache
   * Useful for memory management on mobile
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics for debugging
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }

  /**
   * Categorizes WDL value to human-readable category
   * Used for evaluation display
   */
  private getCategory(wdl: number): TablebaseCategory {
    if (wdl === 1 || wdl === 2) return 'win';
    if (wdl === -1 || wdl === -2) return 'loss';
    return 'draw';
  }
} 