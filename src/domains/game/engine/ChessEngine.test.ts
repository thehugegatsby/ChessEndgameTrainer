/**
 * @file ChessEngine Test Contract
 * @description Comprehensive tests for ChessEngine implementation
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
});