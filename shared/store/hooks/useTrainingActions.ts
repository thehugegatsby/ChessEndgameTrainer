/**
 * @file Training slice action hooks
 * @module store/hooks/useTrainingActions
 *
 * @description
 * Provides access to training-related actions from the Zustand store.
 * Actions are stable references and don't require useShallow.
 */

import { useStore } from "../rootStore";

/**
 * Hook for training-related actions
 *
 * @description
 * Provides all actions related to training session management including
 * position loading, progress tracking, and mistake handling.
 *
 * @returns {Object} Training actions
 *
 * @example
 * ```tsx
 * const { loadTrainingContext, incrementMistake, completeTraining } = useTrainingActions();
 *
 * // Load a training position
 * loadTrainingContext(endgamePosition);
 *
 * // Track a mistake
 * incrementMistake();
 *
 * // Complete training session
 * completeTraining(true);
 * ```
 */
export const useTrainingActions = () =>
  useStore((state) => ({
    // Position management
    setPosition: state.setPosition,
    loadTrainingContext: state.loadTrainingContext,

    // Progress tracking
    incrementMistake: state.incrementMistake,
    completeTraining: state.completeTraining,

    // Player move handling
    handlePlayerMove: state.handlePlayerMove,

    // Navigation
    setNavigationPositions: state.setNavigationPositions,

    // Opponent moves
    handleOpponentTurn: state.handleOpponentTurn,
  }));
