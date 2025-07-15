/**
 * Adapter implementations for evaluation providers
 * These adapt existing services to the new provider interfaces
 */

import type { IEngineProvider, ITablebaseProvider } from './providers';
import type { EngineEvaluation, TablebaseResult } from '../../../types/evaluation';
import { getSimpleEngine } from '../engine/simple/SimpleEngine';
import { tablebaseService } from '../../../services/TablebaseService';
import { Logger } from '@shared/services/logging/Logger';

const logger = new Logger();

/**
 * Adapts the enhanced Engine to IEngineProvider interface
 * PHASE 2.2: Now calls enhanced engine API to get PV data
 */
export class EngineProviderAdapter implements IEngineProvider {
  async getEvaluation(fen: string, _playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null> {
    logger.info('[EngineProviderAdapter] Getting evaluation', { fen: fen.slice(0, 20) + '...' });
    try {
      // Use SimpleEngine for evaluation
      logger.debug('[EngineProviderAdapter] Getting SimpleEngine instance');
      const engine = getSimpleEngine();
      logger.debug('[EngineProviderAdapter] Calling engine.evaluatePosition');
      const evaluation = await engine.evaluatePosition(fen);
      logger.info('[EngineProviderAdapter] Got evaluation result', { evaluation });
      
      if (!evaluation) {
        return null;
      }

      // Convert SimpleEngine evaluation to EngineEvaluation format
      const result: EngineEvaluation = {
        score: evaluation.score.value,
        mate: evaluation.score.type === 'mate' ? evaluation.score.value : null,
        evaluation: evaluation.score.type === 'mate' 
          ? `#${Math.abs(evaluation.score.value)}` 
          : `${(evaluation.score.value / 100).toFixed(2)}`,
        depth: evaluation.depth || 15,
        nodes: evaluation.nodes || 0,
        time: evaluation.time || 0,
        // Use SimpleEngine PV data
        pv: evaluation.pv ? evaluation.pv.split(' ') : [],
        pvString: evaluation.pv || '',
        nps: evaluation.nps || 0,
        hashfull: 0, // Not available in SimpleEngine
        seldepth: 0, // Not available in SimpleEngine
        multipv: 1, // SimpleEngine uses single PV
        currmove: '', // Not available in SimpleEngine
        currmovenumber: 0 // Not available in SimpleEngine
      };

      return result;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Simplified Tablebase provider using direct service
 * SIMPLIFIED: Direct integration with TablebaseService
 */
export class TablebaseProviderAdapter implements ITablebaseProvider {
  async getEvaluation(fen: string, _playerToMove: 'w' | 'b'): Promise<TablebaseResult | null> {
    try {
      // HIGH FIX: Use direct service call instead of complex adapter chain
      const result = await tablebaseService.getEvaluation(fen);
      return result.isAvailable && result.result ? result.result : null;
    } catch (error) {
      // Log error but return null for graceful fallback to engine
      console.warn('TablebaseProviderAdapter: Failed to get tablebase evaluation', error);
      return null;
    }
  }
}