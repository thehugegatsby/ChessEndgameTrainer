/**
 * @file Move validation module
 * @module store/orchestrators/handlePlayerMove/MoveValidator
 *
 * @description
 * Handles move validation logic including turn validation,
 * move legality checking, and game state verification.
 */

import type { Move as ChessJsMove } from 'chess.js';
import { chessService } from '@shared/services/ChessService';
import type { TrainingState } from '@shared/store/slices/types';

/**
 * Result of move validation containing validity status and error information
 * @interface ValidationResult
 */
export interface ValidationResult {
  /** Whether the move is valid */
  isValid: boolean;
  /** Error message if move is invalid */
  errorMessage?: string;
}

/**
 * Game state information for comprehensive game status checking
 * @interface GameStateInfo
 */
export interface GameStateInfo {
  /** Whether the game has ended */
  isGameOver: boolean;
  /** Whether the position is checkmate */
  isCheckmate: boolean;
  /** Whether the position is a draw */
  isDraw: boolean;
  /** Whether the position is stalemate */
  isStalemate: boolean;
}

/**
 * Validates and manages chess move validation
 * @class MoveValidator
 *
 * @description
 * Handles comprehensive move validation including:
 * - Move legality using chess.js engine
 * - Game state verification (turn, game over checks)
 * - Error message generation for UI feedback
 *
 * @example
 * ```typescript
 * const validator = new MoveValidator();
 * const result = await validator.validateMove("e2-e4");
 * if (!result.isValid) {
 *   // console.log(result.errorMessage);
 * }
 * ```
 */
export class MoveValidator {
  /**
   * Validates if it's the player's turn and opponent is not thinking
   *
   * @param state - Current training state
   * @returns True if player can move
   */
  validateTurn(state: TrainingState): boolean {
    return state.isPlayerTurn && !state.isOpponentThinking;
  }

  /**
   * Validates if a move is legal according to chess rules
   *
   * @param move - The move to validate
   * @returns Validation result with error message if invalid
   */
  validateMove(
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ): ValidationResult {
    try {
      const isValid = chessService.validateMove(move);

      if (!isValid) {
        return {
          isValid: false,
          errorMessage: 'Invalid move',
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Invalid move',
      };
    }
  }

  /**
   * Checks the current game state
   *
   * @returns Current game state information
   */
  checkGameState(): GameStateInfo {
    return {
      isGameOver: chessService.isGameOver(),
      isCheckmate: chessService.isCheckmate(),
      isDraw: chessService.isDraw(),
      isStalemate: chessService.isStalemate(),
    };
  }
}
