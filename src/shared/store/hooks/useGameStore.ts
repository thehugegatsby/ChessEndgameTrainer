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

import { useMemo } from 'react';
import { useStore, useStoreApi } from '../StoreContext';
import { useShallow } from 'zustand/react/shallow';
import type {
  RootState,
  GameState as GameStateType,
  GameActions as GameActionsType,
} from '../slices/types';

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
      // Pure game state from nested structure
      currentFen: state.game.currentFen,
      currentPgn: state.game.currentPgn,
      moveHistory: state.game.moveHistory,
      currentMoveIndex: state.game.currentMoveIndex,
      isGameFinished: state.game.isGameFinished,
      ...(state.game.gameResult !== null &&
        state.game.gameResult !== undefined && { gameResult: state.game.gameResult }),
      isCheckmate: state.game.isCheckmate,
      isDraw: state.game.isDraw,
      isStalemate: state.game.isStalemate,
    }))
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
  // Non-reactive access to avoid SSR issues
  const storeApi = useStoreApi();
  const state = storeApi.getState();
  const actions = state.game;

  // Memoize the actions object to ensure stable reference
  return useMemo(
    () => ({
      // State management actions
      updatePosition: actions.updatePosition,
      addMove: actions.addMove,
      setMoveHistory: actions.setMoveHistory,
      setCurrentMoveIndex: actions.setCurrentMoveIndex,
      setGameFinished: actions.setGameFinished,
      setGameStatus: actions.setGameStatus,
      resetGame: actions.resetGame,

      // Game operations
      initializeGame: actions.initializeGame,
      makeMove: actions.makeMove,
      applyMove: actions.applyMove,
      undoMove: actions.undoMove,
      redoMove: actions.redoMove,

      // Navigation actions
      goToMove: actions.goToMove,
      goToFirst: actions.goToFirst,
      goToPrevious: actions.goToPrevious,
      goToNext: actions.goToNext,
      goToLast: actions.goToLast,
      setCurrentFen: actions.setCurrentFen,

      // Pure function actions (ChessService replacement)
      makeMovePure: actions.makeMovePure,
      validateMovePure: actions.validateMovePure,
      getGameStatusPure: actions.getGameStatusPure,
      getPossibleMovesPure: actions.getPossibleMovesPure,
      goToMovePure: actions.goToMovePure,
      initializeGamePure: actions.initializeGamePure,
      resetGamePure: actions.resetGamePure,
    }),
    [actions]
  );
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
