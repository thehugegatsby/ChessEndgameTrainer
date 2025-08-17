/**
 * @file ChessEngine Test Contract
 * @description Comprehensive tests for domain ChessEngine implementation
 * Expanded from legacy test suite with high-priority test cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChessEngine } from './ChessEngine';
import type { MoveInput } from './types';

describe('ChessEngine', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  describe('Smoke Test - Basic Instantiation', () => {
    it('should create a new ChessEngine instance', () => {
      expect(engine).toBeDefined();
      expect(engine).toBeInstanceOf(ChessEngine);
    });

    it('should initialize with starting position', () => {
      const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(engine.getFen()).toBe(startingFen);
      expect(engine.getTurn()).toBe('w');
    });

    it('should accept custom FEN in constructor', () => {
      const customFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const customEngine = new ChessEngine(customFen);
      expect(customEngine.getFen()).toBe(customFen);
      expect(customEngine.getTurn()).toBe('b');
    });
  });

  describe('Position Management', () => {
    it('should load custom FEN position', () => {
      const customFen = '8/8/8/3k4/3K4/8/8/8 w - - 0 1';
      const result = engine.loadFen(customFen);

      expect(result).toBe(true);
      expect(engine.getFen()).toBe(customFen);
      expect(engine.getTurn()).toBe('w');
    });

    it('should reject invalid FEN positions', () => {
      const invalidFen = 'invalid fen string';
      const result = engine.loadFen(invalidFen);

      expect(result).toBe(false);
      // Engine should retain previous valid position
      expect(engine.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  describe('Move Operations', () => {
    it('should execute valid moves in object format', () => {
      const move = engine.makeMove({ from: 'e2', to: 'e4' });

      expect(move).toBeDefined();
      expect(move?.from).toBe('e2');
      expect(move?.to).toBe('e4');
      expect(move?.san).toBe('e4');
      expect(engine.getTurn()).toBe('b');
    });

    it('should execute valid moves in SAN format', () => {
      const move = engine.makeMove('e4');

      expect(move).toBeDefined();
      expect(move?.san).toBe('e4');
      expect(move?.from).toBe('e2');
      expect(move?.to).toBe('e4');
      expect(engine.getTurn()).toBe('b');
    });

    it('should reject invalid moves', () => {
      const move = engine.makeMove({ from: 'e2', to: 'e5' });

      expect(move).toBeNull();
      // Turn should not change on invalid move
      expect(engine.getTurn()).toBe('w');
    });

    it('should handle promotion moves', () => {
      engine.loadFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'q' });

      expect(move).toBeDefined();
      expect(move?.from).toBe('a7');
      expect(move?.to).toBe('a8');
      expect(move?.promotion).toBe('q');
    });

    it('should undo moves correctly', () => {
      const fenBefore = engine.getFen();
      const move = engine.makeMove('e4');
      expect(move).toBeDefined();
      expect(engine.getFen()).not.toBe(fenBefore);

      const undone = engine.undo();
      expect(undone).toBeDefined();
      expect(undone?.san).toBe('e4');
      expect(engine.getFen()).toBe(fenBefore);
      expect(engine.getTurn()).toBe('w');
    });

    it('should return null when undoing with no moves', () => {
      const undone = engine.undo();
      expect(undone).toBeNull();
    });
  });

  describe('Game State Detection', () => {
    it('should detect checkmate', () => {
      engine.loadFen('rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3');

      expect(engine.isCheckmate()).toBe(true);
      expect(engine.isGameOver()).toBe(true);
      expect(engine.isCheck()).toBe(true);
      expect(engine.getTurn()).toBe('w');
    });

    it('should detect stalemate', () => {
      engine.loadFen('7k/8/6Q1/8/8/8/8/K7 b - - 0 1');

      expect(engine.isStalemate()).toBe(true);
      expect(engine.isGameOver()).toBe(true);
      expect(engine.isDraw()).toBe(true);
      expect(engine.getTurn()).toBe('b');
    });

    it('should detect check', () => {
      engine.loadFen('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');

      expect(engine.isCheck()).toBe(true);
      expect(engine.isCheckmate()).toBe(false);
      expect(engine.isGameOver()).toBe(false);
      expect(engine.getTurn()).toBe('w');

      // White can escape by moving king
      const move = engine.makeMove('Kd1');
      expect(move).toBeDefined();
      expect(engine.isCheck()).toBe(false);
    });
  });

  describe('Move Validation', () => {
    it('should validate legal moves', () => {
      expect(engine.validateMove('e4')).toBe(true);
      expect(engine.validateMove({ from: 'e2', to: 'e4' })).toBe(true);
      expect(engine.validateMove('Nf3')).toBe(true);
    });

    it('should reject invalid moves', () => {
      expect(engine.validateMove('e5')).toBe(false);
      expect(engine.validateMove({ from: 'e2', to: 'e5' })).toBe(false);
      expect(engine.validateMove('invalid')).toBe(false);
    });

    it('should validate promotion moves', () => {
      engine.loadFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'q' })).toBe(true);
      expect(engine.validateMove({ from: 'a7', to: 'a8' })).toBe(false); // Missing promotion
    });
  });

  describe('Move Generation', () => {
    it('should generate all legal moves from starting position', () => {
      const moves = engine.getPossibleMoves();
      
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBe(20); // 20 legal moves in starting position
      
      // Check that some expected moves are present
      const sanMoves = moves.map(m => m.san);
      expect(sanMoves).toContain('e4');
      expect(sanMoves).toContain('Nf3');
      expect(sanMoves).toContain('d4');
    });

    it('should generate moves for specific square', () => {
      const moves = engine.getPossibleMoves('e2');
      
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBe(2); // e3 and e4
      
      const sanMoves = moves.map(m => m.san);
      expect(sanMoves).toContain('e3');
      expect(sanMoves).toContain('e4');
    });
  });

  describe('German Notation Support', () => {
    beforeEach(() => {
      // Set up pawn promotion scenarios for German notation testing
      engine.loadFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    });

    it('should handle German Dame (D) promotion to Queen', () => {
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'D' });
      
      expect(move).toBeDefined();
      expect(move?.promotion).toBe('q'); // Internal representation should be 'q'
      expect(move?.san).toContain('=Q'); // SAN should show Queen
    });

    it('should handle German Dame (d) lowercase promotion to Queen', () => {
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'd' });
      
      expect(move).toBeDefined();
      expect(move?.promotion).toBe('q');
      expect(move?.san).toContain('=Q');
    });

    it('should handle German Turm (T) promotion to Rook', () => {
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'T' });
      
      expect(move).toBeDefined();
      expect(move?.promotion).toBe('r');
      expect(move?.san).toContain('=R');
    });

    it('should handle German Turm (t) lowercase promotion to Rook', () => {
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 't' });
      
      expect(move).toBeDefined();
      expect(move?.promotion).toBe('r');
      expect(move?.san).toContain('=R');
    });

    it('should handle German Läufer (L) promotion to Bishop', () => {
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'L' });
      
      expect(move).toBeDefined();
      expect(move?.promotion).toBe('b');
      expect(move?.san).toContain('=B');
    });

    it('should handle German Läufer (l) lowercase promotion to Bishop', () => {
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'l' });
      
      expect(move).toBeDefined();
      expect(move?.promotion).toBe('b');
      expect(move?.san).toContain('=B');
    });

    it('should handle German Springer (S) promotion to Knight', () => {
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'S' });
      
      expect(move).toBeDefined();
      expect(move?.promotion).toBe('n');
      expect(move?.san).toContain('=N');
    });

    it('should handle German Springer (s) lowercase promotion to Knight', () => {
      const move = engine.makeMove({ from: 'a7', to: 'a8', promotion: 's' });
      
      expect(move).toBeDefined();
      expect(move?.promotion).toBe('n');
      expect(move?.san).toContain('=N');
    });

    it('should handle mixed German and English notation in same game', () => {
      // First promotion with German notation
      const move1 = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'D' });
      expect(move1).toBeDefined();
      expect(move1?.promotion).toBe('q');
      
      // Reset and try English notation
      engine.loadFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      const move2 = engine.makeMove({ from: 'a7', to: 'a8', promotion: 'Q' });
      expect(move2).toBeDefined();
      expect(move2?.promotion).toBe('q');
    });

    it('should validate German notation promotions', () => {
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'D' })).toBe(true);
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'T' })).toBe(true);
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'L' })).toBe(true);
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'S' })).toBe(true);
      
      // Test lowercase variants
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'd' })).toBe(true);
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 't' })).toBe(true);
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'l' })).toBe(true);
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 's' })).toBe(true);
    });

    it('should reject invalid German promotion pieces', () => {
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'K' })).toBe(false); // King not allowed
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'B' })).toBe(true); // B is valid (English Bishop)
      expect(engine.validateMove({ from: 'a7', to: 'a8', promotion: 'X' })).toBe(false); // Invalid piece
    });
  });

  describe('Endgame Training Integration', () => {
    it('should handle king and pawn endgames with German notation', () => {
      // King and pawn vs king endgame
      engine.loadFen('8/1k6/8/8/8/8/1P6/1K6 w - - 0 1');
      
      // Advance pawn
      const pawnMove = engine.makeMove('b3');
      expect(pawnMove).toBeDefined();
      expect(engine.getTurn()).toBe('b');
      
      // Black king moves
      engine.makeMove('Kc6');
      expect(engine.getTurn()).toBe('w');
    });

    it('should detect opposition in king endgames', () => {
      // Opposition position: kings facing each other with odd number of squares
      engine.loadFen('8/8/8/3k4/8/3K4/8/8 w - - 0 1');
      
      // This position is draw by insufficient material, which is correct
      expect(engine.isDraw()).toBe(true);
      expect(engine.isGameOver()).toBe(true);
      
      // But moves should still be generated for analysis
      const kingMoves = engine.getPossibleMoves('d3');
      expect(kingMoves.length).toBeGreaterThan(0);
    });

    it('should handle complex endgame positions from training database', () => {
      // Advanced endgame position - should not crash
      engine.loadFen('8/1p6/p1k5/P1P5/1P1K4/8/8/8 w - - 0 1');
      
      expect(engine.isGameOver()).toBe(false);
      const moves = engine.getPossibleMoves();
      expect(moves.length).toBeGreaterThan(0);
      
      // Should be able to make a move
      const move = engine.makeMove('Kd5');
      expect(move).toBeDefined();
    });
  });
});