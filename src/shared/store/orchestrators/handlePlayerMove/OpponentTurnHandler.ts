/**
 * Opponent turn handler - manages opponent move scheduling and execution
 * @see docs/orchestrators/handlePlayerMove/OpponentTurnHandler.md
 */

import type { StoreApi } from "../types";
import { chessService } from "@shared/services/ChessService";
// Note: Using dynamic import for service instead of React Query hook in orchestrator
import type { TablebaseMove } from "@shared/types/tablebase";
import { ErrorService } from "@shared/services/ErrorService";
import { handleTrainingCompletion } from "./move.completion";
import { getLogger } from "@shared/services/logging";

const OPPONENT_TURN_DELAY = 500; // ms

/** Manages opponent turn scheduling with race condition prevention */
class OpponentTurnManager {
  private timeout?: NodeJS.Timeout | undefined;
  private isCancelled = false;

  /** Cancels any scheduled opponent turn */
  cancel(): void {
    this.isCancelled = true;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
      getLogger().debug(
        "[OpponentTurnHandler] Successfully cancelled scheduled opponent turn",
      );
    } else {
      getLogger().debug(
        "[OpponentTurnHandler] WARNING: No timeout to cancel, but set cancellation flag",
      );
    }
  }

  /**
   * Schedules optimal opponent move execution with sophisticated timing control
   *
   * @param {StoreApi} api - Zustand store API for state management
   * @param {number} [delay=500] - Delay in milliseconds before executing opponent move
   * @param {Object} [options] - Optional configuration
   * @param {Function} [options.onOpponentMoveComplete] - Callback after opponent move completes
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
   */
  schedule(
    api: StoreApi,
    delay: number = OPPONENT_TURN_DELAY,
    options?: { onOpponentMoveComplete?: () => Promise<void> | void }
  ): void {
    const currentState = api.getState();
    getLogger().info(
      `[OpponentTurnHandler] 🎯 scheduleOpponentTurn called - delay: ${delay}ms`,
      {
        isPlayerTurn: currentState.training.isPlayerTurn,
        isOpponentThinking: currentState.training.isOpponentThinking,
        currentFen: chessService.getFen(),
        currentTurn: chessService.turn(),
        colorToTrain: currentState.training.currentPosition?.colorToTrain,
      }
    );

    // Cancel any previously scheduled opponent turn
    this.cancel();

    // Clear the cancellation flag when scheduling new turn
    this.isCancelled = false;

    if (typeof window !== "undefined") {
      // Schedule new opponent turn with cancellable timeout
      this.timeout = setTimeout(async () => {

        // Check if this turn was cancelled
        if (this.isCancelled) return;

        // Check state again before executing - player might have undone the move
        const latestState = api.getState();
        if (latestState.training.isPlayerTurn) return;

        getLogger().debug("[OpponentTurnHandler] Executing opponent turn");
        await this.executeOpponentTurn(api, options?.onOpponentMoveComplete);

        // Clear the timeout reference after execution
        this.timeout = undefined;
      }, delay);
    } else {
      // Fallback for non-browser environments (tests)
      (async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (!this.isCancelled) {
          await this.executeOpponentTurn(api, options?.onOpponentMoveComplete);
        }
      })();
    }
  }

  /**
   * Executes optimal opponent move using tablebase recommendations
   *
   * @param {StoreApi} api - Zustand store API for state management
   * @param {Function} [onComplete] - Optional callback after move completion
   * @returns {Promise<void>} Promise that resolves when opponent move execution is complete
   *
   * @private
   * @description
   * Core opponent move execution with comprehensive state validation and error handling.
   * Fetches the best move from tablebase API and executes it with proper state updates.
   */
  private async executeOpponentTurn(
    api: StoreApi,
    onComplete?: () => Promise<void> | void
  ): Promise<void> {
    const { getState, setState } = api;

    // Check if we should actually execute opponent turn
    const state = getState();

    // Check cancellation flag first
    if (this.isCancelled) return;

    // Don't execute if it's the player's turn
    if (state.training.isPlayerTurn) return;

    try {
      // Get current position
      const currentFen = chessService.getFen();

      // Fetch ALL moves from tablebase to find optimal one based on DTM
      // We need all moves to properly evaluate defense in losing positions
      // Using orchestrator service wrapper for clean non-hook access
      const { orchestratorTablebase } = await import("@shared/services/orchestrator/OrchestratorServices");
      const topMoves = await orchestratorTablebase.getTopMoves(currentFen, 10);


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

      // Select optimal move (see selectOptimalMove for algorithm)
      const bestMove = selectOptimalMove(topMoves.moves);

      // Execute the opponent move (tablebase moves should always be valid)
      const move = chessService.move(bestMove.san);
      if (!move) {
        throw new Error(`Failed to execute tablebase move: ${bestMove.san}`);
      }

      // Update state - switch back to player's turn
      setState((draft) => {
        draft.training.isPlayerTurn = true;
        draft.training.isOpponentThinking = false;

      });

      // Check if game ended after opponent move
      if (chessService.isGameOver()) {
        await handleTrainingCompletion(api, false); // Player didn't win
      }

      // Call completion callback if provided
      if (onComplete) {
        try {
          await onComplete();
        } catch {
          // Silently ignore callback errors
        }
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
}

/**
 * Selects optimal move: Win > Draw > Loss by WDL,
 * then fastest win (low DTM) or best defense (high DTM)
 */
function selectOptimalMove(moves: TablebaseMove[]): TablebaseMove {

  // Sort moves by optimal criteria
  const sortedMoves = [...moves].sort((a, b) => {
    // First priority: Sort by outcome (higher WDL is better)
    if (a.wdl !== b.wdl) {
      return b.wdl - a.wdl; // Prefer wins over draws over losses
    }

    // Same outcome - sort by DTM based on position type
    if (
      a.dtm === null ||
      a.dtm === undefined ||
      b.dtm === null ||
      b.dtm === undefined
    ) {
      return 0; // Can't compare if DTM is missing
    }

    // Check position type based on WDL
    if (a.wdl > 0) {
      // These are "winning" positions for the opponent after our move
      // For optimal defense: prefer HIGHER DTM (gives opponent longer path to win)
      return Math.abs(b.dtm) - Math.abs(a.dtm); // FIXED: Higher DTM first for defense
    } else if (a.wdl < 0) {
      // LOSING position: prefer HIGHER DTM (slower loss - better defense)
      // DTM is negative for losses
      // Example: -27 is better than -15 (lose in 27 moves vs 15 moves)
      return Math.abs(b.dtm) - Math.abs(a.dtm);
    } else {
      // DRAW: all moves equivalent
      return 0;
    }
  });

  const selected = sortedMoves[0];
  if (!selected) {
    throw new Error('No moves available for selection');
  }

  // Log the decision for debugging
  getLogger().info("[OpponentTurnHandler] Move selection:", {
    availableMoves: moves.map((m) => ({
      san: m.san,
      wdl: m.wdl,
      dtm: m.dtm,
      category: m.category,
    })),
    selectedMove: {
      san: selected.san,
      wdl: selected.wdl,
      dtm: selected.dtm,
      category: selected.category,
    },
    reason: (() => {
      if (selected.wdl < 0) return `Best defense - delays mate for ${Math.abs(selected.dtm || 0)} moves`;
      if (selected.wdl > 0) return `Fastest win - mate in ${Math.abs(selected.dtm || 0)} moves`;
      return "Draw maintaining move";
    })(),
  });

  return selected;
}

// Singleton instance
let managerInstance: OpponentTurnManager | null = null;

/** Gets singleton OpponentTurnManager instance */
export function getOpponentTurnManager(): OpponentTurnManager {
  if (!managerInstance) {
    managerInstance = new OpponentTurnManager();
  }
  return managerInstance;
}