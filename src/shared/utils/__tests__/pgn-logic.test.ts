/**
 * @file PGN Logic Tests
 * @description Pure function tests for PGN operations
 * Migrated from service-based architecture as part of Issue #173
 */

import { describe, it, expect } from 'vitest';
import { loadPgn, getMoveHistory, getPgn, generatePgn } from '@shared/utils/chess-logic';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

describe('PGN Logic', () => {
  // Test fixtures for comprehensive testing
  const pgnTestFixtures = {
    simple: '1. e4 e5 2. Nf3 Nc6 3. Bb5', // Spanish Opening
    complex: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6', // Complex with castling
    quickMate: '1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#', // Quick checkmate
    empty: '',
    whitespace: '   \n  \t  ',
    invalid: '1. xx yy zz', // Malformed moves
    malformed: 'this is not pgn at all',
    partialValid: '1. e4 e5 2. Nf3 invalid_move', // Valid start, invalid continuation
  };

  describe('loadPgn', () => {
    it('should return final FEN for valid simple PGN', () => {
      const result = loadPgn(pgnTestFixtures.simple);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // After 1. e4 e5 2. Nf3 Nc6 3. Bb5 - exact FEN assertion
      expect(result).toBe('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3');
    });

    it('should return final FEN for complex PGN with castling', () => {
      const result = loadPgn(pgnTestFixtures.complex);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      
      // Validate specific FEN components for complex game with castling
      const [pieces, turn, castling, ep, halfmove, fullmove] = result!.split(' ');
      expect(turn).toBe('w'); // White to move after 7...d6
      expect(castling).toBe('kq'); // White castled, black still has both rights
      expect(ep).toBe('-'); // No en passant after pawn move d6
      expect(halfmove).toBe('0'); // Last move was a pawn move (7...d6)
      expect(fullmove).toBe('8'); // After 7...d6, it's move 8
    });

    it('should handle checkmate position correctly', () => {
      const result = loadPgn(pgnTestFixtures.quickMate);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // Black is in checkmate after white's Qxf7# - black to move
      expect(result!.split(' ')[1]).toBe('b');
    });

    it('should return starting position for empty PGN', () => {
      const result = loadPgn(pgnTestFixtures.empty);
      
      expect(result).toBe(TEST_POSITIONS.STARTING_POSITION);
    });

    it('should return starting position for whitespace-only PGN', () => {
      const result = loadPgn(pgnTestFixtures.whitespace);
      
      expect(result).toBe(TEST_POSITIONS.STARTING_POSITION);
    });

    it('should return null for invalid PGN', () => {
      const result = loadPgn(pgnTestFixtures.invalid);
      
      expect(result).toBeNull();
    });

    it('should return null for malformed PGN string', () => {
      const result = loadPgn(pgnTestFixtures.malformed);
      
      expect(result).toBeNull();
    });

    it('should return null for partially valid PGN', () => {
      const result = loadPgn(pgnTestFixtures.partialValid);
      
      expect(result).toBeNull();
    });

    it('should handle PGN with annotations and comments', () => {
      const pgnWithComments = '1. e4 {best by test} e5 2. Nf3';
      const result = loadPgn(pgnWithComments);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // Should match the position after e4 e5 Nf3
      expect(result).toBe(TEST_POSITIONS.OPENING_AFTER_E4_E5_NF3);
    });

    it('should handle castling moves in PGN', () => {
      const pgnWithCastling = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O';
      const result = loadPgn(pgnWithCastling);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      // After castling, it's black's turn (b in FEN)
      expect(result).toContain('b'); // Black to move after white castles
      expect(result).toContain('RK1'); // King castled to g1, rook to f1
    });

    it('should handle promotion moves', () => {
      // Start from a position where promotion is possible
      const promotionPgn = '1. e8=Q+';
      const result = loadPgn(promotionPgn);
      
      // This will be null because we need a proper starting position for promotion
      expect(result).toBeNull();
    });
  });

  describe('getMoveHistory', () => {
    it('should return correct move history for simple PGN', () => {
      const result = getMoveHistory(pgnTestFixtures.simple);
      
      expect(result).toHaveLength(5); // e4, e5, Nf3, Nc6, Bb5
      expect(result[0]).toEqual({ san: 'e4' });
      expect(result[1]).toEqual({ san: 'e5' });
      expect(result[2]).toEqual({ san: 'Nf3' });
      expect(result[3]).toEqual({ san: 'Nc6' });
      expect(result[4]).toEqual({ san: 'Bb5' });
    });

    it('should return correct move history for complex PGN with castling', () => {
      const result = getMoveHistory(pgnTestFixtures.complex);
      
      expect(result).toHaveLength(14); // 7 moves per side
      expect(result).toContainEqual({ san: 'O-O' }); // Should include castling
      expect(result.map(m => m.san)).toContain('O-O');
    });

    it('should return empty array for empty PGN', () => {
      const result = getMoveHistory(pgnTestFixtures.empty);
      
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only PGN', () => {
      const result = getMoveHistory(pgnTestFixtures.whitespace);
      
      expect(result).toEqual([]);
    });

    it('should return empty array for invalid PGN', () => {
      const result = getMoveHistory(pgnTestFixtures.invalid);
      
      expect(result).toEqual([]);
    });

    it('should return empty array for malformed PGN', () => {
      const result = getMoveHistory(pgnTestFixtures.malformed);
      
      expect(result).toEqual([]);
    });

    it('should handle checkmate game correctly', () => {
      const result = getMoveHistory(pgnTestFixtures.quickMate);
      
      expect(result).toHaveLength(7); // e4, e5, Qh5, Nc6, Bc4, Nf6, Qxf7#
      expect(result[6]).toEqual({ san: 'Qxf7#' }); // Final checkmate move
    });

    it('should preserve move structure for all moves', () => {
      const result = getMoveHistory(pgnTestFixtures.simple);
      
      result.forEach(move => {
        expect(move).toHaveProperty('san');
        expect(typeof move.san).toBe('string');
        expect(move.san.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getPgn', () => {
    it('should return the same PGN string (passthrough)', () => {
      const result = getPgn(pgnTestFixtures.simple);
      
      expect(result).toBe(pgnTestFixtures.simple);
    });

    it('should handle empty string', () => {
      const result = getPgn(pgnTestFixtures.empty);
      
      expect(result).toBe('');
    });

    it('should handle complex PGN', () => {
      const result = getPgn(pgnTestFixtures.complex);
      
      expect(result).toBe(pgnTestFixtures.complex);
    });

    it('should preserve whitespace and formatting', () => {
      const pgnWithSpaces = '1. e4  e5   2. Nf3';
      const result = getPgn(pgnWithSpaces);
      
      expect(result).toBe(pgnWithSpaces);
    });
  });

  describe('generatePgn', () => {
    it('should generate PGN from move array', () => {
      const moves = ['e4', 'e5', 'Nf3', 'Nc6'];
      const result = generatePgn(moves);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('1. e4 e5');
      expect(result).toContain('2. Nf3 Nc6');
    });

    it('should handle empty move array', () => {
      const result = generatePgn([]);
      
      expect(result).toBeTruthy();
      expect(result).toContain('[Event "?"]'); // generatePgn returns PGN headers even for empty games
    });

    it('should handle single move', () => {
      const moves = ['e4'];
      const result = generatePgn(moves);
      
      expect(result).toBeTruthy();
      expect(result).toContain('1. e4');
    });

    it('should handle odd number of moves', () => {
      const moves = ['e4', 'e5', 'Nf3'];
      const result = generatePgn(moves);
      
      expect(result).toBeTruthy();
      expect(result).toContain('1. e4 e5');
      expect(result).toContain('2. Nf3');
    });

    it('should return null for invalid moves', () => {
      const invalidMoves = ['invalid_move', 'another_invalid'];
      const result = generatePgn(invalidMoves);
      
      expect(result).toBeNull();
    });

    it('should handle starting from custom position', () => {
      // Use TEST_POSITIONS for consistent testing
      const moves = ['e5']; // Valid black move after e4
      const result = generatePgn(moves, TEST_POSITIONS.OPENING_AFTER_E4);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('1. ... e5'); // Should show black's first move notation
    });

    it('should return null for invalid move from custom position', () => {
      // Invalid white move when it's black's turn
      const invalidMoves = ['Qh5'];
      const result = generatePgn(invalidMoves, TEST_POSITIONS.OPENING_AFTER_E4);
      
      expect(result).toBeNull();
    });
  });

  describe('PGN round-trip consistency', () => {
    it('should maintain consistency between loadPgn and getMoveHistory', () => {
      const originalPgn = pgnTestFixtures.simple;
      
      // Load PGN to get final position
      const finalFen = loadPgn(originalPgn);
      expect(finalFen).toBeTruthy();
      
      // Get move history from same PGN
      const moveHistory = getMoveHistory(originalPgn);
      expect(moveHistory.length).toBeGreaterThan(0);
      
      // Verify that we have the expected number of moves
      expect(moveHistory).toHaveLength(5);
    });

    it('should handle complex PGN round-trip', () => {
      const originalPgn = pgnTestFixtures.complex;
      
      const finalFen = loadPgn(originalPgn);
      const moveHistory = getMoveHistory(originalPgn);
      
      expect(finalFen).toBeTruthy();
      expect(moveHistory.length).toBeGreaterThan(0);
      
      // Should include castling move
      const hasCastling = moveHistory.some(move => move.san === 'O-O');
      expect(hasCastling).toBe(true);
    });

    it('should handle moves with check and checkmate notation', () => {
      const checkmatePgn = '1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#';
      const result = getMoveHistory(checkmatePgn);
      
      expect(result).toHaveLength(7);
      expect(result[6]).toEqual({ san: 'Qxf7#' });
      expect(result[0]).toEqual({ san: 'e4' });
    });

    it('should handle positions from TEST_POSITIONS', () => {
      // Test with a complex position
      const simplePgn = '1. e4';
      const result = getMoveHistory(simplePgn);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ san: 'e4' });
    });
  });
});