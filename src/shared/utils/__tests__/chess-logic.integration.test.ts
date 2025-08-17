/**
 * @file chess-logic.integration.test.ts
 * @description Integration tests for pure chess functions
 * 
 * Migrated from service-based architecture as part of Issue #173
 * Focus: Integration testing with real chess.js (30% of total test strategy)
 * Target: Verify real chess rules work correctly with pure functions
 * Strategy: Use real chess.js to test actual chess logic integration
 */

import { describe, it, expect } from 'vitest';
import {
  makeMove,
  validateMove,
  getFen,
  isGameOver,
  isCheckmate,
  isStalemate,
  isDraw,
  isCheck,
  getGameStatus,
  getMoveHistory,
  loadPgn,
  getPgn,
  generatePgn,
  turn,
} from '../chess-logic';
import {
  TEST_POSITIONS,
  StandardPositions,
  EndgamePositions,
  SpecialPositions,
} from '@shared/testing/ChessTestData';

// Helper to create test moves in chess.js format
const createTestMove = (from: string, to: string, promotion?: string) => ({
  from,
  to,
  promotion,
});

describe('Chess Logic Integration Tests', () => {
  describe('Real Chess Rules', () => {
    it('should execute standard opening moves correctly', () => {
      const startingFen = StandardPositions.STARTING;
      const result = makeMove(startingFen, createTestMove('e2', 'e4'));

      expect(result).not.toBeNull();
      expect(result?.move.san).toBe('e4');
      // chess.js correctly returns - for en passant after e4 (no en passant possible)
      expect(result?.newFen).toContain('4P3'); // Pawn on e4
      expect(result?.newFen).toContain('b KQkq -'); // No en passant available
    });

    it('should handle castling moves correctly', () => {
      const castlingFen = StandardPositions.CASTLING_AVAILABLE;

      // Test kingside castling for white
      const result = makeMove(castlingFen, createTestMove('e1', 'g1'));

      expect(result).not.toBeNull();
      expect(result?.move.san).toBe('O-O');
      expect(result?.newFen).toContain('R4RK1'); // King on g1, Rook on f1 after castling
    });

    it('should handle en passant captures correctly', () => {
      const enPassantFen = StandardPositions.EN_PASSANT;

      const result = makeMove(enPassantFen, createTestMove('e5', 'd6'));

      expect(result).not.toBeNull();
      expect(result?.move.san).toBe('exd6');
      expect(result?.move.flags).toContain('e'); // en passant flag
      // The captured pawn should be gone from d5
      expect(result?.newFen).not.toContain('3pP3');
    });

    it('should handle pawn promotion correctly', () => {
      const promotionFen = SpecialPositions.PROMOTION;

      // chess.js expects promotion in the move format: "e8=Q+"
      const result = makeMove(promotionFen, 'e8=Q+');

      expect(result).not.toBeNull();
      expect(result?.move.promotion).toBe('q');
      expect(result?.newFen).toContain('Q'); // Queen on e8
    });

    it('should detect checkmate correctly', () => {
      const checkmateFen = SpecialPositions.CHECKMATE;

      expect(isGameOver(checkmateFen)).toBe(true);
      expect(isCheckmate(checkmateFen)).toBe(true);
    });

    it('should detect stalemate correctly', () => {
      const stalemateFen = SpecialPositions.STALEMATE;

      expect(isGameOver(stalemateFen)).toBe(true);
      expect(isStalemate(stalemateFen)).toBe(true);
    });

    it('should reject illegal moves', () => {
      const startingFen = StandardPositions.STARTING;

      const result = makeMove(startingFen, createTestMove('e2', 'e5')); // Illegal pawn jump

      expect(result).toBeNull();
    });

    it('should handle complex move sequences', () => {
      // Play a short opening sequence using makeMove sequentially
      let currentFen = StandardPositions.STARTING;
      
      const moves = [
        createTestMove('e2', 'e4'), // 1. e4
        createTestMove('e7', 'e5'), // 1... e5
        createTestMove('g1', 'f3'), // 2. Nf3
        createTestMove('b8', 'c6'), // 2... Nc6
      ];

      const moveHistory: any[] = [];
      
      moves.forEach(move => {
        const result = makeMove(currentFen, move);
        expect(result).not.toBeNull();
        currentFen = result!.newFen;
        moveHistory.push(result!.move);
      });

      expect(moveHistory).toHaveLength(4);
      // Final position should be after Italian/Spanish opening setup
      // Complete FEN: position + turn + castling + en passant + halfmove + fullmove
      expect(currentFen).toBe(
        'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
      );
    });
  });

  describe('Move Validation Integration', () => {
    it('should validate moves without changing state', () => {
      const startingFen = StandardPositions.STARTING;

      const validGood = validateMove(startingFen, createTestMove('e2', 'e4'));
      const validBad = validateMove(startingFen, createTestMove('e2', 'e5'));

      expect(validGood).toBe(true);
      expect(validBad).toBe(false);

      // Pure functions - no state to change
      expect(getFen(startingFen)).toBe(startingFen);
    });

    it('should validate promotion moves correctly', () => {
      const promotionFen = SpecialPositions.PROMOTION;

      const validPromotion = validateMove(promotionFen, 'e8=Q+'); // chess.js format
      const invalidNoPromotion = validateMove(promotionFen, 'e8'); // Missing promotion

      expect(validPromotion).toBe(true);
      expect(invalidNoPromotion).toBe(false);
    });

    it('should validate string moves in SAN notation', () => {
      const startingFen = StandardPositions.STARTING;

      const validSAN = validateMove(startingFen, 'e4');
      const invalidSAN = validateMove(startingFen, 'e5'); // Illegal as opening move for white

      expect(validSAN).toBe(true);
      expect(invalidSAN).toBe(false);
    });
  });

  describe('Game Status Integration', () => {
    it('should provide comprehensive game status', () => {
      const checkmateFen = SpecialPositions.CHECKMATE;
      const status = getGameStatus(checkmateFen);

      expect(status.isGameOver).toBe(true);
      expect(status.isCheckmate).toBe(true);
      expect(status.turn).toBeDefined();
      expect(['w', 'b']).toContain(status.turn);
    });

    it('should detect different game end conditions', () => {
      // Test checkmate
      const checkmateFen = SpecialPositions.CHECKMATE;
      const checkmateStatus = getGameStatus(checkmateFen);
      expect(checkmateStatus.isCheckmate).toBe(true);
      expect(checkmateStatus.isGameOver).toBe(true);

      // Test stalemate
      const stalemateFen = SpecialPositions.STALEMATE;
      const stalemateStatus = getGameStatus(stalemateFen);
      expect(stalemateStatus.isStalemate).toBe(true);
      expect(stalemateStatus.isGameOver).toBe(true);

      // Test insufficient material
      const insufficientFen = SpecialPositions.INSUFFICIENT_MATERIAL;
      const insufficientStatus = getGameStatus(insufficientFen);
      expect(insufficientStatus.isDraw).toBe(true);
      expect(insufficientStatus.isGameOver).toBe(true);
    });
  });

  describe('Endgame Scenarios', () => {
    it('should handle KPK (King + Pawn vs King) endgame correctly', () => {
      const kpkFen = EndgamePositions.KPK_WIN;

      // Test a typical winning move in KPK
      const result = makeMove(kpkFen, createTestMove('a8', 'b8')); // King move

      expect(result).not.toBeNull();
      expect(result?.move.san).toBe('Kb8');
      expect(result?.newFen).toContain('1K6/P7/k7'); // King moved to b8
    });

    it('should handle KQK (King + Queen vs King) endgame correctly', () => {
      const kqkFen = EndgamePositions.KQK_WIN;

      // Queen should have many legal moves in this position
      expect(kqkFen).toContain('Q'); // Queen present
      expect(isGameOver(kqkFen)).toBe(false); // Not mate yet

      // Make a queen move
      const result = makeMove(kqkFen, createTestMove('h1', 'h8')); // Example queen move

      if (result) {
        expect(result.move.piece).toBe('q');
        expect(result.newFen).toContain('Q'); // Queen still present
      }
    });

    it('should detect insufficient material correctly', () => {
      const insufficientFen = SpecialPositions.INSUFFICIENT_MATERIAL;

      expect(isGameOver(insufficientFen)).toBe(true);
      expect(isDraw(insufficientFen)).toBe(true);
    });
  });

  describe('Position Validation', () => {
    it('should accept valid FEN positions', () => {
      const validPositions = [
        StandardPositions.STARTING,
        StandardPositions.AFTER_E4,
        EndgamePositions.KPK_WIN,
        EndgamePositions.KQK_WIN,
      ];

      validPositions.forEach(fen => {
        // Pure functions - just verify FEN can be processed
        const currentTurn = turn(fen);
        expect(['w', 'b']).toContain(currentTurn);
        
        // For AFTER_E4, chess.js correctly shows no en passant
        if (fen === StandardPositions.AFTER_E4) {
          expect(fen).toContain('4P3');
          expect(fen).toContain('b KQkq -');
        }
        
        expect(getFen(fen)).toBe(fen);
      });
    });

    it('should handle invalid FEN positions gracefully', () => {
      const invalidFen = 'invalid-fen-string';
      
      // Pure functions should handle gracefully without throwing
      expect(() => getFen(invalidFen)).not.toThrow();
      expect(() => turn(invalidFen)).not.toThrow();
    });
  });

  describe('Real Chess Logic Edge Cases', () => {
    it('should handle castling restrictions correctly', () => {
      // Start with castling available position
      let currentFen = StandardPositions.CASTLING_AVAILABLE;

      // Move the king first
      let result = makeMove(currentFen, createTestMove('e1', 'f1')); // King move
      expect(result).not.toBeNull();
      currentFen = result!.newFen;

      result = makeMove(currentFen, createTestMove('e8', 'd8')); // Black king move
      expect(result).not.toBeNull();
      currentFen = result!.newFen;

      result = makeMove(currentFen, createTestMove('f1', 'e1')); // King back
      expect(result).not.toBeNull();
      currentFen = result!.newFen;

      // Now castling should be invalid (king has moved)
      const castlingResult = makeMove(currentFen, createTestMove('e1', 'g1'));
      expect(castlingResult).toBeNull(); // Should be invalid
    });

    it('should handle check restrictions correctly', () => {
      // Set up a position where black king is in check
      const checkFen = SpecialPositions.CHECK;

      // First verify king is actually in check
      expect(isCheck(checkFen)).toBe(true);

      // Validate that moves that don't address check are invalid
      const isIllegalMoveValid = validateMove(checkFen, createTestMove('a7', 'a6'));
      expect(isIllegalMoveValid).toBe(false);

      // Legal move that blocks check should be valid (f6 blocks the diagonal)
      const isLegalMoveValid = validateMove(checkFen, createTestMove('f7', 'f6')); // Block check
      expect(isLegalMoveValid).toBe(true);
    });
  });

  describe('PGN Integration', () => {
    it('should handle move sequence to PGN conversion', () => {
      // Create a sequence of moves and generate PGN
      const movesInSan = ['e4', 'e5', 'Nf3'];
      
      const pgn = generatePgn(movesInSan);
      expect(pgn).not.toBeNull();
      expect(pgn).toContain('e4');
      expect(pgn).toContain('e5');
      expect(pgn).toContain('Nf3');
    });

    it('should load PGN and extract moves correctly', () => {
      const samplePgn = '1. e4 e5 2. Nf3 Nc6';
      
      const finalFen = loadPgn(samplePgn);
      expect(finalFen).not.toBeNull();
      
      const moves = getMoveHistory(samplePgn);
      expect(moves).toHaveLength(4);
      expect(moves[0].san).toBe('e4');
      expect(moves[1].san).toBe('e5');
      expect(moves[2].san).toBe('Nf3');
      expect(moves[3].san).toBe('Nc6');
    });
  });

  describe('Turn and State Management', () => {
    it('should track turn correctly throughout game', () => {
      let currentFen = StandardPositions.STARTING;
      
      expect(turn(currentFen)).toBe('w'); // White starts
      
      // Make white move
      let result = makeMove(currentFen, 'e4');
      expect(result).not.toBeNull();
      currentFen = result!.newFen;
      expect(turn(currentFen)).toBe('b'); // Now black's turn
      
      // Make black move
      result = makeMove(currentFen, 'e5');
      expect(result).not.toBeNull();
      currentFen = result!.newFen;
      expect(turn(currentFen)).toBe('w'); // Back to white
    });

    it('should maintain position consistency', () => {
      const testFen = StandardPositions.AFTER_E4;
      
      // Pure function should return identical FEN
      expect(getFen(testFen)).toBe(testFen);
      
      // Multiple calls should be consistent
      expect(getFen(testFen)).toBe(getFen(testFen));
      expect(turn(testFen)).toBe(turn(testFen));
    });
  });
});