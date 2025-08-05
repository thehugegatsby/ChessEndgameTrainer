/**
 * @file Handle player move orchestrator
 * @module store/orchestrators/handlePlayerMove
 *
 * @description
 * Main orchestrator for handling player chess moves. Coordinates validation,
 * evaluation, and training completion across multiple store slices.
 *
 * @remarks
 * This orchestrator imports and calls functions from specialized modules
 * in sequence. It maintains the high-level flow while delegating specific
 * responsibilities to focused modules.
 *
 * @example
 * ```typescript
 * const success = await handlePlayerMove(api, { from: "e2", to: "e4" });
 * ```
 */

import type { StoreApi } from "../types";
import type { Move as ChessJsMove } from "chess.js";
import { ErrorService } from "@shared/services/ErrorService";

// Import specialized modules
import {
  validateMoveContext,
  executeMoveWithValidation,
} from "./move.validation";
import { evaluateMoveQuality, handleMoveError } from "./move.evaluation";
import { handleTrainingCompletion } from "./move.completion";

// Re-export types for consumers
export type { MoveEvaluation, MoveExecutionResult } from "./move.types";

/**
 * Handles a player move with full orchestration across slices
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @param {ChessJsMove | {from: string; to: string; promotion?: string} | string} move - The move to make
 * @returns {Promise<boolean>} Whether the move was successful
 *
 * @fires stateChange - Updates game, training, progress, and UI slices
 * @fires tablebaseRequest - Fetches evaluation data for positions
 *
 * @remarks
 * Orchestration flow:
 * 1. Validate preconditions
 * 2. Execute move with validation
 * 3. Evaluate move quality
 * 4. Handle feedback for suboptimal moves
 * 5. Check for training completion
 * 6. Transition to opponent turn
 */
export const handlePlayerMove = async (
  api: StoreApi,
  move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
): Promise<boolean> => {
  const { getState } = api;
  const state = getState();

  // Step 1: Validate preconditions
  if (!validateMoveContext(state)) {
    return false;
  }

  try {
    state.setLoading("position", true);

    // Step 2: Execute move and get positions
    const moveResult = await executeMoveWithValidation(state, move);
    if (!moveResult) {
      return false;
    }

    const { fenBefore, fenAfter } = moveResult;

    // Step 3: Evaluate move quality
    const evaluation = await evaluateMoveQuality(
      fenBefore,
      fenAfter,
      state.currentPosition!,
    );

    // Step 4: Handle move feedback
    if (!evaluation.isOptimal) {
      // Show error dialog for all suboptimal moves
      handleMoveError(state, evaluation);
      // Don't continue to opponent turn - wait for user decision
      return true;
    }

    // Step 5: Check training completion or continue game
    if (state.isGameFinished) {
      await handleTrainingCompletion(api, evaluation.isOptimal);
      return true;
    }

    // Step 6: Transition to opponent turn
    await transitionToOpponentTurn(api, state);

    return true;
  } catch (error) {
    handleMoveOrchestrationError(state, error as Error);
    return false;
  } finally {
    state.setLoading("position", false);
  }
};

/**
 * Transitions to opponent turn
 *
 * @param {StoreApi} api - Store API
 * @param {any} state - Current store state
 *
 * @private
 *
 * @remarks
 * This function remains in the orchestrator as it's part of the
 * main flow control and only consists of a single function.
 */
async function transitionToOpponentTurn(
  api: StoreApi,
  state: any,
): Promise<void> {
  state.setPlayerTurn(false); // User just moved, so it's not their turn

  // Get fresh state after move
  const freshState = api.getState();

  // Check if it's the opponent's turn (not the training color)
  const currentTurn = freshState.game?.turn(); // 'w' or 'b'
  const trainingColor = freshState.currentPosition?.colorToTrain?.charAt(0); // 'w' or 'b'
  const isOpponentTurn = currentTurn !== trainingColor;

  if (isOpponentTurn) {
    // Small delay for better UX
    setTimeout(async () => {
      await api.getState().handleOpponentTurn();
    }, 500);
  }
}

/**
 * Handles orchestration errors
 *
 * @param {any} state - Current store state
 * @param {Error} error - The error that occurred
 *
 * @private
 *
 * @remarks
 * Top-level error handling remains in the orchestrator as it
 * coordinates the overall error response.
 */
function handleMoveOrchestrationError(state: any, error: Error): void {
  const userMessage = ErrorService.handleUIError(error, "MakeUserMove", {
    component: "MakeUserMove",
    action: "orchestrate",
  });
  state.showToast(userMessage, "error");
}
