/**
 * @file Load training context orchestrator - refactored thin coordinator
 * @module store/orchestrators/loadTrainingContext
 *
 * @description
 * Thin orchestrator that coordinates loading a complete training context.
 * Follows Single Responsibility Principle by delegating to focused orchestrators:
 * - Position loading: delegated to loadPosition orchestrator
 * - Navigation loading: delegated to loadNavigation orchestrator
 * - Tablebase analysis: handled by components (no longer orchestrated here)
 *
 * @remarks
 * This orchestrator is the main entry point for starting a training session.
 * After refactoring, it's now a thin coordinator that:
 * - Delegates position loading to loadPosition (SRP-compliant)
 * - Delegates navigation loading to loadNavigation (SRP-compliant)
 * - Handles high-level coordination and error management
 *
 * The orchestrator ensures proper order of operations:
 * 1. Load position first (core functionality)
 * 2. Load navigation in parallel (enhancement, non-blocking)
 *
 * @example
 * ```typescript
 * // In a component
 * const loadContext = useStore(state => state.loadTrainingContext);
 *
 * await loadContext(endgamePosition);
 * // Position loaded, navigation loaded, ready for training
 * ```
 */

import type { StoreApi } from './types';
import type { EndgamePosition } from '@shared/types/endgame';
import { getLogger } from '@shared/services/logging';
import { loadPosition } from './loadPosition';
import { loadNavigation } from './loadNavigation';

const logger = getLogger().setContext('loadTrainingContext');

/**
 * Loads complete training context by coordinating focused orchestrators
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @param {EndgamePosition} position - The endgame position to load
 * @returns {Promise<void>}
 *
 * @fires stateChange - Coordinates updates across multiple slices via orchestrators
 *
 * @description
 * Thin coordinator that delegates to focused, SRP-compliant orchestrators.
 * Ensures proper order of operations for complete training setup.
 *
 * @remarks
 * This refactored orchestrator follows the delegation pattern:
 * 1. **loadPosition**: Handles position loading, game state, training setup
 * 2. **loadNavigation**: Handles navigation positions (next/prev) in parallel
 *
 * Key architectural improvements:
 * - **SRP Compliance**: Each orchestrator has a single responsibility
 * - **Error Isolation**: Position loading and navigation loading are independent
 * - **Non-blocking**: Navigation loading doesn't block position loading
 * - **Root Cause Fix**: Navigation NEVER overwrites current position
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
 * // Position loaded via loadPosition, navigation loaded via loadNavigation
 * ```
 */
export const loadTrainingContext = async (
  api: StoreApi,
  position: EndgamePosition
): Promise<void> => {
  logger.info('Starting training context loading', {
    positionId: position.id,
    title: position.title,
  });

  try {
    // Step 1: Load the position using focused loadPosition orchestrator
    // This handles: position validation, game state setup, training position creation
    logger.info('Delegating to loadPosition orchestrator');
    await loadPosition(api, position);

    // Step 2: Load navigation in parallel (non-blocking)
    // This handles: next/previous position loading, error isolation
    logger.info('Delegating to loadNavigation orchestrator (non-blocking)');
    
    // Run navigation loading in background - don't wait for it
    // This ensures position loading completes quickly for user interaction
    loadNavigation(api, position).catch(error => {
      // Navigation errors are already handled in loadNavigation
      // This catch prevents unhandled promise rejection
      logger.debug('Navigation loading completed with error (handled)', { error });
    });

    logger.info('Training context loading completed successfully', {
      positionId: position.id,
    });

  } catch (error) {
    // Handle errors from position loading (critical path)
    const errorMessage = error instanceof Error ? error.message : 'Fehler beim Laden des Trainings-Kontexts';

    logger.error('Training context loading failed', {
      error: errorMessage,
      positionId: position.id,
    });

    // Error handling is already done in loadPosition orchestrator
    // Re-throw to allow caller to handle if needed
    throw error;
  }
};
