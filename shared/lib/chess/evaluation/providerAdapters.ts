/**
 * Adapter implementations for evaluation providers
 * These adapt existing services to the new provider interfaces
 */

import type { IEngineProvider, ITablebaseProvider } from './providers';
import type { EngineEvaluation, TablebaseResult } from '../../../types/evaluation';
import { EngineService } from '../../../services/chess/EngineService';

/**
 * Adapts the new EngineService to IEngineProvider interface
 */
export class EngineProviderAdapter implements IEngineProvider {
  private engineService: EngineService;

  constructor() {
    this.engineService = EngineService.getInstance();
  }

  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null> {
    try {
      // Use the new IChessEngine interface
      const evaluation = await this.engineService.evaluatePosition(fen, { depth: 15 });
      
      if (!evaluation) {
        return null;
      }

      // Convert to EngineEvaluation format
      const result: EngineEvaluation = {
        score: evaluation.evaluation,
        mate: evaluation.mate || null,
        evaluation: evaluation.mate ? `#${Math.abs(evaluation.mate)}` : `${(evaluation.evaluation / 100).toFixed(2)}`,
        depth: 15, // Default depth
        nodes: 0, // Not available in current implementation
        time: 0   // Not available in current implementation
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