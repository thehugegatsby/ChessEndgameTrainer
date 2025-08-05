/**
 * @file Load training context orchestrator
 * @module store/orchestrators/loadTrainingContext
 * 
 * @description
 * Orchestrates loading a training position across game, training, and UI slices.
 * Sets up the complete training environment for a new endgame position.
 * 
 * @remarks
 * This orchestrator is the main entry point for starting a training session.
 * It coordinates multiple slices to ensure proper initialization:
 * - Resets previous state to avoid conflicts
 * - Initializes chess.js with the position
 * - Configures training parameters
 * - Sets up initial turn order
 * - Requests initial analysis
 * - Tracks position progress
 * 
 * The orchestrator handles both player-first and opponent-first scenarios,
 * automatically triggering the appropriate initial move or analysis.
 *
 * @example
 * ```typescript
 * // In a component
 * const loadContext = useStore(state => state.loadTrainingContext);
 *
 * await loadContext(endgamePosition);
 * ```
 */

import type { StoreApi } from "./types";
import type { EndgamePosition } from "@shared/types/endgame";
import type { TrainingPosition } from "../slices/trainingSlice";

/**
 * Loads training context for a position
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @param {EndgamePosition} position - The endgame position to load
 * @returns {Promise<void>}
 *
 * @fires stateChange - Updates game, training, tablebase, progress, and UI slices
 * @fires tablebaseRequest - May trigger initial opponent move or position evaluation
 *
 * @description
 * Main orchestrator for initializing a complete training session.
 * Ensures all state is properly reset and configured for the new position.
 *
 * @remarks
 * This orchestrator performs the following steps:
 * 1. Resets training state to clean slate
 * 2. Initializes chess game with position FEN
 * 3. Sets up training position with metadata
 * 4. Determines initial turn based on position
 * 5. Clears any previous tablebase data
 * 6. Resets UI state for new session
 * 7. Initializes progress tracking
 * 8. Triggers initial move/analysis as needed
 * 
 * The orchestrator gracefully handles errors by resetting to a clean state
 * and showing user-friendly error messages.
 * 
 * TrainingPosition extends EndgamePosition with:
 * - colorToTrain: Which color the user is playing
 * - targetOutcome: Expected result ("1-0", "0-1", "1/2-1/2")
 * - timeLimit: Optional time constraint
 * - chapterId: If part of a training chapter
 *
 * @example
 * ```typescript
 * const position: EndgamePosition = {
 *   id: 1,
 *   title: "King and Rook vs King",
 *   fen: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
 *   category: "basic-checkmates",
 *   difficulty: "beginner",
 *   sideToMove: "white",
 *   goal: "win"
 * };
 *
 * await loadTrainingContext(api, position);
 * // Game is now ready for training
 * ```
 */
export const loadTrainingContext = async (
  api: StoreApi,
  position: EndgamePosition,
): Promise<void> => {
  const { getState } = api;
  const state = getState();

  try {
    // Set loading state
    state.setLoading("position", true);

    // Step 1: Reset all relevant state
    state.resetGame();
    state.resetTraining();
    state.clearTablebaseState();

    // Close any open modals
    if (state.modalOpen) {
      state.closeModal();
    }

    // Step 2: Initialize the chess game
    const game = state.initializeGame(position.fen);
    if (!game) {
      throw new Error("Ungültige FEN-Position");
    }

    // Step 3: Create TrainingPosition from EndgamePosition
    const trainingPosition: TrainingPosition = {
      ...position,
      // Add training-specific fields with sensible defaults if not already present
      colorToTrain:
        (position as any).colorToTrain || position.sideToMove || "white",
      targetOutcome:
        (position as any).targetOutcome ||
        (position.goal === "win"
          ? position.sideToMove === "white"
            ? "1-0"
            : "0-1"
          : position.goal === "draw"
            ? "1/2-1/2"
            : "1-0"), // Default to win for white
      timeLimit: (position as any).timeLimit || undefined, // No time limit by default
      chapterId: (position as any).chapterId || undefined, // Will be set if part of a chapter
    };

    // Step 4: Set the training position
    state.setPosition(trainingPosition);

    // Step 5: Initialize player turn
    // Player's turn if the side to move matches the color they're training
    const isPlayerTurn =
      game.turn() === trainingPosition.colorToTrain.charAt(0);
    state.setPlayerTurn(isPlayerTurn);

    // Step 6: Request initial tablebase analysis if it's not player's turn
    if (!isPlayerTurn) {
      // Tablebase needs to make the first move
      setTimeout(async () => {
        await api.getState().handleOpponentTurn();
      }, 500);
    } else {
      // Get position evaluation for the player
      setTimeout(async () => {
        await api.getState().requestPositionEvaluation();
      }, 300);
    }

    // Step 7: Initialize position progress if not exists
    if (!state.positionProgress[position.id]) {
      state.updatePositionProgress(position.id, {
        positionId: position.id,
        attempts: 0,
        completed: false,
        accuracy: 0,
        lastAttempt: Date.now(),
        difficulty:
          position.difficulty === "beginner"
            ? 1
            : position.difficulty === "intermediate"
              ? 2
              : position.difficulty === "advanced"
                ? 3
                : 4,
      });
    }

    // Step 8: Show success message
    state.showToast(`Position geladen: ${position.title}`, "success", 2000);
  } catch (error) {
    // Handle errors
    const errorMessage =
      error instanceof Error ? error.message : "Fehler beim Laden der Position";

    state.showToast(errorMessage, "error");

    // Reset to clean state on error
    state.resetGame();
    state.resetTraining();
  } finally {
    // Clear loading state
    state.setLoading("position", false);
  }
};
