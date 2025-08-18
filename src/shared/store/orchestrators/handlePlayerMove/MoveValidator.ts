/**
 * @file Move validation module
 * @module store/orchestrators/handlePlayerMove/MoveValidator
 *
 * @description
 * Handles move validation logic using domain services.
 * Migrated from legacy chess-logic utils to MoveService and GameStateService.
 */

import type { Move as ChessJsMove } from 'chess.js';
import type { TrainingState } from '@shared/store/slices/types';
import { MoveService } from '@domains/game/services/MoveService';
import { GameStateService } from '@domains/game/services/GameStateService';
import { ChessGameLogic } from '@domains/game/engine/ChessGameLogic';

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
 * Validates and manages chess move validation using domain services
 * @class MoveValidator
 *
 * @description
 * Handles comprehensive move validation including:
 * - Move legality using MoveService
 * - Game state verification using GameStateService
 * - Error message generation for UI feedback
 *
 * @example
 * ```typescript
 * const validator = new MoveValidator();
 * const result = validator.validateMove("e2-e4", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
 * if (!result.isValid) {
 *   // console.log(result.errorMessage);
 * }
 * ```
 */
export class MoveValidator {
  private moveService: MoveService;
  private gameStateService: GameStateService;

  constructor() {
    // Create domain services with shared chess engine
    const chessEngine = new ChessGameLogic();
    this.moveService = new MoveService(chessEngine);
    this.gameStateService = new GameStateService(chessEngine);
  }
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
   * Validates if a move is legal according to chess rules using MoveService
   *
   * @param move - The move to validate
   * @param fen - Current FEN position
   * @returns Validation result with error message if invalid
   */
  validateMove(
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
    fen: string
  ): ValidationResult {
    try {
      // Convert move to standard format for MoveService
      let moveInput: { from: string; to: string; promotion?: string };
      
      if (typeof move === 'string') {
        // First try to parse as coordinate notation (e2e4, e2-e4)
        const cleanMove = move.replace('-', '');
        if (cleanMove.length >= 4 && cleanMove.length <= 5 && /^[a-h][1-8][a-h][1-8][qrnb]?$/.test(cleanMove)) {
          // This is coordinate notation
          moveInput = {
            from: cleanMove.slice(0, 2),
            to: cleanMove.slice(2, 4),
            ...(cleanMove.length > 4 && { promotion: cleanMove.slice(4) })
          };
        } else {
          // Assume it's SAN notation - use engine directly
          try {
            const tempEngine = new ChessGameLogic();
            const loadResult = tempEngine.loadFen(fen);
            if (!loadResult) {
              return {
                isValid: false,
                errorMessage: 'Ungültiger Zug',
              };
            }
            const moveResult = tempEngine.makeMove(move);
            if (moveResult) {
              return { isValid: true };
            } else {
              return {
                isValid: false,
                errorMessage: 'Ungültiger Zug',
              };
            }
          } catch (error) {
            return {
              isValid: false,
              errorMessage: error instanceof Error ? error.message : 'Ungültiger Zug',
            };
          }
        }
      } else if ('from' in move && 'to' in move) {
        // Already in correct format
        moveInput = {
          from: move.from,
          to: move.to,
          ...(move.promotion && { promotion: move.promotion })
        };
      } else {
        // ChessJsMove format - convert to coordinate notation
        moveInput = {
          from: move.from,
          to: move.to,
          ...(move.promotion && { promotion: move.promotion })
        };
      }

      // Use MoveService for validation
      const validationResult = this.moveService.isMoveLegal(fen, moveInput);

      if (!validationResult.isLegal) {
        return {
          isValid: false,
          errorMessage: validationResult.error || 'Ungültiger Zug',
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Ungültiger Zug',
      };
    }
  }

  /**
   * Checks the current game state using GameStateService
   *
   * @param fen - Current FEN position
   * @returns Current game state information
   */
  checkGameState(fen: string): GameStateInfo {
    try {
      // GameStateService needs the engine to be loaded with the FEN first
      // We can use individual methods that work with the current engine state
      // Since we need to check a specific FEN, we must load it first
      
      // For now, create a fresh engine instance with the FEN
      const tempEngine = new ChessGameLogic();
      tempEngine.loadFen(fen);
      const tempGameStateService = new GameStateService(tempEngine);
      
      return {
        isGameOver: tempGameStateService.isGameOver(),
        isCheckmate: tempGameStateService.isCheckmate(),
        isDraw: tempGameStateService.isDraw(),
        isStalemate: tempGameStateService.isStalemate(),
      };
    } catch {
      // Return safe defaults on error
      return {
        isGameOver: false,
        isCheckmate: false,
        isDraw: false,
        isStalemate: false,
      };
    }
  }
}
