/**
 * @fileoverview PuzzleSolver interface for E2E test puzzle interaction
 * @description Abstracts chess puzzle solving for training mode testing
 */

import { PuzzleResult, PuzzleOptions } from './types';

/**
 * Interface for puzzle solving in E2E tests
 * Handles training puzzles with engine feedback
 */
export interface IPuzzleSolver {
  /**
   * Setup a puzzle position
   * @param fen - Starting position
   * @param solution - Expected solution moves
   * @param description - Puzzle description/goal
   */
  setupPuzzle(fen: string, solution: string[], description?: string): Promise<void>;

  /**
   * Attempt to solve the current puzzle
   * @param moves - Moves to try
   * @param options - Puzzle solving options
   * @returns Result with feedback and success status
   */
  solvePuzzle(moves: string[], options?: PuzzleOptions): Promise<PuzzleResult>;

  /**
   * Get hint for current position
   * @returns Engine's suggested best move
   */
  getHint(): Promise<string>;

  /**
   * Check if current puzzle is solved
   * @returns True if puzzle goal is achieved
   */
  isPuzzleSolved(): Promise<boolean>;

  /**
   * Reset current puzzle to starting position
   */
  resetPuzzle(): Promise<void>;

  /**
   * Get puzzle evaluation feedback
   * @returns Current evaluation and suggested continuation
   */
  getPuzzleFeedback(): Promise<{
    evaluation: number;
    bestMove: string;
    message: string;
  }>;
}