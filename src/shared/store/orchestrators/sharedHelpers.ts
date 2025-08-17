/**
 * @file Shared orchestrator helper functions
 * @module store/orchestrators/sharedHelpers
 * 
 * @description
 * Common helper functions used across multiple orchestrators to avoid code duplication
 * and maintain consistent state management patterns.
 * 
 * @remarks
 * These helpers implement the coordinated state updates that span multiple slices,
 * following the "orchestrator coordinates, slices execute" pattern.
 * Part of B5.5.5 Phase 3B refactoring to decouple slice cross-dependencies.
 */

import type { StoreApi } from './types';
import { getLogger } from '@shared/services/logging';

const logger = getLogger().setContext('OrchestratorHelpers');

/**
 * Resets training and game state in a coordinated manner
 * 
 * @param {StoreApi} api - Store API for accessing state and actions
 * 
 * @fires stateChange - Updates both training and game slices
 * 
 * @description
 * This helper centralizes the logic for resetting both training and game state,
 * eliminating cross-slice coupling where TrainingSlice directly modifies GameSlice.
 * 
 * **Coordinated Actions:**
 * 1. Calls TrainingSlice.resetPosition() - resets training-specific state
 * 2. Calls GameSlice.resetMoveHistory() - resets move history in proper slice
 * 
 * **Usage Pattern:**
 * Use this instead of calling trainingSlice.resetPosition() directly when you need
 * to reset both training context and game state.
 * 
 * @example
 * ```typescript
 * // In any orchestrator
 * import { resetTrainingAndGameState } from './sharedHelpers';
 * 
 * // Instead of this (cross-slice coupling):
 * // trainingSlice.resetPosition(); // This internally modifies game.moveHistory ❌
 * 
 * // Use this (proper orchestration):
 * resetTrainingAndGameState(api); // ✅
 * ```
 * 
 * @see {@link TrainingSlice.resetPosition} - Training state reset
 * @see {@link GameSlice.resetMoveHistory} - Game history reset
 */
export function resetTrainingAndGameState(api: StoreApi): void {
  const { getState } = api;
  const { training, game } = getState();

  logger.debug('Resetting training and game state');

  // 1. Reset training-specific state (purified - no longer touches game state)
  training.resetPosition();
  
  // 2. Reset game state via proper slice action
  game.resetMoveHistory();

  logger.info('Training and game state reset completed');
}