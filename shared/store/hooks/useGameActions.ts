/**
 * @file Game slice action hooks
 * @module store/hooks/useGameActions
 *
 * @description
 * Provides access to game-related actions from the Zustand store.
 * Actions are stable references and don't require useShallow.
 */

import { useStore } from "../rootStore";

/**
 * Hook for game-related actions
 *
 * @description
 * Provides all actions related to game state management including
 * position updates, move handling, and navigation.
 *
 * @returns {Object} Game actions
 *
 * @example
 * ```tsx
 * const { resetPosition, makeMove, goToMove } = useGameActions();
 *
 * // Reset game to initial position
 * resetPosition();
 *
 * // Make a move
 * const result = makeMove({ from: 'e2', to: 'e4' });
 *
 * // Navigate to specific move
 * goToMove(5);
 * ```
 */
export const useGameActions = () =>
  useStore((state) => ({
    // State management
    setGame: state.setGame,
    updatePosition: state.updatePosition,
    addMove: state.addMove,
    setMoveHistory: state.setMoveHistory,
    setCurrentMoveIndex: state.setCurrentMoveIndex,
    setGameFinished: state.setGameFinished,
    resetGame: state.resetGame,

    // Game operations
    initializeGame: state.initializeGame,
    makeMove: state.makeMove,
    undoMove: state.undoMove,
    redoMove: state.redoMove,

    // Navigation
    goToMove: state.goToMove,
    goToFirst: state.goToFirst,
    goToPrevious: state.goToPrevious,
    goToNext: state.goToNext,
    goToLast: state.goToLast,

    // Additional
    setCurrentFen: state.setCurrentFen,
    resetPosition: state.resetPosition,
  }));
