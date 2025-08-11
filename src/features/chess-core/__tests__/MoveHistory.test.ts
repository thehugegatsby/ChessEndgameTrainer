/**
 * Tests for MoveHistory service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IMoveHistory } from '../types/interfaces';
import type { ValidatedMove } from '@shared/types/chess';
import MoveHistory from '../services/MoveHistory';

// Helper function to create a mock ValidatedMove
function createMockMove(
  san: string,
  from: string,
  to: string,
  fenBefore: string,
  fenAfter: string
): ValidatedMove {
  return {
    san,
    from,
    to,
    color: 'w',
    piece: 'p',
    flags: '',
    fenBefore,
    fenAfter,
    captured: undefined,
    promotion: undefined,
    before: undefined,
    after: undefined,
    lan: `${from}${to}`,
  };
}

describe('MoveHistory', () => {
  let history: IMoveHistory;
  
  const move1 = createMockMove(
    'e4',
    'e2',
    'e4',
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
  );
  
  const move2 = createMockMove(
    'e5',
    'e7',
    'e5',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
  );
  
  const move3 = createMockMove(
    'Nf3',
    'g1',
    'f3',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2'
  );
  
  beforeEach(() => {
    history = new MoveHistory();
  });
  
  describe('Basic Operations', () => {
    it('should start with empty history', () => {
      expect(history.getMoves()).toEqual([]);
      expect(history.getCurrentIndex()).toBe(-1);
      expect(history.getLength()).toBe(0);
    });
    
    it('should add moves to history', () => {
      history.addMove(move1);
      
      expect(history.getMoves()).toHaveLength(1);
      expect(history.getCurrentIndex()).toBe(0);
      expect(history.getMove(0)).toEqual(move1);
    });
    
    it('should clear history', () => {
      history.addMove(move1);
      history.addMove(move2);
      history.clear();
      
      expect(history.getMoves()).toEqual([]);
      expect(history.getCurrentIndex()).toBe(-1);
    });
  });
  
  describe('Navigation', () => {
    beforeEach(() => {
      history.addMove(move1);
      history.addMove(move2);
      history.addMove(move3);
    });
    
    it('should check if can undo', () => {
      expect(history.canUndo()).toBe(true);
      
      history.clear();
      expect(history.canUndo()).toBe(false);
    });
    
    it('should check if can redo', () => {
      expect(history.canRedo()).toBe(false);
      
      history.setPosition(1);
      expect(history.canRedo()).toBe(true);
    });
    
    it('should go back and forward', () => {
      expect(history.getCurrentIndex()).toBe(2);
      
      expect(history.goBack()).toBe(true);
      expect(history.getCurrentIndex()).toBe(1);
      
      expect(history.goBack()).toBe(true);
      expect(history.getCurrentIndex()).toBe(0);
      
      expect(history.goBack()).toBe(true);
      expect(history.getCurrentIndex()).toBe(-1);
      
      expect(history.goBack()).toBe(false);
      expect(history.getCurrentIndex()).toBe(-1);
      
      expect(history.goForward()).toBe(true);
      expect(history.getCurrentIndex()).toBe(0);
      
      expect(history.goForward()).toBe(true);
      expect(history.getCurrentIndex()).toBe(1);
    });
    
    it('should set position', () => {
      history.setPosition(1);
      expect(history.getCurrentIndex()).toBe(1);
      
      history.setPosition(-5);
      expect(history.getCurrentIndex()).toBe(-1);
      
      history.setPosition(10);
      expect(history.getCurrentIndex()).toBe(2);
    });
    
    it('should check if at start or end', () => {
      expect(history.isAtStart()).toBe(false);
      expect(history.isAtEnd()).toBe(true);
      
      history.setPosition(-1);
      expect(history.isAtStart()).toBe(true);
      expect(history.isAtEnd()).toBe(false);
      
      history.setPosition(1);
      expect(history.isAtStart()).toBe(false);
      expect(history.isAtEnd()).toBe(false);
    });
  });
  
  describe('Move Truncation', () => {
    beforeEach(() => {
      history.addMove(move1);
      history.addMove(move2);
      history.addMove(move3);
    });
    
    it('should truncate future moves when adding from middle', () => {
      history.setPosition(1);
      expect(history.getMoves()).toHaveLength(3);
      
      const newMove = createMockMove(
        'Nc6',
        'b8',
        'c6',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2'
      );
      
      history.addMove(newMove);
      
      expect(history.getMoves()).toHaveLength(3);
      expect(history.getMove(2)).toEqual(newMove);
      expect(history.getMove(2)).not.toEqual(move3);
      expect(history.getCurrentIndex()).toBe(2);
    });
    
    it('should warn when discarding future moves', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      history.setPosition(0); // Go back to first move
      expect(history.getMoves()).toHaveLength(3);
      
      const newMove = createMockMove(
        'Nc6',
        'b8',
        'c6',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2'
      );
      
      history.addMove(newMove);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Discarding 2 future move(s) from history');
      expect(history.getMoves()).toHaveLength(2);
      
      consoleWarnSpy.mockRestore();
    });
    
    it('should explicitly truncate after current', () => {
      history.setPosition(1);
      history.truncateAfterCurrent();
      
      expect(history.getMoves()).toHaveLength(2);
      expect(history.getMove(0)).toEqual(move1);
      expect(history.getMove(1)).toEqual(move2);
      expect(history.getMove(2)).toBeUndefined();
    });
  });
  
  describe('FEN Tracking', () => {
    beforeEach(() => {
      history.addMove(move1);
      history.addMove(move2);
      history.addMove(move3);
    });
    
    it('should get FEN at index', () => {
      expect(history.getFenAtIndex(-1)).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
      expect(history.getFenAtIndex(0)).toBe(move1.fenAfter);
      expect(history.getFenAtIndex(1)).toBe(move2.fenAfter);
      expect(history.getFenAtIndex(2)).toBe(move3.fenAfter);
      expect(history.getFenAtIndex(3)).toBeUndefined();
    });
    
    it('should get FEN before current position', () => {
      history.setPosition(2);
      expect(history.getFenBeforeCurrent()).toBe(move2.fenAfter);
      
      history.setPosition(1);
      expect(history.getFenBeforeCurrent()).toBe(move1.fenAfter);
      
      history.setPosition(0);
      expect(history.getFenBeforeCurrent()).toBe(move1.fenBefore);
      
      history.setPosition(-1);
      expect(history.getFenBeforeCurrent()).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });
    
    it('should get FEN after current position', () => {
      history.setPosition(0);
      expect(history.getFenAfterCurrent()).toBe(move1.fenAfter);
      
      history.setPosition(1);
      expect(history.getFenAfterCurrent()).toBe(move2.fenAfter);
      
      history.setPosition(-1);
      expect(history.getFenAfterCurrent()).toBeUndefined();
    });
    
    it('should handle initial FEN', () => {
      const customFen = '8/8/8/3k4/3K4/8/8/8 w - - 0 1';
      history.setInitialFen(customFen);
      
      expect(history.getInitialFen()).toBe(customFen);
      expect(history.getFenAtIndex(-1)).toBe(customFen);
      
      history.setPosition(-1);
      expect(history.getFenBeforeCurrent()).toBe(customFen);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty history navigation', () => {
      expect(history.goBack()).toBe(false);
      expect(history.goForward()).toBe(false);
      expect(history.getFenBeforeCurrent()).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
      expect(history.getFenAfterCurrent()).toBeUndefined();
    });
    
    it('should validate FEN when setting initial position', () => {
      const validFen = '8/8/8/3k4/3K4/8/8/8 w - - 0 1';
      const invalidFen = 'invalid fen string';
      
      // Valid FEN should work
      expect(() => history.setInitialFen(validFen)).not.toThrow();
      expect(history.getInitialFen()).toBe(validFen);
      
      // Invalid FEN should throw
      expect(() => history.setInitialFen(invalidFen)).toThrow('Cannot set invalid FEN');
    });
    
    it('should handle non-integer indices in getFenAtIndex', () => {
      history.addMove(move1);
      
      expect(history.getFenAtIndex(NaN)).toBeUndefined();
      expect(history.getFenAtIndex(Infinity)).toBeUndefined();
      expect(history.getFenAtIndex(-Infinity)).toBeUndefined();
      expect(history.getFenAtIndex(0.5)).toBeUndefined();
    });
    
    it('should handle single move', () => {
      history.addMove(move1);
      
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
      expect(history.isAtEnd()).toBe(true);
      expect(history.isAtStart()).toBe(false);
    });
    
    it('should return copies of moves array', () => {
      history.addMove(move1);
      const moves1 = history.getMoves();
      const moves2 = history.getMoves();
      
      expect(moves1).not.toBe(moves2);
      expect(moves1).toEqual(moves2);
      
      moves1.push(move2);
      expect(history.getMoves()).toHaveLength(1);
    });
    
    it('should handle invalid indices', () => {
      history.addMove(move1);
      
      expect(history.getMove(-1)).toBeUndefined();
      expect(history.getMove(5)).toBeUndefined();
      expect(history.getFenAtIndex(-2)).toBeUndefined();
      expect(history.getFenAtIndex(10)).toBeUndefined();
    });
  });
});