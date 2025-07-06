/**
 * EvaluationFormatter - Formats evaluations for UI display
 * 
 * This module converts PlayerPerspectiveEvaluation into formatted strings
 * suitable for UI display. It handles different evaluation types with
 * appropriate formatting conventions.
 * 
 * Formatting hierarchy:
 * 1. Tablebase (highest priority) - Ground truth
 * 2. Engine Mate - Forced sequence
 * 3. Engine Score - Numerical evaluation
 * 
 * @module EvaluationFormatter
 */

import { Logger } from '@shared/services/logging/LoggerCompat';
import type { ILogger } from '@shared/services/logging/types';
import type {
  PlayerPerspectiveEvaluation,
  FormattedEvaluation
} from '@shared/types/evaluation';

export interface FormatterConfig {
  /** Threshold for neutral evaluation in centipawns (default: 20) */
  neutralThreshold?: number;
  /** Threshold for extreme scores in centipawns (default: 1000) */
  extremeScoreThreshold?: number;
}

export class EvaluationFormatter {
  private readonly logger: ILogger;
  private readonly neutralThreshold: number;
  private readonly extremeScoreThreshold: number;

  constructor(config: FormatterConfig = {}) {
    this.logger = Logger.getInstance();
    this.neutralThreshold = config.neutralThreshold ?? 20;
    this.extremeScoreThreshold = config.extremeScoreThreshold ?? 1000;
  }

  /**
   * Formats a player perspective evaluation for UI display
   * 
   * @param evaluation - Evaluation from player's perspective
   * @returns Formatted evaluation ready for UI
   */
  format(evaluation: PlayerPerspectiveEvaluation | null | undefined): FormattedEvaluation {
    // Handle null/undefined input
    if (!evaluation) {
      this.logger.warn('EvaluationFormatter: Received null/undefined evaluation');
      return this.createDefaultFormattedEvaluation();
    }

    // Tablebase has highest priority
    if (evaluation.isTablebasePosition && evaluation.perspectiveWdl !== null) {
      return this.formatTablebase(evaluation);
    }

    // Engine mate has second priority
    if (evaluation.perspectiveMate !== null) {
      return this.formatMate(evaluation);
    }

    // Engine score is default
    if (evaluation.perspectiveScore !== null) {
      return this.formatScore(evaluation);
    }

    // No evaluation data available
    return this.createDefaultFormattedEvaluation();
  }

  /**
   * Formats tablebase evaluation
   * @private
   */
  private formatTablebase(evaluation: PlayerPerspectiveEvaluation): FormattedEvaluation {
    const wdl = evaluation.perspectiveWdl!;
    const dtm = evaluation.perspectiveDtm;
    const dtz = evaluation.perspectiveDtz;

    let mainText: string;
    let className: 'winning' | 'losing' | 'neutral';
    let isDrawn = false;

    if (wdl > 1) {
      // Clear win
      mainText = 'TB Win';
      className = 'winning';
    } else if (wdl === 1) {
      // Cursed win
      mainText = 'TB Win*';
      className = 'winning';
    } else if (wdl === 0) {
      // Draw
      mainText = 'TB Draw';
      className = 'neutral';
      isDrawn = true;
    } else if (wdl === -1) {
      // Blessed loss
      mainText = 'TB Loss*';
      className = 'losing';
    } else {
      // Clear loss
      mainText = 'TB Loss';
      className = 'losing';
    }

    // Detail text
    let detailText: string | null = null;
    if (dtm !== null && wdl !== 0) {
      detailText = `DTM: ${Math.abs(dtm)}`;
    } else if (dtz !== null && dtz > 0 && wdl === 0) {
      detailText = `DTZ: ${dtz}`;
    }

    return {
      mainText,
      detailText,
      className,
      metadata: {
        isTablebase: true,
        isMate: false,
        isDrawn
      }
    };
  }

  /**
   * Formats mate evaluation
   * @private
   */
  private formatMate(evaluation: PlayerPerspectiveEvaluation): FormattedEvaluation {
    const mate = evaluation.perspectiveMate!;
    
    let mainText: string;
    let className: 'winning' | 'losing' | 'neutral';

    if (mate === 0) {
      // Checkmate on the board
      mainText = 'M#';
      className = 'winning';
    } else {
      // For perspective-adjusted mates, the sign indicates who's winning from current perspective:
      // - Positive mate: Current perspective player wins
      // - Negative mate: Current perspective player is being mated
      // BUT for display, we always show the absolute value and determine winning/losing by sign
      
      mainText = `M${Math.abs(mate)}`;
      
      if (mate > 0) {
        // Positive perspectiveMate = current player has mate
        className = 'winning';
      } else {
        // Negative perspectiveMate = current player is being mated
        className = 'losing';
      }
    }

    // ALIGN WITH LEGACY: Use score-based color logic (mate uses legacy score's color thresholds)
    // For mates, we can't use score thresholds, so stick to semantic classification
    // but match legacy behavior in EngineEvaluationCardUnified color mapping

    return {
      mainText,
      detailText: null,
      className,
      metadata: {
        isTablebase: false,
        isMate: true,
        isDrawn: false
      }
    };
  }

  /**
   * Formats engine score evaluation  
   * @private
   */
  private formatScore(evaluation: PlayerPerspectiveEvaluation): FormattedEvaluation {
    const score = evaluation.perspectiveScore!;
    
    let mainText: string;
    let className: 'advantage' | 'disadvantage' | 'neutral' | 'winning' | 'losing';
    let isDrawn = false;

    // ALIGN WITH LEGACY: Use legacy thresholds and formatting
    // Legacy uses Math.abs(score) < 50 for neutral (yellow)
    const LEGACY_NEUTRAL_THRESHOLD = 50;

    // Convert to pawns for display
    const pawns = score / 100;

    if (Math.abs(score) < LEGACY_NEUTRAL_THRESHOLD) {
      // ALIGN WITH LEGACY: < 50cp is neutral (yellow)
      mainText = pawns.toFixed(1); // Legacy uses 1 decimal place
      className = 'neutral';
      isDrawn = false; // Legacy doesn't mark < 50cp as drawn
    } else {
      // ALIGN WITH LEGACY: >= 50cp uses color based on sign
      if (score > 0) {
        mainText = pawns.toFixed(1); // Legacy: No + prefix for positive
        className = 'advantage'; // Maps to green in UI
      } else {
        mainText = pawns.toFixed(1); // Legacy: Negative sign already included
        className = 'disadvantage'; // Maps to red in UI
      }
    }

    return {
      mainText,
      detailText: null,
      className,
      metadata: {
        isTablebase: false,
        isMate: false,
        isDrawn
      }
    };
  }

  /**
   * Creates default formatted evaluation for error cases
   * @private
   */
  private createDefaultFormattedEvaluation(): FormattedEvaluation {
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