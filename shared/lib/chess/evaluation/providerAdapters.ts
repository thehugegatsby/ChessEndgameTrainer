/**
 * Adapter implementations for evaluation providers
 * These adapt existing services to the new provider interfaces
 */

import type { IEngineProvider, ITablebaseProvider } from './providers';
import type { EngineEvaluation, TablebaseResult } from '@shared/types/evaluation';
import { EngineService } from '@shared/services/chess/EngineService';

/**
 * Adapts the existing EngineService to IEngineProvider interface
 */
export class EngineProviderAdapter implements IEngineProvider {
  private engineService: typeof EngineService;

  constructor() {
    this.engineService = EngineService;
  }

  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null> {
    try {
      const engineService = this.engineService.getInstance();
      const scenarioEngine = await engineService.getEngine('evaluation');
      const evaluation = await scenarioEngine.getEvaluation(fen);
      
      if (!evaluation) {
        engineService.releaseEngine('evaluation');
        return null;
      }

      // Convert to EngineEvaluation format
      const result: EngineEvaluation = {
        score: evaluation.score,
        mate: evaluation.mate || null,
        evaluation: evaluation.mate ? `#${Math.abs(evaluation.mate)}` : `${(evaluation.score / 100).toFixed(2)}`,
        depth: 20, // Default depth
        nodes: 0, // Not available in current implementation
        time: 0   // Not available in current implementation
      };

      engineService.releaseEngine('evaluation');
      return result;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Adapts the existing ScenarioEngine tablebase to ITablebaseProvider interface
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
    try {
      
      const engineService = EngineService.getInstance();
      const scenarioEngine = await engineService.getEngine('tablebase');
      const result = await scenarioEngine.getTablebaseInfo(fen);
      
      
      if (!result || !result.isTablebasePosition) {
        engineService.releaseEngine('tablebase');
        return null;
      }

      // Convert to TablebaseResult format
      const tablebaseResult: TablebaseResult = {
        wdl: result.result?.wdl || 0,
        dtz: result.result?.dtz || null,
        dtm: null, // TablebaseInfo doesn't have dtm
        category: result.result?.category || this.getWdlCategory(result.result?.wdl || 0),
        precise: result.result?.precise || true
      };
      

      engineService.releaseEngine('tablebase');
      return tablebaseResult;
    } catch (error) {
      return null;
    }
  }
}