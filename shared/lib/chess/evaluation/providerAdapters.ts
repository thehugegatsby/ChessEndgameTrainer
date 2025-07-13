/**
 * Adapter implementations for evaluation providers
 * These adapt existing services to the new provider interfaces
 */

import type { IEngineProvider, ITablebaseProvider } from './providers';
import type { EngineEvaluation, TablebaseResult } from '../../../types/evaluation';
import { engine } from '../engine/singleton';

/**
 * Adapts the enhanced Engine to IEngineProvider interface
 * PHASE 2.2: Now calls enhanced engine API to get PV data
 */
export class EngineProviderAdapter implements IEngineProvider {
  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null> {
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
 * Tablebase provider - currently not implemented in new clean architecture
 * TODO: Implement tablebase integration when needed
 */
export class TablebaseProviderAdapter implements ITablebaseProvider {
  private getWdlCategory(wdl: number): 'win' | 'cursed-win' | 'draw' | 'blessed-loss' | 'loss' {
    if (wdl === 2) return 'win';
    if (wdl === 1) return 'cursed-win';
    if (wdl === 0) return 'draw';
    if (wdl === -1) return 'blessed-loss';
    return 'loss';
  }

  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<TablebaseResult | null> {
    // TODO: Implement tablebase integration in clean architecture
    // For now, return null (no tablebase data available)
    return null;
  }
}