/**
 * MoveQualityAnalyzer - Analyzes move quality between positions
 * 
 * This module compares two positions to classify move quality based on
 * evaluation differences. It provides standardized move assessment that
 * works across both engine and tablebase evaluations.
 * 
 * Classification thresholds (centipawns):
 * - excellent: +50cp or better (or WDL improvement)
 * - good: +20 to +50cp
 * - inaccuracy: -20 to -100cp loss
 * - mistake: -100 to -300cp loss  
 * - blunder: -300cp+ loss (or WDL deterioration)
 * 
 * @module MoveQualityAnalyzer
 */

import type { UnifiedEvaluationService } from './unifiedService';
import type {
  PlayerPerspectiveEvaluation,
  MoveQualityResult,
  MoveQualityType
} from '@shared/types/evaluation';

export interface MoveQualityConfig {
  /** Threshold for excellent moves in centipawns */
  excellentThreshold?: number;
  /** Threshold for good moves in centipawns */
  goodThreshold?: number;
  /** Threshold for inaccuracy in centipawns */
  inaccuracyThreshold?: number;
  /** Threshold for mistake in centipawns */
  mistakeThreshold?: number;
}

export class MoveQualityAnalyzer {
  private readonly excellentThreshold: number;
  private readonly goodThreshold: number;
  private readonly inaccuracyThreshold: number;
  private readonly mistakeThreshold: number;

  constructor(
    private readonly evaluationService: UnifiedEvaluationService,
    config: MoveQualityConfig = {}
  ) {
    
    // Apply default thresholds
    this.excellentThreshold = config.excellentThreshold ?? 50;
    this.goodThreshold = config.goodThreshold ?? 20;
    this.inaccuracyThreshold = config.inaccuracyThreshold ?? 100;
    this.mistakeThreshold = config.mistakeThreshold ?? 300;
  }

  /**
   * Analyzes the quality of a move between two positions
   * 
   * @param fenBefore - Position before the move
   * @param fenAfter - Position after the move
   * @param player - Player who made the move
   * @returns Move quality analysis result
   */
  async analyzeMove(
    fenBefore: string,
    fenAfter: string,
    player: 'w' | 'b'
  ): Promise<MoveQualityResult> {
    try {
      // Get evaluations for both positions
      const [beforeEval, afterEval] = await Promise.all([
        this.evaluationService.getPerspectiveEvaluation(fenBefore, player),
        this.evaluationService.getPerspectiveEvaluation(fenAfter, player)
      ]);

      // Analyze the difference
      const analysis = this.analyzeDifference(beforeEval, afterEval, player);

      return {
        quality: analysis.quality,
        fromFen: fenBefore,
        toFen: fenAfter,
        player,
        scoreDifference: analysis.scoreDifference,
        wdlChange: analysis.wdlChange,
        mateChange: analysis.mateChange,
        reason: analysis.reason,
        isTablebaseAnalysis: analysis.isTablebaseAnalysis,
        metadata: {
          beforeEvaluation: beforeEval,
          afterEvaluation: afterEval
        }
      };
    } catch (error) {
      
      return {
        quality: 'unknown',
        fromFen: fenBefore,
        toFen: fenAfter,
        player,
        scoreDifference: null,
        wdlChange: null,
        mateChange: null,
        reason: 'Error analyzing move quality',
        isTablebaseAnalysis: false,
        metadata: {
          beforeEvaluation: null,
          afterEvaluation: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Analyzes a sequence of moves
   * 
   * @param fens - Array of FEN positions
   * @param startingPlayer - Player who made the first move
   * @returns Array of move quality results
   */
  async analyzeMoveSequence(
    fens: string[],
    startingPlayer: 'w' | 'b'
  ): Promise<MoveQualityResult[]> {
    if (fens.length < 2) {
      return [];
    }

    const results: MoveQualityResult[] = [];
    let currentPlayer = startingPlayer;

    for (let i = 0; i < fens.length - 1; i++) {
      const result = await this.analyzeMove(fens[i], fens[i + 1], currentPlayer);
      results.push(result);
      
      // Alternate player for next move
      currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
    }

    return results;
  }

  /**
   * Analyzes the difference between two evaluations
   * @private
   */
  private analyzeDifference(
    beforeEval: PlayerPerspectiveEvaluation | null,
    afterEval: PlayerPerspectiveEvaluation | null,
    player: 'w' | 'b'
  ): {
    quality: MoveQualityType;
    scoreDifference: number | null;
    wdlChange: number | null;
    mateChange: number | null;
    reason: string;
    isTablebaseAnalysis: boolean;
  } {
    // Handle missing evaluations
    if (!beforeEval || !afterEval) {
      return {
        quality: 'unknown',
        scoreDifference: null,
        wdlChange: null,
        mateChange: null,
        reason: 'Missing evaluation data',
        isTablebaseAnalysis: false
      };
    }

    // Tablebase analysis takes priority (ground truth)
    if (beforeEval.isTablebasePosition && afterEval.isTablebasePosition) {
      return this.analyzeTablebaseDifference(beforeEval, afterEval);
    }

    // Mate analysis
    if (beforeEval.perspectiveMate !== null || afterEval.perspectiveMate !== null) {
      return this.analyzeMateDifference(beforeEval, afterEval);
    }

    // Score analysis
    if (beforeEval.perspectiveScore !== null && afterEval.perspectiveScore !== null) {
      return this.analyzeScoreDifference(beforeEval, afterEval);
    }

    // Mixed evaluation types - fallback to score if available
    if (beforeEval.perspectiveScore !== null || afterEval.perspectiveScore !== null) {
      return this.analyzeMixedEvaluation(beforeEval, afterEval);
    }

    return {
      quality: 'unknown',
      scoreDifference: null,
      wdlChange: null,
      mateChange: null,
      reason: 'Unable to compare evaluations',
      isTablebaseAnalysis: false
    };
  }

  /**
   * Analyzes WDL differences in tablebase positions
   * @private
   */
  private analyzeTablebaseDifference(
    beforeEval: PlayerPerspectiveEvaluation,
    afterEval: PlayerPerspectiveEvaluation
  ): {
    quality: MoveQualityType;
    scoreDifference: null;
    wdlChange: number | null;
    mateChange: number | null;
    reason: string;
    isTablebaseAnalysis: boolean;
  } {
    const wdlBefore = beforeEval.perspectiveWdl ?? 0;
    const wdlAfter = afterEval.perspectiveWdl ?? 0;
    const wdlChange = wdlAfter - wdlBefore;

    const dtmBefore = beforeEval.perspectiveDtm;
    const dtmAfter = afterEval.perspectiveDtm;
    const mateChange = (dtmBefore !== null && dtmAfter !== null) ? dtmAfter - dtmBefore : null;

    let quality: MoveQualityType;
    let reason: string;

    if (wdlChange > 0) {
      quality = 'excellent';
      reason = 'Excellent move: WDL improvement';
    } else if (wdlChange < 0) {
      quality = 'blunder';
      reason = 'Blunder: WDL deterioration';
    } else {
      // Same WDL - check DTM improvement
      if (mateChange !== null) {
        if (mateChange < 0 && wdlAfter > 0) {
          quality = 'excellent';
          reason = 'Excellent move: Faster mate';
        } else if (mateChange > 0 && wdlAfter > 0) {
          quality = 'inaccuracy';
          reason = 'Inaccuracy: Slower mate';
        } else {
          quality = 'good';
          reason = 'Good move: Maintains position';
        }
      } else {
        quality = 'good';
        reason = 'Good move: Maintains WDL';
      }
    }

    return {
      quality,
      scoreDifference: null,
      wdlChange,
      mateChange,
      reason,
      isTablebaseAnalysis: true
    };
  }

  /**
   * Analyzes mate differences
   * @private
   */
  private analyzeMateDifference(
    beforeEval: PlayerPerspectiveEvaluation,
    afterEval: PlayerPerspectiveEvaluation
  ): {
    quality: MoveQualityType;
    scoreDifference: number | null;
    wdlChange: null;
    mateChange: number | null;
    reason: string;
    isTablebaseAnalysis: boolean;
  } {
    const mateBefore = beforeEval.perspectiveMate;
    const mateAfter = afterEval.perspectiveMate;

    // Handle mate to non-mate or vice versa
    if (mateBefore === null && mateAfter !== null) {
      if (mateAfter > 0) {
        return {
          quality: 'excellent',
          scoreDifference: null,
          wdlChange: null,
          mateChange: mateAfter,
          reason: 'Excellent move: Found mate',
          isTablebaseAnalysis: false
        };
      } else {
        return {
          quality: 'blunder',
          scoreDifference: null,
          wdlChange: null,
          mateChange: mateAfter,
          reason: 'Blunder: Allowed mate',
          isTablebaseAnalysis: false
        };
      }
    }

    if (mateBefore !== null && mateAfter === null) {
      if (mateBefore > 0) {
        return {
          quality: 'mistake',
          scoreDifference: null,
          wdlChange: null,
          mateChange: null,
          reason: 'Mistake: Lost mate opportunity',
          isTablebaseAnalysis: false
        };
      } else {
        return {
          quality: 'excellent',
          scoreDifference: null,
          wdlChange: null,
          mateChange: null,
          reason: 'Excellent move: Avoided mate',
          isTablebaseAnalysis: false
        };
      }
    }

    // Both are mate values
    if (mateBefore !== null && mateAfter !== null) {
      const mateChange = mateAfter - mateBefore;
      
      if (mateAfter > 0) {
        // Player has mate
        if (mateChange < 0) {
          return {
            quality: 'excellent',
            scoreDifference: null,
            wdlChange: null,
            mateChange,
            reason: 'Excellent move: Improved mate',
            isTablebaseAnalysis: false
          };
        } else if (mateChange > 0) {
          return {
            quality: 'inaccuracy',
            scoreDifference: null,
            wdlChange: null,
            mateChange,
            reason: 'Inaccuracy: Slower mate',
            isTablebaseAnalysis: false
          };
        }
      } else {
        // Player is being mated
        if (mateChange > 0) {
          return {
            quality: 'good',
            scoreDifference: null,
            wdlChange: null,
            mateChange,
            reason: 'Good move: Prolonged defense',
            isTablebaseAnalysis: false
          };
        } else if (mateChange < 0) {
          return {
            quality: 'mistake',
            scoreDifference: null,
            wdlChange: null,
            mateChange,
            reason: 'Mistake: Hastened mate',
            isTablebaseAnalysis: false
          };
        }
      }

      return {
        quality: 'good',
        scoreDifference: null,
        wdlChange: null,
        mateChange,
        reason: 'Good move: Maintained mate sequence',
        isTablebaseAnalysis: false
      };
    }

    // Should not reach here
    return {
      quality: 'unknown',
      scoreDifference: null,
      wdlChange: null,
      mateChange: null,
      reason: 'Unable to analyze mate difference',
      isTablebaseAnalysis: false
    };
  }

  /**
   * Analyzes score differences
   * @private
   */
  private analyzeScoreDifference(
    beforeEval: PlayerPerspectiveEvaluation,
    afterEval: PlayerPerspectiveEvaluation
  ): {
    quality: MoveQualityType;
    scoreDifference: number;
    wdlChange: null;
    mateChange: null;
    reason: string;
    isTablebaseAnalysis: boolean;
  } {
    const scoreBefore = beforeEval.perspectiveScore!;
    const scoreAfter = afterEval.perspectiveScore!;
    const scoreDifference = scoreAfter - scoreBefore;

    let quality: MoveQualityType;
    let reason: string;

    if (scoreDifference >= this.excellentThreshold) {
      quality = 'excellent';
      reason = `Excellent move: +${scoreDifference}cp improvement`;
    } else if (scoreDifference >= this.goodThreshold) {
      quality = 'good';
      reason = `Good move: +${scoreDifference}cp improvement`;
    } else if (scoreDifference >= -this.goodThreshold) {
      quality = 'good';
      reason = `Good move: ${Math.abs(scoreDifference)}cp neutral`;
    } else if (scoreDifference >= -this.inaccuracyThreshold) {
      quality = 'inaccuracy';
      reason = `Inaccuracy: ${Math.abs(scoreDifference)}cp loss`;
    } else if (scoreDifference >= -this.mistakeThreshold) {
      quality = 'mistake';
      reason = `Mistake: ${Math.abs(scoreDifference)}cp loss`;
    } else {
      quality = 'blunder';
      reason = `Blunder: ${Math.abs(scoreDifference)}cp loss`;
    }

    return {
      quality,
      scoreDifference,
      wdlChange: null,
      mateChange: null,
      reason,
      isTablebaseAnalysis: false
    };
  }

  /**
   * Analyzes mixed evaluation types
   * @private
   */
  private analyzeMixedEvaluation(
    beforeEval: PlayerPerspectiveEvaluation,
    afterEval: PlayerPerspectiveEvaluation
  ): {
    quality: MoveQualityType;
    scoreDifference: number | null;
    wdlChange: null;
    mateChange: null;
    reason: string;
    isTablebaseAnalysis: boolean;
  } {
    // Try to use available score data
    const scoreBefore = beforeEval.perspectiveScore;
    const scoreAfter = afterEval.perspectiveScore;

    if (scoreBefore !== null && scoreAfter !== null) {
      return this.analyzeScoreDifference(beforeEval, afterEval);
    }

    // Cannot meaningfully compare mixed types
    return {
      quality: 'unknown',
      scoreDifference: null,
      wdlChange: null,
      mateChange: null,
      reason: 'Cannot compare different evaluation types',
      isTablebaseAnalysis: false
    };
  }
}