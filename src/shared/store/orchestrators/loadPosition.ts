/**
 * @file Load position orchestrator - focused on position loading only
 * @module store/orchestrators/loadPosition
 *
 * @description
 * Focused orchestrator that ONLY handles loading a chess position.
 * Follows Single Responsibility Principle by separating concerns:
 * - Position validation and setup
 * - Game state initialization
 * - Training position setup
 * 
 * Does NOT handle:
 * - Navigation loading (prev/next positions)
 * - Tablebase analysis triggering
 * - UI state management beyond position-specific needs
 *
 * @remarks
 * This is part of the architectural healing (Weg B) to fix E2E test issues
 * caused by the monolithic loadTrainingContext orchestrator.
 *
 * @example
 * ```typescript
 * import { loadPosition } from './loadPosition';
 * 
 * await loadPosition(api, endgamePosition);
 * // Position is loaded, game state is ready
 * // Navigation and analysis need separate calls
 * ```
 */

import type { StoreApi } from './types';
import type { EndgamePosition } from '@shared/types/endgame';
import type { TrainingPosition } from '../slices/trainingSlice';
import { getLogger } from '@shared/services/logging';
import { isValidFen, turn } from '@shared/utils/chess-logic';

const logger = getLogger().setContext('loadPosition');

/**
 * Loads and sets up a chess position in the store
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @param {EndgamePosition} position - The endgame position to load
 * @returns {Promise<void>}
 *
 * @fires stateChange - Updates game and training slices with position data
 *
 * @description
 * Focused orchestrator that only handles position loading responsibilities:
 * 1. Validates FEN position
 * 2. Resets game state to clean slate
 * 3. Sets current position and FEN
 * 4. Creates training position with metadata
 * 5. Determines player turn based on position
 * 6. Shows position loaded toast
 *
 * This orchestrator deliberately does NOT:
 * - Load navigation positions (prev/next) - use loadNavigation()
 * - Trigger tablebase analysis - use triggerTablebaseAnalysis()
 * - Handle complex UI state - components should handle this
 *
 * @throws {Error} When FEN position is invalid
 *
 * @example
 * ```typescript
 * const position: EndgamePosition = {
 *   id: 1,
 *   title: "King and Pawn vs King",
 *   fen: "8/8/8/8/8/8/P7/K3k3 w - - 0 1",
 *   category: "basic-endgames",
 *   difficulty: "beginner",
 *   sideToMove: "white",
 *   goal: "win"
 * };
 *
 * await loadPosition(api, position);
 * // Game is ready for moves, training state is set
 * ```
 */
export const loadPosition = (
  api: StoreApi,
  position: EndgamePosition
): Promise<void> => {
  const { setState } = api;

  return new Promise<void>((resolve, reject) => {
  try {
    // Set loading state
    setState(draft => {
      draft.ui.loading.position = true;
    });

    // Step 1: Validate FEN position
    if (!isValidFen(position.fen)) {
      throw new Error('Ungültige FEN-Position');
    }

    logger.info('Loading position', {
      id: position.id,
      title: position.title,
      fen: position.fen,
    });

    // Step 2: Reset game state to clean slate
    setState(draft => {
      // Game slice - manual property reset for clean state
      draft.game.moveHistory = [];
      draft.game.currentMoveIndex = -1; // -1 means starting position (no moves played)
      draft.game.isGameFinished = false;
      draft.game.gameResult = null;

      // Set the new position
      draft.game.currentFen = position.fen;
      draft.game.currentPgn = '';
      // CRITICAL FIX: Set startingFen to training position so undoMove returns to correct position
      draft.game.startingFen = position.fen;

      // Clear any open modals that might interfere
      if (draft.ui.currentModal) {
        draft.ui.currentModal = null;
      }
    });

    // Step 3: Create TrainingPosition from EndgamePosition
    const isTrainingPosition = (pos: EndgamePosition): pos is TrainingPosition => {
      return 'colorToTrain' in pos && 'targetOutcome' in pos;
    };

    const trainingPosition: TrainingPosition = isTrainingPosition(position)
      ? position
      : {
          ...position,
          // Add training-specific fields with sensible defaults
          colorToTrain: position.sideToMove || 'white',
          targetOutcome: (() => {
            if (position.goal === 'win') {
              return position.sideToMove === 'white' ? '1-0' : '0-1';
            }
            if (position.goal === 'draw') {
              return '1/2-1/2';
            }
            return '1-0'; // Default to win for white
          })(),
        };

    // Step 4: Set training position and determine player turn
    const currentTurn = turn(position.fen);
    const isPlayerTurn = currentTurn === trainingPosition.colorToTrain.charAt(0);

    setState(draft => {
      logger.info('Setting training position', {
        positionId: trainingPosition.id,
        colorToTrain: trainingPosition.colorToTrain,
        isPlayerTurn,
      });

      draft.training.currentPosition = trainingPosition;
      draft.training.isPlayerTurn = isPlayerTurn;

      // Clear any previous navigation data (will be loaded separately if needed)
      draft.training.nextPosition = null;
      draft.training.previousPosition = null;
      draft.training.isLoadingNavigation = false;
      draft.training.navigationError = null;
    });

    // Step 5: Show success message
    setState(draft => {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: `Position geladen: ${position.title}`,
        type: 'success',
        duration: 2000,
      });
    });

    logger.info('Position loaded successfully', {
      id: position.id,
      title: position.title,
      isPlayerTurn,
    });

    resolve(); // Success

  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : 'Fehler beim Laden der Position';

    logger.error('Failed to load position', {
      error: errorMessage,
      position: { id: position.id, title: position.title },
    });

    // Show error and reset to clean state
    setState(draft => {
      // Show error toast
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: errorMessage,
        type: 'error',
        duration: 5000,
      });

      // Reset to clean state on error
      draft.game.moveHistory = [];
      draft.game.currentMoveIndex = -1;
      draft.game.isGameFinished = false;
      draft.game.gameResult = null;
    });

    reject(error); // Propagate error
  } finally {
    // Clear loading state
    setState(draft => {
      draft.ui.loading.position = false;
    });
  }
  });
};