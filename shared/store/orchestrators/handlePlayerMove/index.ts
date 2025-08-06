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
import { tablebaseService } from "@shared/services/TablebaseService";
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
  console.log("[handlePlayerMove] ORCHESTRATOR CALLED:", { move });

  const { getState, setState } = api;
  const state = getState();

  console.log("[handlePlayerMove] Current state:", {
    isPlayerTurn: state.training.isPlayerTurn,
    isOpponentThinking: state.training.isOpponentThinking,
  });

  // Check if it's player's turn and opponent is not thinking
  if (!state.training.isPlayerTurn || state.training.isOpponentThinking) {
    console.log(
      "[handlePlayerMove] Early return - not player turn or opponent thinking",
    );
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

    // Step 2: Get position before move for evaluation
    const fenBefore = chessService.getFen();

    // Step 3: Apply move to game state
    const validatedMove = chessService.move(move);
    if (!validatedMove) {
      return false;
    }

    // Game state will be automatically synced via ChessService event subscription in rootStore

    // Step 4: Move quality evaluation with tablebase service
    try {
      // Get evaluations before and after the move
      const evalBefore = await tablebaseService
        .getEvaluation(fenBefore)
        .catch(() => ({ isAvailable: false }));
      const fenAfter = chessService.getFen();
      const evalAfter = await tablebaseService
        .getEvaluation(fenAfter)
        .catch(() => ({ isAvailable: false }));

      // Check if move worsened position (only if both evaluations are available)
      if (
        evalBefore.isAvailable &&
        evalAfter.isAvailable &&
        "result" in evalBefore &&
        "result" in evalAfter &&
        evalBefore.result &&
        evalAfter.result
      ) {
        const wdlBefore = evalBefore.result.wdl;
        const wdlAfter = evalAfter.result.wdl;

        console.log("[MoveQuality] Evaluating move quality:", {
          moveColor: validatedMove.color,
          moveSan: validatedMove.san,
          wdlBefore,
          wdlAfter,
          fenBefore: fenBefore.split(" ")[0], // Just board position
          fenAfter: fenAfter.split(" ")[0],
        });

        // WDL values are from white's perspective:
        // Positive = good for white, Negative = good for black
        // IMPORTANT: After white moves, it's black's turn, so the evaluation
        // perspective needs careful handling
        const movedColor = validatedMove.color; // 'w' or 'b'

        // For winning positions, WDL values alternate between moves
        // If white had +2 (win) and after moving still has a winning position,
        // the API might return -2 (from black's perspective for black to move)
        // This doesn't mean the position got worse!

        // Convert WDL to player's perspective consistently
        const wdlBeforeFromPlayerPerspective =
          movedColor === "w" ? wdlBefore : -wdlBefore;

        // After the move, it's the opponent's turn, so we need to invert
        const wdlAfterFromPlayerPerspective =
          movedColor === "w" ? -wdlAfter : wdlAfter;

        console.log("[MoveQuality] WDL from player perspective:", {
          wdlBeforeFromPlayerPerspective,
          wdlAfterFromPlayerPerspective,
        });

        // Get best moves for comparison
        const topMoves = await tablebaseService
          .getTopMoves(fenBefore, 3)
          .catch(() => ({ isAvailable: false, moves: [] }));

        // Check if the played move was one of the best moves
        const playedMoveWasBest =
          topMoves.isAvailable &&
          topMoves.moves &&
          topMoves.moves.some((m) => m.san === validatedMove.san);

        console.log("[MoveQuality] Best moves check:");
        console.log("  topMovesAvailable:", topMoves.isAvailable);
        console.log(
          "  bestMoves:",
          JSON.stringify(topMoves.moves?.map((m) => m.san)),
        );
        console.log("  playedMove:", validatedMove.san);
        console.log("  playedMoveWasBest:", playedMoveWasBest);

        // Debug each move comparison
        if (topMoves.moves) {
          console.log("  Comparing each move:");
          topMoves.moves.forEach((m, i) => {
            console.log(
              `    Move ${i}: "${m.san}" === "${validatedMove.san}" ? ${m.san === validatedMove.san}`,
            );
          });
        }

        // Only show error if:
        // 1. Position got worse (WDL decreased from player's perspective) AND
        // 2. The played move was not one of the best moves
        // 3. The position outcome actually changed (not just DTM increase)
        const outcomeChanged =
          (wdlBeforeFromPlayerPerspective > 0 &&
            wdlAfterFromPlayerPerspective <= 0) || // Win -> Draw/Loss
          (wdlBeforeFromPlayerPerspective === 0 &&
            wdlAfterFromPlayerPerspective < 0); // Draw -> Loss

        console.log("[MoveQuality] DECISION VALUES:");
        console.log("  outcomeChanged:", outcomeChanged);
        console.log("  playedMoveWasBest:", playedMoveWasBest);
        console.log(
          "  wdlBeforeFromPlayerPerspective:",
          wdlBeforeFromPlayerPerspective,
        );
        console.log(
          "  wdlAfterFromPlayerPerspective:",
          wdlAfterFromPlayerPerspective,
        );
        console.log(
          "  showDialog (original logic):",
          !playedMoveWasBest && outcomeChanged,
        );
        console.log(
          "  forceTestDialog:",
          !playedMoveWasBest && topMoves.isAvailable,
        );
        console.log(
          "  FINAL TRIGGER:",
          (!playedMoveWasBest && outcomeChanged) ||
            (!playedMoveWasBest && topMoves.isAvailable),
        );

        // TEMP: Force error dialog for testing (should only trigger if move was not best)
        const forceTestDialog = !playedMoveWasBest && topMoves.isAvailable;

        if ((!playedMoveWasBest && outcomeChanged) || forceTestDialog) {
          const bestMove =
            topMoves.isAvailable && topMoves.moves && topMoves.moves.length > 0
              ? topMoves.moves[0].san
              : undefined;

          console.log(
            "[MoveQuality] Showing error dialog with best move:",
            bestMove,
          );
          console.log(
            "[MoveQuality] Force test dialog triggered:",
            forceTestDialog,
          );

          // Show error dialog
          setState((draft) => {
            draft.training.moveErrorDialog = {
              isOpen: true,
              wdlBefore,
              wdlAfter,
              bestMove,
            };
          });
        }
      } else {
        console.log("[MoveQuality] Skipping evaluation - insufficient data:", {
          evalBeforeAvailable: evalBefore?.isAvailable,
          evalAfterAvailable: evalAfter?.isAvailable,
          hasBeforeResult: evalBefore && "result" in evalBefore,
          hasAfterResult: evalAfter && "result" in evalAfter,
        });
      }
    } catch (error) {
      // Log evaluation error but don't block move
      console.error("Move quality evaluation failed:", error);
    }

    // Step 5: Check if game is finished
    if (chessService.isGameOver()) {
      await handleTrainingCompletion(api, true);
      return true;
    }

    // Step 6: Check if opponent's turn
    const currentTurn = chessService.turn();
    const trainingColor =
      state.training.currentPosition?.colorToTrain?.charAt(0);

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
    const userMessage = ErrorService.handleUIError(
      error as Error,
      "MakeUserMove",
      {
        component: "MakeUserMove",
        action: "orchestrate",
      },
    );

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

    // Convert SAN move to from/to format for ChessService
    // The tablebase returns moves in SAN format (e.g., "Ke4", "Rxh7")
    // We need to convert to { from, to } format
    const moveResult = chessService.validateMove(bestMove.san);
    if (!moveResult) {
      // If validation fails, try to make the move directly
      const move = chessService.move(bestMove.san);
      if (!move) {
        throw new Error(`Invalid tablebase move: ${bestMove.san}`);
      }
    } else {
      // Make the opponent move
      const move = chessService.move(bestMove.san);
      if (!move) {
        throw new Error(`Failed to execute tablebase move: ${bestMove.san}`);
      }
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
      error as Error,
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
  } finally {
    // Always clear the thinking flag
    setState((draft) => {
      draft.training.isOpponentThinking = false;
    });
  }
}
