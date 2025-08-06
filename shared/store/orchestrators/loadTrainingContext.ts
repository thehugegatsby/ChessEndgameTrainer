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
import { getLogger } from "@shared/services/logging";
import { chessService } from "@shared/services/ChessService";

const logger = getLogger().setContext("loadTrainingContext");

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
  const { setState } = api;

  try {
    // Set loading state via setState
    setState((draft) => {
      draft.ui.loading.position = true;
    });

    // Step 1: Reset all relevant state via setState using initial states
    setState((draft) => {
      // Reset slices to their initial states - PROPERLY preserving action methods
      // CRITICAL: Reset only data properties, never overwrite the slice objects themselves
      
      // Game slice - manual property reset
      draft.game.moveHistory = [];
      draft.game.currentMoveIndex = 0;
      draft.game.isGameFinished = false;
      
      // Training slice - DO NOT RESET - Let the position loading handle training state
      
      // Tablebase slice - manual property reset
      draft.tablebase.tablebaseMove = null;
      draft.tablebase.analysisStatus = 'idle';
      draft.tablebase.evaluations = [];
      draft.tablebase.currentEvaluation = undefined;
      
      // Close any open modals
      if (draft.ui.currentModal) {
        draft.ui.currentModal = null;
      }
    })

    // Step 2: Validate FEN and initialize game state
    // Use ChessService to validate and initialize position
    const isValidFen = chessService.initialize(position.fen);
    
    if (!isValidFen) {
      throw new Error("Ungültige FEN-Position");
    }
    
    // Game state will be automatically synced via ChessService event subscription in rootStore
    // No need to manually update game state here

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

    // Step 4: Set the training position and player turn
    // Get turn from ChessService
    const currentTurn = chessService.turn();
    const isPlayerTurn =
      currentTurn === trainingPosition.colorToTrain.charAt(0);
    
    setState((draft) => {
      draft.training.currentPosition = trainingPosition;
      draft.training.isPlayerTurn = isPlayerTurn;
    })

    // Step 6: Request initial tablebase analysis if it's not player's turn
    if (!isPlayerTurn) {
      // Tablebase needs to make the first move
      // This is now handled by the training components
      logger.debug("Opponent's turn - should be handled by component");
    } else {
      // Position evaluation now handled by components using chessService
      logger.debug("Player's turn - evaluation handled by component");
    }

    // Step 7: Position progress tracking removed (was unused in UI)

    // Step 8: Show success message
    setState((draft) => {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: `Position geladen: ${position.title}`,
        type: "success",
        duration: 2000,
      });
    })
  } catch (error) {
    // Handle errors
    const errorMessage =
      error instanceof Error ? error.message : "Fehler beim Laden der Position";

    // Show error and reset state
    setState((draft) => {
      // Show error toast
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: errorMessage,
        type: "error",
        duration: 5000,
      });
      
      // Reset slices to initial states on error - PROPERLY preserving action methods
      // Game slice - manual property reset
      draft.game.moveHistory = [];
      draft.game.currentMoveIndex = 0;
      draft.game.isGameFinished = false;
      
      // Training slice - DO NOT RESET - Let the position loading handle training state
    })
  } finally {
    // Clear loading state
    setState((draft) => {
      draft.ui.loading.position = false;
    });
  }
};