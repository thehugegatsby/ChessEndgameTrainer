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

import type { SimplifiedMoveQualityResult, MoveQualityType } from '@shared/types/evaluation';

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
  wdlAfter: number
): SimplifiedMoveQualityResult {
  // Since we're analyzing from the player's perspective who made the move,
  // we need to negate the WDL for the position after (opponent's turn)
  const wdlChange = -wdlAfter - wdlBefore;

  let quality: MoveQualityType;
  let reason: string;

  if (wdlChange > 0) {
    quality = 'excellent';
    reason = 'Optimal tablebase move';
  } else if (wdlChange === 0) {
    quality = 'good';
    reason = 'Maintains tablebase evaluation';
  } else {
    quality = 'mistake';
    reason = 'Worsens tablebase position';
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
