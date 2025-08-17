/**
 * @file Opponent state slice for Zustand store
 * @module store/slices/opponentSlice
 * @description Manages opponent AI state and move generation
 * This slice handles opponent turn management and AI move execution.
 */

import { type OpponentSlice, type OpponentState, type OpponentActions } from './types';

// Re-export types for external use
export type { OpponentState, OpponentActions } from './types';

/**
 * Initial state for the opponent slice
 * Exported separately to enable proper store reset in tests
 */
export const initialOpponentState = {
  isThinking: false,
  lastMove: null as string | null,
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
};

/**
 * Creates the opponent state (data only, no actions)
 */
export const createOpponentState = (): OpponentState => ({ ...initialOpponentState });

/**
 * Creates the opponent actions (functions only, no state)
 */
export const createOpponentActions = (
  set: (fn: (state: { opponent: OpponentState }) => void) => void,
  _get: () => { opponent: OpponentState }
): OpponentActions => ({
  
  setThinking: (thinking: boolean) => {
    set(state => {
      state.opponent.isThinking = thinking;
    });
  },

  setLastMove: (move: string | null) => {
    set(state => {
      state.opponent.lastMove = move;
    });
  },

  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => {
    set(state => {
      state.opponent.difficulty = difficulty;
    });
  },

  // =====================================================
  // ORCHESTRATOR DELEGATE STUBS (Migration Phase)
  // =====================================================

  /**
   * [STUB] Triggers opponent move generation and execution
   * @param fen - The current FEN position for opponent to analyze
   */
  triggerOpponentMove: (fen: string) => {
    console.info(`STUB: Triggering opponent move for FEN: ${fen}`);
    // TODO: Implement actual opponent AI move generation
  },
});

/**
 * Selector functions for efficient state access
 */
export const opponentSelectors = {
  /**
   * Selects whether opponent is thinking
   */
  selectIsThinking: (state: OpponentSlice) => state.isThinking,

  /**
   * Selects the last move made by opponent
   */
  selectLastMove: (state: OpponentSlice) => state.lastMove,

  /**
   * Selects the opponent difficulty level
   */
  selectDifficulty: (state: OpponentSlice) => state.difficulty,
};