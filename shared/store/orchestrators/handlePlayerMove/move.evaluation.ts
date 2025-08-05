/**
 * @file Tablebase evaluation logic for handlePlayerMove orchestrator
 * @module store/orchestrators/handlePlayerMove/move.evaluation
 *
 * @description
 * Contains all evaluation logic including tablebase API calls, WDL calculations,
 * and move quality assessment. This module is the single source of truth for
 * all WDL (Win/Draw/Loss) related functionality.
 */

import { tablebaseService } from "@shared/services/TablebaseService";
import { assessTablebaseMoveQuality } from "@shared/utils/moveQuality";
import type { MoveEvaluation, MoveErrorDialog } from "./move.types";

/**
 * Evaluates move quality using tablebase
 *
 * @param {string} fenBefore - Position before move
 * @param {string} fenAfter - Position after move
 * @returns {Promise<MoveEvaluation>} Move evaluation result
 */
export async function evaluateMoveQuality(
  fenBefore: string,
  fenAfter: string,
): Promise<MoveEvaluation> {
  const result: MoveEvaluation = {
    isOptimal: true, // Default to true when tablebase unavailable
  };

  try {
    // Evaluate positions for WDL perspective
    const [evalBefore, evalAfter] = await Promise.all([
      tablebaseService.getEvaluation(fenBefore),
      tablebaseService.getEvaluation(fenAfter),
    ]);

    if (
      evalBefore.isAvailable &&
      evalAfter.isAvailable &&
      evalBefore.result &&
      evalAfter.result
    ) {
      const wdlBefore = evalBefore.result.wdl;
      const wdlAfter = evalAfter.result.wdl;

      result.wdlBefore = wdlBefore;
      result.wdlAfter = wdlAfter;

      // Use the same logic as MoveQualityIndicator
      const moveQuality = assessTablebaseMoveQuality(
        evalBefore.result.wdl,
        evalAfter.result.wdl,
      );

      // A move is optimal if it's "excellent" or "good"
      result.isOptimal =
        moveQuality.quality === "excellent" || moveQuality.quality === "good";

      // Get best move for display
      const topMoves = await tablebaseService.getTopMoves(fenBefore);
      if (topMoves.isAvailable && topMoves.moves && topMoves.moves.length > 0) {
        result.bestMove = topMoves.moves[0].san;
      }

      // Note: isWorseningMove is currently unused but kept for potential future use
      // The move quality assessment from assessTablebaseMoveQuality is sufficient
    }
  } catch (error) {
    // Silently handle evaluation errors - move was valid even if we can't evaluate it
  }

  return result;
}

/**
 * Handles move error feedback by updating UI state
 *
 * @param {Object} actions - Store actions for UI updates
 * @param {MoveEvaluation} evaluation - Move evaluation result
 */
export function handleMoveError(
  actions: {
    incrementMistake: () => void;
    setMoveErrorDialog: (dialog: MoveErrorDialog | null) => void;
    showToast: (
      message: string,
      type: "error" | "warning" | "success" | "info",
      duration?: number,
    ) => void;
  },
  evaluation: MoveEvaluation,
): void {
  actions.incrementMistake();
  actions.setMoveErrorDialog({
    isOpen: true,
    wdlBefore: evaluation.wdlBefore,
    wdlAfter: evaluation.wdlAfter,
    bestMove: evaluation.bestMove,
  });

  // Show generic message for suboptimal moves
  actions.showToast(
    "Nicht der beste Zug - versuche es nochmal",
    "warning",
    4000,
  );
}

/**
 * Gets WDL value from training perspective
 *
 * @param {number} wdl - Raw WDL value (always from white's perspective)
 * @param {"white" | "black"} trainingColor - Color being trained
 * @returns {number} WDL from training perspective
 *
 * @description
 * Converts tablebase WDL values to the perspective of the training color.
 * Tablebase always returns WDL from white's perspective, so when training
 * black, we negate the value.
 *
 * @example
 * ```typescript
 * // White training, winning position
 * getWDLFromTrainingPerspective(1000, "white"); // 1000
 *
 * // Black training, same position (losing for black)
 * getWDLFromTrainingPerspective(1000, "black"); // -1000
 * ```
 */
export function getWDLFromTrainingPerspective(
  wdl: number,
  trainingColor: "white" | "black",
): number {
  // WDL is always from white's perspective
  // If training black, we need to negate
  return trainingColor === "white" ? wdl : -wdl;
}
