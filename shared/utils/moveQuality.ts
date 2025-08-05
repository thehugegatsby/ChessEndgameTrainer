/**
 * @file Move quality assessment utilities for tablebase analysis
 * @module utils/moveQuality
 *
 * @description
 * Pure functions for assessing chess move quality based on tablebase WDL
 * (Win/Draw/Loss) values. Provides comprehensive analysis of move impact
 * including critical move detection and human-readable quality descriptions.
 *
 * @remarks
 * Key features:
 * - WDL-based move quality assessment (excellent, good, mistake)
 * - Critical move detection for position evaluation changes
 * - Human-readable quality descriptions for UI display
 * - Perspective-aware analysis (player vs opponent viewpoint)
 *
 * All functions are pure and side-effect free, designed for use in
 * performance-critical contexts like real-time move analysis.
 */

import type {
  SimplifiedMoveQualityResult,
  MoveQualityType,
} from "@shared/types/evaluation";

/**
 * Analyzes move quality based on tablebase WDL values
 *
 * @param {number} wdlBefore - WDL value before the move (from player's perspective)
 * @param {number} wdlAfter - WDL value after the move (from opponent's perspective, needs negation)
 * @returns {SimplifiedMoveQualityResult} Comprehensive move quality assessment
 *
 * @description
 * Compares tablebase evaluations before and after a move to determine
 * move quality. Handles perspective conversion since wdlAfter represents
 * the opponent's view and must be negated for player perspective analysis.
 *
 * @remarks
 * Quality categories:
 * - excellent: Move improves WDL evaluation (wdlChange > 0)
 * - good: Move maintains WDL evaluation (wdlChange = 0)
 * - mistake: Move worsens WDL evaluation (wdlChange < 0)
 *
 * The WDL change calculation: -wdlAfter - wdlBefore accounts for
 * perspective flip when it becomes the opponent's turn.
 *
 * @example
 * ```typescript
 * // Excellent move: Win to win (maintains advantage)
 * const result1 = assessTablebaseMoveQuality(2, -2);
 * // { quality: 'excellent', reason: 'Optimal tablebase move' }
 *
 * // Mistake: Win to draw
 * const result2 = assessTablebaseMoveQuality(2, 0);
 * // { quality: 'mistake', reason: 'Worsens tablebase position' }
 * ```
 */
export function assessTablebaseMoveQuality(
  wdlBefore: number,
  wdlAfter: number,
): SimplifiedMoveQualityResult {
  // Since we're analyzing from the player's perspective who made the move,
  // we need to negate the WDL for the position after (opponent's turn)
  const wdlChange = -wdlAfter - wdlBefore;

  let quality: MoveQualityType;
  let reason: string;

  if (wdlChange > 0) {
    quality = "excellent";
    reason = "Optimal tablebase move";
  } else if (wdlChange === 0) {
    quality = "good";
    reason = "Maintains tablebase evaluation";
  } else {
    quality = "mistake";
    reason = "Worsens tablebase position";
  }

  return {
    quality,
    reason,
    isTablebaseAnalysis: true,
    tablebaseInfo: {
      wdlBefore,
      wdlAfter: -wdlAfter,
    },
  };
}

/**
 * Check if a move is critical (changes win/loss status)
 *
 * @param {number} wdlBefore - WDL value before the move
 * @param {number} wdlAfter - WDL value after the move (from opponent perspective)
 * @returns {boolean} True if the move changes win/loss status significantly
 *
 * @description
 * Determines if a move is critical by checking for significant changes
 * in game outcome status (win/draw/loss). Critical moves include both
 * negative changes (blunders) and positive changes (saves).
 *
 * @remarks
 * Critical move types:
 * - Bad critical: Throwing away win/draw (win→draw/loss, draw→loss)
 * - Good critical: Finding saves (loss→draw/win)
 *
 * Uses player perspective for consistent evaluation, converting
 * opponent WDL values as needed.
 *
 * @example
 * ```typescript
 * // Critical blunder: win to draw
 * isCriticalMove(2, 0) // true
 *
 * // Critical save: loss to draw
 * isCriticalMove(-2, 0) // true
 *
 * // Not critical: win to win
 * isCriticalMove(2, -2) // false
 * ```
 */
export function isCriticalMove(wdlBefore: number, wdlAfter: number): boolean {
  const wdlAfterFromPlayerPerspective = -wdlAfter;

  // Critical if:
  // - Win to draw/loss (2 to 0/-2)
  // - Draw to loss (0 to -2)
  // - Loss to win/draw (-2 to 2/0) - this would be a good critical move

  const wasWinning = wdlBefore === 2;
  const wasDrawing = wdlBefore === 0;
  const wasLosing = wdlBefore === -2;

  const isWinning = wdlAfterFromPlayerPerspective === 2;
  const isLosing = wdlAfterFromPlayerPerspective === -2;

  // Bad critical moves
  if (wasWinning && !isWinning) return true; // Threw away win
  if (wasDrawing && isLosing) return true; // Threw away draw

  // Good critical moves (still critical, but positive)
  if (wasLosing && !isLosing) return true; // Found a save

  return false;
}

/**
 * Get human-readable description of move quality
 *
 * @param {SimplifiedMoveQualityResult} quality - Move quality assessment result
 * @returns {string} Human-readable description for UI display
 *
 * @description
 * Converts move quality assessment into user-friendly descriptions,
 * with special handling for critical moves that change game outcome.
 * Provides contextual feedback based on WDL value transitions.
 *
 * @remarks
 * Special descriptions for critical moves:
 * - "Threw away the win!" (win → draw)
 * - "Blundered into a loss!" (win → loss)
 * - "Blundered the draw!" (draw → loss)
 * - "Found the drawing resource!" (loss → draw)
 * - "Incredible save!" (loss → win)
 *
 * Falls back to generic quality reason for non-critical moves.
 *
 * @example
 * ```typescript
 * const quality = assessTablebaseMoveQuality(2, 0);
 * const description = getMoveQualityDescription(quality);
 * // Returns: "Threw away the win!"
 * ```
 */
export function getMoveQualityDescription(
  quality: SimplifiedMoveQualityResult,
): string {
  if (!quality.tablebaseInfo) {
    return quality.reason;
  }

  const { wdlBefore, wdlAfter } = quality.tablebaseInfo;

  // Special cases for critical moves
  if (wdlBefore === 2 && wdlAfter === 0) {
    return "Threw away the win!";
  }
  if (wdlBefore === 2 && wdlAfter === -2) {
    return "Blundered into a loss!";
  }
  if (wdlBefore === 0 && wdlAfter === -2) {
    return "Blundered the draw!";
  }
  if (wdlBefore === -2 && wdlAfter === 0) {
    return "Found the drawing resource!";
  }
  if (wdlBefore === -2 && wdlAfter === 2) {
    return "Incredible save!";
  }

  return quality.reason;
}
