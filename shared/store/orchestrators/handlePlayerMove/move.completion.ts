/**
 * @file Training completion logic for handlePlayerMove orchestrator
 * @module store/orchestrators/handlePlayerMove/move.completion
 *
 * @description
 * Handles training completion including success calculation, accuracy metrics,
 * achievement checks, and user feedback. Imports WDL helpers from move.evaluation
 * for consistency.
 */

import type { StoreApi } from "../types";
import type { ValidatedMove } from "@shared/types/chess";

/**
 * Handles training completion logic
 *
 * @param {StoreApi} api - Store API for state access and actions
 * @param {boolean} isOptimal - Whether the last move was optimal
 * @returns {Promise<void>}
 *
 * @description
 * Processes training completion including:
 * - Calculating accuracy and performance metrics
 * - Updating position progress and spaced repetition
 * - Recording daily statistics
 * - Showing completion feedback
 * - Opening completion modal
 *
 * @remarks
 * A "perfect game" requires 100% accuracy, no mistakes, and optimal final move.
 * Success is determined by matching the target outcome (win/draw/loss).
 */
export async function handleTrainingCompletion(
  api: StoreApi,
  isOptimal: boolean,
): Promise<void> {
  const state = api.getState();

  if (!state.currentPosition || !state.sessionStartTime) return;

  const userMoves = state.moveHistory.filter(
    (m: ValidatedMove) => (m as any).userMove,
  );
  const optimalMoves = userMoves.filter(
    (m: ValidatedMove) => (m as any).isOptimal,
  ).length;
  const totalMoves = userMoves.length;
  const accuracy = totalMoves > 0 ? (optimalMoves / totalMoves) * 100 : 0;

  // Consider the final move's optimality for perfect game calculation
  const finalMoveOptimal = isOptimal;
  const isPerfectGame =
    accuracy === 100 && state.mistakeCount === 0 && finalMoveOptimal;

  // Determine success based on game outcome
  const gameOutcome = state.game?.isCheckmate()
    ? state.game.turn() === "w"
      ? "0-1"
      : "1-0"
    : state.game?.isDraw()
      ? "1/2-1/2"
      : null;

  const success = gameOutcome === state.currentPosition.targetOutcome;

  // Complete training
  state.completeTraining(success);

  // TODO: Progress tracking removed (was over-engineered, not used in UI)
  // If progress tracking is needed in the future, implement only what's actually displayed

  // Show completion message
  if (success) {
    if (isPerfectGame) {
      state.showToast("Perfektes Spiel! 🎉", "success", 5000);
      // Could check for achievements here
    } else {
      state.showToast(
        `Training abgeschlossen! Genauigkeit: ${accuracy.toFixed(0)}%`,
        "success",
        4000,
      );
    }
  } else {
    state.showToast(
      "Training nicht erfolgreich - versuche es erneut!",
      "warning",
      4000,
    );
  }

  // Open completion modal
  state.openModal("completion");
}
