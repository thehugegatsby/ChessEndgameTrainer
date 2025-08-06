/**
 * @file Handle player move orchestrator (slim coordinator)
 * @module store/orchestrators/handlePlayerMove
 *
 * @description
 * Slim orchestrator that coordinates player moves using the chess service layer.
 * Handles state updates and delegates business logic to stateless services.
 *
 * @remarks
 * This orchestrator is now a thin coordination layer that:
 * - Uses chessService for stateless operations
 * - Updates store state based on service results
 * - Maintains clear separation of concerns
 *
 * @example
 * ```typescript
 * const success = await handlePlayerMove(api, { from: "e2", to: "e4" });
 * ```
 */

import type { StoreApi } from "../types";
import type { Move as ChessJsMove } from "chess.js";
import { chessService } from "@shared/services/ChessService";
import { ErrorService } from "@shared/services/ErrorService";
import { handleTrainingCompletion } from "./move.completion";
import { delay } from "@shared/utils/async";

// Re-export types for consumers
export type { MoveEvaluation, MoveExecutionResult } from "./move.types";

/**
 * Handles a player move using slim orchestration
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @param {ChessJsMove | {from: string; to: string; promotion?: string} | string} move - The move to make
 * @returns {Promise<boolean>} Whether the move was successful
 *
 * @remarks
 * Simplified flow using chess service:
 * 1. Validate move using service
 * 2. Apply move and update state
 * 3. Evaluate quality using service
 * 4. Handle completion or opponent turn
 */
export const handlePlayerMove = async (
  api: StoreApi,
  move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
): Promise<boolean> => {
  const { getState, setState } = api;
  const state = getState();

  // Check if it's player's turn and opponent is not thinking
  if (!state.training.isPlayerTurn || state.training.isOpponentThinking) {
    return false;
  }

  try {
    // Set loading state
    setState((draft) => {
      draft.ui.loading.position = true;
    });

    // currentFen removed - not used here
    
    // Step 1: Validate move using service
    const isValid = chessService.validateMove(move);
    if (!isValid) {
      // Use setState for UI updates instead of direct state access
      setState((draft) => {
        draft.ui.toasts.push({
          id: Date.now().toString(),
          message: "Invalid move",
          type: "error",
        });
      });
      return false;
    }

    // Step 2: Apply move to game state
    const validatedMove = chessService.move(move);
    if (!validatedMove) {
      return false;
    }
    
    // Game state will be automatically synced via ChessService event subscription in rootStore

    // Step 3: Move quality evaluation would go here
    // TODO: Implement move quality evaluation with tablebase service
    // For now, assume all moves are acceptable

    // Step 5: Check if game is finished
    if (chessService.isGameOver()) {
      await handleTrainingCompletion(api, true);
      return true;
    }

    // Step 6: Check if opponent's turn
    const currentTurn = chessService.turn();
    const trainingColor = state.training.currentPosition?.colorToTrain?.charAt(0);
    
    if (currentTurn !== trainingColor) {
      // Trigger opponent turn (delegated to separate function)
      setState((draft) => {
        draft.training.isPlayerTurn = false;
        draft.training.isOpponentThinking = true; // Set flag before opponent starts
      });
      
      // Schedule opponent turn without recursion
      scheduleOpponentTurn(api);
    }

    return true;
  } catch (error) {
    const userMessage = ErrorService.handleUIError(error as Error, "MakeUserMove", {
      component: "MakeUserMove",
      action: "orchestrate",
    });
    
    // Use setState for error toast
    setState((draft) => {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: userMessage,
        type: "error",
      });
    });
    
    return false;
  } finally {
    // Clear loading state
    setState((draft) => {
      draft.ui.loading.position = false;
    });
  }
};

/**
 * Schedules opponent turn execution
 * 
 * @param {StoreApi} api - Store API
 * 
 * @private
 * 
 * @remarks
 * Separates opponent logic from player move handling.
 * Uses testable delay utility instead of raw setTimeout.
 */
function scheduleOpponentTurn(api: StoreApi): void {
  // Use async IIFE to handle the promise properly
  (async () => {
    await delay(500); // Testable delay
    await executeOpponentTurn(api);
  })();
}

/**
 * Executes opponent turn
 * 
 * @param {StoreApi} api - Store API
 * @returns {Promise<void>}
 * 
 * @private
 * 
 * @remarks
 * Handles opponent move separately from player moves.
 * No recursion - clear separation of concerns.
 */
async function executeOpponentTurn(api: StoreApi): Promise<void> {
  const { setState } = api;
  
  try {
    // currentFen removed - not used here
    
    // TODO: Fetch best move from tablebase service
    // This functionality needs to be implemented with TablebaseService
    
    // For now, just return - opponent moves need tablebase integration
    setState((draft) => {
      
      // Switch back to player's turn and clear thinking flag
      draft.training.isPlayerTurn = true;
      draft.training.isOpponentThinking = false;
    });
    
    // Check if game ended after opponent move
    if (chessService.isGameOver()) {
      await handleTrainingCompletion(api, false); // Player didn't win
    }
    
  } catch (error) {
    // Handle opponent move errors
    const userMessage = ErrorService.handleUIError(error as Error, "OpponentMove", {
      component: "OpponentMove",
      action: "execute",
    });
    
    setState((draft) => {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: userMessage,
        type: "error",
      });
      // Reset to player's turn and clear thinking flag on error
      draft.training.isPlayerTurn = true;
      draft.training.isOpponentThinking = false;
    });
  } finally {
    // Always clear the thinking flag
    setState((draft) => {
      draft.training.isOpponentThinking = false;
    });
  }
}

