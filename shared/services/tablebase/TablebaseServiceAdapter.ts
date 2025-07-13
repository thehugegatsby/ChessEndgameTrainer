/**
 * TablebaseServiceAdapter - Clean Architecture Adapter
 * 
 * PHASE 3.1: Adapter to bridge ITablebaseService with ITablebaseProvider
 * Connects service-level tablebase interface with evaluation system provider interface
 * 
 * @module TablebaseServiceAdapter
 */

import type { ITablebaseProvider } from '@shared/lib/chess/evaluation/providers';
import type { TablebaseResult } from '@shared/types/evaluation';
import type { ITablebaseService } from './ITablebaseService';

/**
 * Adapter that bridges ITablebaseService with ITablebaseProvider interface
 * 
 * This adapter allows the UnifiedEvaluationService to use tablebase services
 * while maintaining clean architecture separation between service and provider layers.
 */
export class TablebaseServiceAdapter implements ITablebaseProvider {
  constructor(private readonly tablebaseService: ITablebaseService) {}

  /**
   * Implements ITablebaseProvider.getEvaluation using ITablebaseService
   * 
   * @param fen - Position in FEN notation
   * @param playerToMove - Which player is to move ('w' or 'b')  
   * @returns Tablebase result or null if unavailable
   */
  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<TablebaseResult | null> {
    try {
      // Check if position is in tablebase range
      if (!this.tablebaseService.isTablebasePosition(fen)) {
        return null;
      }
      
      // Query tablebase service
      const lookupResult = await this.tablebaseService.lookupPosition(fen);
      
      if (!lookupResult) {
        return null;
      }
      
      // Return the tablebase result directly
      return lookupResult.result;
      
    } catch (error) {
      // Log error but don't throw - return null for graceful fallback
      console.warn('TablebaseServiceAdapter: Lookup failed', error);
      return null;
    }
  }
  
  /**
   * Gets the underlying tablebase service
   * 
   * @returns The tablebase service instance
   */
  getTablebaseService(): ITablebaseService {
    return this.tablebaseService;
  }
}