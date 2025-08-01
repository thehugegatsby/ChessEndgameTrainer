/**
 * Move Quality Helper Functions
 * Pure functions for assessing move quality based on tablebase WDL values
 */

import type {
  SimplifiedMoveQualityResult,
  MoveQualityType,
} from "@shared/types/evaluation";

/**
 * Analyzes move quality based on tablebase WDL values
 * Compares position before and after the move
 *
 * @param wdlBefore - WDL value before the move (from player's perspective)
 * @param wdlAfter - WDL value after the move (from opponent's perspective, needs negation)
 * @returns Move quality assessment
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
 * @param wdlBefore - WDL before move
 * @param wdlAfter - WDL after move (negated for player perspective)
 * @returns True if move changes win/loss status
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
 * @param quality - Move quality assessment
 * @returns Description for UI display
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
