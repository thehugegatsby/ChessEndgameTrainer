/**
 * @file Training navigation state hook
 * @module store/hooks/useTrainingNavigationState
 *
 * @description
 * Task-oriented hook providing navigation state for training UI
 * components. Combines state from multiple slices for comprehensive
 * navigation functionality. Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";

/**
 * Hook for training navigation state
 *
 * @description
 * Provides all state needed for navigation through training positions
 * and move history. Combines data from game, training, and UI slices
 * to provide a complete navigation context.
 *
 * @returns {Object} Navigation state
 * @returns {EndgamePosition} currentPosition - Active training position
 * @returns {string} currentFen - Current board state
 * @returns {string} currentPgn - Game notation
 * @returns {ValidatedMove[]} moveHistory - Move history array
 * @returns {number} currentMoveIndex - Current position in history
 * @returns {EndgamePosition} previousPosition - Previous training position
 * @returns {EndgamePosition} nextPosition - Next training position
 * @returns {boolean} isLoadingNavigation - Navigation loading state
 * @returns {boolean} hasPreviousMove - Can go back in history
 * @returns {boolean} hasNextMove - Can go forward in history
 *
 * @example
 * ```tsx
 * const {
 *   currentMoveIndex,
 *   moveHistory,
 *   hasNextMove,
 *   hasPreviousMove,
 *   nextPosition
 * } = useTrainingNavigationState();
 *
 * return (
 *   <NavigationBar
 *     canGoBack={hasPreviousMove}
 *     canGoForward={hasNextMove}
 *     canGoToNextPosition={!!nextPosition}
 *   />
 * );
 * ```
 */
export const useTrainingNavigationState = () =>
  useStore(
    useShallow((state) => ({
      // Current position data
      currentPosition: state.currentPosition,
      currentFen: state.currentFen,
      currentPgn: state.currentPgn,

      // Move history navigation
      moveHistory: state.moveHistory,
      currentMoveIndex: state.currentMoveIndex,

      // Position navigation
      previousPosition: state.previousPosition,
      nextPosition: state.nextPosition,
      isLoadingNavigation: state.isLoadingNavigation,

      // Computed navigation states
      hasPreviousMove: state.currentMoveIndex > -1,
      hasNextMove: state.currentMoveIndex < state.moveHistory.length - 1,
    })),
  );
