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
  EngineEvaluation,
  MoveQualityResult,
  MoveQualityType
} from '../../../types/evaluation';
import { Logger } from '@shared/services/logging/Logger';
import { Chess } from 'chess.js';

const logger = new Logger();

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
    logger.info('[UnifiedEvaluationService] getFormattedEvaluation called', { fen: fen.slice(0, 20) + '...', perspective });
    const cacheKey = this.createCacheKey(fen, perspective, 'formatted');
    
    // Check cache first
    if (this.config.enableCaching) {
      try {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          logger.debug('[UnifiedEvaluationService] Cache hit', { cacheKey });
          return cached;
        }
      } catch (error) {
        logger.warn('[UnifiedEvaluationService] Cache error', error);
      }
    }

    try {
      logger.debug('[UnifiedEvaluationService] No cache hit, starting evaluation');
      
      // Try tablebase first (highest priority)
      logger.debug('[UnifiedEvaluationService] Trying tablebase evaluation');
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
      logger.info('[UnifiedEvaluationService] No tablebase data, falling back to engine');
      const engineFormatted = await this.getEngineFormattedEvaluation(fen, perspective);
      logger.info('[UnifiedEvaluationService] Got engine evaluation', { engineFormatted });
      
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
   * Assesses the quality of a move by comparing evaluations before and after
   * Supports both engine-based and tablebase-based analysis
   * 
   * @param fenBefore - FEN position before the move
   * @param move - The move in algebraic notation (e.g., "e4") or UCI (e.g., "e2e4")
   * @param playerPerspective - Player who made the move ('w' or 'b')
   * @returns Detailed move quality analysis
   */
  async assessMoveQuality(
    fenBefore: string,
    move: string,
    playerPerspective: 'w' | 'b'
  ): Promise<MoveQualityResult> {
    try {
      // Calculate FEN after the move
      const fenAfter = this.calculateFenAfterMove(fenBefore, move);
      if (!fenAfter) {
        return this.createErrorMoveQuality(fenBefore, move, playerPerspective, 'Invalid move');
      }

      // Get evaluations for both positions
      const [evalBefore, evalAfter] = await Promise.all([
        this.getPerspectiveEvaluation(fenBefore, playerPerspective),
        this.getPerspectiveEvaluation(fenAfter, playerPerspective)
      ]);

      // Analyze based on data type priority (tablebase > engine)
      if (evalBefore.isTablebasePosition && evalAfter.isTablebasePosition) {
        return this.analyzeTablebaseMoveQuality(evalBefore, evalAfter, fenBefore, fenAfter, playerPerspective);
      } else if (evalBefore.type === 'engine' && evalAfter.type === 'engine') {
        return this.analyzeEngineMoveQuality(evalBefore, evalAfter, fenBefore, fenAfter, playerPerspective);
      } else {
        // Mixed evaluation types (edge case)
        return this.analyzeMixedMoveQuality(evalBefore, evalAfter, fenBefore, fenAfter, playerPerspective);
      }
    } catch (error) {
      logger.error('[UnifiedEvaluationService] Error in assessMoveQuality', error);
      return this.createErrorMoveQuality(fenBefore, move, playerPerspective, 'Analysis failed');
    }
  }

  /**
   * Analyzes move quality based on tablebase WDL values
   * @private
   */
  private analyzeTablebaseMoveQuality(
    evalBefore: PlayerPerspectiveEvaluation,
    evalAfter: PlayerPerspectiveEvaluation,
    fenBefore: string,
    fenAfter: string,
    player: 'w' | 'b'
  ): MoveQualityResult {
    const wdlBefore = evalBefore.perspectiveWdl || 0;
    const wdlAfter = evalAfter.perspectiveWdl || 0;
    const wdlChange = wdlAfter - wdlBefore;

    let quality: MoveQualityType;
    let reason: string;

    if (wdlChange > 0) {
      quality = 'excellent';
      reason = 'Improved position (WDL)';
    } else if (wdlChange === 0) {
      if (wdlBefore === 2) {
        // Win to Win - check DTZ for efficiency
        const dtzBefore = evalBefore.perspectiveDtz || 0;
        const dtzAfter = evalAfter.perspectiveDtz || 0;
        const dtzChange = dtzAfter - dtzBefore;

        if (dtzChange <= 0) {
          quality = 'excellent';
          reason = 'Optimal winning move (DTZ maintained/improved)';
        } else if (dtzChange <= 5) {
          quality = 'good';
          reason = 'Slight DTZ increase but still winning';
        } else {
          quality = 'inaccuracy';
          reason = 'Significant DTZ increase';
        }
      } else {
        quality = 'good';
        reason = 'Maintained position quality';
      }
    } else if (wdlChange === -1) {
      quality = 'mistake';
      reason = 'Lost winning chance or worsened position';
    } else {
      quality = 'blunder';
      reason = 'Significant position deterioration';
    }

    return {
      quality,
      fromFen: fenBefore,
      toFen: fenAfter,
      player,
      scoreDifference: null,
      wdlChange,
      mateChange: null,
      reason,
      isTablebaseAnalysis: true,
      metadata: {
        beforeEvaluation: evalBefore,
        afterEvaluation: evalAfter
      }
    };
  }

  /**
   * Analyzes move quality based on engine centipawn evaluation
   * @private
   */
  private analyzeEngineMoveQuality(
    evalBefore: PlayerPerspectiveEvaluation,
    evalAfter: PlayerPerspectiveEvaluation,
    fenBefore: string,
    fenAfter: string,
    player: 'w' | 'b'
  ): MoveQualityResult {
    const scoreBefore = evalBefore.perspectiveScore || 0;
    const scoreAfter = evalAfter.perspectiveScore || 0;
    const scoreDifference = scoreAfter - scoreBefore;

    const mateBefore = evalBefore.perspectiveMate;
    const mateAfter = evalAfter.perspectiveMate;
    const mateChange = mateAfter && mateBefore ? mateAfter - mateBefore : null;

    let quality: MoveQualityType;
    let reason: string;

    // Handle mate positions first
    if (mateBefore || mateAfter) {
      if (mateBefore && mateAfter) {
        if (mateAfter <= mateBefore) {
          quality = 'excellent';
          reason = 'Maintained or improved mate';
        } else {
          quality = 'mistake';
          reason = 'Extended mate distance';
        }
      } else if (mateAfter && !mateBefore) {
        quality = 'excellent';
        reason = 'Found mate';
      } else {
        quality = 'blunder';
        reason = 'Lost mate';
      }
    } else {
      // Standard centipawn evaluation
      if (scoreDifference >= 50) {
        quality = 'excellent';
        reason = 'Significant improvement';
      } else if (scoreDifference >= 10) {
        quality = 'good';
        reason = 'Position improved';
      } else if (scoreDifference >= -10) {
        quality = 'good';
        reason = 'Position maintained';
      } else if (scoreDifference >= -50) {
        quality = 'inaccuracy';
        reason = 'Minor position loss';
      } else if (scoreDifference >= -100) {
        quality = 'mistake';
        reason = 'Position worsened';
      } else {
        quality = 'blunder';
        reason = 'Major position loss';
      }
    }

    return {
      quality,
      fromFen: fenBefore,
      toFen: fenAfter,
      player,
      scoreDifference,
      wdlChange: null,
      mateChange,
      reason,
      isTablebaseAnalysis: false,
      metadata: {
        beforeEvaluation: evalBefore,
        afterEvaluation: evalAfter
      }
    };
  }

  /**
   * Analyzes move quality for mixed evaluation types (edge case)
   * @private
   */
  private analyzeMixedMoveQuality(
    evalBefore: PlayerPerspectiveEvaluation,
    evalAfter: PlayerPerspectiveEvaluation,
    fenBefore: string,
    fenAfter: string,
    player: 'w' | 'b'
  ): MoveQualityResult {
    // Default to conservative analysis for mixed types
    return {
      quality: 'unknown',
      fromFen: fenBefore,
      toFen: fenAfter,
      player,
      scoreDifference: null,
      wdlChange: null,
      mateChange: null,
      reason: 'Mixed evaluation sources - analysis limited',
      isTablebaseAnalysis: false,
      metadata: {
        beforeEvaluation: evalBefore,
        afterEvaluation: evalAfter
      }
    };
  }

  /**
   * Calculates FEN position after a move
   * @private
   */
  private calculateFenAfterMove(fenBefore: string, move: string): string | null {
    try {
      const chess = new Chess(fenBefore);
      const moveResult = chess.move(move);
      
      if (moveResult) {
        return chess.fen();
      }
      return null;
    } catch (error) {
      logger.error('[UnifiedEvaluationService] Error calculating FEN after move', error);
      return null;
    }
  }

  /**
   * Creates error move quality result
   * @private
   */
  private createErrorMoveQuality(
    fenBefore: string,
    move: string,
    player: 'w' | 'b',
    errorMessage: string
  ): MoveQualityResult {
    return {
      quality: 'unknown',
      fromFen: fenBefore,
      toFen: fenBefore,
      player,
      scoreDifference: null,
      wdlChange: null,
      mateChange: null,
      reason: errorMessage,
      isTablebaseAnalysis: false,
      metadata: {
        beforeEvaluation: null,
        afterEvaluation: null,
        error: errorMessage
      }
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