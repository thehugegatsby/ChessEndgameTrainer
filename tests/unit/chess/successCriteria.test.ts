/**
 * @fileoverview Unit tests for chess success criteria
 * @description Tests game ending detection: checkmate, stalemate, draws, and other success conditions
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { checkSuccess } from '../../../shared/lib/chess/successCriteria';
import { Chess } from 'chess.js';

// Create mock Chess instance type
type MockChess = {
  isCheckmate: jest.Mock;
  isStalemate: jest.Mock;
  isThreefoldRepetition: jest.Mock;
  isDraw: jest.Mock;
  load: jest.Mock;
  move: jest.Mock;
  fen: jest.Mock;
};

describe('Chess Success Criteria', () => {
  let mockGame: MockChess;

  beforeEach(() => {
    mockGame = {
      isCheckmate: jest.fn(),
      isStalemate: jest.fn(),
      isThreefoldRepetition: jest.fn(),
      isDraw: jest.fn(),
      load: jest.fn(),
      move: jest.fn(),
      fen: jest.fn()
    };
  });

  describe('checkSuccess', () => {
    describe('Checkmate Detection', () => {
      test('should_return_true_when_checkmate_achieved', () => {
        mockGame.isCheckmate.mockReturnValue(true);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockReturnValue(false);
        mockGame.isDraw.mockReturnValue(false);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isCheckmate).toHaveBeenCalledTimes(1);
      });

      test('should_not_check_other_conditions_when_checkmate_found', () => {
        mockGame.isCheckmate.mockReturnValue(true);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isCheckmate).toHaveBeenCalledTimes(1);
        expect(mockGame.isStalemate).not.toHaveBeenCalled();
        expect(mockGame.isThreefoldRepetition).not.toHaveBeenCalled();
        expect(mockGame.isDraw).not.toHaveBeenCalled();
      });
    });

    describe('Stalemate Detection', () => {
      test('should_return_true_when_stalemate_achieved', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(true);
        mockGame.isThreefoldRepetition.mockReturnValue(false);
        mockGame.isDraw.mockReturnValue(false);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isCheckmate).toHaveBeenCalledTimes(1);
        expect(mockGame.isStalemate).toHaveBeenCalledTimes(1);
      });

      test('should_not_check_remaining_conditions_when_stalemate_found', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(true);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isThreefoldRepetition).not.toHaveBeenCalled();
        expect(mockGame.isDraw).not.toHaveBeenCalled();
      });
    });

    describe('Threefold Repetition Detection', () => {
      test('should_return_true_when_threefold_repetition_achieved', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockReturnValue(true);
        mockGame.isDraw.mockReturnValue(false);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isCheckmate).toHaveBeenCalledTimes(1);
        expect(mockGame.isStalemate).toHaveBeenCalledTimes(1);
        expect(mockGame.isThreefoldRepetition).toHaveBeenCalledTimes(1);
      });

      test('should_not_check_draw_when_threefold_repetition_found', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockReturnValue(true);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isDraw).not.toHaveBeenCalled();
      });
    });

    describe('Other Draw Conditions', () => {
      test('should_return_true_when_fifty_move_rule_triggered', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockReturnValue(false);
        mockGame.isDraw.mockReturnValue(true);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isCheckmate).toHaveBeenCalledTimes(1);
        expect(mockGame.isStalemate).toHaveBeenCalledTimes(1);
        expect(mockGame.isThreefoldRepetition).toHaveBeenCalledTimes(1);
        expect(mockGame.isDraw).toHaveBeenCalledTimes(1);
      });

      test('should_return_true_when_insufficient_material_draw', () => {
        // isDraw() should cover insufficient material cases
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockReturnValue(false);
        mockGame.isDraw.mockReturnValue(true);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
      });
    });

    describe('No Success Conditions Met', () => {
      test('should_return_false_when_game_continues', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockReturnValue(false);
        mockGame.isDraw.mockReturnValue(false);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(false);
        expect(mockGame.isCheckmate).toHaveBeenCalledTimes(1);
        expect(mockGame.isStalemate).toHaveBeenCalledTimes(1);
        expect(mockGame.isThreefoldRepetition).toHaveBeenCalledTimes(1);
        expect(mockGame.isDraw).toHaveBeenCalledTimes(1);
      });
    });

    describe('Multiple Conditions True (Edge Cases)', () => {
      test('should_return_true_when_both_checkmate_and_stalemate_somehow_true', () => {
        // This shouldn't happen in real chess, but test defensive programming
        mockGame.isCheckmate.mockReturnValue(true);
        mockGame.isStalemate.mockReturnValue(true);

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isCheckmate).toHaveBeenCalledTimes(1);
        // Should short-circuit and not check stalemate
        expect(mockGame.isStalemate).not.toHaveBeenCalled();
      });

      test('should_return_true_when_multiple_draw_conditions_true', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockReturnValue(true);
        mockGame.isDraw.mockReturnValue(true); // Also true, but shouldn't be checked

        const result = checkSuccess(mockGame as any);

        expect(result).toBe(true);
        expect(mockGame.isThreefoldRepetition).toHaveBeenCalledTimes(1);
        expect(mockGame.isDraw).not.toHaveBeenCalled(); // Short-circuited
      });
    });

    describe('Error Handling', () => {
      test('should_handle_isCheckmate_throwing_error', () => {
        mockGame.isCheckmate.mockImplementation(() => {
          throw new Error('Chess engine error');
        });

        expect(() => checkSuccess(mockGame as any)).toThrow('Chess engine error');
      });

      test('should_handle_isStalemate_throwing_error', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockImplementation(() => {
          throw new Error('Stalemate detection error');
        });

        expect(() => checkSuccess(mockGame as any)).toThrow('Stalemate detection error');
      });

      test('should_handle_isThreefoldRepetition_throwing_error', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockImplementation(() => {
          throw new Error('Repetition tracking error');
        });

        expect(() => checkSuccess(mockGame as any)).toThrow('Repetition tracking error');
      });

      test('should_handle_isDraw_throwing_error', () => {
        mockGame.isCheckmate.mockReturnValue(false);
        mockGame.isStalemate.mockReturnValue(false);
        mockGame.isThreefoldRepetition.mockReturnValue(false);
        mockGame.isDraw.mockImplementation(() => {
          throw new Error('Draw detection error');
        });

        expect(() => checkSuccess(mockGame as any)).toThrow('Draw detection error');
      });
    });
  });

  describe('Integration with Real Chess.js (Smoke Tests)', () => {
    test('should_work_with_real_chess_instance_starting_position', () => {
      const realGame = new Chess();
      
      const result = checkSuccess(realGame);
      
      expect(result).toBe(false); // Starting position should not be a success condition
    });

    test('should_work_with_real_chess_instance_after_moves', () => {
      const realGame = new Chess();
      realGame.move('e4');
      realGame.move('e5');
      
      const result = checkSuccess(realGame);
      
      expect(result).toBe(false); // Normal opening should not be success
    });

    test('should_detect_scholars_mate_scenario', () => {
      const realGame = new Chess();
      
      // Scholar's mate sequence
      realGame.move('e4');
      realGame.move('e5');
      realGame.move('Bc4');
      realGame.move('Nc6');
      realGame.move('Qh5');
      realGame.move('Nf6');
      realGame.move('Qxf7'); // Checkmate
      
      const result = checkSuccess(realGame);
      
      expect(result).toBe(true); // Should detect checkmate
    });

    test('should_handle_stalemate_position', () => {
      const realGame = new Chess();
      
      // Set up a real stalemate position: Black king trapped by white king and pawn
      realGame.load('k7/P7/K7/8/8/8/8/8 b - - 0 1'); // Black king is stalemated
      
      const result = checkSuccess(realGame);
      
      expect(result).toBe(true); // Should detect stalemate
    });
  });

  describe('Performance Tests', () => {
    test('should_execute_quickly_for_normal_positions', () => {
      mockGame.isCheckmate.mockReturnValue(false);
      mockGame.isStalemate.mockReturnValue(false);
      mockGame.isThreefoldRepetition.mockReturnValue(false);
      mockGame.isDraw.mockReturnValue(false);

      const startTime = Date.now();
      
      // Run multiple times
      for (let i = 0; i < 100; i++) {
        checkSuccess(mockGame as any);
      }
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    test('should_short_circuit_efficiently_on_checkmate', () => {
      mockGame.isCheckmate.mockReturnValue(true);

      // Run multiple times to test short-circuiting
      for (let i = 0; i < 10; i++) {
        const result = checkSuccess(mockGame as any);
        expect(result).toBe(true);
      }

      expect(mockGame.isCheckmate).toHaveBeenCalledTimes(10);
      expect(mockGame.isStalemate).not.toHaveBeenCalled();
      expect(mockGame.isThreefoldRepetition).not.toHaveBeenCalled();
      expect(mockGame.isDraw).not.toHaveBeenCalled();
    });
  });
});