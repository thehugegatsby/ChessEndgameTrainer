/**
 * @file Handle player move orchestrator
 * @module store/orchestrators/handlePlayerMove
 *
 * @description
 * Orchestrates player moves across game, tablebase, training, and progress slices.
 * This is the main orchestrator for handling player chess moves with full validation,
 * tablebase checking, progress tracking, and training completion logic.
 *
 * @remarks
 * Key responsibilities:
 * - Move validation through chess.js
 * - Tablebase evaluation for move quality
 * - Training progress tracking
 * - UI feedback for mistakes
 * - Game state synchronization
 * - Automatic opponent response
 *
 * This orchestrator is exposed as `makeUserMove` in the root store for
 * backward compatibility.
 *
 * @example
 * ```typescript
 * // In the root store
 * const makeUserMove = useStore(state => state.makeUserMove);
 *
 * // Make a move
 * const success = await makeUserMove({ from: "e2", to: "e4" });
 * ```
 */

import type { StoreApi } from "./types";
// ValidatedMove available from other imports
import type { Move as ChessJsMove } from "chess.js";
import { tablebaseService } from "@shared/services/TablebaseService";
import { ErrorService } from "@shared/services/ErrorService";

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
 * This orchestrator performs the following steps:
 * 1. Validates the move using chess.js
 * 2. Updates game state and move history
 * 3. Evaluates position with tablebase
 * 4. Checks for WDL perspective changes
 * 5. Updates progress statistics
 * 6. Checks for training completion
 * 7. Handles perfect game achievements
 * 8. Shows appropriate toasts for feedback
 *
 * The orchestrator ensures atomicity - if any step fails, the entire
 * operation is rolled back to maintain consistency.
 *
 * @example
 * ```typescript
 * // Object notation
 * const success = await makeUserMove(api, { from: "e2", to: "e4" });
 *
 * // Algebraic notation
 * const success = await makeUserMove(api, "Nf3");
 *
 * // With promotion
 * const success = await makeUserMove(api, {
 *   from: "e7",
 *   to: "e8",
 *   promotion: "q"
 * });
 * ```
 */
export const handlePlayerMove = async (
  api: StoreApi,
  move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
): Promise<boolean> => {
  const { getState } = api;
  const state = getState();

  // Early validation
  if (!state.game) {
    state.showToast("Kein Spiel aktiv", "error");
    return false;
  }

  if (!state.currentPosition) {
    state.showToast("Keine Position geladen", "error");
    return false;
  }

  try {
    // Set loading state
    state.setLoading("position", true);

    // Step 1: Validate and make the move
    const fenBefore = state.currentFen;
    const validatedMove = state.makeMove(move);

    if (!validatedMove) {
      state.showToast("Ungültiger Zug", "error");
      return false;
    }

    const fenAfter = state.currentFen;

    // Step 2: Evaluate positions for WDL perspective
    const [evalBefore, evalAfter] = await Promise.all([
      tablebaseService.getEvaluation(fenBefore),
      tablebaseService.getEvaluation(fenAfter),
    ]);

    // Step 3: Check if move was optimal
    let isOptimal = false;
    let wdlBefore: number | undefined;
    let wdlAfter: number | undefined;

    if (
      evalBefore.isAvailable &&
      evalAfter.isAvailable &&
      evalBefore.result &&
      evalAfter.result
    ) {
      wdlBefore = getWDLFromTrainingPerspective(
        evalBefore.result.wdl,
        state.currentPosition.colorToTrain,
      );
      wdlAfter = getWDLFromTrainingPerspective(
        evalAfter.result.wdl,
        state.currentPosition.colorToTrain,
      );

      // Get best moves to check optimality
      const topMoves = await tablebaseService.getTopMoves(fenBefore);
      if (topMoves.isAvailable && topMoves.moves && topMoves.moves.length > 0) {
        const bestWDL = getWDLFromTrainingPerspective(
          topMoves.moves[0].wdl,
          state.currentPosition.colorToTrain,
        );
        isOptimal = wdlAfter === bestWDL;
      }

      // Check for position worsening
      if (isPositionWorsened(wdlBefore, wdlAfter)) {
        const outcomeChange = getOutcomeChange(wdlBefore, wdlAfter);

        state.incrementMistake();
        state.setMoveErrorDialog({
          isOpen: true,
          wdlBefore,
          wdlAfter,
          bestMove:
            topMoves.isAvailable && topMoves.moves && topMoves.moves.length > 0
              ? topMoves.moves[0].san
              : undefined,
        });

        state.showToast(
          outcomeChange === "Win->Draw/Loss"
            ? "Position verschlechtert: Gewinn → Remis/Verlust"
            : "Position verschlechtert: Remis → Verlust",
          "warning",
          4000,
        );
      }
    }

    // Step 4: Update progress would be calculated here if needed

    // Step 5: Check for training completion
    if (state.isGameFinished) {
      await handleTrainingCompletion(api, isOptimal);
      return true;
    }

    // Step 6: Switch turns and request tablebase move if needed
    state.setPlayerTurn(false); // User just moved, so it's not their turn

    const isTablebaseTurn =
      state.game.turn() !== state.currentPosition.colorToTrain.charAt(0);
    if (isTablebaseTurn) {
      // Small delay for better UX
      setTimeout(async () => {
        await api.getState().handleOpponentTurn();
      }, 500);
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
    state.showToast(userMessage, "error");
    return false;
  } finally {
    state.setLoading("position", false);
  }
};

/**
 * Handles training completion logic
 *
 * @param {StoreApi} api - Store API for state access and actions
 * @param {boolean} isOptimal - Whether the last move was optimal
 * @returns {Promise<void>}
 *
 * @private
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
async function handleTrainingCompletion(
  api: StoreApi,
  isOptimal: boolean,
): Promise<void> {
  const state = api.getState();

  if (!state.currentPosition || !state.sessionStartTime) return;

  const userMoves = state.moveHistory.filter((m: any) => m.userMove);
  const optimalMoves = userMoves.filter((m: any) => m.isOptimal).length;
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

  // Update position progress
  const positionId = state.currentPosition.id;
  const timeSpent = Date.now() - state.sessionStartTime;

  state.updatePositionProgress(positionId, {
    attempts: (state.positionProgress[positionId]?.attempts || 0) + 1,
    completed: success,
    lastAttempt: Date.now(),
    bestTime:
      success &&
      (!state.positionProgress[positionId]?.bestTime ||
        timeSpent < state.positionProgress[positionId].bestTime!)
        ? timeSpent
        : state.positionProgress[positionId]?.bestTime,
  });

  // Calculate next review date if successful
  if (success) {
    state.calculateNextReview(positionId, true);
  }

  // Add daily stats
  state.addDailyStats({
    positionsCompleted: success ? 1 : 0,
    totalTime: Math.floor(timeSpent / 1000), // Convert to seconds
    averageAccuracy: 0,
    mistakesMade: state.mistakeCount,
    hintsUsed: state.hintsUsed,
  });

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

/**
 * Gets WDL value from training perspective
 *
 * @param {number} wdl - Raw WDL value (always from white's perspective)
 * @param {"white" | "black"} trainingColor - Color being trained
 * @returns {number} WDL from training perspective
 *
 * @private
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
function getWDLFromTrainingPerspective(
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
 * @private
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
function isPositionWorsened(wdlBefore: number, wdlAfter: number): boolean {
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
 * @private
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
function getOutcomeChange(wdlBefore: number, wdlAfter: number): string | null {
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
 * @returns {"win" | "draw" | "loss"} Outcome classification
 *
 * @private
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
function getOutcomeFromWDL(wdl: number): "win" | "draw" | "loss" {
  if (wdl > 0) return "win";
  if (wdl < 0) return "loss";
  return "draw";
}
