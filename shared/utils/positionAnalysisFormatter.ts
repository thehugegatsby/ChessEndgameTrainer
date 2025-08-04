/**
 * PositionAnalysisFormatter
 * Formats position analysis data for UI display
 * Domain-centric naming - decoupled from data source
 */

import type {
  TablebaseResult,
  TablebaseMove,
} from "@shared/services/TablebaseService";

export interface PositionAnalysisDisplay {
  displayText: string;
  className: string;
  score: number;
  isWin: boolean;
  isDraw: boolean;
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
export function formatPositionAnalysis(
  result: TablebaseResult,
): PositionAnalysisDisplay {
  const { category, dtz, wdl } = result;

  let displayText: string;
  let className: string;

  if (category === "draw" || dtz === 0) {
    displayText = "Draw";
    className = "draw";
  } else if (category === "win" || (dtz !== null && dtz > 0)) {
    displayText = dtz !== null ? `Win in ${dtz}` : "Win";
    className = "winning";
  } else {
    displayText = dtz !== null ? `Loss in ${Math.abs(dtz)}` : "Loss";
    className = "losing";
  }

  return {
    displayText,
    className,
    score: wdlToScore(wdl, dtz),
    isWin: category === "win" || category === "cursed-win",
    isDraw: category === "draw",
    isLoss: category === "loss" || category === "blessed-loss",
  };
}

/**
 * Format tablebase move for display
 */
export function formatTablebaseMove(move: TablebaseMove): string {
  const { san, wdl, dtz } = move;

  if (wdl === 0) {
    return `${san} (Draw)`;
  } else if (wdl > 0) {
    return dtz ? `${san} (Win in ${dtz})` : `${san} (Win)`;
  } else {
    return dtz ? `${san} (Loss in ${Math.abs(dtz)})` : `${san} (Loss)`;
  }
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
  } else if (wdl === -2) {
    // Loss: High negative score, increased by DTZ (longer resistance is better)
    return -BASE_SCORE + Math.abs(dtz || 0);
  } else if (wdl === 1) {
    // Cursed win (50-move rule)
    return BASE_SCORE * 0.8 - Math.abs(dtz || 0);
  } else if (wdl === -1) {
    // Blessed loss (50-move rule)
    return -BASE_SCORE * 0.8 + Math.abs(dtz || 0);
  }
  // Draw
  return 0;
}

/**
 * Get CSS class for evaluation display
 */
export function getEvaluationClass(wdl: number): string {
  if (wdl > 0) return "winning";
  if (wdl < 0) return "losing";
  return "draw";
}

/**
 * Check if position is critical (win/loss)
 */
export function isCriticalPosition(wdl: number): boolean {
  return Math.abs(wdl) === 2;
}

/**
 * Get human-readable description of position
 */
export function getPositionDescription(result: TablebaseResult): string {
  const { category, dtz } = result;

  switch (category) {
    case "win":
      return dtz
        ? `White wins with best play in ${dtz} moves`
        : "White has a theoretical win";
    case "cursed-win":
      return dtz
        ? `White wins in ${dtz} moves (50-move rule applies)`
        : "White wins but 50-move rule applies";
    case "draw":
      return "Position is a theoretical draw with best play";
    case "blessed-loss":
      return dtz
        ? `White loses in ${Math.abs(dtz)} moves (but can claim 50-move rule)`
        : "White loses but can claim 50-move rule";
    case "loss":
      return dtz
        ? `White loses with best defense in ${Math.abs(dtz)} moves`
        : "White has a theoretical loss";
    default:
      return "Unknown position";
  }
}
