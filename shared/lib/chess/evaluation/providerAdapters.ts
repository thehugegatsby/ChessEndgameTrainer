/**
 * Adapter implementations for evaluation providers
 * These adapt existing services to the new provider interfaces
 */

import type { IEngineProvider, ITablebaseProvider } from './providers';
import type { EngineEvaluation, TablebaseResult } from '../../../types/evaluation';
import { engine } from '../engine/singleton';
import { createTablebaseService, TablebaseServiceAdapter } from '../../../services/tablebase';

/**
 * Adapts the enhanced Engine to IEngineProvider interface
 * PHASE 2.2: Now calls enhanced engine API to get PV data
 */
export class EngineProviderAdapter implements IEngineProvider {
  async getEvaluation(fen: string, _playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null> {
    try {
      // PHASE 2.2: Call enhanced engine API with PV data
      const enhancedEvaluation = await engine.evaluatePositionEnhanced(fen, false);
      
      if (!enhancedEvaluation) {
        return null;
      }

      // Convert enhanced evaluation to EngineEvaluation format with PV data
      const result: EngineEvaluation = {
        score: enhancedEvaluation.score,
        mate: enhancedEvaluation.mate,
        evaluation: enhancedEvaluation.mate 
          ? `#${Math.abs(enhancedEvaluation.mate)}` 
          : `${(enhancedEvaluation.score / 100).toFixed(2)}`,
        depth: enhancedEvaluation.depth || 15,
        nodes: enhancedEvaluation.nodes || 0,
        time: enhancedEvaluation.time || 0,
        // PHASE 2.2: Include PV data in engine evaluation
        pv: enhancedEvaluation.pv,
        pvString: enhancedEvaluation.pvString,
        nps: enhancedEvaluation.nps,
        hashfull: enhancedEvaluation.hashfull,
        seldepth: enhancedEvaluation.seldepth,
        multipv: enhancedEvaluation.multipv,
        currmove: enhancedEvaluation.currmove,
        currmovenumber: enhancedEvaluation.currmovenumber
      };

      return result;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Tablebase provider using clean architecture tablebase services
 * PHASE 3.2: Implements tablebase integration through ITablebaseService
 */
export class TablebaseProviderAdapter implements ITablebaseProvider {
  private readonly serviceAdapter: TablebaseServiceAdapter;

  constructor() {
    // PHASE 3.2: Create tablebase service and adapter
    // For now using mock service - can be configured for real services later
    const tablebaseService = createTablebaseService('mock', {
      maxPieces: 7,
      enableCaching: true,
      cacheTtl: 3600, // 1 hour cache
      timeout: 2000   // 2 second timeout
    });
    
    this.serviceAdapter = new TablebaseServiceAdapter(tablebaseService);
  }

  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<TablebaseResult | null> {
    try {
      // PHASE 3.2: Use service adapter to get tablebase evaluation
      return await this.serviceAdapter.getEvaluation(fen, playerToMove);
    } catch (error) {
      // Log error but return null for graceful fallback to engine
      console.warn('TablebaseProviderAdapter: Failed to get tablebase evaluation', error);
      return null;
    }
  }
  
  /**
   * Gets the underlying tablebase service for advanced usage
   * @returns The tablebase service instance
   */
  getTablebaseService() {
    return this.serviceAdapter.getTablebaseService();
  }
}