import { describe, it, expect, beforeEach } from 'vitest';
/**
 * @file Tests for MoveValidator with pure functions
 * @module tests/unit/orchestrators/MoveValidator
 */

import { MoveValidator } from '@shared/store/orchestrators/handlePlayerMove/MoveValidator';
import type { TrainingState } from '@shared/store/slices/types';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

describe('MoveValidator', () => {
  let validator: MoveValidator;

  beforeEach(() => {
    validator = new MoveValidator();
  });

  describe('validateTurn', () => {
    it("should return true when it's player turn and opponent not thinking", () => {
      const state: Partial<TrainingState> = {
        isPlayerTurn: true,
        isOpponentThinking: false,
      };

      const result = validator.validateTurn(state as TrainingState);

      expect(result).toBe(true);
    });

    it("should return false when it's not player turn", () => {
      const state: Partial<TrainingState> = {
        isPlayerTurn: false,
        isOpponentThinking: false,
      };

      const result = validator.validateTurn(state as TrainingState);

      expect(result).toBe(false);
    });

    it('should return false when opponent is thinking', () => {
      const state: Partial<TrainingState> = {
        isPlayerTurn: true,
        isOpponentThinking: true,
      };

      const result = validator.validateTurn(state as TrainingState);

      expect(result).toBe(false);
    });

    it('should return false when not player turn AND opponent thinking', () => {
      const state: Partial<TrainingState> = {
        isPlayerTurn: false,
        isOpponentThinking: true,
      };

      const result = validator.validateTurn(state as TrainingState);

      expect(result).toBe(false);
    });
  });

  describe('validateMove', () => {
    it('should return valid result for legal move using pure functions', () => {
      const result = validator.validateMove('e4', TEST_POSITIONS.STARTING_POSITION);

      expect(result).toEqual({
        isValid: true,
      });
    });

    it('should return invalid result for illegal move using pure functions', () => {
      const result = validator.validateMove('e5', TEST_POSITIONS.STARTING_POSITION); // Invalid opening move

      expect(result).toEqual({
        isValid: false,
        errorMessage: 'Invalid move',
      });
    });

    it('should handle ChessJS move object with pure functions', () => {
      const move = { from: 'e7', to: 'e8', promotion: 'q' };
      const result = validator.validateMove(move, TEST_POSITIONS.WHITE_PROMOTION);

      expect(result.isValid).toBe(true);
    });

    it('should handle move object with from/to using pure functions', () => {
      const move = { from: 'e2', to: 'e4' };
      const result = validator.validateMove(move, TEST_POSITIONS.STARTING_POSITION);

      expect(result.isValid).toBe(true);
    });

    it('should return error message for invalid FEN', () => {
      const result = validator.validateMove('e4', 'invalid-fen');

      expect(result).toEqual({
        isValid: false,
        errorMessage: 'Invalid move',
      });
    });

    it('should handle valid knight moves', () => {
      const result = validator.validateMove('Nf3', TEST_POSITIONS.STARTING_POSITION);

      expect(result).toEqual({
        isValid: true,
      });
    });

    it('should reject moves in checkmate position', () => {
      const result = validator.validateMove('Ka8', TEST_POSITIONS.CHECKMATE_POSITION);

      expect(result).toEqual({
        isValid: false,
        errorMessage: 'Invalid move',
      });
    });
  });

  describe('checkGameState', () => {
    it('should return correct game state for starting position', () => {
      const result = validator.checkGameState(TEST_POSITIONS.STARTING_POSITION);

      expect(result).toEqual({
        isGameOver: false,
        isCheckmate: false,
        isDraw: false,
        isStalemate: false,
      });
    });

    it('should detect checkmate using pure functions', () => {
      const result = validator.checkGameState(TEST_POSITIONS.CHECKMATE_POSITION);

      expect(result).toEqual({
        isGameOver: true,
        isCheckmate: true,
        isDraw: false,
        isStalemate: false,
      });
    });

    it('should detect stalemate using pure functions', () => {
      const result = validator.checkGameState(TEST_POSITIONS.STALEMATE_POSITION);

      expect(result).toEqual({
        isGameOver: true,
        isCheckmate: false,
        isDraw: true,
        isStalemate: true,
      });
    });

    it('should handle invalid FEN gracefully', () => {
      const result = validator.checkGameState('invalid-fen');

      expect(result).toEqual({
        isGameOver: false,
        isCheckmate: false,
        isDraw: false,
        isStalemate: false,
      });
    });
  });
});
