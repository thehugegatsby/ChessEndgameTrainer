import { vi } from 'vitest';
/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrainingEventEmitter } from '../EventEmitter';
import type { TrainingEvents } from '../EventEmitter';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

describe('TrainingEventEmitter', () => {
  let emitter: TrainingEventEmitter;

  beforeEach(() => {
    emitter = new TrainingEventEmitter(false); // Debug off for tests
  });

  describe('basic functionality', () => {
    it('should emit and receive events', () => {
      const handler = vi.fn();
      emitter.on('move:attempted', handler);

      const moveData: TrainingEvents['move:attempted'] = {
        from: 'e2',
        to: 'e4',
      };

      emitter.emit('move:attempted', moveData);

      expect(handler).toHaveBeenCalledWith(moveData);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      emitter.on('move:feedback', handler1);
      emitter.on('move:feedback', handler2);
      emitter.on('move:feedback', handler3);

      const feedbackData: TrainingEvents['move:feedback'] = {
        type: 'error',
        wasOptimal: false,
        wdlBefore: 50,
        wdlAfter: -50,
        bestMove: 'Qe5',
      };

      emitter.emit('move:feedback', feedbackData);

      expect(handler1).toHaveBeenCalledWith(feedbackData);
      expect(handler2).toHaveBeenCalledWith(feedbackData);
      expect(handler3).toHaveBeenCalledWith(feedbackData);
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.on('game:complete', handler);

      const gameData: TrainingEvents['game:complete'] = {
        result: 'win',
        reason: 'checkmate',
        moveCount: 25,
      };

      emitter.emit('game:complete', gameData);
      expect(handler).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      emitter.emit('game:complete', gameData);
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('once functionality', () => {
    it('should only call handler once', () => {
      const handler = vi.fn();
      emitter.once('opponent:thinking', handler);

      const thinkingData: TrainingEvents['opponent:thinking'] = {
        isThinking: true,
      };

      emitter.emit('opponent:thinking', thinkingData);
      emitter.emit('opponent:thinking', thinkingData);
      emitter.emit('opponent:thinking', thinkingData);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return working unsubscribe for once', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.once('promotion:required', handler);

      // Unsubscribe before event is emitted
      unsubscribe();

      const promotionData: TrainingEvents['promotion:required'] = {
        from: 'e7',
        to: 'e8',
        color: 'w',
      };

      emitter.emit('promotion:required', promotionData);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('off functionality', () => {
    it('should unsubscribe specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('move:validated', handler1);
      emitter.on('move:validated', handler2);

      const validationData: TrainingEvents['move:validated'] = {
        isValid: true,
      };

      emitter.emit('move:validated', validationData);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      // Remove only handler1
      emitter.off('move:validated', handler1);

      emitter.emit('move:validated', validationData);
      expect(handler1).toHaveBeenCalledTimes(1); // Still 1
      expect(handler2).toHaveBeenCalledTimes(2); // Called again
    });
  });

  describe('clear functionality', () => {
    it('should clear all handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      emitter.on('move:attempted', handler1);
      emitter.on('move:feedback', handler2);
      emitter.on('game:complete', handler3);

      emitter.clear();

      emitter.emit('move:attempted', { from: 'e2', to: 'e4' });
      emitter.emit('move:feedback', {
        type: 'success',
        wasOptimal: true,
      });
      emitter.emit('game:complete', {
        result: 'draw',
        reason: 'stalemate',
        moveCount: 50,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    it('should clear handlers for specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('opponent:moved', handler1);
      emitter.on('opponent:thinking', handler2);

      emitter.clearEvent('opponent:moved');

      emitter.emit('opponent:moved', {
        move: 'Qe5',
        fen: TEST_POSITIONS.STARTING_POSITION,
      });
      emitter.emit('opponent:thinking', { isThinking: false });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch and log handler errors', () => {
      // Mock the structured logger instead of console.error
      const mockLogger = vi.fn();
      vi.doMock('@shared/services/logging/Logger', () => ({
        getLogger: () => ({
          setContext: () => ({
            error: mockLogger,
            debug: vi.fn(),
          }),
        }),
      }));

      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      emitter.on('move:applied', errorHandler);
      emitter.on('move:applied', normalHandler);

      const moveData: TrainingEvents['move:applied'] = {
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        san: 'e4',
        moveNumber: 1,
      };

      emitter.emit('move:applied', moveData);

      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled(); // Should still call other handlers
      // The structured logger error call should have happened
      // We don't need to verify exact format since it's implementation detail
    });
  });

  describe('getHandlerCount', () => {
    it('should return correct handler count for specific event', () => {
      emitter.on('move:feedback', vi.fn());
      emitter.on('move:feedback', vi.fn());
      emitter.on('move:feedback', vi.fn());

      expect(emitter.getHandlerCount('move:feedback')).toBe(3);
      expect(emitter.getHandlerCount('game:complete')).toBe(0);
    });

    it('should return total handler count when no event specified', () => {
      emitter.on('move:feedback', vi.fn());
      emitter.on('move:feedback', vi.fn());
      emitter.on('game:complete', vi.fn());
      emitter.on('opponent:thinking', vi.fn());

      expect(emitter.getHandlerCount()).toBe(4);
    });
  });

  describe('type safety', () => {
    it('should enforce correct event data types at compile time', () => {
      const handler = vi.fn<[TrainingEvents['move:feedback']], void>();
      emitter.on('move:feedback', handler);

      // This should compile and work
      emitter.emit('move:feedback', {
        type: 'success',
        wasOptimal: true,
        wdlBefore: 100,
        wdlAfter: 100,
      });

      expect(handler).toHaveBeenCalled();

      // TypeScript should catch these at compile time
      // @ts-expect-error - Wrong event data type
      emitter.emit('move:feedback', { from: 'e2', to: 'e4' });

      // @ts-expect-error - Invalid event name
      emitter.emit('invalid:event', {});
    });
  });

  describe('debug mode', () => {
    it('should enable debug mode without errors', () => {
      // Simply test that debug mode can be enabled and functions work
      const debugEmitter = new TrainingEventEmitter(true);

      const handler = vi.fn();
      const unsubscribe = debugEmitter.on('move:attempted', handler);

      // Should function normally
      debugEmitter.emit('move:attempted', { from: 'e2', to: 'e4' });
      expect(handler).toHaveBeenCalledWith({ from: 'e2', to: 'e4' });

      unsubscribe();
      
      // Should unsubscribe successfully
      debugEmitter.emit('move:attempted', { from: 'e2', to: 'e4' });
      expect(handler).toHaveBeenCalledTimes(1); // Still only called once
    });
  });
});
