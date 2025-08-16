/**
 * TablebaseTransformer Tests
 *
 * Critical tests for perspective normalization logic.
 * Tests designed with consensus from O3-mini (9/10) and Claude Haiku (8/10).
 *
 * Test Categories:
 * 1. Position Evaluation - WDL perspective switching for positions
 * 2. Move Evaluation - Different logic for move quality assessment
 * 3. FEN Validation - Edge cases and error scenarios
 * 4. Error Handling - Comprehensive error message validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TablebaseTransformer } from '../TablebaseTransformer';
import type { TablebaseApiResponse } from '../../types/interfaces';

describe('TablebaseTransformer', () => {
  let transformer: TablebaseTransformer;

  beforeEach(() => {
    transformer = new TablebaseTransformer();
  });

  describe('normalizePositionEvaluation', () => {
    describe('White to move positions', () => {
      it('should keep win evaluation unchanged for White to move', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: 2, // Win for White
          dtz: 10,
          dtm: 5,
          category: 'win',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/K6k w - - 0 1'; // White to move

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'win',
          dtm: 5,
          dtz: 10,
        });
      });

      it('should keep loss evaluation unchanged for White to move', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: -2, // Loss for White
          dtz: -10,
          dtm: -5,
          category: 'loss',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/k6K w - - 0 1'; // White to move

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'loss',
          dtm: -5,
          dtz: -10,
        });
      });

      it('should keep draw evaluation unchanged for White to move', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: 0, // Draw
          dtz: 0,
          dtm: null,
          category: 'draw',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/K6k w - - 0 1'; // White to move

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'draw',
          dtm: undefined,
          dtz: 0,
        });
      });
    });

    describe('Black to move positions', () => {
      it('should invert win to loss for Black to move', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: 2, // Win for White (API perspective)
          dtz: 10,
          dtm: 5,
          category: 'win',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/K6k b - - 0 1'; // Black to move

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'loss', // Loss for Black!
          dtm: 5,
          dtz: 10,
        });
      });

      it('should invert loss to win for Black to move', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: -2, // Loss for White (API perspective)
          dtz: -10,
          dtm: -5,
          category: 'loss',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/k6K b - - 0 1'; // Black to move

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'win', // Win for Black!
          dtm: -5,
          dtz: -10,
        });
      });

      it('should keep draw unchanged for Black to move', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: 0, // Draw
          dtz: 0,
          dtm: null,
          category: 'draw',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/K6k b - - 0 1'; // Black to move

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'draw',
          dtm: undefined,
          dtz: 0,
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle missing DTM/DTZ values', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: 1,
          dtz: null,
          dtm: undefined,
          category: 'win',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/K6k w - - 0 1';

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'win',
          dtm: undefined,
          dtz: undefined,
        });
      });

      it('should handle cursed win (positive wdl but draw category)', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: 1, // Cursed win
          dtz: 0,
          dtm: null,
          category: 'cursed-win',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/K6k w - - 0 1';

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'win',
          dtm: undefined,
          dtz: 0,
        });
      });

      it('should handle blessed loss (negative wdl but draw category)', () => {
        const apiResponse: TablebaseApiResponse = {
          wdl: -1, // Blessed loss
          dtz: 0,
          dtm: null,
          category: 'blessed-loss',
          moves: [],
        };
        const fen = '8/8/8/8/8/8/8/K6k w - - 0 1';

        const result = transformer.normalizePositionEvaluation(apiResponse, fen);

        expect(result).toEqual({
          outcome: 'loss',
          dtm: undefined,
          dtz: 0,
        });
      });
    });
  });

  describe('normalizeMoveEvaluation', () => {
    describe('White moves', () => {
      it('should return win for White making a winning move', () => {
        // White moves, position is winning for White after
        const result = transformer.normalizeMoveEvaluation(2, false);
        expect(result).toBe('win');
      });

      it('should return loss for White making a losing move', () => {
        // White moves, position is losing for White after
        const result = transformer.normalizeMoveEvaluation(-2, false);
        expect(result).toBe('loss');
      });

      it('should return draw for White making a drawing move', () => {
        // White moves, position is drawn after
        const result = transformer.normalizeMoveEvaluation(0, false);
        expect(result).toBe('draw');
      });
    });

    describe('Black moves', () => {
      it('should return loss for Black making a move good for White', () => {
        // Black moves, position is winning for White after (bad for Black)
        const result = transformer.normalizeMoveEvaluation(2, true);
        expect(result).toBe('loss');
      });

      it('should return win for Black making a move bad for White', () => {
        // Black moves, position is losing for White after (good for Black)
        const result = transformer.normalizeMoveEvaluation(-2, true);
        expect(result).toBe('win');
      });

      it('should return draw for Black making a drawing move', () => {
        // Black moves, position is drawn after
        const result = transformer.normalizeMoveEvaluation(0, true);
        expect(result).toBe('draw');
      });
    });

    describe('Edge cases for move evaluation', () => {
      it('should handle cursed win moves correctly for White', () => {
        const result = transformer.normalizeMoveEvaluation(1, false);
        expect(result).toBe('win');
      });

      it('should handle blessed loss moves correctly for White', () => {
        const result = transformer.normalizeMoveEvaluation(-1, false);
        expect(result).toBe('loss');
      });

      it('should handle cursed win moves correctly for Black', () => {
        const result = transformer.normalizeMoveEvaluation(1, true);
        expect(result).toBe('loss');
      });

      it('should handle blessed loss moves correctly for Black', () => {
        const result = transformer.normalizeMoveEvaluation(-1, true);
        expect(result).toBe('win');
      });
    });
  });

  describe('validateFen', () => {
    describe('Valid FEN strings', () => {
      it('should accept valid FEN with 2 pieces', () => {
        const fen = 'K7/8/8/8/8/8/8/k7 w - - 0 1';
        expect(() => transformer.validateFen(fen)).not.toThrow();
      });

      it('should accept valid FEN with 7 pieces (max allowed)', () => {
        const fen = 'KQR4/8/8/8/8/8/8/kqrn3 w - - 0 1'; // K,Q,R,k,q,r,n = 7 pieces
        expect(() => transformer.validateFen(fen)).not.toThrow();
      });

      it('should accept FEN with en passant square', () => {
        const fen = '8/8/8/8/4Pp2/8/8/K6k b - e3 0 1';
        expect(() => transformer.validateFen(fen)).not.toThrow();
      });

      it('should accept FEN with castling rights', () => {
        const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
        expect(() => transformer.validateFen(fen)).not.toThrow();
      });
    });

    describe('Invalid FEN strings', () => {
      it('should throw error for empty FEN', () => {
        expect(() => transformer.validateFen('')).toThrow('FEN is required');
      });

      it('should throw error for null/undefined FEN', () => {
        expect(() => transformer.validateFen(null as any)).toThrow('FEN is required');
        expect(() => transformer.validateFen(undefined as any)).toThrow('FEN is required');
      });

      it('should throw error for FEN with too many pieces', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // 32 pieces
        expect(() => transformer.validateFen(fen)).toThrow(
          'Too many pieces for tablebase (32 > 7)'
        );
      });

      it('should throw error for FEN with 8 pieces', () => {
        const fen = 'KQRB4/8/8/8/8/8/8/kqrn3 w - - 0 1'; // K,Q,R,B,k,q,r,n = 8 pieces
        expect(() => transformer.validateFen(fen)).toThrow('Too many pieces for tablebase (8 > 7)');
      });

      it('should throw error for invalid FEN format - missing parts', () => {
        const fen = 'K7/8/8/8/8/8/8/k7'; // Missing turn indicator
        expect(() => transformer.validateFen(fen)).toThrow('Invalid FEN format');
      });

      it('should throw error for invalid FEN format - wrong number of ranks', () => {
        const fen = 'K7/8/8/8/8/8/k7 w - - 0 1'; // Only 7 ranks
        expect(() => transformer.validateFen(fen)).toThrow('Invalid FEN format');
      });

      it('should throw error for invalid FEN format - invalid turn indicator', () => {
        const fen = 'K7/8/8/8/8/8/8/k7 x - - 0 1'; // 'x' instead of 'w' or 'b'
        expect(() => transformer.validateFen(fen)).toThrow('Invalid FEN format');
      });

      it('should throw error for malformed FEN', () => {
        const fen = 'invalid fen string';
        expect(() => transformer.validateFen(fen)).toThrow('Invalid FEN format');
      });
    });

    describe('Error message validation', () => {
      it('should include piece count in error message', () => {
        const fen = 'KQRBN3/8/8/8/8/8/8/kqrnb2 w - - 0 1'; // K,Q,R,B,N,k,q,r,n,b = 10 pieces
        expect(() => transformer.validateFen(fen)).toThrow(
          'Too many pieces for tablebase (10 > 7)'
        );
      });

      it('should include FEN in error message for invalid format', () => {
        const fen = 'bad_fen';
        expect(() => transformer.validateFen(fen)).toThrow(`Invalid FEN format: ${fen}`);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete position evaluation flow for White', () => {
      const apiResponse: TablebaseApiResponse = {
        wdl: 2,
        dtz: 15,
        dtm: 8,
        category: 'win',
        moves: [],
      };
      const fen = 'K7/P7/8/8/8/8/8/k7 w - - 0 1';

      // Validate FEN first
      expect(() => transformer.validateFen(fen)).not.toThrow();

      // Then normalize evaluation
      const result = transformer.normalizePositionEvaluation(apiResponse, fen);
      expect(result).toEqual({
        outcome: 'win',
        dtm: 8,
        dtz: 15,
      });
    });

    it('should handle complete position evaluation flow for Black', () => {
      const apiResponse: TablebaseApiResponse = {
        wdl: -2,
        dtz: -20,
        dtm: -10,
        category: 'loss',
        moves: [],
      };
      const fen = 'k7/p7/8/8/8/8/8/K7 b - - 0 1';

      // Validate FEN first
      expect(() => transformer.validateFen(fen)).not.toThrow();

      // Then normalize evaluation
      const result = transformer.normalizePositionEvaluation(apiResponse, fen);
      expect(result).toEqual({
        outcome: 'win', // Win for Black (inverted)
        dtm: -10,
        dtz: -20,
      });
    });

    it('should handle complete move evaluation flow', () => {
      const fen = 'K7/8/8/8/8/8/8/k6r w - - 0 1';

      // Validate FEN
      expect(() => transformer.validateFen(fen)).not.toThrow();

      // Evaluate a winning move for White
      const moveResult = transformer.normalizeMoveEvaluation(2, false);
      expect(moveResult).toBe('win');

      // Evaluate a losing move for Black
      const blackMoveResult = transformer.normalizeMoveEvaluation(2, true);
      expect(blackMoveResult).toBe('loss');
    });
  });
});
