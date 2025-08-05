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
 * This orchestrator coordinates move execution across multiple slices:
 * 1. Validates preconditions and makes move
 * 2. Evaluates move quality with tablebase
 * 3. Handles training completion or turn transition
 *
 * @example
 * ```typescript
 * const success = await handlePlayerMove(api, { from: "e2", to: "e4" });
 * ```
 */
export const handlePlayerMove = async (
  api: StoreApi,
  move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
): Promise<boolean> => {
  const { getState } = api;
  const state = getState();

  // Validate preconditions
  if (!validateMoveContext(state)) {
    return false;
  }

  try {
    state.setLoading("position", true);

    // Execute move and get positions
    const moveResult = await executeMoveWithValidation(state, move);
    if (!moveResult) {
      return false;
    }

    const { fenBefore, fenAfter } = moveResult;

    // Evaluate move quality
    const evaluation = await evaluateMoveQuality(
      fenBefore,
      fenAfter,
      state.currentPosition!,
    );

    // Handle move feedback
    if (evaluation.isWorseningMove) {
      handleMoveError(state, evaluation);
    }

    // Check training completion or continue game
    if (state.isGameFinished) {
      await handleTrainingCompletion(api, evaluation.isOptimal);
      return true;
    }

    // Transition to opponent turn
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
 * Validates the context for making a move
 *
 * @param {any} state - Current store state
 * @returns {boolean} Whether the context is valid for moves
 *
 * @private
 */
function validateMoveContext(state: any): boolean {
  if (!state.game) {
    state.showToast("Kein Spiel aktiv", "error");
    return false;
  }

  if (!state.currentPosition) {
    state.showToast("Keine Position geladen", "error");
    return false;
  }

  return true;
}

/**
 * Executes a move with validation
 *
 * @param {any} state - Current store state
 * @param {ChessJsMove | {from: string; to: string; promotion?: string} | string} move - The move to make
 * @returns {Promise<{fenBefore: string; fenAfter: string; validatedMove: any} | null>} Move result or null if invalid
 *
 * @private
 */
async function executeMoveWithValidation(
  state: any,
  move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
): Promise<{ fenBefore: string; fenAfter: string; validatedMove: any } | null> {
  const fenBefore = state.currentFen;
  const validatedMove = state.makeMove(move);

  if (!validatedMove) {
    state.showToast("Ungültiger Zug", "error");
    return null;
  }

  const fenAfter = state.currentFen;
  return { fenBefore, fenAfter, validatedMove };
}

/**
 * Move evaluation result interface
 *
 * @private
 */
interface MoveEvaluation {
  isOptimal: boolean;
  isWorseningMove: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  bestMove?: string;
  outcomeChange?: string | null;
}

/**
 * Evaluates move quality using tablebase
 *
 * @param {string} fenBefore - Position before move
 * @param {string} fenAfter - Position after move
 * @param {any} currentPosition - Training position context
 * @returns {Promise<MoveEvaluation>} Move evaluation result
 *
 * @private
 */
async function evaluateMoveQuality(
  fenBefore: string,
  fenAfter: string,
  currentPosition: any,
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
 * Handles move error feedback
 *
 * @param {any} state - Current store state
 * @param {MoveEvaluation} evaluation - Move evaluation result
 *
 * @private
 */
function handleMoveError(state: any, evaluation: MoveEvaluation): void {
  state.incrementMistake();
  state.setMoveErrorDialog({
    isOpen: true,
    wdlBefore: evaluation.wdlBefore,
    wdlAfter: evaluation.wdlAfter,
    bestMove: evaluation.bestMove,
  });

  const message =
    evaluation.outcomeChange === "Win->Draw/Loss"
      ? "Position verschlechtert: Gewinn → Remis/Verlust"
      : "Position verschlechtert: Remis → Verlust";

  state.showToast(message, "warning", 4000);
}

/**
 * Transitions to opponent turn
 *
 * @param {StoreApi} api - Store API
 * @param {any} state - Current store state
 *
 * @private
 */
async function transitionToOpponentTurn(
  api: StoreApi,
  state: any,
): Promise<void> {
  state.setPlayerTurn(false); // User just moved, so it's not their turn

  const isTablebaseTurn =
    state.game.turn() !== state.currentPosition.colorToTrain.charAt(0);
  if (isTablebaseTurn) {
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
 */
function handleMoveOrchestrationError(state: any, error: Error): void {
  const userMessage = ErrorService.handleUIError(error, "MakeUserMove", {
    component: "MakeUserMove",
    action: "orchestrate",
  });
  state.showToast(userMessage, "error");
}

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

  const userMoves = state.moveHistory.filter((m) => (m as any).userMove);
  const optimalMoves = userMoves.filter((m) => (m as any).isOptimal).length;
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
