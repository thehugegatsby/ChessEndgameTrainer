/**
 * @file Comprehensive unit tests for chess-adapter
 * @module tests/unit/infrastructure/chess-adapter
 * 
 * @description
 * Tests for the critical Anti-Corruption Layer between chess.js and domain.
 * Following DeepSeek planning + Gemini review feedback.
 * Target: 95%+ coverage for Foundation Infrastructure.
 */

import { type Move as ChessJsMove } from 'chess.js';
import {
  toLibraryMove,
  fromLibraryMove,
  fromLibraryMoves,
  ChessAdapterError,
  ChessAdapter
} from '@shared/infrastructure/chess-adapter';
import { ValidatedMove, type Color, type PieceSymbol, type Square } from '@shared/types/chess';
import { createTestValidatedMove } from '@tests/helpers/validatedMoveFactory';

// Mock the logger to prevent console output during tests
jest.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    error: jest.fn(),
  }),
}));

// Helper to create chess.js Move with all required properties including methods
const createChessJsMove = (overrides: Partial<Omit<ChessJsMove, 'isCapture' | 'isPromotion' | 'isEnPassant' | 'isKingsideCastle' | 'isQueensideCastle' | 'isBigPawn'>> = {}): ChessJsMove => {
  const baseMove = {
    from: 'e2' as Square,
    to: 'e4' as Square,
    piece: 'p' as PieceSymbol,
    color: 'w' as Color,
    san: 'e4',
    flags: 'b',
    lan: 'e2e4',
    before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    ...overrides,
  };
  
  // Create the complete chess.js Move object with all required methods
  return {
    ...baseMove,
    isCapture: () => Boolean(baseMove.captured),
    isPromotion: () => Boolean(baseMove.promotion),
    isEnPassant: () => (baseMove.flags || '').includes('e'),
    isKingsideCastle: () => (baseMove.flags || '').includes('k'),
    isQueensideCastle: () => (baseMove.flags || '').includes('q'),
    isBigPawn: () => (baseMove.flags || '').includes('b'),
  } as ChessJsMove;
};

describe('chess-adapter', () => {
  describe('Type Guards and Validators', () => {
    describe('ChessAdapter.isValidPromotionPiece', () => {
      it('should return true for valid promotion pieces', () => {
        expect(ChessAdapter.isValidPromotionPiece('q')).toBe(true);
        expect(ChessAdapter.isValidPromotionPiece('r')).toBe(true);
        expect(ChessAdapter.isValidPromotionPiece('b')).toBe(true);
        expect(ChessAdapter.isValidPromotionPiece('n')).toBe(true);
      });

      it('should return false for invalid promotion pieces', () => {
        expect(ChessAdapter.isValidPromotionPiece('k')).toBe(false); // King cannot promote
        expect(ChessAdapter.isValidPromotionPiece('p')).toBe(false); // Pawn cannot promote to pawn
        expect(ChessAdapter.isValidPromotionPiece('x')).toBe(false); // Invalid piece
        expect(ChessAdapter.isValidPromotionPiece('')).toBe(false);   // Empty string
      });

      it('should return false for non-string inputs', () => {
        expect(ChessAdapter.isValidPromotionPiece(null as any)).toBe(false);
        expect(ChessAdapter.isValidPromotionPiece(undefined as any)).toBe(false);
        expect(ChessAdapter.isValidPromotionPiece(42 as any)).toBe(false);
      });
    });

    describe('ChessAdapter.isValidPieceSymbol', () => {
      it('should return true for valid piece symbols', () => {
        const validPieces = ['p', 'n', 'b', 'r', 'q', 'k'];
        validPieces.forEach(piece => {
          expect(ChessAdapter.isValidPieceSymbol(piece)).toBe(true);
        });
      });

      it('should return false for invalid piece symbols', () => {
        expect(ChessAdapter.isValidPieceSymbol('x')).toBe(false);
        expect(ChessAdapter.isValidPieceSymbol('P')).toBe(false); // Uppercase
        expect(ChessAdapter.isValidPieceSymbol('')).toBe(false);
        expect(ChessAdapter.isValidPieceSymbol('knight')).toBe(false); // Full name
      });
    });

    describe('ChessAdapter.isValidColor', () => {
      it('should return true for valid colors', () => {
        expect(ChessAdapter.isValidColor('w')).toBe(true);
        expect(ChessAdapter.isValidColor('b')).toBe(true);
      });

      it('should return false for invalid colors', () => {
        expect(ChessAdapter.isValidColor('white')).toBe(false);
        expect(ChessAdapter.isValidColor('black')).toBe(false);
        expect(ChessAdapter.isValidColor('W')).toBe(false);
        expect(ChessAdapter.isValidColor('B')).toBe(false);
        expect(ChessAdapter.isValidColor('')).toBe(false);
        expect(ChessAdapter.isValidColor('x')).toBe(false);
      });
    });

    describe('VALID_PROMOTION_PIECES constant', () => {
      it('should contain exactly the valid promotion pieces', () => {
        expect(ChessAdapter.VALID_PROMOTION_PIECES).toEqual(['q', 'r', 'b', 'n']);
      });

      it('should be readonly', () => {
        expect(Object.isFrozen(ChessAdapter.VALID_PROMOTION_PIECES)).toBe(true);
      });
    });
  });

  describe('toLibraryMove', () => {
    it('should convert basic domain move to library format', () => {
      const domainMove = createTestValidatedMove({
        from: 'e2',
        to: 'e4',
        piece: 'p',
        color: 'w',
        san: 'e4',
        before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      });

      const result = toLibraryMove(domainMove);

      expect(result.from).toBe('e2');
      expect(result.to).toBe('e4');
      expect(result.san).toBe('e4');
      expect(result.before).toBe(domainMove.fenBefore); // Mapped correctly
      expect(result.after).toBe(domainMove.fenAfter);   // Mapped correctly
    });

    it('should preserve all move properties', () => {
      const domainMove = createTestValidatedMove({
        from: 'e7',
        to: 'e8',
        piece: 'p',
        color: 'w',
        san: 'e8=Q+',
        promotion: 'q',
        captured: 'r'
      });

      const result = toLibraryMove(domainMove);

      expect(result.promotion).toBe('q');
      expect(result.captured).toBe('r');
      expect(result.san).toBe('e8=Q+');
      // Note: flags are computed by the factory, test the actual flags
      expect(result.flags).toMatch(/[cp]/); // Should contain capture and/or promotion flags
    });

    it('should handle moves with missing optional properties', () => {
      const minimalMove = createTestValidatedMove({
        from: 'g1',
        to: 'f3',
        piece: 'n',
        color: 'w',
        san: 'Nf3'
      });

      const result = toLibraryMove(minimalMove);

      expect(result.from).toBe('g1');
      expect(result.to).toBe('f3');
      expect(result.san).toBe('Nf3');
      expect(result.promotion).toBeUndefined();
      expect(result.captured).toBeUndefined();
    });
  });

  describe('fromLibraryMove', () => {
    const validLibraryMove = createChessJsMove();

    describe('Valid Conversions', () => {
      it('should convert valid library move to domain format', () => {
        const result = fromLibraryMove(validLibraryMove);

        expect(result.from).toBe('e2');
        expect(result.to).toBe('e4');
        expect(result.piece).toBe('p');
        expect(result.color).toBe('w');
        expect(result.san).toBe('e4');
        expect(result.flags).toBe('b');
        expect(result.lan).toBe('e2e4');
        expect(result.fenBefore).toBe(validLibraryMove.before);
        expect(result.fenAfter).toBe(validLibraryMove.after);
      });

      it('should handle capture moves correctly', () => {
        const captureMove = createChessJsMove({
          from: 'e4',
          to: 'd5',
          captured: 'p',
          san: 'exd5',
          flags: 'c' // capture
        });

        const result = fromLibraryMove(captureMove);

        expect(result.captured).toBe('p');
        expect(result.isCapture()).toBe(true);
        expect(result.san).toBe('exd5');
      });

      it('should handle promotion moves correctly', () => {
        const promotionMove = createChessJsMove({
          from: 'e7',
          to: 'e8',
          promotion: 'q',
          san: 'e8=Q',
          flags: 'p' // promotion
        });

        const result = fromLibraryMove(promotionMove);

        expect(result.promotion).toBe('q');
        expect(result.isPromotion()).toBe(true);
        expect(result.san).toBe('e8=Q');
      });

      it('should handle castling moves correctly', () => {
        const kingsideCastle = createChessJsMove({
          from: 'e1',
          to: 'g1',
          piece: 'k',
          san: 'O-O',
          flags: 'k' // kingside castle
        });

        const queensideCastle = createChessJsMove({
          from: 'e1',
          to: 'c1',
          piece: 'k',
          san: 'O-O-O',
          flags: 'q' // queenside castle
        });

        const kingsideResult = fromLibraryMove(kingsideCastle);
        const queensideResult = fromLibraryMove(queensideCastle);

        expect(kingsideResult.isKingsideCastle()).toBe(true);
        expect(kingsideResult.isQueensideCastle()).toBe(false);
        expect(queensideResult.isKingsideCastle()).toBe(false);
        expect(queensideResult.isQueensideCastle()).toBe(true);
      });

      it('should handle en passant moves correctly', () => {
        const enPassantMove = createChessJsMove({
          from: 'e5',
          to: 'd6',
          captured: 'p',
          san: 'exd6',
          flags: 'e' // en passant
        });

        const result = fromLibraryMove(enPassantMove);

        expect(result.isEnPassant()).toBe(true);
        expect(result.captured).toBe('p');
      });

      it('should handle all promotion piece types', () => {
        const promotionPieces: Array<'q' | 'r' | 'b' | 'n'> = ['q', 'r', 'b', 'n'];

        promotionPieces.forEach(piece => {
          const promotionMove = createChessJsMove({
            from: 'a7',
            to: 'a8',
            promotion: piece,
            san: `a8=${piece.toUpperCase()}`,
            flags: 'p'
          });

          const result = fromLibraryMove(promotionMove);
          expect(result.promotion).toBe(piece);
          expect(result.isPromotion()).toBe(true);
        });
      });
    });

    describe('Validation Errors', () => {
      it('should throw for missing required fields', () => {
        const incompleteMove = { ...validLibraryMove };
        delete (incompleteMove as any).from;

        expect(() => fromLibraryMove(incompleteMove as ChessJsMove)).toThrow(ChessAdapterError);
        expect(() => fromLibraryMove(incompleteMove as ChessJsMove)).toThrow('Missing required move fields');
      });

      it('should validate all required fields individually', () => {
        const requiredFields = ['from', 'to', 'san'] as const;

        requiredFields.forEach(field => {
          const incompleteMove = { ...validLibraryMove };
          delete (incompleteMove as any)[field];

          expect(() => fromLibraryMove(incompleteMove as ChessJsMove)).toThrow(ChessAdapterError);
        });
      });

      it('should throw for invalid color', () => {
        const invalidColorMove = createChessJsMove({
          color: 'invalid' as Color
        });

        expect(() => fromLibraryMove(invalidColorMove)).toThrow(ChessAdapterError);
        expect(() => fromLibraryMove(invalidColorMove)).toThrow('Invalid move color');
      });

      it('should throw for invalid piece symbol', () => {
        const invalidPieceMove = createChessJsMove({
          piece: 'invalid' as PieceSymbol
        });

        expect(() => fromLibraryMove(invalidPieceMove)).toThrow(ChessAdapterError);
        expect(() => fromLibraryMove(invalidPieceMove)).toThrow('Invalid piece symbol');
      });

      it('should throw for invalid captured piece', () => {
        const invalidCaptureMove = createChessJsMove({
          captured: 'invalid' as PieceSymbol
        });

        expect(() => fromLibraryMove(invalidCaptureMove)).toThrow(ChessAdapterError);
        expect(() => fromLibraryMove(invalidCaptureMove)).toThrow('Invalid captured piece');
      });

      it('should throw for invalid promotion piece', () => {
        const invalidPromotionMove = createChessJsMove({
          promotion: 'k' as any // King promotion is invalid
        });

        expect(() => fromLibraryMove(invalidPromotionMove)).toThrow(ChessAdapterError);
        expect(() => fromLibraryMove(invalidPromotionMove)).toThrow('Invalid promotion piece');
        expect(() => fromLibraryMove(invalidPromotionMove)).toThrow('Only q, r, b, n are allowed');
      });

      it('should provide detailed error context', () => {
        const invalidMove = createChessJsMove({
          color: 'invalid' as Color
        });

        try {
          fromLibraryMove(invalidMove);
          fail('Should have thrown ChessAdapterError');
        } catch (error) {
          expect(error).toBeInstanceOf(ChessAdapterError);
          expect((error as ChessAdapterError).context).toBeDefined();
          expect((error as ChessAdapterError).context!.move).toEqual(invalidMove);
          expect((error as ChessAdapterError).context!.invalidField).toBe('color');
        }
      });
    });

    describe('Helper Methods', () => {
      it('should provide correct isCapture helper', () => {
        const nonCaptureMove = fromLibraryMove(validLibraryMove);
        const captureMove = fromLibraryMove(createChessJsMove({
          captured: 'p',
          flags: 'c'
        }));

        expect(nonCaptureMove.isCapture()).toBe(false);
        expect(captureMove.isCapture()).toBe(true);
      });

      it('should provide correct isBigPawn helper', () => {
        const bigPawnMove = fromLibraryMove(createChessJsMove({
          flags: 'b' // big pawn move (2 squares)
        }));

        const regularMove = fromLibraryMove(createChessJsMove({
          flags: ''
        }));

        expect(bigPawnMove.isBigPawn()).toBe(true);
        expect(regularMove.isBigPawn()).toBe(false);
      });

      it('should handle missing flags gracefully', () => {
        const moveWithoutFlags = createChessJsMove({
          flags: undefined
        });

        const result = fromLibraryMove(moveWithoutFlags);

        expect(result.flags).toBe('');
        expect(result.isCapture()).toBe(false);
        expect(result.isPromotion()).toBe(false);
        expect(result.isEnPassant()).toBe(false);
        expect(result.isKingsideCastle()).toBe(false);
        expect(result.isQueensideCastle()).toBe(false);
        expect(result.isBigPawn()).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty LAN field', () => {
        const moveWithoutLan = createChessJsMove({
          lan: undefined
        });

        const result = fromLibraryMove(moveWithoutLan);
        expect(result.lan).toBe('');
      });

      it('should handle missing FEN fields', () => {
        const moveWithoutFens = createChessJsMove({
          before: undefined,
          after: undefined
        });

        const result = fromLibraryMove(moveWithoutFens);
        expect(result.fenBefore).toBe('');
        expect(result.fenAfter).toBe('');
      });

      it('should preserve complex flag combinations', () => {
        const complexMove = createChessJsMove({
          flags: 'npc', // promotion + capture + check
          promotion: 'q',
          captured: 'r'
        });

        const result = fromLibraryMove(complexMove);
        expect(result.flags).toBe('npc');
        expect(result.isPromotion()).toBe(true);
        expect(result.isCapture()).toBe(true);
      });
    });
  });

  describe('fromLibraryMoves', () => {
    const validMoves: ChessJsMove[] = [
      createChessJsMove({
        from: 'e2',
        to: 'e4',
        san: 'e4',
        flags: 'b',
        lan: 'e2e4'
      }),
      createChessJsMove({
        from: 'g8',
        to: 'f6',
        piece: 'n',
        color: 'b',
        san: 'Nf6',
        flags: '',
        lan: 'g8f6'
      })
    ];

    it('should convert array of valid moves', () => {
      const result = fromLibraryMoves(validMoves);

      expect(result).toHaveLength(2);
      expect(result[0].san).toBe('e4');
      expect(result[1].san).toBe('Nf6');
    });

    it('should handle empty array', () => {
      const result = fromLibraryMoves([]);
      expect(result).toEqual([]);
    });

    it('should provide enhanced error context for invalid moves in array', () => {
      const movesWithInvalid = [
        validMoves[0],
        createChessJsMove({
          from: 'g8',
          to: 'f6',
          piece: 'n',
          color: 'invalid' as Color // Invalid color
        })
      ];

      try {
        fromLibraryMoves(movesWithInvalid);
        fail('Should have thrown ChessAdapterError');
      } catch (error) {
        expect(error).toBeInstanceOf(ChessAdapterError);
        expect((error as ChessAdapterError).context!.moveIndex).toBe(1);
        expect((error as ChessAdapterError).context!.totalMoves).toBe(2);
      }
    });

    it('should stop processing on first error', () => {
      const movesWithMultipleErrors = [
        validMoves[0],
        createChessJsMove({
          from: 'g8',
          to: 'f6',
          piece: 'n',
          color: 'invalid1' as Color
        }),
        createChessJsMove({
          from: 'e2',
          to: 'e4',
          color: 'invalid2' as Color
        })
      ];

      try {
        fromLibraryMoves(movesWithMultipleErrors);
        fail('Should have thrown ChessAdapterError');
      } catch (error) {
        // Should fail on the first invalid move (index 1)
        expect((error as ChessAdapterError).context!.moveIndex).toBe(1);
      }
    });
  });

  describe('ChessAdapterError', () => {
    it('should create error with message and context', () => {
      const context = { invalidField: 'color', missingFields: ['value'] };
      const error = new ChessAdapterError('Test error message', context);

      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('ChessAdapterError');
      expect(error.context).toEqual(context);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error without context', () => {
      const error = new ChessAdapterError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.context).toBeUndefined();
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new ChessAdapterError('Test throw');
      }).toThrow(ChessAdapterError);

      expect(() => {
        throw new ChessAdapterError('Test throw');
      }).toThrow('Test throw');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete game move sequence', () => {
      const gameSequence: ChessJsMove[] = [
        // 1. e4 e5
        createChessJsMove({
          from: 'e2', to: 'e4', piece: 'p', color: 'w', san: 'e4', flags: 'b', lan: 'e2e4',
          before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
        }),
        createChessJsMove({
          from: 'e7', to: 'e5', piece: 'p', color: 'b', san: 'e5', flags: 'b', lan: 'e7e5',
          before: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          after: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
        }),
        // 2. Nf3 Nc6
        createChessJsMove({
          from: 'g1', to: 'f3', piece: 'n', color: 'w', san: 'Nf3', flags: 'n', lan: 'g1f3'
        }),
        createChessJsMove({
          from: 'b8', to: 'c6', piece: 'n', color: 'b', san: 'Nc6', flags: 'n', lan: 'b8c6'
        })
      ];

      const result = fromLibraryMoves(gameSequence);

      expect(result).toHaveLength(4);
      expect(result[0].san).toBe('e4');
      expect(result[1].san).toBe('e5');
      expect(result[2].san).toBe('Nf3');
      expect(result[3].san).toBe('Nc6');

      // Verify all moves are properly validated
      result.forEach(move => {
        expect(move.from).toMatch(/^[a-h][1-8]$/);
        expect(move.to).toMatch(/^[a-h][1-8]$/);
        expect(['w', 'b']).toContain(move.color);
        expect(['p', 'n', 'b', 'r', 'q', 'k']).toContain(move.piece);
      });
    });

    it('should handle chess.js library upgrade compatibility', () => {
      // Create a base valid move for this test
      const baseValidMove = createChessJsMove({
        from: 'e2' as Square,
        to: 'e4' as Square,
        piece: 'p' as PieceSymbol,
        color: 'w' as Color,
        san: 'e4',
        flags: 'b',
        lan: 'e2e4',
        before: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        after: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      });
      
      // Simulate potential future library changes by adding unknown fields
      const futureMoveFormat = {
        ...baseValidMove,
        // Simulate additional fields that might be added in future versions
        futureField1: 'unknown',
        futureField2: 42,
        futureFlag: true
      } as any;

      // Should still work - adapter only validates known fields
      const result = fromLibraryMove(futureMoveFormat);

      expect(result.from).toBe('e2');
      expect(result.to).toBe('e4');
      expect(result.san).toBe('e4');
      // Additional fields are ignored, don't break validation
    });

    it('should maintain data integrity through round-trip conversion', () => {
      const originalDomainMove = createTestValidatedMove({
        from: 'e7',
        to: 'e8',
        piece: 'p',
        color: 'w',
        san: 'e8=Q+',
        promotion: 'q',
        captured: 'r',
        before: 'test-before-fen',
        after: 'test-after-fen'
      });

      // Domain → Library → Domain
      const libraryMove = toLibraryMove(originalDomainMove);
      const backToDomain = fromLibraryMove(libraryMove);

      // Key fields should be preserved
      expect(backToDomain.from).toBe(originalDomainMove.from);
      expect(backToDomain.to).toBe(originalDomainMove.to);
      expect(backToDomain.san).toBe(originalDomainMove.san);
      expect(backToDomain.promotion).toBe(originalDomainMove.promotion);
      expect(backToDomain.captured).toBe(originalDomainMove.captured);
      expect(backToDomain.flags).toBe(originalDomainMove.flags);
      expect(backToDomain.fenBefore).toBe(originalDomainMove.fenBefore);
      expect(backToDomain.fenAfter).toBe(originalDomainMove.fenAfter);
    });
  });
});