/**
 * @file Consolidated game store hook
 * @module store/hooks/useGameStore
 *
 * @description
 * Provides unified access to game-related state and actions from the Zustand store.
 * This consolidated hook replaces multiple small hooks for better ergonomics
 * and avoids naming conflicts. Uses useShallow for optimal performance.
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type { RootState } from "../slices/types";

/**
 * Hook for pure game state and actions (chess logic only)
 *
 * @description
 * Focused hook for chess game functionality including board state,
 * move history, and game operations. This hook is optimized for
 * performance by only subscribing to game-related state changes.
 *
 * For other domains use:
 * - useTrainingStore() for training session state
 * - useTablebaseStore() for analysis/evaluation data
 * - useUIStore() for interface state
 *
 * @returns {Object} Game state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // Pure game state
 *   currentFen,
 *   moveHistory,
 *   isGameFinished,
 *
 *   // Game actions
 *   makeMove,
 *   resetGame,
 *   goToMove,
 * } = useGameStore();
 *
 * // For better performance, use direct selectors for single values
 * const currentFen = useStore(state => state.currentFen);
 * const makeMove = useStore(state => state.makeMove);
 * ```
 */
export const useGameStore = () => {
  return useStore(
    useShallow((state: RootState) => ({
      // === Pure Game State ===
      game: state.game,
      currentFen: state.currentFen,
      currentPgn: state.currentPgn,
      moveHistory: state.moveHistory,
      currentMoveIndex: state.currentMoveIndex,
      isGameFinished: state.isGameFinished,
      gameResult: state.gameResult,

      // === Pure Game Actions ===
      setGame: state.setGame,
      updatePosition: state.updatePosition,
      makeMove: state.makeMove,
      resetGame: state.resetGame,
      undoMove: state.undoMove,
      redoMove: state.redoMove,

      // === Navigation Actions ===
      goToMove: state.goToMove,
      goToFirst: state.goToFirst,
      goToPrevious: state.goToPrevious,
      goToNext: state.goToNext,
      goToLast: state.goToLast,
      setCurrentFen: state.setCurrentFen,
    })),
  );
};
