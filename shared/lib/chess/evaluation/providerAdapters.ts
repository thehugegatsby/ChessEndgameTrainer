/**
 * Adapter implementations for evaluation providers
 * These adapt existing services to the new provider interfaces
 */

import type { IEngineProvider, ITablebaseProvider } from './providers';
import type { EngineEvaluation, TablebaseResult } from '../../../types/evaluation';
import { getSimpleEngine } from '../engine/simple/SimpleEngine';
import { tablebaseService } from '../../../services/TablebaseService';
import { Logger } from '@shared/services/logging/Logger';
import { EVALUATION } from '@shared/constants';

const logger = new Logger();

/**
 * Adapts the enhanced Engine to IEngineProvider interface
 * PHASE 2.2: Now calls enhanced engine API to get PV data
 * PHASE 3: Added Multi-PV support
 */
export class EngineProviderAdapter implements IEngineProvider {
  async getEvaluation(fen: string, _playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null> {
    logger.info('[EngineProviderAdapter] Getting evaluation', { fen: fen.slice(0, 20) + '...' });
    try {
      // Use SimpleEngine for evaluation
      logger.debug('[EngineProviderAdapter] Getting SimpleEngine instance');
      const engine = getSimpleEngine();
      
      // Try Multi-PV evaluation first
      try {
        logger.debug('[EngineProviderAdapter] Trying Multi-PV evaluation');
        const multiPvResult = await engine.evaluatePositionMultiPV(fen, EVALUATION.MULTI_PV_COUNT);
        
        if (multiPvResult && multiPvResult.lines.length > 0) {
          // Use the best line (first one) for primary evaluation
          const bestLine = multiPvResult.lines[0];
          logger.info('[EngineProviderAdapter] Got Multi-PV result', { 
            lines: multiPvResult.lines.length,
            bestScore: bestLine.score 
          });
          
          const result: EngineEvaluation = {
            score: bestLine.score.value,
            mate: bestLine.score.type === 'mate' ? Math.ceil(bestLine.score.value / 2) : null,
            evaluation: bestLine.score.type === 'mate' 
              ? `#${Math.abs(Math.ceil(bestLine.score.value / 2))}` 
              : `${(bestLine.score.value / 100).toFixed(2)}`,
            depth: bestLine.depth,
            nodes: bestLine.nodes || 0,
            time: bestLine.time || 0,
            pv: bestLine.pv.split(' '),
            pvString: bestLine.pv,
            nps: bestLine.nps || 0,
            hashfull: 0, // Not available in SimpleEngine
            seldepth: bestLine.seldepth || 0,
            multipv: 1, // This is the best line
            currmove: '', // Not available in SimpleEngine
            currmovenumber: 0, // Not available in SimpleEngine
            // Store all Multi-PV lines for later use
            multiPvLines: multiPvResult.lines
          };
          
          return result;
        }
      } catch (multiPvError) {
        logger.warn('[EngineProviderAdapter] Multi-PV failed, falling back to single PV', multiPvError);
      }
      
      // Fallback to single PV evaluation
      logger.debug('[EngineProviderAdapter] Calling engine.evaluatePosition');
      const evaluation = await engine.evaluatePosition(fen);
      logger.info('[EngineProviderAdapter] Got evaluation result', { evaluation });
      
      if (!evaluation) {
        return null;
      }

      // Convert SimpleEngine evaluation to EngineEvaluation format
      const result: EngineEvaluation = {
        score: evaluation.score.value,
        mate: evaluation.score.type === 'mate' ? Math.ceil(evaluation.score.value / 2) : null,
        evaluation: evaluation.score.type === 'mate' 
          ? `#${Math.abs(Math.ceil(evaluation.score.value / 2))}` 
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