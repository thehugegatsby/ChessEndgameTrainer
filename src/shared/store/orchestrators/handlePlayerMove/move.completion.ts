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
import { chessService } from "@shared/services/ChessService";

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
  const { getState, setState } = api;
  const state = getState();

  if (!state.training.currentPosition || !state.training.sessionStartTime)
    return;

  const userMoves = state.game.moveHistory.filter(
    (m: ValidatedMove) => 'userMove' in m && (m as Record<string, unknown>)['userMove'],
  );
  const optimalMoves = userMoves.filter(
    (m: ValidatedMove) => 'isOptimal' in m && (m as Record<string, unknown>)['isOptimal'],
  ).length;
  const totalMoves = userMoves.length;
  const accuracy = totalMoves > 0 ? (optimalMoves / totalMoves) * 100 : 0;

  // Consider the final move's optimality for perfect game calculation
  const finalMoveOptimal = isOptimal;
  const isPerfectGame =
    accuracy === 100 && state.training.mistakeCount === 0 && finalMoveOptimal;

  // Determine success based on game outcome
  const gameOutcome = (() => {
    if (chessService.isCheckmate()) {
      return chessService.turn() === "w" ? "0-1" : "1-0";
    }
    if (chessService.isDraw()) {
      return "1/2-1/2";
    }
    return null;
  })();

  const success = gameOutcome === state.training.currentPosition.targetOutcome;

  // Complete training using setState
  setState((draft) => {
    // Mark training as complete
    draft.training.isSuccess = success;
    draft.training.sessionEndTime = Date.now();
    draft.training.isPlayerTurn = false;
    draft.training.isOpponentThinking = false;

    // Update streak based on success
    if (success) {
      // Increment streak and show checkmark
      draft.training.currentStreak = draft.training.currentStreak + 1;
      if (draft.training.currentStreak > draft.training.bestStreak) {
        draft.training.bestStreak = draft.training.currentStreak;
      }
      draft.training.showCheckmark = true;
      
      // Auto-hide checkmark after 2 seconds
      setTimeout(() => {
        api.setState((state) => {
          state.training.showCheckmark = false;
        });
      }, 2000);
    } else {
      // Reset streak on failure
      draft.training.currentStreak = 0;
    }

    // Show completion message
    if (success) {
      if (isPerfectGame) {
        draft.ui.toasts.push({
          id: Date.now().toString(),
          message: "Perfektes Spiel! 🎉",
          type: "success",
          duration: 5000,
        });
      } else {
        draft.ui.toasts.push({
          id: Date.now().toString(),
          message: `Training abgeschlossen! Genauigkeit: ${accuracy.toFixed(0)}%`,
          type: "success",
          duration: 4000,
        });
      }
    } else {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: "Training nicht erfolgreich - versuche es erneut!",
        type: "warning",
        duration: 4000,
      });
    }

    // Open completion modal
    draft.ui.currentModal = "completion";
    // Note: We'd need a separate way to pass completion data (success, accuracy, isPerfectGame)
    // For now, just showing the toast is enough to fix the immediate issue
  });

  // Auto-progress is now handled by the success dialog "Weiter" button
  // or by the EndgameTrainingPage handleComplete callback
  // No automatic navigation here to avoid conflicts with dialog interaction
}
