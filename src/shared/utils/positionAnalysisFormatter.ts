/**
 * @file Position analysis formatting utilities
 * @module utils/positionAnalysisFormatter
 *
 * @description
 * Provides utilities for formatting tablebase position analysis data
 * for UI display. Converts raw tablebase evaluation data into
 * human-readable formats with appropriate styling classes.
 *
 * @remarks
 * Key features:
 * - WDL to score conversion for move ordering
 * - Human-readable outcome descriptions
 * - CSS class generation for visual styling
 * - Support for 50-move rule positions
 * - DTZ (Distance to Zero) formatting
 *
 * The module uses domain-centric naming to decouple
 * formatting logic from specific data sources.
 */

import type { TablebaseResult } from '@domains/evaluation';
import { CHESS_EVALUATION, POSITION_ANALYSIS } from '@shared/constants';

/**
 * Formatted position analysis for UI display
 *
 * @interface PositionAnalysisDisplay
 *
 * @description
 * Contains all necessary data for rendering position
 * evaluations in the UI with appropriate styling.
 */
export interface PositionAnalysisDisplay {
  /** Human-readable evaluation text (e.g., "Win in 15") */
  displayText: string;
  /** CSS class name for styling (winning/losing/draw) */
  className: string;
  /** Numeric score for sorting (-10000 to 10000) */
  score: number;
  /** Whether position is winning */
  isWin: boolean;
  /** Whether position is drawn */
  isDraw: boolean;
  /** Whether position is losing */
  isLoss: boolean;
}

/**
 * Format tablebase result for display
 *
 * @param {TablebaseResult} result - Raw tablebase evaluation data
 * @returns {PositionAnalysisDisplay} Formatted data for UI rendering
 *
 * @example
 * const display = formatPositionAnalysis({
 *   wdl: 2, dtz: 15, category: "win", ...
 * });
 * // Returns: { displayText: "Win in 15", className: "winning", score: 9985, ... }
 *
 * @performance O(1) - Simple calculations only
 */
export function formatPositionAnalysis(result: TablebaseResult): PositionAnalysisDisplay {
  const { category, dtz, wdl } = result;

  let displayText: string;
  let className: string;

  if (category === 'draw' || dtz === 0) {
    displayText = 'Draw';
    className = 'draw';
  } else if (category === 'win' || (dtz !== null && dtz > 0)) {
    displayText = dtz !== null ? `Win in ${dtz}` : 'Win';
    className = 'winning';
  } else {
    displayText = dtz !== null ? `Loss in ${Math.abs(dtz)}` : 'Loss';
    className = 'losing';
  }

  return {
    displayText,
    className,
    score: wdlToScore(wdl, dtz),
    isWin: category === 'win' || category === 'cursed-win',
    isDraw: category === 'draw',
    isLoss: category === 'loss' || category === 'blessed-loss',
  };
}

/**
 * Convert WDL to numeric score for sorting/comparison
 * Higher scores are better for the player
 *
 * @param {number} wdl - Win/Draw/Loss value (-2 to 2)
 * @param {number | null} dtz - Distance to zeroing (affects score granularity)
 * @returns {number} Numeric score for comparison (higher = better)
 *
 * @remarks
 * Scoring algorithm:
 * - Win (wdl=2): 10000 - dtz (faster wins score higher)
 * - Loss (wdl=-2): -10000 + dtz (longer resistance scores higher)
 * - Cursed win (wdl=1): 8000 - dtz (discounted due to 50-move rule)
 * - Blessed loss (wdl=-1): -8000 + dtz (less bad due to 50-move rule)
 * - Draw (wdl=0): 0 (neutral)
 *
 * @example
 * wdlToScore(2, 10)  // 9990 (win in 10 moves)
 * wdlToScore(-2, 30) // -9970 (loss in 30 moves)
 * wdlToScore(0, null) // 0 (draw)
 *
 * @performance O(1) - Basic arithmetic only
 */
export function wdlToScore(wdl: number, dtz: number | null): number {
  const BASE_SCORE = 10000;

  if (wdl === 2) {
    // Win: High positive score, reduced by DTZ (faster wins are better)
    return BASE_SCORE - Math.abs(dtz || 0);
  } else if (wdl === CHESS_EVALUATION.WDL_LOSS) {
    // Loss: High negative score, increased by DTZ (longer resistance is better)
    return -BASE_SCORE + Math.abs(dtz || 0);
  } else if (wdl === 1) {
    // Cursed win (50-move rule)
    return BASE_SCORE * POSITION_ANALYSIS.CURSED_BLESSED_FACTOR - Math.abs(dtz || 0);
  } else if (wdl === -1) {
    // Blessed loss (50-move rule)
    return -BASE_SCORE * POSITION_ANALYSIS.CURSED_BLESSED_FACTOR + Math.abs(dtz || 0);
  }
  // Draw
  return 0;
}
