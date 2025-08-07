/**
 * @file Opponent turn handler module
 * @module store/orchestrators/handlePlayerMove/OpponentTurnHandler
 * 
 * @description
 * Handles opponent turn scheduling, execution, and cancellation.
 * Manages timeout state and coordinates with tablebase service.
 */

import type { StoreApi } from "../types";
import { chessService } from "@shared/services/ChessService";
import { tablebaseService } from "@shared/services/TablebaseService";
import { ErrorService } from "@shared/services/ErrorService";
import { handleTrainingCompletion } from "./move.completion";
import { delay } from "@shared/utils/async";
import { getLogger } from "@shared/services/logging";

// Module-level timeout management
let opponentTurnTimeout: NodeJS.Timeout | undefined;
let isCancelled = false;

/** Default delay for opponent moves in milliseconds */
const OPPONENT_TURN_DELAY = 500;

/**
 * Cancels any scheduled opponent turn
 * 
 * @description
 * Called when undoing a move to prevent the opponent from playing
 * after the undo action completes.
 */
export function cancelScheduledOpponentTurn(): void {
  isCancelled = true;
  
  if (opponentTurnTimeout) {
    clearTimeout(opponentTurnTimeout);
    opponentTurnTimeout = undefined;
    getLogger().debug("[OpponentTurnHandler] Successfully cancelled scheduled opponent turn");
  } else {
    getLogger().debug("[OpponentTurnHandler] WARNING: No timeout to cancel, but set cancellation flag");
  }
}

/**
 * Schedules opponent turn execution
 *
 * @param api - Store API
 * @param delay - Optional delay in milliseconds (default: 500ms)
 *
 * @remarks
 * Separates opponent logic from player move handling.
 * Uses testable delay utility instead of raw setTimeout.
 */
export function scheduleOpponentTurn(api: StoreApi, delay: number = OPPONENT_TURN_DELAY): void {
  getLogger().info("[OpponentTurnHandler] Scheduling opponent turn in", delay, "ms");
  
  // Cancel any previously scheduled opponent turn
  cancelScheduledOpponentTurn();
  
  // Clear the cancellation flag when scheduling new turn
  isCancelled = false;
  
  if (typeof window !== "undefined") {
    // Schedule new opponent turn with cancellable timeout
    opponentTurnTimeout = setTimeout(async () => {
      getLogger().debug("[OpponentTurnHandler] Timeout fired, checking if we should execute opponent turn");
      
      // Check if this turn was cancelled
      if (isCancelled) {
        getLogger().debug("[OpponentTurnHandler] ABORTING - Turn was cancelled by undo");
        return;
      }
      
      // Check state again before executing - player might have undone the move
      const currentState = api.getState();
      if (currentState.training.isPlayerTurn) {
        getLogger().debug("[OpponentTurnHandler] ABORTING - It's now player's turn (move was undone)");
        return;
      }
      
      getLogger().debug("[OpponentTurnHandler] Executing opponent turn");
      await executeOpponentTurn(api);
      
      // Clear the timeout reference after execution
      opponentTurnTimeout = undefined;
    }, delay);
  } else {
    // Fallback for non-browser environments (tests)
    (async () => {
      await delay(delay);
      if (!isCancelled) {
        await executeOpponentTurn(api);
      }
    })();
  }
}

/**
 * Executes opponent turn
 *
 * @param api - Store API
 * @returns Promise that resolves when opponent turn is complete
 *
 * @private
 *
 * @remarks
 * Handles opponent move separately from player moves.
 * No recursion - clear separation of concerns.
 */
async function executeOpponentTurn(api: StoreApi): Promise<void> {
  const { getState, setState } = api;

  // Check if we should actually execute opponent turn
  const state = getState();
  getLogger().debug("[OpponentTurnHandler] Called with state:", {
    isPlayerTurn: state.training.isPlayerTurn,
    isOpponentThinking: state.training.isOpponentThinking,
    currentFen: chessService.getFen(),
    currentTurn: chessService.turn(),
    trainingColor: state.training.currentPosition?.colorToTrain,
    wasCancelled: isCancelled
  });

  // Check cancellation flag first
  if (isCancelled) {
    getLogger().debug("[OpponentTurnHandler] ABORTING - Turn was cancelled!");
    return;
  }

  // Don't execute if it's the player's turn
  if (state.training.isPlayerTurn) {
    getLogger().debug("[OpponentTurnHandler] ABORTING - It's player's turn!");
    return;
  }

  try {
    // Get current position
    const currentFen = chessService.getFen();

    // Fetch best move from tablebase
    const topMoves = await tablebaseService.getTopMoves(currentFen, 1);

    if (
      !topMoves.isAvailable ||
      !topMoves.moves ||
      topMoves.moves.length === 0
    ) {
      // No tablebase move available - just return control to player
      setState((draft) => {
        draft.training.isPlayerTurn = true;
        draft.training.isOpponentThinking = false;
      });
      return;
    }

    // Get the best move
    const bestMove = topMoves.moves[0];

    // Execute the opponent move (tablebase moves should always be valid)
    const move = chessService.move(bestMove.san);
    if (!move) {
      throw new Error(`Failed to execute tablebase move: ${bestMove.san}`);
    }

    // Update state - switch back to player's turn
    setState((draft) => {
      draft.training.isPlayerTurn = true;
      draft.training.isOpponentThinking = false;

      // Add a toast notification for the opponent's move
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: `Gegner spielt: ${bestMove.san}`,
        type: "info",
      });
    });

    // Check if game ended after opponent move
    if (chessService.isGameOver()) {
      await handleTrainingCompletion(api, false); // Player didn't win
    }
  } catch (error) {
    // Handle opponent move errors
    const userMessage = ErrorService.handleUIError(
      error instanceof Error ? error : new Error(String(error)),
      "OpponentMove",
      {
        component: "OpponentMove",
        action: "execute",
      },
    );

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
  }
}