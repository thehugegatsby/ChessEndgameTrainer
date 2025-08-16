/**
 * TDD Tests for MoveValidator
 * Tests the move validation logic extraction
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { IMoveValidator, IChessEngine } from '../types/interfaces';
import MoveValidator from '../services/MoveValidator';
import ChessEngine from '../services/ChessEngine';
import { TestPositions } from '../../../shared/testing/TestScenarios';

describe('MoveValidator', () => {
  let validator: IMoveValidator;
  let engine: IChessEngine;

  beforeEach(() => {
    validator = new MoveValidator();
    engine = new ChessEngine();
  });

  describe('validateMove', () => {
    it('should validate legal moves', () => {
      const result = validator.validateMove('e4', engine);
      expect(result).toBe(true);
    });

    it('should reject illegal moves', () => {
      const result = validator.validateMove('e5', engine);
      expect(result).toBe(false);
    });

    it('should validate object format moves', () => {
      const result = validator.validateMove({ from: 'e2', to: 'e4' }, engine);
      expect(result).toBe(true);
    });

    it('should reject invalid object moves', () => {
      const result = validator.validateMove({ from: 'e2', to: 'e5' }, engine);
      expect(result).toBe(false);
    });

    it('should not modify engine state during validation', () => {
      const fenBefore = engine.getFen();
      validator.validateMove('e4', engine);
      const fenAfter = engine.getFen();

      expect(fenAfter).toBe(fenBefore);
    });

    it('should validate moves in endgame positions', () => {
      const position = TestPositions.POSITION_1_OPPOSITION_BASICS;
      engine.initialize(position.fen);

      // Test first move from solution
      const result = validator.validateMove('Kf6', engine);
      expect(result).toBe(true);

      // Test illegal move
      const illegalResult = validator.validateMove('Kd8', engine);
      expect(illegalResult).toBe(false);
    });
  });

  describe('validatePromotion', () => {
    it('should validate white pawn promotion', () => {
      engine.initialize('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

      const result = validator.validatePromotion('a7', 'a8', 'q', engine);
      expect(result).toBe(true);
    });

    it('should validate black pawn promotion', () => {
      engine.initialize('4k3/8/8/8/8/8/p7/4K3 b - - 0 1');

      const result = validator.validatePromotion('a2', 'a1', 'q', engine);
      expect(result).toBe(true);
    });

    it('should reject promotion from wrong rank', () => {
      engine.initialize('4k3/8/P7/8/8/8/8/4K3 w - - 0 1');

      const result = validator.validatePromotion('a6', 'a7', 'q', engine);
      expect(result).toBe(false);
    });

    it('should reject invalid promotion pieces', () => {
      engine.initialize('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

      const result = validator.validatePromotion('a7', 'a8', 'k', engine);
      expect(result).toBe(false);
    });

    it('should accept all valid promotion pieces', () => {
      engine.initialize('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

      expect(validator.validatePromotion('a7', 'a8', 'q', engine)).toBe(true);
      expect(validator.validatePromotion('a7', 'a8', 'r', engine)).toBe(true);
      expect(validator.validatePromotion('a7', 'a8', 'b', engine)).toBe(true);
      expect(validator.validatePromotion('a7', 'a8', 'n', engine)).toBe(true);
    });

    it('should handle capture promotions', () => {
      engine.initialize('1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1');

      const result = validator.validatePromotion('a7', 'b8', 'q', engine);
      expect(result).toBe(true);
    });
  });

  describe('validateCastling', () => {
    it('should validate kingside castling', () => {
      engine.initialize('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

      const result = validator.validateCastling('O-O', engine);
      expect(result).toBe(true);
    });

    it('should validate queenside castling', () => {
      engine.initialize('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

      const result = validator.validateCastling('O-O-O', engine);
      expect(result).toBe(true);
    });

    it('should accept numeric notation', () => {
      engine.initialize('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

      expect(validator.validateCastling('0-0', engine)).toBe(true);
      expect(validator.validateCastling('0-0-0', engine)).toBe(true);
    });

    it('should reject castling when not allowed', () => {
      // Position where castling is not possible
      engine.initialize('4k3/8/8/8/8/8/8/4K3 w - - 0 1');

      const result = validator.validateCastling('O-O', engine);
      expect(result).toBe(false);
    });

    it('should reject castling through check', () => {
      // White king in check
      engine.initialize('r3k2r/8/8/8/8/8/4r3/R3K2R w KQkq - 0 1');

      const result = validator.validateCastling('O-O', engine);
      expect(result).toBe(false);
    });
  });

  describe('validateEnPassant', () => {
    it('should validate white en passant capture', () => {
      // Position after 1.e4 e6 2.e5 d5
      engine.initialize('rnbqkbnr/ppp2ppp/4p3/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');

      const result = validator.validateEnPassant('e5', 'd6', engine);
      expect(result).toBe(true);
    });

    it('should validate black en passant capture', () => {
      // Position where black can capture en passant
      engine.initialize('rnbqkbnr/pppp1ppp/8/8/3Pp3/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 2');

      const result = validator.validateEnPassant('e4', 'd3', engine);
      expect(result).toBe(true);
    });

    it('should reject en passant from wrong rank', () => {
      engine.initialize('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      const result = validator.validateEnPassant('e2', 'd3', engine);
      expect(result).toBe(false);
    });

    it('should reject non-diagonal en passant', () => {
      engine.initialize('rnbqkbnr/ppp2ppp/4p3/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');

      const result = validator.validateEnPassant('e5', 'e6', engine);
      expect(result).toBe(false);
    });

    it('should reject when target square is occupied', () => {
      engine.initialize('rnbqkbnr/ppp2ppp/3pp3/4P3/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3');

      const result = validator.validateEnPassant('e5', 'd6', engine);
      expect(result).toBe(false);
    });
  });

  describe('isValidSquare', () => {
    it('should validate correct square notation', () => {
      expect(validator.isValidSquare('e4')).toBe(true);
      expect(validator.isValidSquare('a1')).toBe(true);
      expect(validator.isValidSquare('h8')).toBe(true);
    });

    it('should reject invalid square notation', () => {
      expect(validator.isValidSquare('e9')).toBe(false);
      expect(validator.isValidSquare('i4')).toBe(false);
      expect(validator.isValidSquare('e0')).toBe(false);
      expect(validator.isValidSquare('44')).toBe(false);
      expect(validator.isValidSquare('ee')).toBe(false);
      expect(validator.isValidSquare('')).toBe(false);
    });
  });

  describe('hasPieceAt', () => {
    it('should detect pieces on squares', () => {
      expect(validator.hasPieceAt('e2', engine)).toBe(true);
      expect(validator.hasPieceAt('e1', engine)).toBe(true);
      expect(validator.hasPieceAt('a8', engine)).toBe(true);
    });

    it('should detect empty squares', () => {
      expect(validator.hasPieceAt('e4', engine)).toBe(false);
      expect(validator.hasPieceAt('d4', engine)).toBe(false);
      expect(validator.hasPieceAt('e5', engine)).toBe(false);
    });

    it('should handle invalid squares', () => {
      expect(validator.hasPieceAt('z9', engine)).toBe(false);
      expect(validator.hasPieceAt('', engine)).toBe(false);
    });
  });

  describe('getLegalMoves', () => {
    it('should get legal moves for a piece', () => {
      const moves = validator.getLegalMoves('e2', engine);

      expect(moves).toHaveLength(2);
      expect(moves[0]).toHaveProperty('from', 'e2');
      expect(moves[0]).toHaveProperty('san');
    });

    it('should return empty array for empty squares', () => {
      const moves = validator.getLegalMoves('e4', engine);

      expect(moves).toEqual([]);
    });

    it('should return empty array for invalid squares', () => {
      const moves = validator.getLegalMoves('z9', engine);

      expect(moves).toEqual([]);
    });

    it('should get moves for knights', () => {
      const moves = validator.getLegalMoves('b1', engine);

      expect(moves).toHaveLength(2);
      expect(moves.some(m => m.san === 'Nc3')).toBe(true);
      expect(moves.some(m => m.san === 'Na3')).toBe(true);
    });

    it('should handle endgame positions', () => {
      const position = TestPositions.POSITION_1_OPPOSITION_BASICS;
      engine.initialize(position.fen);

      // In this position (fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1")
      // The white king is on e6, black king on e8, white pawn on e5
      expect(validator.hasPieceAt('e6', engine)).toBe(true);

      const moves = validator.getLegalMoves('e6', engine);

      expect(moves.length).toBeGreaterThan(0);
      // Check available king moves
      expect(moves.some(m => m.san === 'Kf6' || m.san === 'Kd6' || m.san === 'Kf7')).toBe(true);
    });
  });

  describe('Complex validation scenarios', () => {
    it('should validate moves that avoid checkmate', () => {
      // Position where only one move avoids checkmate
      engine.initialize('rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 0 3');

      // White is in checkmate - no legal moves
      const moves = validator.getLegalMoves('e1', engine);
      expect(moves).toHaveLength(0);
    });

    it('should validate forced moves in check', () => {
      // White king in check with limited escape squares
      engine.initialize('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');

      const kingMoves = validator.getLegalMoves('e1', engine);

      // King can only move to certain squares
      expect(kingMoves.length).toBeGreaterThan(0);
      expect(validator.validateMove('Kd1', engine)).toBe(true);
      expect(validator.validateMove('Kf1', engine)).toBe(true);

      // Ke2 is actually a legal move since the king can block the check
      // by moving to e2 (the rook is on e2, not e3)
      // Let's test an actually illegal move
      expect(validator.validateMove('Ke3', engine)).toBe(false); // Can't move to e3
    });

    it('should validate pinned piece restrictions', () => {
      // Bishop pinned by rook
      engine.initialize('4k3/8/8/8/8/2b5/8/R3K3 w - - 0 1');

      // Move rook to pin the bishop
      engine.move('Ra3');

      // Bishop is pinned and has limited moves
      const bishopMoves = validator.getLegalMoves('c3', engine);

      // Bishop can only move along the pin line
      expect(
        bishopMoves.every(
          m =>
            m.to === 'a1' ||
            m.to === 'b2' ||
            m.to === 'd4' ||
            m.to === 'e5' ||
            m.to === 'f6' ||
            m.to === 'g7' ||
            m.to === 'h8'
        )
      ).toBe(true);
    });
  });
});
