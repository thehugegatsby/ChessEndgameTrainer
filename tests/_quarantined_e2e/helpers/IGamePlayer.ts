/**
 * @fileoverview GamePlayer interface for E2E test game interaction
 * @description Abstracts chess game move execution for testability
 */

import { PlayResult, PlayOptions } from './types';
import { Result } from '../utils/chess-utils';

/**
 * Interface for game move execution in E2E tests
 * Follows Single Responsibility Principle - focused on game interaction
 */
export interface IGamePlayer {
  /**
   * Play a single move on the board
   * @param move - Move in various formats (SAN: "Nf3", UCI: "e2e4", or coordinate)
   * @param options - Optional configuration for move execution
   * @returns Result with success status, final position, and any errors
   */
  playMove(move: string, options?: { useSAN?: boolean }): Promise<PlayResult>;

  /**
   * Play a sequence of moves
   * @param moves - Array of moves to execute
   * @param options - Configuration for sequence execution
   * @returns Aggregated result of all moves
   */
  playMoveSequence(moves: string[], options?: PlayOptions): Promise<PlayResult>;

  /**
   * Validate if a move is legal without executing it
   * @param move - Move to validate
   * @param currentFen - Current position (if not provided, uses current board state)
   * @returns Result with normalized move or validation error
   */
  validateMove(move: string, currentFen?: string): Promise<Result<string, Error>>;

  /**
   * Get current board position as FEN
   * @returns Current position FEN string
   */
  getCurrentPosition(): Promise<string>;

  /**
   * Reset the game to initial position
   */
  reset(): Promise<void>;

  /**
   * Get move history in SAN notation
   * @returns Array of moves in Standard Algebraic Notation
   */
  getHistory(): Promise<string[]>;

  /**
   * Get current game as PGN
   * @returns PGN string with headers and moves
   */
  getPGN(): Promise<string>;

  /**
   * Dispose of resources (chess instance, etc.)
   */
  dispose(): void;
}