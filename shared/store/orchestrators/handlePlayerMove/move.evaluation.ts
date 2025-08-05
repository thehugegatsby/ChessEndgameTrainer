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
import type { MoveEvaluation, WDLOutcome, MoveErrorDialog } from "./move.types";
import type { TrainingPosition } from "@shared/store/slices/trainingSlice";

/**
 * Evaluates move quality using tablebase
 *
 * @param {string} fenBefore - Position before move
 * @param {string} fenAfter - Position after move
 * @param {TrainingPosition} currentPosition - Training position context
 * @returns {Promise<MoveEvaluation>} Move evaluation result
 */
export async function evaluateMoveQuality(
  fenBefore: string,
  fenAfter: string,
  currentPosition: TrainingPosition,
): Promise<MoveEvaluation> {
  const result: MoveEvaluation = {
    isOptimal: false,
    isWorseningMove: false,
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
      const wdlBefore = getWDLFromTrainingPerspective(
        evalBefore.result.wdl,
        currentPosition.colorToTrain,
      );
      const wdlAfter = getWDLFromTrainingPerspective(
        evalAfter.result.wdl,
        currentPosition.colorToTrain,
      );

      result.wdlBefore = wdlBefore;
      result.wdlAfter = wdlAfter;

      // Get best moves to check optimality
      const topMoves = await tablebaseService.getTopMoves(fenBefore);
      if (topMoves.isAvailable && topMoves.moves && topMoves.moves.length > 0) {
        const bestWDL = getWDLFromTrainingPerspective(
          topMoves.moves[0].wdl,
          currentPosition.colorToTrain,
        );
        result.isOptimal = wdlAfter === bestWDL;
        result.bestMove = topMoves.moves[0].san;
      }

      // Check for position worsening
      if (isPositionWorsened(wdlBefore, wdlAfter)) {
        result.isWorseningMove = true;
        result.outcomeChange = getOutcomeChange(wdlBefore, wdlAfter);
      }
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

  const message =
    evaluation.outcomeChange === "Win->Draw/Loss"
      ? "Position verschlechtert: Gewinn → Remis/Verlust"
      : "Position verschlechtert: Remis → Verlust";

  actions.showToast(message, "warning", 4000);
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

/**
 * Checks if position worsened from training perspective
 *
 * @param {number} wdlBefore - WDL before move (from training perspective)
 * @param {number} wdlAfter - WDL after move (from training perspective)
 * @returns {boolean} Whether position worsened
 *
 * @description
 * A position worsens when the WDL value decreases from the training
 * perspective. This indicates the player made a suboptimal move.
 *
 * @example
 * ```typescript
 * isPositionWorsened(1000, 0); // true (win -> draw)
 * isPositionWorsened(0, -1000); // true (draw -> loss)
 * isPositionWorsened(-1000, 0); // false (loss -> draw is improvement)
 * ```
 */
export function isPositionWorsened(
  wdlBefore: number,
  wdlAfter: number,
): boolean {
  // Position worsens if WDL decreases
  return wdlAfter < wdlBefore;
}

/**
 * Gets outcome change description
 *
 * @param {number} wdlBefore - WDL before move (from training perspective)
 * @param {number} wdlAfter - WDL after move (from training perspective)
 * @returns {string | null} Outcome change description or null if no significant change
 *
 * @description
 * Generates human-readable descriptions for significant outcome changes.
 * Used for user feedback when a move worsens the position.
 *
 * @example
 * ```typescript
 * getOutcomeChange(1000, 0); // "Win->Draw/Loss"
 * getOutcomeChange(0, -1000); // "Draw->Loss"
 * getOutcomeChange(1000, 500); // null (still winning)
 * ```
 */
export function getOutcomeChange(
  wdlBefore: number,
  wdlAfter: number,
): string | null {
  const outcomeBefore = getOutcomeFromWDL(wdlBefore);
  const outcomeAfter = getOutcomeFromWDL(wdlAfter);

  if (outcomeBefore === "win" && outcomeAfter !== "win") {
    return "Win->Draw/Loss";
  }
  if (outcomeBefore === "draw" && outcomeAfter === "loss") {
    return "Draw->Loss";
  }
  return null;
}

/**
 * Converts WDL to outcome string
 *
 * @param {number} wdl - WDL value (from any perspective)
 * @returns {WDLOutcome} Outcome classification
 *
 * @description
 * Classifies a WDL value into three outcome categories.
 * Positive values are wins, negative are losses, zero is draw.
 *
 * @example
 * ```typescript
 * getOutcomeFromWDL(1000); // "win"
 * getOutcomeFromWDL(0); // "draw"
 * getOutcomeFromWDL(-500); // "loss"
 * ```
 */
export function getOutcomeFromWDL(wdl: number): WDLOutcome {
  if (wdl > 0) return "win";
  if (wdl < 0) return "loss";
  return "draw";
}
