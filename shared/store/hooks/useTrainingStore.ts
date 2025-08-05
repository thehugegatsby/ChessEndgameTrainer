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

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type {
  RootState,
  TrainingState as TrainingStateType,
  TrainingActions as TrainingActionsType,
} from "../slices/types";
import type { AsyncActions } from "../slices/types";

// Extend training actions with relevant async actions
type ExtendedTrainingActions = TrainingActionsType &
  Pick<
    AsyncActions,
    "handlePlayerMove" | "handleOpponentTurn" | "loadTrainingContext"
  >;

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
    useShallow((state: RootState) => ({
      // Training session state
      currentPosition: state.currentPosition,
      nextPosition: state.nextPosition,
      previousPosition: state.previousPosition,
      isLoadingNavigation: state.isLoadingNavigation,
      navigationError: state.navigationError,
      chapterProgress: state.chapterProgress,
      isPlayerTurn: state.isPlayerTurn,
      isSuccess: state.isSuccess,
      sessionStartTime: state.sessionStartTime,
      sessionEndTime: state.sessionEndTime,
      hintsUsed: state.hintsUsed,
      mistakeCount: state.mistakeCount,
      moveErrorDialog: state.moveErrorDialog,
    })),
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
  return useStore((state: RootState) => ({
    // Training actions
    setPosition: state.setPosition,
    setNavigationPositions: state.setNavigationPositions,
    setNavigationLoading: state.setNavigationLoading,
    setNavigationError: state.setNavigationError,
    setChapterProgress: state.setChapterProgress,
    setPlayerTurn: state.setPlayerTurn,
    completeTraining: state.completeTraining,
    incrementHint: state.incrementHint,
    incrementMistake: state.incrementMistake,
    setMoveErrorDialog: state.setMoveErrorDialog,
    addTrainingMove: state.addTrainingMove,
    resetTraining: state.resetTraining,
    resetPosition: state.resetPosition,

    // Orchestrated actions
    handlePlayerMove: state.handlePlayerMove,
    handleOpponentTurn: state.handleOpponentTurn,
    loadTrainingContext: state.loadTrainingContext,
  }));
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
export const useTrainingStore = (): [
  TrainingStateType,
  ExtendedTrainingActions,
] => {
  return [useTrainingState(), useTrainingActions()];
};
