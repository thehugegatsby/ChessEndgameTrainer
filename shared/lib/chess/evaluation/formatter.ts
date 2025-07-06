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

import type {
  PlayerPerspectiveEvaluation,
  FormattedEvaluation
} from '@shared/types/evaluation';

export interface FormatterConfig {
  /** Threshold for neutral evaluation in centipawns (default: 50) */
  neutralThreshold?: number;
  /** Threshold for extreme scores in centipawns (default: 1000) */
  extremeScoreThreshold?: number;
}

export class EvaluationFormatter {
  private readonly neutralThreshold: number;
  private readonly extremeScoreThreshold: number;

  constructor(config: FormatterConfig = {}) {
    this.neutralThreshold = config.neutralThreshold ?? 50;
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

    // Convert to pawns for display
    const pawns = score / 100;

    if (Math.abs(score) < this.neutralThreshold) {
      // Small advantage is considered neutral
      mainText = pawns.toFixed(1);
      className = 'neutral';
      isDrawn = false;
    } else {
      // Clear advantage or disadvantage
      if (score > 0) {
        mainText = pawns.toFixed(1);
        className = 'advantage';
      } else {
        mainText = pawns.toFixed(1);
        className = 'disadvantage';
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