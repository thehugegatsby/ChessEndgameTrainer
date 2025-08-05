/**
 * @file Consolidated training store hook
 * @module store/hooks/useTrainingStore
 *
 * @description
 * Provides unified access to training-related state and actions from the Zustand store.
 * This consolidated hook focuses on training session management, navigation,
 * and user progress tracking. Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type { RootState } from "../slices/types";

/**
 * Hook for comprehensive training state and actions
 *
 * @description
 * Central hook for training session functionality including position
 * management, navigation between positions, progress tracking, and
 * orchestrated actions like player moves and opponent responses.
 *
 * @returns {Object} Training state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // State
 *   currentPosition,
 *   previousPosition,
 *   nextPosition,
 *   isLoadingNavigation,
 *
 *   // Actions
 *   loadTrainingContext,
 *   completeTraining,
 *   handlePlayerMove,
 * } = useTrainingStore();
 *
 * // Load new position
 * useEffect(() => {
 *   if (position) {
 *     loadTrainingContext(position);
 *   }
 * }, [position, loadTrainingContext]);
 * ```
 */
export const useTrainingStore = () => {
  return useStore(
    useShallow((state: RootState) => ({
      // === Training State ===
      currentPosition: state.currentPosition,
      sessionStartTime: state.sessionStartTime,
      sessionEndTime: state.sessionEndTime,
      isSuccess: state.isSuccess,
      hintsUsed: state.hintsUsed,
      mistakeCount: state.mistakeCount,
      isPlayerTurn: state.isPlayerTurn,

      // === Navigation State ===
      previousPosition: state.previousPosition,
      nextPosition: state.nextPosition,
      isLoadingNavigation: state.isLoadingNavigation,

      // === Training Actions ===
      setPosition: state.setPosition,
      loadTrainingContext: state.loadTrainingContext,
      completeTraining: state.completeTraining,
      incrementMistake: state.incrementMistake,
      useHint: state.useHint,

      // === Navigation Actions ===
      setNavigationPositions: state.setNavigationPositions,

      // === Orchestrated Actions ===
      handlePlayerMove: state.handlePlayerMove,
      handleOpponentTurn: state.handleOpponentTurn,
    })),
  );
};
