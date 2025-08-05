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

import type {
  TablebaseResult,
  TablebaseMove,
} from "@shared/services/TablebaseService";

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
 * Formats tablebase move for display with outcome annotation
 *
 * @param {TablebaseMove} move - Move data from tablebase
 * @returns {string} Formatted move string with outcome
 *
 * @description
 * Combines the move notation with a human-readable outcome
 * description in parentheses. Includes DTZ information when available.
 *
 * @example
 * ```typescript
 * formatTablebaseMove({ san: "Ke2", wdl: 2, dtz: 10 });
 * // Returns: "Ke2 (Win in 10)"
 *
 * formatTablebaseMove({ san: "Kb1", wdl: 0, dtz: null });
 * // Returns: "Kb1 (Draw)"
 * ```
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
 * Gets appropriate CSS class for evaluation display
 *
 * @param {number} wdl - Win/Draw/Loss value
 * @returns {string} CSS class name for styling
 *
 * @description
 * Maps WDL values to semantic CSS classes for consistent
 * visual styling across the application.
 *
 * @example
 * ```typescript
 * getEvaluationClass(2);  // "winning"
 * getEvaluationClass(0);  // "draw"
 * getEvaluationClass(-1); // "losing"
 * ```
 */
export function getEvaluationClass(wdl: number): string {
  if (wdl > 0) return "winning";
  if (wdl < 0) return "losing";
  return "draw";
}

/**
 * Checks if position represents a critical outcome
 *
 * @param {number} wdl - Win/Draw/Loss value
 * @returns {boolean} True if position is definitely won or lost
 *
 * @description
 * Critical positions are those with absolute outcomes (WDL ±2),
 * excluding 50-move rule positions (WDL ±1) and draws (WDL 0).
 *
 * @example
 * ```typescript
 * isCriticalPosition(2);  // true (definite win)
 * isCriticalPosition(-2); // true (definite loss)
 * isCriticalPosition(1);  // false (cursed win)
 * isCriticalPosition(0);  // false (draw)
 * ```
 */
export function isCriticalPosition(wdl: number): boolean {
  return Math.abs(wdl) === 2;
}

/**
 * Generates human-readable description of position outcome
 *
 * @param {TablebaseResult} result - Tablebase evaluation result
 * @returns {string} Detailed position description
 *
 * @description
 * Creates comprehensive descriptions including outcome type,
 * move count (DTZ), and special conditions like 50-move rule.
 * Always written from White's perspective.
 *
 * @example
 * ```typescript
 * getPositionDescription({ category: "win", dtz: 15, ... });
 * // "White wins with best play in 15 moves"
 *
 * getPositionDescription({ category: "cursed-win", dtz: 60, ... });
 * // "White wins in 60 moves (50-move rule applies)"
 * ```
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
