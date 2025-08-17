/**
 * @file AdapterValidation.test.ts
 * @description Critical legacy tests run through ChessEngineAdapter
 * 
 * TEMPORARY: These tests validate domain ChessEngine through legacy interface
 * Purpose: Ensure domain engine matches legacy behavior for core functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { IChessEngine } from '@features/chess-core/types/interfaces';
import { ChessEngineAdapter } from '../ChessEngineAdapter';

describe('ChessEngineAdapter - Critical Legacy Validation', () => {
  let engine: IChessEngine;

  beforeEach(() => {
    engine = new ChessEngineAdapter();
  });

  describe('Core Position Management', () => {
    it('should initialize with default starting position', () => {
      const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      expect(engine.getFen()).toBe(defaultFen);
    });

    it('should initialize with custom FEN position', () => {
      const customFen = '8/8/8/3k4/3K4/8/8/8 w - - 0 1';
      const result = engine.initialize(customFen);

      expect(result).toBe(true);
      expect(engine.getFen()).toBe(customFen);
    });

    it('should reject invalid FEN positions', () => {
      const invalidFen = 'invalid fen string';
      const result = engine.initialize(invalidFen);

      expect(result).toBe(false);
    });

    it('should reset to initialized position', () => {
      const customFen = '8/8/8/3k4/3K4/8/8/8 w - - 0 1';
      engine.initialize(customFen);

      // Make a move to change position
      engine.move('Kd5');
      expect(engine.getFen()).not.toBe(customFen);

      // Reset should restore the initialized position
      engine.reset();
      expect(engine.getFen()).toBe(customFen);
    });
  });

  describe('Core Move Operations', () => {
    it('should execute valid moves in object format', () => {
      const move = engine.move({ from: 'e2', to: 'e4' });

      expect(move).toBeDefined();
      expect(move?.from).toBe('e2');
      expect(move?.to).toBe('e4');
      expect(move?.san).toBe('e4');
    });

    it('should execute valid moves in SAN format', () => {
      const move = engine.move('e4');

      expect(move).toBeDefined();
      expect(move?.san).toBe('e4');
    });

    it('should reject invalid moves', () => {
      const move = engine.move({ from: 'e2', to: 'e5' });

      expect(move).toBeNull();
    });

    it('should handle promotion moves', () => {
      engine.initialize('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      const move = engine.move({ from: 'a7', to: 'a8', promotion: 'q' });

      expect(move).toBeDefined();
      expect(move?.promotion).toBe('q');
    });

    it('should undo moves', () => {
      const fenBefore = engine.getFen();
      engine.move('e4');
      const undone = engine.undo();

      expect(undone).toBeDefined();
      expect(undone?.san).toBe('e4');
      expect(engine.getFen()).toBe(fenBefore);
    });
  });

  describe('Game State Detection', () => {
    it('should detect checkmate', () => {
      engine.initialize('rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3');

      expect(engine.isCheckmate()).toBe(true);
      expect(engine.isGameOver()).toBe(true);
      expect(engine.isCheck()).toBe(true);
    });

    it('should detect stalemate', () => {
      engine.initialize('7k/8/6Q1/8/8/8/8/K7 b - - 0 1');

      expect(engine.isStalemate()).toBe(true);
      expect(engine.isGameOver()).toBe(true);
      expect(engine.isDraw()).toBe(true);
    });

    it('should detect check', () => {
      engine.initialize('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');

      expect(engine.isCheck()).toBe(true);
      expect(engine.isCheckmate()).toBe(false);
      expect(engine.turn()).toBe('w');

      // White can escape by moving king to d1
      const move = engine.move('Kd1');
      expect(move).toBeDefined();
      expect(engine.isCheck()).toBe(false);
    });

    it('should track turn correctly', () => {
      expect(engine.turn()).toBe('w');

      engine.move('e4');
      expect(engine.turn()).toBe('b');

      engine.move('e5');
      expect(engine.turn()).toBe('w');
    });
  });

  describe('Move Generation', () => {
    it('should generate all legal moves', () => {
      const moves = engine.moves();
      
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    it('should generate moves for specific square', () => {
      const moves = engine.moves({ square: 'e2' });
      
      expect(Array.isArray(moves)).toBe(true);
      // Should have at least e3 and e4 for pawn
      expect(moves.length).toBeGreaterThan(0);
    });

    it('should return verbose move objects when requested', () => {
      const moves = engine.moves({ verbose: true }) as any[];
      
      expect(Array.isArray(moves)).toBe(true);
      if (moves.length > 0) {
        expect(moves[0]).toHaveProperty('from');
        expect(moves[0]).toHaveProperty('to');
      }
    });
  });
});