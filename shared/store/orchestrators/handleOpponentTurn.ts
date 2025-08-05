/**
 * @file Handle opponent turn orchestrator
 * @module store/orchestrators/handleOpponentTurn
 *
 * @description
 * Orchestrates opponent moves using tablebase for the current chess position.
 * This orchestrator handles the async flow of requesting the best move from the
 * Lichess tablebase API and updating the relevant state slices.
 *
 * @remarks
 * Key responsibilities:
 * - Validate game state and turn order
 * - Request optimal moves from tablebase API
 * - Execute moves on the chess board
 * - Update training move history
 * - Handle special cases (draws, unavailable positions)
 * - Manage loading states and error handling
 *
 * This orchestrator is exposed as `requestTablebaseMove` in the root store
 * for backward compatibility.
 *
 * @example
 * ```typescript
 * // In the root store
 * import { handleOpponentTurn } from './orchestrators/handleOpponentTurn';
 *
 * const store = create<RootState>()((...args) => ({
 *   ...createGameSlice(...args),
 *   ...createTablebaseSlice(...args),
 *   // ... other slices
 *   // Orchestrators as actions
 *   requestTablebaseMove: () => handleOpponentTurn(args[2]),
 * }));
 * ```
 */

import type { StoreApi, OrchestratorFunction } from "./types";
import { tablebaseService } from "@shared/services/TablebaseService";
import { ErrorService } from "@shared/services/ErrorService";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("handleOpponentTurn");

/**
 * Handles the opponent's turn by requesting the best tablebase move
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @returns {Promise<void>}
 *
 * @fires setAnalysisStatus - Updates analysis status during the request
 * @fires setTablebaseMove - Sets the best move when found
 * @fires makeMove - Makes the tablebase move on the board
 * @fires addTrainingMove - Adds the move to training history
 * @fires showToast - Shows error messages if request fails
 *
 * @remarks
 * This orchestrator performs the following steps:
 * 1. Validates game state and checks if it's tablebase's turn
 * 2. Sets loading status
 * 3. Requests top moves from tablebase API
 * 4. Handles the response (move, draw, or unavailable)
 * 5. Makes the move on the board if available
 * 6. Updates training state with the tablebase move
 * 7. Handles errors gracefully with user feedback
 *
 * The orchestrator respects the three-state pattern for tablebase moves:
 * - undefined: No lookup performed
 * - null: Position is a draw
 * - string: Best move available
 *
 * @example
 * ```typescript
 * // Typical usage in a component or another orchestrator
 * await store.getState().requestTablebaseMove();
 *
 * // The orchestrator will:
 * // 1. Check if game exists and it's tablebase's turn
 * // 2. Get current FEN
 * // 3. Request moves from API
 * // 4. Make the best move if available
 * // 5. Update UI and training state
 * ```
 */
export const handleOpponentTurn: OrchestratorFunction<
  [],
  Promise<void>
> = async (api) => {
  const state = api.getState();

  // Step 1: Validate preconditions
  if (!state.game) {
    logger.warn("No game instance");
    return;
  }

  if (!state.currentPosition) {
    logger.warn("No current position");
    return;
  }

  // Check if it's tablebase's turn (opposite of training color)
  const isTablebaseTurn =
    state.game.turn() !== state.currentPosition.colorToTrain.charAt(0);
  if (!isTablebaseTurn) {
    logger.warn("Not tablebase's turn");
    return;
  }

  // Don't make moves if game is over
  if (state.isGameFinished) {
    logger.info("Game is already over");
    return;
  }

  try {
    // Step 2: Set loading state
    state.setAnalysisStatus("loading");
    state.setLoading("tablebase", true);

    // Step 3: Get current position and request moves
    const currentFen = state.currentFen;
    const topMovesResult = await tablebaseService.getTopMoves(currentFen);

    // Step 4: Handle the response
    if (!topMovesResult.isAvailable) {
      // Position not in tablebase (>7 pieces or special rules)
      state.setTablebaseMove(undefined);
      state.setAnalysisStatus("success"); // Not an error, just unavailable

      if (topMovesResult.error) {
        logger.info("Tablebase unavailable", { error: topMovesResult.error });
      }
      return;
    }

    // Check if position is a draw
    if (
      !topMovesResult.moves ||
      topMovesResult.moves.length === 0 ||
      topMovesResult.moves[0].wdl === 0
    ) {
      state.setTablebaseMove(null); // null = draw
      state.setAnalysisStatus("success");

      // Still make a move if available (even if draw)
      if (topMovesResult.moves && topMovesResult.moves.length > 0) {
        await makeTablebaseMove(api, topMovesResult.moves[0].san);
      }
      return;
    }

    // Step 5: Make the best move
    const bestMove = topMovesResult.moves[0];
    state.setTablebaseMove(bestMove.san);

    // Make the move on the board
    await makeTablebaseMove(api, bestMove.san);

    // Step 6: Success
    state.setAnalysisStatus("success");
  } catch (error) {
    // Step 7: Error handling
    logger.error("Error requesting tablebase move", error);
    state.setAnalysisStatus("error");

    const userMessage = ErrorService.handleUIError(
      error as Error,
      "RequestTablebaseMove",
      {
        action: "orchestrate",
      },
    );

    state.showToast(userMessage, "error");
  } finally {
    state.setLoading("tablebase", false);
  }
};

/**
 * Makes a tablebase move on the board and updates training state
 *
 * @param {StoreApi} api - Store API for state access and actions
 * @param {string} moveStr - Move in algebraic notation (e.g., "Nf3", "e4")
 * @returns {Promise<void>}
 *
 * @private
 *
 * @description
 * Helper function that executes a tablebase move and updates all
 * relevant state including game position and training history.
 *
 * @remarks
 * This helper function:
 * 1. Makes the move using the game slice
 * 2. Adds training metadata to the move
 * 3. Updates the training move history
 * 4. Handles move validation errors
 *
 * All tablebase moves are marked as optimal since they come from
 * perfect endgame analysis.
 *
 * @example
 * ```typescript
 * // Called internally by handleOpponentTurn
 * await makeTablebaseMove(api, "Ra8#"); // Checkmate move
 * await makeTablebaseMove(api, "Kf7"); // King move
 * ```
 */
async function makeTablebaseMove(
  api: StoreApi,
  moveStr: string,
): Promise<void> {
  const state = api.getState();

  // Make the move
  const validatedMove = state.makeMove(moveStr);

  if (!validatedMove) {
    logger.error("Failed to make tablebase move", { move: moveStr });
    state.showToast("Tablebase-Zug ungültig", "error");
    return;
  }

  // Add training metadata
  const trainingMove = {
    ...validatedMove,
    userMove: false,
    isOptimal: true, // Tablebase moves are always optimal
    isTablebaseMove: true,
  };

  // Update training state
  state.addTrainingMove(trainingMove);

  // Check if game ended after tablebase move
  if (state.isGameFinished) {
    // Training completion will be handled by makeUserMove orchestrator
    // when user makes their next move attempt
    logger.info("Game ended after tablebase move");
  }
}
