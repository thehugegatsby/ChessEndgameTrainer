/**
 * @file Load navigation orchestrator - focused on navigation loading only
 * @module store/orchestrators/loadNavigation
 *
 * @description
 * Focused orchestrator that ONLY handles loading navigation positions (next/previous).
 * Follows Single Responsibility Principle by separating concerns:
 * - Navigation position loading (async operations)
 * - EndgamePosition to TrainingPosition conversion
 * - Navigation state management (loading states, error handling)
 * 
 * Does NOT handle:
 * - Position loading (use loadPosition)
 * - Game state initialization
 * - Training session setup
 * - Tablebase analysis triggering
 *
 * @remarks
 * This is part of the architectural healing (Weg B) to fix SRP violation
 * in the monolithic loadTrainingContext orchestrator.
 *
 * @example
 * ```typescript
 * import { loadNavigation } from './loadNavigation';
 * 
 * await loadNavigation(api, currentPosition);
 * // Navigation positions loaded, ready for prev/next buttons
 * ```
 */

import type { StoreApi } from './types';
import type { EndgamePosition } from '@shared/types/endgame';
import type { TrainingPosition } from '../slices/trainingSlice';
import { getLogger } from '@shared/services/logging';
import { getServerPositionService } from '@shared/services/database/serverPositionService';

const logger = getLogger().setContext('loadNavigation');

/**
 * Helper function to convert EndgamePosition to TrainingPosition
 *
 * @param {EndgamePosition | null} pos - Position to convert
 * @returns {TrainingPosition | null} Converted training position
 *
 * @description
 * Converts an EndgamePosition to TrainingPosition by adding training-specific fields.
 * Returns null if input is null (no position available).
 */
const convertToTrainingPosition = (pos: EndgamePosition | null): TrainingPosition | null => {
  if (!pos) return null;

  // Check if already a TrainingPosition
  const isTrainingPosition = (p: EndgamePosition): p is TrainingPosition => {
    return 'colorToTrain' in p && 'targetOutcome' in p;
  };

  if (isTrainingPosition(pos)) return pos;

  // Convert EndgamePosition to TrainingPosition
  return {
    ...pos,
    colorToTrain: pos.sideToMove || 'white',
    targetOutcome: (() => {
      if (pos.goal === 'win') {
        return pos.sideToMove === 'white' ? '1-0' : '0-1';
      }
      if (pos.goal === 'draw') {
        return '1/2-1/2';
      }
      return '1-0'; // Default to win for white
    })(),
  };
};

/**
 * Loads navigation positions (next/previous) for the current position
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @param {EndgamePosition} currentPosition - The current position to find navigation for
 * @returns {Promise<void>}
 *
 * @fires stateChange - Updates training slice with navigation data
 *
 * @description
 * Focused orchestrator that only handles navigation loading responsibilities:
 * 1. Sets navigation loading state
 * 2. Fetches next and previous positions in parallel
 * 3. Converts positions to TrainingPosition format
 * 4. Updates training slice with navigation data
 * 5. Handles errors gracefully (navigation is non-critical)
 *
 * This orchestrator deliberately does NOT:
 * - Modify the current position - CRITICAL: Navigation never overwrites current position
 * - Initialize game state
 * - Set up training session
 * - Trigger any analysis or moves
 *
 * @throws {Error} Only logs errors, does not throw (navigation is non-critical)
 *
 * @example
 * ```typescript
 * const currentPosition: EndgamePosition = {
 *   id: 5,
 *   title: "King and Queen vs King",
 *   fen: "8/8/8/8/8/8/Q7/K3k3 w - - 0 1",
 *   category: "basic-checkmates",
 *   difficulty: "beginner",
 *   sideToMove: "white",
 *   goal: "win"
 * };
 *
 * await loadNavigation(api, currentPosition);
 * // Navigation loaded: prev/next buttons can now be enabled
 * ```
 */
export const loadNavigation = async (
  api: StoreApi,
  currentPosition: EndgamePosition
): Promise<void> => {
  const { setState } = api;

  // Step 1: Set loading state for navigation
  setState(draft => {
    draft.training.isLoadingNavigation = true;
    draft.training.navigationError = null;
  });

  try {
    logger.info('Loading navigation positions', {
      currentId: currentPosition.id,
      category: currentPosition.category,
    });

    // Step 2: Load navigation positions in parallel
    const positionService = getServerPositionService();
    const [nextPos, prevPos] = await Promise.all([
      positionService.getNextPosition(currentPosition.id, currentPosition.category),
      positionService.getPreviousPosition(currentPosition.id, currentPosition.category),
    ]);

    // Step 3: Convert to TrainingPosition format
    const nextTrainingPos = convertToTrainingPosition(nextPos);
    const prevTrainingPos = convertToTrainingPosition(prevPos);

    // Step 4: Update navigation positions in training slice
    // CRITICAL: Never overwrite currentPosition - only update navigation
    setState(draft => {
      draft.training.nextPosition = nextTrainingPos;
      draft.training.previousPosition = prevTrainingPos;
      draft.training.isLoadingNavigation = false;
      draft.training.navigationError = null;
    });

    logger.info('Navigation positions loaded successfully', {
      nextId: nextPos?.id,
      nextTitle: nextPos?.title,
      prevId: prevPos?.id,
      prevTitle: prevPos?.title,
    });

  } catch (error) {
    // Step 5: Handle errors gracefully (navigation is non-critical)
    const errorMessage = error instanceof Error ? error.message : 'Failed to load navigation';
    
    logger.warn('Failed to load navigation positions', {
      error: errorMessage,
      currentPositionId: currentPosition.id,
    });

    // Set error state but don't throw - navigation failure shouldn't break training
    setState(draft => {
      draft.training.nextPosition = null;
      draft.training.previousPosition = null;
      draft.training.isLoadingNavigation = false;
      draft.training.navigationError = errorMessage;
    });

    // Note: We don't throw here because navigation is non-critical
    // The main position loading should continue even if navigation fails
  }
};