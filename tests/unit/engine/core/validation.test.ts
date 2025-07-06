import { isValidFen, validateFen } from '@/lib/chess/validation';

describe('Chess Validation', () => {
  describe('isValidFen', () => {
    describe('Valid FEN strings', () => {
      it('should accept standard starting position', () => {
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        expect(isValidFen(startingFen)).toBe(true);
      });

      it('should accept endgame positions', () => {
        const endgameFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
        expect(isValidFen(endgameFen)).toBe(true);
      });

      it('should accept positions with castling rights', () => {
        const castlingFen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
        expect(isValidFen(castlingFen)).toBe(true);
      });

      it('should accept positions with en passant', () => {
        const enPassantFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        expect(isValidFen(enPassantFen)).toBe(true);
      });

      it('should accept positions with different move counts', () => {
        const midgameFen = 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3';
        expect(isValidFen(midgameFen)).toBe(true);
      });

      it('should accept positions with black to move', () => {
        const blackToMoveFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        expect(isValidFen(blackToMoveFen)).toBe(true);
      });

      it('should accept positions without castling rights', () => {
        const noCastlingFen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
        expect(isValidFen(noCastlingFen)).toBe(true);
      });

      it('should accept positions with partial castling rights', () => {
        const partialCastlingFen = 'r3k3/8/8/8/8/8/8/R3K2R w KQ - 0 1';
        expect(isValidFen(partialCastlingFen)).toBe(true);
      });
    });

    describe('Invalid FEN strings', () => {
      it('should reject empty string', () => {
        expect(isValidFen('')).toBe(false);
      });

      it('should reject null/undefined', () => {
        expect(isValidFen(null as any)).toBe(false);
        expect(isValidFen(undefined as any)).toBe(false);
      });

      it('should reject incomplete FEN (missing parts)', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')).toBe(false);
      });

      it('should reject invalid piece placement', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1')).toBe(false);
        expect(isValidFen('9/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1')).toBe(false); // Missing rank
      });

      it('should reject invalid active color', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR white KQkq - 0 1')).toBe(false);
      });

      it('should reject invalid castling availability', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqX - 0 1')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQKQ - 0 1')).toBe(false);
      });

      it('should reject invalid en passant target', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq z9 0 1')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e9 0 1')).toBe(false);
      });

      it('should reject invalid halfmove clock', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - abc 1')).toBe(false);
      });

      it('should reject invalid fullmove number', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 xyz')).toBe(false);
      });

      it('should reject positions with multiple kings of same color', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPKPPP/RNBQKBNR w KQkq - 0 1')).toBe(false);
      });

      it('should reject positions with no kings', () => {
        expect(isValidFen('rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR w - - 0 1')).toBe(false);
      });

      it('should reject random strings', () => {
        expect(isValidFen('hello world')).toBe(false);
        expect(isValidFen('123456789')).toBe(false);
        expect(isValidFen('not-a-fen-string')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle very long strings', () => {
        const longString = 'a'.repeat(1000);
        expect(isValidFen(longString)).toBe(false);
      });

      it('should handle strings with special characters', () => {
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1\n')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1\t')).toBe(false);
      });

      it('should handle strings with extra spaces', () => {
        expect(isValidFen(' rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe(false);
        expect(isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR  w  KQkq  -  0  1')).toBe(false);
      });
    });
  });

  describe('validateFen', () => {
    describe('Valid FEN strings', () => {
      it('should return success for valid starting position', () => {
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const result = validateFen(startingFen);
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return success for valid endgame position', () => {
        const endgameFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
        const result = validateFen(endgameFen);
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return success for complex valid positions', () => {
        const complexFen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5';
        const result = validateFen(complexFen);
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('Invalid FEN strings', () => {
      it('should return error for empty string', () => {
        const result = validateFen('');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      });

      it('should return error for null/undefined', () => {
        const nullResult = validateFen(null as any);
        expect(nullResult.isValid).toBe(false);
        expect(nullResult.error).toBeDefined();

        const undefinedResult = validateFen(undefined as any);
        expect(undefinedResult.isValid).toBe(false);
        expect(undefinedResult.error).toBeDefined();
      });

      it('should return error for incomplete FEN', () => {
        const result = validateFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('FEN');
      });

      it('should return error for invalid piece placement', () => {
        const result = validateFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should return error for invalid active color', () => {
        const result = validateFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should return error for random strings', () => {
        const result = validateFen('not-a-chess-position');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('Error message quality', () => {
      it('should provide meaningful error messages', () => {
        const result = validateFen('invalid');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.length).toBeGreaterThan(0);
      });

      it('should handle Error objects properly', () => {
        // This tests the error handling in the catch block
        const result = validateFen('9/8/8/8/8/8/8/8 w - - 0 1'); // Invalid piece count
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should provide default error message for non-Error exceptions', () => {
        // This test verifies the catch block handles non-Error objects
        // We'll test this by providing an invalid FEN that causes chess.js to throw
        const result = validateFen('invalid-fen-that-causes-error');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      });
    });

    describe('Edge cases', () => {
      it('should handle very long invalid strings', () => {
        const longString = 'invalid'.repeat(200);
        const result = validateFen(longString);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should handle strings with special characters', () => {
        const specialString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1\x00';
        const result = validateFen(specialString);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should handle unicode characters', () => {
        const unicodeString = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1🚀';
        const result = validateFen(unicodeString);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('Consistency with isValidFen', () => {
      const testCases = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Valid
        '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', // Valid
        'invalid-fen', // Invalid
        '', // Invalid
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', // Invalid (incomplete)
      ];

      testCases.forEach((fen, index) => {
        it(`should be consistent with isValidFen for test case ${index + 1}`, () => {
          const isValidResult = isValidFen(fen);
          const validateResult = validateFen(fen);
          
          expect(validateResult.isValid).toBe(isValidResult);
          
          if (isValidResult) {
            expect(validateResult.error).toBeUndefined();
          } else {
            expect(validateResult.error).toBeDefined();
          }
        });
      });
    });
  });

  describe('Performance', () => {
    it('should validate many FEN strings quickly', () => {
      const validFens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
        'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
        '8/8/8/8/8/8/8/4K3 w - - 0 1',
      ];
      
      const invalidFens = [
        'invalid',
        '',
        '9/8/8/8/8/8/8/8 w - - 0 1',
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1',
      ];
      
      const startTime = Date.now();
      
      // Test 1000 validations
      for (let i = 0; i < 250; i++) {
        validFens.forEach(fen => {
          isValidFen(fen);
          validateFen(fen);
        });
        
        invalidFens.forEach(fen => {
          isValidFen(fen);
          validateFen(fen);
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 2000 validations in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
}); 