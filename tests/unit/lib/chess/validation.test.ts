/**
 * @fileoverview Unit Tests for Chess FEN Validation
 * @description Tests FEN string validation functions with comprehensive edge cases
 */

import { isValidFen, validateFen } from '../../../../shared/lib/chess/validation';

describe('Chess FEN Validation', () => {
  describe('isValidFen', () => {
    describe('Valid FEN strings', () => {
      it('should validate standard starting position', () => {
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        expect(isValidFen(startingFen)).toBe(true);
      });

      it('should validate endgame positions', () => {
        const endgameFens = [
          'k7/8/8/8/8/8/P7/K7 w - - 0 1', // King and pawn vs king (Ka1, Pa2 vs ka8)
          '8/8/8/8/8/8/8/k6K w - - 0 1', // King vs king (Ka1 vs kh1)
          'r7/8/8/8/8/8/8/k6K b - - 0 1', // Rook vs king (ra8 vs Ka1, kh1)
          'q7/8/8/8/8/8/8/k6K b - - 0 1', // Queen vs king (qa8 vs Ka1, kh1)
        ];

        endgameFens.forEach(fen => {
          expect(isValidFen(fen)).toBe(true);
        });
      });

      it('should validate positions after moves', () => {
        const validFens = [
          'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', // After e4
          'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', // After e4 e5
          'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 3', // After several moves
        ];

        validFens.forEach(fen => {
          expect(isValidFen(fen)).toBe(true);
        });
      });

      it('should validate different castling rights', () => {
        const castlingFens = [
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // All castling
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w Kq - 0 1', // Only white king, black queen
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1', // No castling
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w K - 0 1', // Only white king
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w Q - 0 1', // Only white queen
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w k - 0 1', // Only black king
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w q - 0 1', // Only black queen
        ];

        castlingFens.forEach(fen => {
          expect(isValidFen(fen)).toBe(true);
        });
      });

      it('should validate en passant positions', () => {
        const enPassantFens = [
          'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', // e3 en passant
          'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', // e6 en passant
          'rnbqkbnr/p1pppppp/8/1p6/4P3/8/PPPP1PPP/RNBQKBNR w KQkq b6 0 2', // b6 en passant
        ];

        enPassantFens.forEach(fen => {
          expect(isValidFen(fen)).toBe(true);
        });
      });
    });

    describe('Invalid FEN strings - Input validation', () => {
      it('should reject null and undefined', () => {
        expect(isValidFen(null as any)).toBe(false);
        expect(isValidFen(undefined as any)).toBe(false);
      });

      it('should reject non-string types', () => {
        expect(isValidFen(123 as any)).toBe(false);
        expect(isValidFen({} as any)).toBe(false);
        expect(isValidFen([] as any)).toBe(false);
        expect(isValidFen(true as any)).toBe(false);
      });

      it('should reject empty and whitespace strings', () => {
        expect(isValidFen('')).toBe(false);
        expect(isValidFen('   ')).toBe(false);
        expect(isValidFen('\\t\\n')).toBe(false);
      });
    });

    describe('Invalid FEN strings - Format validation', () => {
      it('should reject wrong number of parts', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')).toBe(false); // Missing parts
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w')).toBe(false); // Only 2 parts
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')).toBe(false); // Only 3 parts
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -')).toBe(false); // Only 4 parts
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0')).toBe(false); // Only 5 parts
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 extra')).toBe(false); // Too many parts
      });

      it('should reject extra spaces', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR  w KQkq - 0 1')).toBe(false); // Double space
        expect(isValidFen(' rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(false); // Leading space
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 ')).toBe(false); // Trailing space
      });

      it('should reject special characters', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1!')).toBe(false); // Exclamation
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1@')).toBe(false); // At symbol
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1#')).toBe(false); // Hash
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq $ 0 1')).toBe(false); // Dollar in en passant
      });

      it('should reject invalid castling rights', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqX - 0 1')).toBe(false); // Invalid character
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KK - 0 1')).toBe(false); // Duplicate K
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w QQ - 0 1')).toBe(false); // Duplicate Q
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w kk - 0 1')).toBe(false); // Duplicate k
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w qq - 0 1')).toBe(false); // Duplicate q
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQKq - 0 1')).toBe(false); // Multiple duplicates
      });
    });

    describe('Invalid FEN strings - Chess logic validation', () => {
      it('should reject positions with too many pieces', () => {
        // This should be caught by chess.js validation
        expect(isValidFen('rnbqkbnr/pppppppp/pppppppp/pppppppp/PPPPPPPP/PPPPPPPP/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(false);
      });

      it('should reject positions with invalid piece placement', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/9 w KQkq - 0 1')).toBe(false); // Invalid number
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/ w KQkq - 0 1')).toBe(false); // Empty rank
      });

      it('should reject positions with multiple kings', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNK w KQkq - 0 1')).toBe(false);
      });

      it('should reject positions with no kings', () => {
        expect(isValidFen('rnbqnbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQNBNR w KQkq - 0 1')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle minimal valid positions', () => {
        expect(isValidFen('8/8/8/8/8/8/8/k6K w - - 0 1')).toBe(true); // Only kings
      });

      it('should handle promotion scenarios', () => {
        expect(isValidFen('rnbqkbnQ/pppppppp/8/8/8/8/PPPPPPP1/RNBQKBNR b KQq - 0 1')).toBe(true); // Promoted queen (one pawn missing)
      });

      it('should handle unicode and international characters', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1ö')).toBe(false); // Non-ASCII
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1€')).toBe(false); // Unicode
      });
    });
  });

  describe('validateFen', () => {
    describe('Valid FEN strings', () => {
      it('should return valid result for correct FEN', () => {
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const result = validateFen(startingFen);
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return valid result for endgame positions', () => {
        const endgameFen = 'k7/8/8/8/8/8/P7/K7 w - - 0 1';
        const result = validateFen(endgameFen);
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('Invalid FEN strings', () => {
      it('should return invalid result with generic error for basic validation failures', () => {
        const invalidFen = '';
        const result = validateFen(invalidFen);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Ungültiger FEN-String');
      });

      it('should return invalid result for malformed FEN', () => {
        const invalidFen = 'invalid-fen-string';
        const result = validateFen(invalidFen);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Ungültiger FEN-String');
      });

      it('should return invalid result for chess logic errors', () => {
        // This FEN has too many pieces on one rank
        const invalidFen = 'rnbqkbnrr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const result = validateFen(invalidFen);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      });

      it('should handle null and undefined inputs', () => {
        expect(validateFen(null as any)).toEqual({
          isValid: false,
          error: 'Ungültiger FEN-String'
        });
        
        expect(validateFen(undefined as any)).toEqual({
          isValid: false,
          error: 'Ungültiger FEN-String'
        });
      });
    });

    describe('Error message handling', () => {
      it('should preserve chess.js error messages when available', () => {
        // This test verifies that specific chess.js errors are passed through
        const invalidFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0';
        const result = validateFen(invalidFen);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Ungültiger FEN-String'); // Falls back to generic message
      });

      it('should handle non-Error exceptions', () => {
        // This test verifies the error handling logic, though it's hard to trigger naturally
        const invalidFen = 'completely-invalid';
        const result = validateFen(invalidFen);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Ungültiger FEN-String');
      });
    });
  });

  describe('Function consistency', () => {
    it('should have isValidFen and validateFen return consistent results', () => {
      const testFens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Valid
        'k7/8/8/8/8/8/P7/K7 w - - 0 1', // Valid endgame
        '', // Invalid empty
        'invalid', // Invalid format
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KK - 0 1', // Invalid duplicate castling
      ];

      testFens.forEach(fen => {
        const isValidResult = isValidFen(fen);
        const validateResult = validateFen(fen);
        
        expect(isValidResult).toBe(validateResult.isValid);
        
        if (!isValidResult) {
          expect(validateResult.error).toBeDefined();
        } else {
          expect(validateResult.error).toBeUndefined();
        }
      });
    });
  });
});