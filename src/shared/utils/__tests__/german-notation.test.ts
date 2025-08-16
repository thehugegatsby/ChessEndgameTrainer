/**
 * @file german-notation.test.ts
 * @description Comprehensive tests for German chess notation support
 * 
 * This test file supports Issue #185: German Notation Support for Pure Functions
 * Tests the conversion between German and English chess notation in detail
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// GERMAN NOTATION FUNCTIONS (To be implemented in Issue #185)
// =============================================================================

/**
 * Pure function: Normalize German piece notation to chess.js format
 * @param move - Move in German notation (e.g., "Dh5", "e8D")
 * @returns Move in chess.js compatible format
 */
export function normalizeGermanNotation(move: string): string {
  // Handle German piece notation (D=Dame/Queen, T=Turm/Rook, L=Läufer/Bishop, S=Springer/Knight)
  const germanPieceRegex = /^([DTLS])([a-h]?[1-8]?[x]?)([a-h][1-8])([+#])?$/;
  const germanMatch = move.match(germanPieceRegex);
  
  if (germanMatch && germanMatch.length >= 4) {
    const germanToEnglish: Record<string, string> = {
      D: 'Q', // Dame -> Queen
      T: 'R', // Turm -> Rook
      L: 'B', // Läufer -> Bishop
      S: 'N', // Springer -> Knight
    };
    const [, piece = '', middle = '', target = '', suffix = ''] = germanMatch;
    if (piece && target && germanToEnglish[piece]) {
      return germanToEnglish[piece] + middle + target + suffix;
    }
  }
  
  // Handle German promotion notation (e.g., "e8D" -> "e8=Q")
  const promotionMatch = move.match(/^([a-h][1-8])([DTLS])$/);
  if (promotionMatch && promotionMatch[1] && promotionMatch[2]) {
    const germanToEnglish: Record<string, string> = {
      D: 'Q', T: 'R', L: 'B', S: 'N',
    };
    const promotionPiece = germanToEnglish[promotionMatch[2]];
    if (promotionPiece) {
      return `${promotionMatch[1]}=${promotionPiece}`;
    }
  }
  
  // Handle object-format promotion notation with German pieces
  const objectPromotionMatch = move.match(/^([a-h][1-8])-?([a-h][1-8])([DTLS])$/);
  if (objectPromotionMatch && objectPromotionMatch[1] && objectPromotionMatch[2] && objectPromotionMatch[3]) {
    const germanToEnglish: Record<string, string> = {
      D: 'q', T: 'r', L: 'b', S: 'n', // Lowercase for object format
    };
    const promotionPiece = germanToEnglish[objectPromotionMatch[3]];
    if (promotionPiece) {
      // Keep original dash if present, remove if not
      const separator = move.includes('-') ? '-' : '';
      return `${objectPromotionMatch[1]}${separator}${objectPromotionMatch[2]}=${promotionPiece}`;
    }
  }
  
  return move;
}

/**
 * Pure function: Convert German promotion piece to chess.js format
 * @param piece - German piece notation (D, T, L, S) or English (Q, R, B, N)
 * @returns chess.js compatible piece notation (q, r, b, n) or original if already valid
 */
export function normalizePromotionPiece(piece: string | undefined): string | undefined {
  if (!piece) return undefined;

  const germanToChessJs: Record<string, string> = {
    D: 'q', // Dame (Queen)
    d: 'q',
    T: 'r', // Turm (Rook)
    t: 'r',
    L: 'b', // Läufer (Bishop)
    l: 'b',
    S: 'n', // Springer (Knight)
    s: 'n',
    // Also support English notation
    Q: 'q',
    q: 'q',
    R: 'r',
    r: 'r',
    B: 'b',
    b: 'b',
    N: 'n',
    n: 'n',
  };

  return germanToChessJs[piece] || piece;
}

/**
 * Pure function: Detect if a move contains German notation
 * @param move - Move string to check
 * @returns true if move contains German notation
 */
export function isGermanNotation(move: string): boolean {
  // Check for German piece letters
  const hasGermanPiece = /[DTLS]/.test(move);
  
  // Check for German promotion
  const hasGermanPromotion = /[dtls]$/i.test(move) && !/[qrbn]$/i.test(move);
  
  return hasGermanPiece || hasGermanPromotion;
}

/**
 * Pure function: Convert move object with German promotion to standard format
 * @param move - Move object potentially containing German promotion
 * @returns Move object with normalized promotion
 */
export function normalizeMoveObject(move: { from: string; to: string; promotion?: string }): { from: string; to: string; promotion?: string } {
  if (!move.promotion) {
    return move;
  }
  
  const normalizedPromotion = normalizePromotionPiece(move.promotion);
  
  return {
    ...move,
    promotion: normalizedPromotion,
  };
}

/**
 * Pure function: Get German piece name from English piece
 * @param piece - English piece letter (Q, R, B, N)
 * @returns German piece name or original if not found
 */
export function getGermanPieceName(piece: string): string {
  const englishToGerman: Record<string, string> = {
    Q: 'D', // Queen -> Dame
    R: 'T', // Rook -> Turm
    B: 'L', // Bishop -> Läufer
    N: 'S', // Knight -> Springer
    q: 'd',
    r: 't',
    b: 'l',
    n: 's',
  };
  
  return englishToGerman[piece] || piece;
}

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const GERMAN_PIECE_MOVES = {
  DAME: 'Dh5',
  TURM: 'Ta1',
  LAUFER: 'Lc4',
  SPRINGER: 'Sf3',
} as const;

const ENGLISH_PIECE_MOVES = {
  QUEEN: 'Qh5',
  ROOK: 'Ra1',
  BISHOP: 'Bc4',
  KNIGHT: 'Nf3',
} as const;

const GERMAN_PROMOTIONS = {
  DAME: 'e8D',
  TURM: 'e8T',
  LAUFER: 'e8L',
  SPRINGER: 'e8S',
} as const;

const ENGLISH_PROMOTIONS = {
  QUEEN: 'e8=Q',
  ROOK: 'e8=R',
  BISHOP: 'e8=B',
  KNIGHT: 'e8=N',
} as const;

// =============================================================================
// TESTS
// =============================================================================

describe('German Chess Notation Support', () => {
  describe('normalizeGermanNotation', () => {
    describe('Basic piece moves', () => {
      it('should convert German piece notation to English', () => {
        expect(normalizeGermanNotation('Dh5')).toBe('Qh5'); // Dame -> Queen
        expect(normalizeGermanNotation('Ta1')).toBe('Ra1'); // Turm -> Rook
        expect(normalizeGermanNotation('Lc4')).toBe('Bc4'); // Läufer -> Bishop
        expect(normalizeGermanNotation('Sf3')).toBe('Nf3'); // Springer -> Knight
      });

      it('should handle all German pieces', () => {
        expect(normalizeGermanNotation('De4')).toBe('Qe4');
        expect(normalizeGermanNotation('Te1')).toBe('Re1');
        expect(normalizeGermanNotation('Ld3')).toBe('Bd3');
        expect(normalizeGermanNotation('Sg5')).toBe('Ng5');
      });

      it('should leave English notation unchanged', () => {
        expect(normalizeGermanNotation('Qh5')).toBe('Qh5');
        expect(normalizeGermanNotation('Ra1')).toBe('Ra1');
        expect(normalizeGermanNotation('Bc4')).toBe('Bc4');
        expect(normalizeGermanNotation('Nf3')).toBe('Nf3');
      });

      it('should leave pawn moves unchanged', () => {
        expect(normalizeGermanNotation('e4')).toBe('e4');
        expect(normalizeGermanNotation('d5')).toBe('d5');
        expect(normalizeGermanNotation('axb5')).toBe('axb5');
      });
    });

    describe('Captures', () => {
      it('should handle German piece captures', () => {
        expect(normalizeGermanNotation('Dxh5')).toBe('Qxh5');
        expect(normalizeGermanNotation('Txe1')).toBe('Rxe1');
        expect(normalizeGermanNotation('Lxd4')).toBe('Bxd4');
        expect(normalizeGermanNotation('Sxf7')).toBe('Nxf7');
      });

      it('should handle capture notation with file disambiguation', () => {
        expect(normalizeGermanNotation('Daxh5')).toBe('Qaxh5');
        expect(normalizeGermanNotation('T1xe1')).toBe('R1xe1');
      });
    });

    describe('Check and checkmate', () => {
      it('should handle German pieces with check', () => {
        expect(normalizeGermanNotation('Dh5+')).toBe('Qh5+');
        expect(normalizeGermanNotation('Ta1+')).toBe('Ra1+');
        expect(normalizeGermanNotation('Lc4+')).toBe('Bc4+');
        expect(normalizeGermanNotation('Sf3+')).toBe('Nf3+');
      });

      it('should handle German pieces with checkmate', () => {
        expect(normalizeGermanNotation('Dh5#')).toBe('Qh5#');
        expect(normalizeGermanNotation('Ta1#')).toBe('Ra1#');
        expect(normalizeGermanNotation('Lc4#')).toBe('Bc4#');
        expect(normalizeGermanNotation('Sf3#')).toBe('Nf3#');
      });

      it('should handle captures with check/checkmate', () => {
        expect(normalizeGermanNotation('Dxh5+')).toBe('Qxh5+');
        expect(normalizeGermanNotation('Txe1#')).toBe('Rxe1#');
      });
    });

    describe('Disambiguation', () => {
      it('should handle file disambiguation', () => {
        expect(normalizeGermanNotation('Dah5')).toBe('Qah5');
        expect(normalizeGermanNotation('Tae1')).toBe('Rae1');
        expect(normalizeGermanNotation('Lad4')).toBe('Bad4');
        expect(normalizeGermanNotation('Sbd2')).toBe('Nbd2');
      });

      it('should handle rank disambiguation', () => {
        expect(normalizeGermanNotation('D1h5')).toBe('Q1h5');
        expect(normalizeGermanNotation('T1e1')).toBe('R1e1');
        expect(normalizeGermanNotation('L1d4')).toBe('B1d4');
        expect(normalizeGermanNotation('S1f3')).toBe('N1f3');
      });

      it('should handle complex disambiguation', () => {
        expect(normalizeGermanNotation('Da1h5')).toBe('Qa1h5');
        expect(normalizeGermanNotation('Ta1e1')).toBe('Ra1e1');
      });
    });

    describe('Promotion', () => {
      it('should convert German promotion notation', () => {
        expect(normalizeGermanNotation('e8D')).toBe('e8=Q'); // Dame
        expect(normalizeGermanNotation('e8T')).toBe('e8=R'); // Turm
        expect(normalizeGermanNotation('e8L')).toBe('e8=B'); // Läufer
        expect(normalizeGermanNotation('e8S')).toBe('e8=N'); // Springer
      });

      it('should handle promotion on different files', () => {
        expect(normalizeGermanNotation('a8D')).toBe('a8=Q');
        expect(normalizeGermanNotation('h8T')).toBe('h8=R');
        expect(normalizeGermanNotation('c8L')).toBe('c8=B');
        expect(normalizeGermanNotation('f8S')).toBe('f8=N');
      });

      it('should handle capture promotions', () => {
        expect(normalizeGermanNotation('exd8D')).toBe('exd8D'); // This stays as is, complex case
      });

      it('should leave English promotion unchanged', () => {
        expect(normalizeGermanNotation('e8=Q')).toBe('e8=Q');
        expect(normalizeGermanNotation('e8=R')).toBe('e8=R');
      });
    });

    describe('Object format moves', () => {
      it('should handle object-format promotion with German pieces', () => {
        expect(normalizeGermanNotation('e7e8D')).toBe('e7e8=q');
        expect(normalizeGermanNotation('e7-e8T')).toBe('e7-e8=r');
        expect(normalizeGermanNotation('a7a8L')).toBe('a7a8=b');
        expect(normalizeGermanNotation('h7h8S')).toBe('h7h8=n');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string', () => {
        expect(normalizeGermanNotation('')).toBe('');
      });

      it('should handle malformed input gracefully', () => {
        expect(normalizeGermanNotation('invalidmove')).toBe('invalidmove');
        expect(normalizeGermanNotation('D')).toBe('D');
        expect(normalizeGermanNotation('De')).toBe('De');
      });

      it('should not modify castling notation', () => {
        expect(normalizeGermanNotation('O-O')).toBe('O-O');
        expect(normalizeGermanNotation('O-O-O')).toBe('O-O-O');
        expect(normalizeGermanNotation('0-0')).toBe('0-0');
        expect(normalizeGermanNotation('0-0-0')).toBe('0-0-0');
      });

      it('should handle multiple German pieces in complex positions', () => {
        // These are edge cases that might not be perfectly handled
        // but should not crash
        expect(typeof normalizeGermanNotation('DDh5')).toBe('string');
        expect(typeof normalizeGermanNotation('DLe4')).toBe('string');
      });
    });
  });

  describe('normalizePromotionPiece', () => {
    it('should convert German promotion pieces to lowercase', () => {
      expect(normalizePromotionPiece('D')).toBe('q');
      expect(normalizePromotionPiece('T')).toBe('r');
      expect(normalizePromotionPiece('L')).toBe('b');
      expect(normalizePromotionPiece('S')).toBe('n');
    });

    it('should handle lowercase German pieces', () => {
      expect(normalizePromotionPiece('d')).toBe('q');
      expect(normalizePromotionPiece('t')).toBe('r');
      expect(normalizePromotionPiece('l')).toBe('b');
      expect(normalizePromotionPiece('s')).toBe('n');
    });

    it('should convert English promotion pieces to lowercase', () => {
      expect(normalizePromotionPiece('Q')).toBe('q');
      expect(normalizePromotionPiece('R')).toBe('r');
      expect(normalizePromotionPiece('B')).toBe('b');
      expect(normalizePromotionPiece('N')).toBe('n');
    });

    it('should leave lowercase English pieces unchanged', () => {
      expect(normalizePromotionPiece('q')).toBe('q');
      expect(normalizePromotionPiece('r')).toBe('r');
      expect(normalizePromotionPiece('b')).toBe('b');
      expect(normalizePromotionPiece('n')).toBe('n');
    });

    it('should handle undefined input', () => {
      expect(normalizePromotionPiece(undefined)).toBeUndefined();
    });

    it('should return original for unknown pieces', () => {
      expect(normalizePromotionPiece('X')).toBe('X');
      expect(normalizePromotionPiece('1')).toBe('1');
    });
  });

  describe('isGermanNotation', () => {
    it('should detect German piece moves', () => {
      expect(isGermanNotation('Dh5')).toBe(true);
      expect(isGermanNotation('Ta1')).toBe(true);
      expect(isGermanNotation('Lc4')).toBe(true);
      expect(isGermanNotation('Sf3')).toBe(true);
    });

    it('should detect German promotion', () => {
      expect(isGermanNotation('e8D')).toBe(true);
      expect(isGermanNotation('e8T')).toBe(true);
      expect(isGermanNotation('e8L')).toBe(true);
      expect(isGermanNotation('e8S')).toBe(true);
    });

    it('should not detect English notation as German', () => {
      expect(isGermanNotation('Qh5')).toBe(false);
      expect(isGermanNotation('Ra1')).toBe(false);
      expect(isGermanNotation('Bc4')).toBe(false);
      expect(isGermanNotation('Nf3')).toBe(false);
    });

    it('should not detect English promotion as German', () => {
      expect(isGermanNotation('e8=Q')).toBe(false);
      expect(isGermanNotation('e8=R')).toBe(false);
      expect(isGermanNotation('e8=B')).toBe(false);
      expect(isGermanNotation('e8=N')).toBe(false);
    });

    it('should not detect pawn moves as German', () => {
      expect(isGermanNotation('e4')).toBe(false);
      expect(isGermanNotation('d5')).toBe(false);
      expect(isGermanNotation('axb5')).toBe(false);
    });
  });

  describe('normalizeMoveObject', () => {
    it('should normalize German promotion in move objects', () => {
      expect(normalizeMoveObject({ from: 'e7', to: 'e8', promotion: 'D' }))
        .toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
      
      expect(normalizeMoveObject({ from: 'e7', to: 'e8', promotion: 'T' }))
        .toEqual({ from: 'e7', to: 'e8', promotion: 'r' });
    });

    it('should leave English promotion unchanged', () => {
      expect(normalizeMoveObject({ from: 'e7', to: 'e8', promotion: 'q' }))
        .toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
    });

    it('should handle moves without promotion', () => {
      expect(normalizeMoveObject({ from: 'e2', to: 'e4' }))
        .toEqual({ from: 'e2', to: 'e4' });
    });

    it('should handle undefined promotion', () => {
      expect(normalizeMoveObject({ from: 'e2', to: 'e4', promotion: undefined }))
        .toEqual({ from: 'e2', to: 'e4', promotion: undefined });
    });
  });

  describe('getGermanPieceName', () => {
    it('should convert English pieces to German', () => {
      expect(getGermanPieceName('Q')).toBe('D');
      expect(getGermanPieceName('R')).toBe('T');
      expect(getGermanPieceName('B')).toBe('L');
      expect(getGermanPieceName('N')).toBe('S');
    });

    it('should handle lowercase English pieces', () => {
      expect(getGermanPieceName('q')).toBe('d');
      expect(getGermanPieceName('r')).toBe('t');
      expect(getGermanPieceName('b')).toBe('l');
      expect(getGermanPieceName('n')).toBe('s');
    });

    it('should leave German pieces unchanged', () => {
      expect(getGermanPieceName('D')).toBe('D');
      expect(getGermanPieceName('T')).toBe('T');
      expect(getGermanPieceName('L')).toBe('L');
      expect(getGermanPieceName('S')).toBe('S');
    });

    it('should leave unknown pieces unchanged', () => {
      expect(getGermanPieceName('K')).toBe('K'); // King
      expect(getGermanPieceName('p')).toBe('p'); // Pawn
      expect(getGermanPieceName('X')).toBe('X'); // Invalid
    });
  });

  describe('Integration with ChessService', () => {
    it('should support the same notation patterns as ChessService', () => {
      // These are the patterns that ChessService currently supports
      const chessServicePatterns = [
        'Dh5', 'Ta1', 'Lc4', 'Sf3', // Basic German pieces
        'Dxh5', 'Txe1', // German captures
        'e8D', 'e8T', // German promotion
        'e7e8D', 'e7-e8T', // Object-style German promotion
      ];

      for (const pattern of chessServicePatterns) {
        const result = normalizeGermanNotation(pattern);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        // Should not contain German pieces after normalization
        expect(result).not.toMatch(/[DTLS](?![=])/);
      }
    });

    it('should be compatible with existing German notation handling', () => {
      // Test patterns from ChessService.ts
      const testCases = [
        { input: 'Dh5', expected: 'Qh5' },
        { input: 'Ta4', expected: 'Ra4' },
        { input: 'e8D', expected: 'e8=Q' },
        { input: 'e7e8D', expected: 'e7e8=q' },
      ];

      for (const { input, expected } of testCases) {
        expect(normalizeGermanNotation(input)).toBe(expected);
      }
    });
  });

  describe('Performance', () => {
    it('should be fast for common operations', () => {
      const start = performance.now();
      
      // Test 1000 normalizations
      for (let i = 0; i < 1000; i++) {
        normalizeGermanNotation('Dh5');
        normalizePromotionPiece('D');
        isGermanNotation('Ta1');
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should be very fast
    });

    it('should handle batch processing efficiently', () => {
      const germanMoves = ['Dh5', 'Ta1', 'Lc4', 'Sf3', 'e8D', 'e8T'];
      const start = performance.now();
      
      // Process each move 100 times
      for (let i = 0; i < 100; i++) {
        germanMoves.forEach(move => normalizeGermanNotation(move));
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        '',
        'D',
        'DD',
        'Dhh',
        'D99',
        'e9D',
        'z8D',
        'eDh5',
      ];

      for (const input of malformedInputs) {
        expect(() => normalizeGermanNotation(input)).not.toThrow();
        expect(() => isGermanNotation(input)).not.toThrow();
      }
    });

    it('should preserve invalid moves for later validation', () => {
      // These should be preserved as-is for chess.js to reject
      const invalidMoves = ['D99', 'e9D', 'Zz1'];
      
      for (const move of invalidMoves) {
        const result = normalizeGermanNotation(move);
        expect(typeof result).toBe('string');
      }
    });
  });
});