/**
 * @file Game store hooks with state/action separation
 * @module store/hooks/useGameStore
 *
 * @description
 * Provides optimized hooks for game-related state and actions with proper separation.
 * This pattern prevents unnecessary re-renders in action-only components while
 * maintaining excellent developer experience.
 *
 * Three hooks are exported:
 * - useGameState(): For components that need reactive state
 * - useGameActions(): For components that only dispatch actions (no re-renders)
 * - useGameStore(): Convenience hook returning [state, actions] tuple
 */

import { useStore } from "../rootStore";
import { useShallow } from "zustand/react/shallow";
import type {
  RootState,
  GameState as GameStateType,
  GameActions as GameActionsType,
} from "../slices/types";

/**
 * Hook for reactive game state properties
 *
 * @description
 * Subscribes components to game state changes. Use this in components
 * that need to display or react to game data. Will re-render when any
 * selected game state changes.
 *
 * @returns {GameStateType} Game state properties
 *
 * @example
 * ```tsx
 * const { currentFen, moveHistory, isGameFinished } = useGameState();
 *
 * // Component will re-render when these values change
 * return <div>Position: {currentFen}</div>;
 * ```
 */
export const useGameState = (): GameStateType => {
  return useStore(
    useShallow((state: RootState) => ({
      // Pure game state
      game: state.game,
      currentFen: state.currentFen,
      currentPgn: state.currentPgn,
      moveHistory: state.moveHistory,
      currentMoveIndex: state.currentMoveIndex,
      isGameFinished: state.isGameFinished,
      gameResult: state.gameResult,
    })),
  );
};

/**
 * Hook for game action functions
 *
 * @description
 * Returns stable action functions that never cause re-renders.
 * Use this in components that only need to trigger game actions
 * without subscribing to state changes.
 *
 * @returns {GameActionsType} Game action functions
 *
 * @example
 * ```tsx
 * const { makeMove, resetGame } = useGameActions();
 *
 * // This component will never re-render due to game state changes
 * return <button onClick={resetGame}>Reset</button>;
 * ```
 */
export const useGameActions = (): GameActionsType => {
  return useStore((state: RootState) => ({
    // State management actions
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

    // Navigation actions
    goToMove: state.goToMove,
    goToFirst: state.goToFirst,
    goToPrevious: state.goToPrevious,
    goToNext: state.goToNext,
    goToLast: state.goToLast,
    setCurrentFen: state.setCurrentFen,
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
 * @returns {[GameStateType, GameActionsType]} Tuple of game state and actions
 *
 * @example
 * ```tsx
 * const [gameState, gameActions] = useGameStore();
 *
 * const handleMove = (move: string) => {
 *   if (!gameState.isGameFinished) {
 *     gameActions.makeMove(move);
 *   }
 * };
 * ```
 */
export const useGameStore = (): [GameStateType, GameActionsType] => {
  return [useGameState(), useGameActions()];
};
