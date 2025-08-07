/**
 * @file Opponent turn handler module
 * @module store/orchestrators/handlePlayerMove/OpponentTurnHandler
 * 
 * @description
 * Handles comprehensive opponent turn management in chess training sessions.
 * Provides sophisticated scheduling, execution, and cancellation of opponent moves
 * with race condition prevention and robust error handling.
 * 
 * @remarks
 * Key architectural features:
 * - **Race condition prevention**: Multiple cancellation checks prevent stale executions
 * - **Timeout management**: Module-level state for proper cleanup and cancellation
 * - **Tablebase integration**: Fetches optimal opponent moves from tablebase API
 * - **State synchronization**: Coordinates with training state for turn management
 * - **Error resilience**: Graceful handling of tablebase API failures
 * - **Cross-platform support**: Works in browser and Node.js test environments
 * 
 * The handler prevents common issues like:
 * - Executing opponent moves after user undo operations
 * - Multiple concurrent opponent turns
 * - Memory leaks from uncleaned timeouts
 * - State desynchronization between UI and game logic
 * 
 * @example
 * ```typescript
 * import { scheduleOpponentTurn, cancelScheduledOpponentTurn } from './OpponentTurnHandler';
 * 
 * // Schedule opponent move with default delay
 * scheduleOpponentTurn(storeApi);
 * 
 * // Schedule with custom delay
 * scheduleOpponentTurn(storeApi, 1000);
 * 
 * // Cancel any pending opponent move (e.g., during undo)
 * cancelScheduledOpponentTurn();
 * ```
 */

import type { StoreApi } from "../types";
import { chessService } from "@shared/services/ChessService";
import { tablebaseService } from "@shared/services/TablebaseService";
import { ErrorService } from "@shared/services/ErrorService";
import { handleTrainingCompletion } from "./move.completion";
import { delay } from "@shared/utils/async";
import { getLogger } from "@shared/services/logging";

// Module-level timeout management for race condition prevention
let opponentTurnTimeout: NodeJS.Timeout | undefined;
let isCancelled = false;

/** Default delay for opponent moves in milliseconds - provides natural game feel */
const OPPONENT_TURN_DELAY = 500;

/**
 * Cancels any scheduled opponent turn to prevent race conditions
 * 
 * @description
 * Provides immediate cancellation of pending opponent moves, essential for:
 * - Undo operations that revert game state
 * - User navigation away from training session
 * - Game completion or interruption scenarios
 * 
 * @remarks
 * Uses two-phase cancellation strategy:
 * 1. Sets global cancellation flag for timeout callbacks
 * 2. Clears active timeout to prevent execution
 * 
 * This dual approach ensures no opponent moves execute after cancellation,
 * even if the timeout has already fired but not yet executed.
 * 
 * @example
 * ```typescript
 * // Cancel when user undoes a move
 * const handleUndo = () => {
 *   cancelScheduledOpponentTurn();
 *   undoLastMove();
 * };
 * ```
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
 * Schedules optimal opponent move execution with sophisticated timing control
 *
 * @param {StoreApi} api - Zustand store API for state management
 * @param {number} [delay=500] - Delay in milliseconds before executing opponent move
 *
 * @description
 * Coordinates the scheduling and execution of optimal opponent moves using tablebase data.
 * Provides natural game pacing while ensuring clean state management and error handling.
 * 
 * @remarks
 * **Race Condition Prevention:**
 * - Cancels any existing scheduled opponent turn before scheduling new one
 * - Resets cancellation flags for clean state
 * - Multiple state checks before execution
 * 
 * **Cross-Platform Support:**
 * - Browser: Uses setTimeout with proper cleanup
 * - Node.js/Tests: Uses async delay utility for deterministic testing
 * 
 * **Error Resilience:**
 * - Graceful handling of tablebase API failures
 * - State recovery on opponent move execution errors
 * - Proper timeout cleanup in all scenarios
 * 
 * @example
 * ```typescript
 * // Schedule with default 500ms delay for natural feel
 * scheduleOpponentTurn(storeApi);
 * 
 * // Schedule with faster response for testing
 * scheduleOpponentTurn(storeApi, 100);
 * 
 * // Schedule with slower response for dramatic effect
 * scheduleOpponentTurn(storeApi, 2000);
 * ```
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
 * Executes optimal opponent move using tablebase recommendations
 *
 * @param {StoreApi} api - Zustand store API for state management
 * @returns {Promise<void>} Promise that resolves when opponent move execution is complete
 *
 * @private
 * @description
 * Core opponent move execution with comprehensive state validation and error handling.
 * Fetches the best move from tablebase API and executes it with proper state updates.
 * 
 * @remarks
 * **Multi-Layer Validation:**
 * - Cancellation flag check (prevents stale executions)
 * - Current turn validation (ensures opponent should move)
 * - Game state consistency checks
 * 
 * **Tablebase Integration:**
 * - Fetches top 1 move for optimal play
 * - Handles API unavailability gracefully
 * - Validates move execution success
 * 
 * **State Management:**
 * - Updates turn state after successful move
 * - Adds user notification for opponent move
 * - Triggers game completion check
 * - Recovers from errors with proper state reset
 * 
 * **Error Scenarios Handled:**
 * - Tablebase API failures (network, rate limits)
 * - Invalid move execution (corrupted game state)
 * - State desynchronization issues
 * 
 * @example
 * ```typescript
 * // This is called internally by scheduleOpponentTurn
 * // Manual usage not recommended - use scheduleOpponentTurn instead
 * await executeOpponentTurn(storeApi);
 * ```
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

      // Note: Removed opponent move toast to reduce UI clutter
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