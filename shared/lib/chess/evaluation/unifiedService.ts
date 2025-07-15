/**
 * UnifiedEvaluationService - Central orchestrator for chess evaluations
 * 
 * This service coordinates the entire evaluation pipeline:
 * 1. Raw data acquisition (Tablebase prioritized over Engine)
 * 2. Normalization to White's perspective
 * 3. Perspective transformation for display
 * 4. Formatting for UI consumption
 * 
 * Key principles:
 * - Tablebase is ground truth (highest priority)
 * - Engine provides fallback when tablebase unavailable
 * - Stateless service with pluggable dependencies
 * - Comprehensive caching for performance
 * 
 * @module UnifiedEvaluationService
 */

import { EvaluationPipelineFactory } from './pipelineFactory';
import type { EvaluationPipelineStrategy } from './pipelineFactory';
import type {
  IEngineProvider,
  ICacheProvider,
  UnifiedEvaluationConfig
} from './providers';
import { tablebaseService } from '../../../services/TablebaseService';
import type {
  PlayerPerspectiveEvaluation,
  FormattedEvaluation,
  EngineEvaluation
} from '../../../types/evaluation';

export class UnifiedEvaluationService {
  private readonly config: Required<UnifiedEvaluationConfig>;
  private readonly pipeline: EvaluationPipelineStrategy;

  constructor(
    private readonly engineProvider: IEngineProvider,
    private readonly cache: ICacheProvider<FormattedEvaluation>,
    config: UnifiedEvaluationConfig = {},
    enhancedPerspective?: boolean
  ) {
    
    // Create evaluation pipeline strategy based on configuration
    // Following o3's recommendation for constructor injection of behavioral contract
    this.pipeline = EvaluationPipelineFactory.createPipeline({ 
      enhancedPerspective,
 
    });
    
    // Apply defaults
    this.config = {
      enableCaching: config.enableCaching ?? true,
      cacheTtl: config.cacheTtl ?? 300,
      engineTimeout: config.engineTimeout ?? 5000,
      tablebaseTimeout: config.tablebaseTimeout ?? 2000,
      fallbackToEngine: config.fallbackToEngine ?? true
    };
  }

  /**
   * Gets the best formatted evaluation for a position, prioritizing tablebase
   * 
   * @param fen - Position in FEN notation
   * @param perspective - Player perspective ('w' or 'b')
   * @returns Formatted evaluation ready for UI display
   */
  async getFormattedEvaluation(
    fen: string,
    perspective: 'w' | 'b'
  ): Promise<FormattedEvaluation> {
    const cacheKey = this.createCacheKey(fen, perspective, 'formatted');
    
    // Check cache first
    if (this.config.enableCaching) {
      try {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (error) {
      }
    }

    try {
      
      // Try tablebase first (highest priority)
      const tablebaseFormatted = await this.getTablebaseFormattedEvaluation(fen, perspective);
      if (tablebaseFormatted) {
        // Cache the result
        if (this.config.enableCaching) {
          try {
            await this.cache.set(cacheKey, tablebaseFormatted, this.config.cacheTtl);
          } catch (error) {
          }
        }
        return tablebaseFormatted;
      }

      
      // Fallback to engine evaluation
      const engineFormatted = await this.getEngineFormattedEvaluation(fen, perspective);
      
      // Cache the result
      if (this.config.enableCaching) {
        try {
          await this.cache.set(cacheKey, engineFormatted, this.config.cacheTtl);
        } catch (error) {
        }
      }

      return engineFormatted;
    } catch (error) {
      return this.createErrorFormattedEvaluation();
    }
  }

  /**
   * Gets unformatted perspective evaluation data
   * Useful for consumers that need numerical data (e.g., MoveQualityAnalyzer)
   * 
   * @param fen - Position in FEN notation
   * @param perspective - Player perspective ('w' or 'b')
   * @returns Perspective-adjusted evaluation data
   */
  async getPerspectiveEvaluation(
    fen: string,
    perspective: 'w' | 'b'
  ): Promise<PlayerPerspectiveEvaluation> {
    try {
      // Extract player to move from FEN
      const playerToMove = this.getPlayerToMoveFromFen(fen);
      
      // Try tablebase first (highest priority)
      try {
        // MEDIUM FIX: Remove redundant timeout wrapper - TablebaseService handles its own timeout
        const tablebaseEval = await tablebaseService.getEvaluation(fen);
        
        if (tablebaseEval.isAvailable && tablebaseEval.result) {
          const result = tablebaseEval.result;
          const perspectiveWdl = perspective === 'w' ? result.wdl : -result.wdl;
          return {
            type: 'tablebase',
            scoreInCentipawns: null,
            mate: null,
            wdl: result.wdl,
            dtm: null,
            dtz: result.dtz,
            isTablebasePosition: true,
            raw: result,
            perspective,
            perspectiveScore: null,
            perspectiveMate: null,
            perspectiveWdl: perspectiveWdl,
            perspectiveDtm: null,
            perspectiveDtz: result.dtz
          };
        }
      } catch (tablebaseError) {
      }
      
      // Fallback to engine data
      const engineData = await this.engineProvider.getEvaluation(fen, playerToMove);
      if (!engineData) {
        return this.createErrorPerspectiveEvaluation(perspective);
      }
      const perspectiveEval = this.pipeline.getPerspectiveEvaluation(engineData, playerToMove, perspective);
      
      return perspectiveEval;
    } catch (error) {
      return this.createErrorPerspectiveEvaluation(perspective);
    }
  }

  /**
   * Gets both engine and tablebase evaluations formatted for UI
   * Useful for displays that show both side-by-side
   * 
   * @param fen - Position in FEN notation
   * @param perspective - Player perspective ('w' or 'b')
   * @returns Engine and optional tablebase evaluations
   */
  async getFormattedDualEvaluation(
    fen: string,
    perspective: 'w' | 'b'
  ): Promise<{ engine: FormattedEvaluation; tablebase?: FormattedEvaluation }> {
    try {
      const [engineEval, tablebaseEval] = await Promise.allSettled([
        this.getEngineFormattedEvaluation(fen, perspective),
        this.getTablebaseFormattedEvaluation(fen, perspective)
      ]);

      const engine = engineEval.status === 'fulfilled' 
        ? engineEval.value 
        : this.createErrorFormattedEvaluation();

      const tablebase = tablebaseEval.status === 'fulfilled' 
        ? tablebaseEval.value 
        : undefined;

      return { engine, tablebase };
    } catch (error) {
      return { 
        engine: this.createErrorFormattedEvaluation()
      };
    }
  }

  /**
   * Gets raw engine evaluation data with enhanced UCI fields (including PV)
   * PHASE 2.2: Exposes enhanced evaluation data for PV display
   * 
   * @param fen - Position in FEN notation
   * @param perspective - Player perspective ('w' or 'b') 
   * @returns Raw engine evaluation data or null if unavailable
   */
  async getRawEngineEvaluation(
    fen: string,
    _perspective: 'w' | 'b'
  ): Promise<EngineEvaluation | null> {
    try {
      const playerToMove = this.getPlayerToMoveFromFen(fen);
      const engineData = await this.engineProvider.getEvaluation(fen, playerToMove);
      
      return engineData;
    } catch (error) {
      return null;
    }
  }


  /**
   * Gets engine-only formatted evaluation
   * @private
   */
  private async getEngineFormattedEvaluation(
    fen: string,
    perspective: 'w' | 'b'
  ): Promise<FormattedEvaluation> {
    const playerToMove = this.getPlayerToMoveFromFen(fen);
    const engineData = await this.engineProvider.getEvaluation(fen, playerToMove);
    if (!engineData) {
      return this.createErrorFormattedEvaluation();
    }

    // Use pipeline strategy for consistent formatting
    return this.pipeline.formatEngineEvaluation(engineData, playerToMove, perspective);
  }

  /**
   * Gets tablebase-only formatted evaluation
   * @private
   */
  private async getTablebaseFormattedEvaluation(
    fen: string,
    perspective: 'w' | 'b'
  ): Promise<FormattedEvaluation | undefined> {
    const playerToMove = this.getPlayerToMoveFromFen(fen);
    const tablebaseEval = await tablebaseService.getEvaluation(fen);
    if (!tablebaseEval.isAvailable || !tablebaseEval.result) {
      return undefined;
    }

    // Use pipeline strategy for consistent formatting
    return this.pipeline.formatTablebaseEvaluation(tablebaseEval.result, playerToMove, perspective);
  }

  // REMOVED: withTimeout method no longer needed after removing redundant timeout logic

  /**
   * Creates cache key for evaluation
   * @private
   */
  private createCacheKey(fen: string, perspective: 'w' | 'b', type: string): string {
    return `eval:${type}:${perspective}:${fen}`;
  }

  /**
   * Creates error formatted evaluation
   * @private
   */
  private createErrorFormattedEvaluation(): FormattedEvaluation {
    return {
      mainText: '...',
      detailText: null,
      className: 'neutral',
      metadata: {
        isTablebase: false,
        isMate: false,
        isDrawn: false
      }
    };
  }

  /**
   * Creates error perspective evaluation
   * @private
   */
  private createErrorPerspectiveEvaluation(perspective: 'w' | 'b'): PlayerPerspectiveEvaluation {
    return {
      type: 'engine',
      scoreInCentipawns: null,
      mate: null,
      wdl: null,
      dtm: null,
      dtz: null,
      isTablebasePosition: false,
      raw: null,
      perspective,
      perspectiveScore: null,
      perspectiveMate: null,
      perspectiveWdl: null,
      perspectiveDtm: null,
      perspectiveDtz: null
    };
  }

  /**
   * Extracts player to move from FEN string
   * @private
   */
  private getPlayerToMoveFromFen(fen: string): 'w' | 'b' {
    const parts = fen.split(' ');
    return parts[1] as 'w' | 'b';
  }
}