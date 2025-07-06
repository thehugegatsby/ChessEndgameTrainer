/**
 * EvaluationPipelineFactory - Factory for evaluation pipeline strategies
 * 
 * This factory implements the Strategy Pattern to cleanly switch between:
 * - Legacy-compatible evaluation pipeline (ignores perspective)
 * - Enhanced evaluation pipeline (proper perspective handling)
 * 
 * Following o3's recommendation for centralized mode switching with
 * constructor injection for immutable behavioral contracts.
 * 
 * @module EvaluationPipelineFactory
 */

import { getLogger } from '@shared/services/logging';
import type { ILogger } from '@shared/services/logging/types';
import { EvaluationNormalizer } from './normalizer';
import { PlayerPerspectiveTransformer } from './perspectiveTransformer';
import { EvaluationFormatter } from './formatter';
import type {
  EngineEvaluation,
  TablebaseResult,
  FormattedEvaluation,
  PlayerPerspectiveEvaluation
} from '@shared/types/evaluation';

/**
 * Configuration for pipeline creation
 */
export interface PipelineConfig {
  enhancedPerspective?: boolean;
  cacheEnabled?: boolean;
  logger?: ILogger;
}

/**
 * Abstract strategy interface for evaluation pipelines
 */
export interface EvaluationPipelineStrategy {
  readonly mode: 'legacy' | 'enhanced';
  formatEngineEvaluation(
    engineData: EngineEvaluation,
    perspective: 'w' | 'b'
  ): FormattedEvaluation;
  formatTablebaseEvaluation(
    tablebaseData: TablebaseResult,
    perspective: 'w' | 'b'
  ): FormattedEvaluation;
  getPerspectiveEvaluation(
    engineData: EngineEvaluation,
    perspective: 'w' | 'b'
  ): PlayerPerspectiveEvaluation;
}

/**
 * Pipeline strategy implementation
 * Handles perspective-aware evaluation
 */
class EnhancedPipelineStrategy implements EvaluationPipelineStrategy {
  readonly mode = 'enhanced' as const;
  
  private readonly normalizer: EvaluationNormalizer;
  private readonly transformer: PlayerPerspectiveTransformer;
  private readonly formatter: EvaluationFormatter;
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.normalizer = new EvaluationNormalizer();
    this.transformer = new PlayerPerspectiveTransformer();
    this.formatter = new EvaluationFormatter();
    this.logger = logger;
  }

  formatEngineEvaluation(
    engineData: EngineEvaluation,
    perspective: 'w' | 'b'
  ): FormattedEvaluation {
    try {
      // ENHANCED BEHAVIOR: Respect actual perspective parameter
      const normalized = this.normalizer.normalizeEngineData(engineData, perspective);
      const perspectiveEval = this.transformer.transform(normalized, perspective);
      return this.formatter.format(perspectiveEval);
    } catch (error) {
      this.logger.error('EnhancedPipelineStrategy: Engine evaluation failed', error);
      return this.createErrorFallback();
    }
  }

  formatTablebaseEvaluation(
    tablebaseData: TablebaseResult,
    perspective: 'w' | 'b'
  ): FormattedEvaluation {
    try {
      // ENHANCED BEHAVIOR: Respect actual perspective parameter
      const normalized = this.normalizer.normalizeTablebaseData(tablebaseData, perspective);
      const perspectiveEval = this.transformer.transform(normalized, perspective);
      return this.formatter.format(perspectiveEval);
    } catch (error) {
      this.logger.error('EnhancedPipelineStrategy: Tablebase evaluation failed', error);
      return this.createErrorFallback();
    }
  }

  getPerspectiveEvaluation(
    engineData: EngineEvaluation,
    perspective: 'w' | 'b'
  ): PlayerPerspectiveEvaluation {
    // ENHANCED BEHAVIOR: Respect actual perspective parameter
    const normalized = this.normalizer.normalizeEngineData(engineData, perspective);
    return this.transformer.transform(normalized, perspective);
  }

  private createErrorFallback(): FormattedEvaluation {
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
}

/**
 * Factory for creating evaluation pipeline strategies
 */
export class EvaluationPipelineFactory {
  private static getDefaultLogger() {
    return getLogger();
  }

  /**
   * Creates an evaluation pipeline strategy
   * 
   * @param config - Configuration for pipeline creation  
   * @returns Strategy instance with correct perspective handling
   */
  static createPipeline(config: PipelineConfig = {}): EvaluationPipelineStrategy {
    const logger = config.logger ?? this.getDefaultLogger();
    
    logger.debug('EvaluationPipelineFactory: Creating evaluation pipeline');
    return new EnhancedPipelineStrategy(logger);
  }

  /**
   * Convenience method for getting current default pipeline
   */
  static createDefault(): EvaluationPipelineStrategy {
    return this.createPipeline();
  }

}