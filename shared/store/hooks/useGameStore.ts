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

/**
 * Hook for comprehensive game state and actions
 *
 * @description
 * Single source of truth for all game-related functionality including
 * board state, move history, analysis results, and game operations.
 * Combines state from multiple slices with their associated actions.
 *
 * @returns {Object} Game state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // State
 *   currentFen,
 *   moveHistory,
 *   isGameFinished,
 *   analysisStatus,
 *
 *   // Actions
 *   makeMove,
 *   resetPosition,
 *   goToMove,
 * } = useGameStore();
 *
 * // Use directly in component
 * const handleMove = async (from: string, to: string) => {
 *   const success = await makeMove({ from, to });
 *   if (!success) {
 *     console.error('Invalid move');
 *   }
 * };
 * ```
 */
export const useGameStore = () => {
  return useStore(
    useShallow((state) => ({
      // === Game State ===
      game: state.game,
      currentFen: state.currentFen,
      currentPgn: state.currentPgn,
      moveHistory: state.moveHistory,
      currentMoveIndex: state.currentMoveIndex,
      isGameFinished: state.isGameFinished,
      gameResult: state.gameResult,

      // === Training State ===
      currentPosition: state.currentPosition,
      mistakeCount: state.mistakeCount,
      moveErrorDialog: state.moveErrorDialog,

      // === Analysis State ===
      analysisStatus: state.analysisStatus,
      evaluations: state.evaluations,
      currentEvaluation: state.currentEvaluation,
      tablebaseMove: state.tablebaseMove,

      // === Game Actions ===
      setGame: state.setGame,
      updatePosition: state.updatePosition,
      makeMove: state.makeMove,
      resetGame: state.resetGame,
      resetPosition: state.resetPosition,
      undoMove: state.undoMove,

      // === Navigation Actions ===
      goToMove: state.goToMove,
      goToFirst: state.goToFirst,
      goToPrevious: state.goToPrevious,
      goToNext: state.goToNext,
      goToLast: state.goToLast,

      // === Analysis Actions ===
      setAnalysisStatus: state.setAnalysisStatus,
      setEvaluations: state.setEvaluations,
      addEvaluation: state.addEvaluation,
      setCurrentEvaluation: state.setCurrentEvaluation,

      // === Training Actions ===
      incrementMistake: state.incrementMistake,
      setMoveErrorDialog: state.setMoveErrorDialog,
    })),
  );
};
