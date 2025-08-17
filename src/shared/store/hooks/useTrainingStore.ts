/**
 * @file Training store hooks with state/action separation
 * @module store/hooks/useTrainingStore
 *
 * @description
 * Provides optimized hooks for training-related state and actions with proper separation.
 * This pattern prevents unnecessary re-renders in action-only components while
 * maintaining excellent developer experience.
 *
 * Three hooks are exported:
 * - useTrainingState(): For components that need reactive state
 * - useTrainingActions(): For components that only dispatch actions (no re-renders)
 * - useTrainingStore(): Convenience hook returning [state, actions] tuple
 */

import { useMemo } from 'react';
import { useStore, useStoreApi } from '../StoreContext';
import { useShallow } from 'zustand/react/shallow';
import type {
  RootState,
  TrainingState as TrainingStateType,
  TrainingActions as TrainingActionsType,
} from '../slices/types';
import type { AsyncActions } from '../slices/types';

// Extend training actions with relevant async actions
type ExtendedTrainingActions = TrainingActionsType &
  Pick<AsyncActions, 'handlePlayerMove' | 'loadTrainingContext'>;

/**
 * Hook for reactive training state properties
 *
 * @description
 * Subscribes components to training state changes. Use this in components
 * that need to display or react to training data. Will re-render when any
 * selected training state changes.
 *
 * @returns {TrainingStateType} Training state properties
 *
 * @example
 * ```tsx
 * const { currentPosition, isPlayerTurn, mistakeCount } = useTrainingState();
 *
 * // Component will re-render when these values change
 * return <div>Mistakes: {mistakeCount}</div>;
 * ```
 */
export const useTrainingState = (): TrainingStateType => {
  return useStore(
    useShallow((state: RootState) => {
      const result: Partial<TrainingStateType> = {
        isLoadingNavigation: state.training.isLoadingNavigation,
        navigationError: state.training.navigationError,
        chapterProgress: state.training.chapterProgress,
        isPlayerTurn: state.training.isPlayerTurn,
        isOpponentThinking: state.training.isOpponentThinking,
        isSuccess: state.training.isSuccess,
        hintsUsed: state.training.hintsUsed,
        mistakeCount: state.training.mistakeCount,
        currentStreak: state.training.currentStreak,
        bestStreak: state.training.bestStreak,
        showCheckmark: state.training.showCheckmark,
        autoProgressEnabled: state.training.autoProgressEnabled,
        moveErrorDialog: state.training.moveErrorDialog,
        moveSuccessDialog: state.training.moveSuccessDialog,
      };

      // Only add optional properties if they have defined values
      if (state.training.currentPosition !== undefined) {
        result.currentPosition = state.training.currentPosition;
      }
      if (state.training.nextPosition !== undefined && state.training.nextPosition !== null) {
        result.nextPosition = state.training.nextPosition;
      }
      if (
        state.training.previousPosition !== undefined &&
        state.training.previousPosition !== null
      ) {
        result.previousPosition = state.training.previousPosition;
      }
      if (state.training.evaluationBaseline !== null) {
        result.evaluationBaseline = state.training.evaluationBaseline;
      }

      return result as TrainingStateType;
    })
  );
};

/**
 * Hook for training action functions
 *
 * @description
 * Returns stable action functions that never cause re-renders.
 * Use this in components that only need to trigger training actions
 * without subscribing to state changes.
 *
 * @returns {ExtendedTrainingActions} Training action functions
 *
 * @example
 * ```tsx
 * const { completeTraining, incrementHint } = useTrainingActions();
 *
 * // This component will never re-render due to training state changes
 * return <button onClick={incrementHint}>Use Hint</button>;
 * ```
 */
export const useTrainingActions = (): ExtendedTrainingActions => {
  // Get actions dynamically to ensure they exist
  const storeApi = useStoreApi();
  return useMemo(() => {
    const state = storeApi.getState();

    // Clean access: actions are directly available in training slice
    return {
      // Training actions - directly from slice (no CRITICAL FIX workaround needed)
      setPosition: state.training.setPosition,
      setNavigationPositions: state.training.setNavigationPositions,
      setNavigationLoading: state.training.setNavigationLoading,
      setNavigationError: state.training.setNavigationError,
      setChapterProgress: state.training.setChapterProgress,
      setPlayerTurn: state.training.setPlayerTurn,
      clearOpponentThinking: state.training.clearOpponentThinking,
      completeTraining: state.training.completeTraining,
      incrementHint: state.training.incrementHint,
      incrementMistake: state.training.incrementMistake,
      setMoveErrorDialog: state.training.setMoveErrorDialog,
      setMoveSuccessDialog: state.training.setMoveSuccessDialog,
      resetTraining: state.training.resetTraining,
      resetPosition: state.training.resetPosition,
      setEvaluationBaseline: state.training.setEvaluationBaseline,
      clearEvaluationBaseline: state.training.clearEvaluationBaseline,

      // Streak actions
      incrementStreak: state.training.incrementStreak,
      resetStreak: state.training.resetStreak,
      showCheckmarkAnimation: state.training.showCheckmarkAnimation,
      setAutoProgressEnabled: state.training.setAutoProgressEnabled,

      // Delegate actions for orchestrator
      evaluateMoveQuality: state.training.evaluateMoveQuality,

      // Orchestrated actions (from root level)
      handlePlayerMove: state.handlePlayerMove,
      loadTrainingContext: state.loadTrainingContext,
    };
  }, [storeApi]);
};

/**
 * Convenience hook for components that need both state and actions
 *
 * @description
 * Returns a tuple of [state, actions] for components that need both.
 * This maintains the familiar pattern while benefiting from the
 * optimized separation under the hood.
 *
 * @returns {[TrainingStateType, ExtendedTrainingActions]} Tuple of training state and actions
 *
 * @example
 * ```tsx
 * const [trainingState, trainingActions] = useTrainingStore();
 *
 * const handleMove = async (move: string) => {
 *   if (trainingState.isPlayerTurn) {
 *     await trainingActions.handlePlayerMove(move);
 *   }
 * };
 * ```
 */
export const useTrainingStore = (): [TrainingStateType, ExtendedTrainingActions] => {
  return [useTrainingState(), useTrainingActions()];
};
