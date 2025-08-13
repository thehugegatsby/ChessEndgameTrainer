import { vi } from 'vitest';
/**
 * Tests for ChessEventBus service
 * Tests event subscription, emission, and management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IChessEventBus, ChessEventHandler, ChessEventPayload } from '../types/interfaces';
import ChessEventBus from '../services/ChessEventBus';

describe('ChessEventBus', () => {
  let eventBus: IChessEventBus;
  
  beforeEach(() => {
    eventBus = new ChessEventBus();
  });
  
  describe('Subscription', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe(handler);
      
      expect(eventBus.getListenerCount()).toBe(1);
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe(handler);
      
      expect(eventBus.getListenerCount()).toBe(1);
      
      unsubscribe();
      
      expect(eventBus.getListenerCount()).toBe(0);
    });
    
    it('should handle multiple subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      
      eventBus.subscribe(handler1);
      eventBus.subscribe(handler2);
      eventBus.subscribe(handler3);
      
      expect(eventBus.getListenerCount()).toBe(3);
    });
    
    it('should throw error for invalid handler', () => {
      expect(() => {
        eventBus.subscribe(null as any);
      }).toThrow('Event handler must be a function');
      
      expect(() => {
        eventBus.subscribe('not a function' as any);
      }).toThrow('Event handler must be a function');
    });
    
    it('should not add duplicate handlers', () => {
      const handler = vi.fn();
      
      eventBus.subscribe(handler);
      eventBus.subscribe(handler); // Same handler again
      
      expect(eventBus.getListenerCount()).toBe(1);
    });
  });
  
  describe('Event Emission', () => {
    it('should emit events to all subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.subscribe(handler1);
      eventBus.subscribe(handler2);
      
      const event: ChessEventPayload = {
        type: 'move',
        payload: {
          move: { from: 'e2', to: 'e4' },
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          isCheck: false,
          isCheckmate: false,
          isStalemate: false,
          isDraw: false,
          moveNumber: 1,
          currentMoveIndex: 0,
          source: 'move'
        }
      };
      
      eventBus.emit(event);
      
      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors in handlers gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      eventBus.subscribe(errorHandler);
      eventBus.subscribe(normalHandler);
      
      const event: ChessEventPayload = {
        type: 'reset',
        payload: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          source: 'reset'
        }
      };
      
      eventBus.emit(event);
      
      expect(errorHandler).toHaveBeenCalledWith(event);
      expect(normalHandler).toHaveBeenCalledWith(event);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error in event handler:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
    
    it('should not emit when disabled', () => {
      const handler = vi.fn();
      eventBus.subscribe(handler);
      
      eventBus.setEnabled(false);
      
      const event: ChessEventPayload = {
        type: 'stateUpdate',
        payload: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          source: 'load'
        }
      };
      
      eventBus.emit(event);
      
      expect(handler).not.toHaveBeenCalled();
    });
    
    it('should emit when re-enabled', () => {
      const handler = vi.fn();
      eventBus.subscribe(handler);
      
      eventBus.setEnabled(false);
      eventBus.setEnabled(true);
      
      const event: ChessEventPayload = {
        type: 'stateUpdate',
        payload: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          source: 'undo'
        }
      };
      
      eventBus.emit(event);
      
      expect(handler).toHaveBeenCalledWith(event);
    });
  });
  
  describe('Event History', () => {
    it('should maintain event history', () => {
      const event1: ChessEventPayload = {
        type: 'move',
        payload: { fen: 'fen1', source: 'move' }
      };
      
      const event2: ChessEventPayload = {
        type: 'reset',
        payload: { fen: 'fen2', source: 'reset' }
      };
      
      eventBus.emit(event1);
      eventBus.emit(event2);
      
      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(event1);
      expect(history[1]).toEqual(event2);
    });
    
    it('should limit history size', () => {
      // Emit more than MAX_HISTORY_SIZE (100) events
      for (let i = 0; i < 150; i++) {
        eventBus.emit({
          type: 'move',
          payload: { fen: `fen${i}`, source: 'move' }
        });
      }
      
      const history = eventBus.getHistory();
      expect(history).toHaveLength(100);
      expect(history[0].payload.fen).toBe('fen50'); // First 50 should be dropped
      expect(history[99].payload.fen).toBe('fen149'); // Last should be most recent
    });
    
    it('should clear history', () => {
      eventBus.emit({
        type: 'move',
        payload: { fen: 'test', source: 'move' }
      });
      
      expect(eventBus.getHistory()).toHaveLength(1);
      
      eventBus.clearHistory();
      
      expect(eventBus.getHistory()).toHaveLength(0);
    });
    
    it('should get last event', () => {
      const event1: ChessEventPayload = {
        type: 'move',
        payload: { fen: 'fen1', source: 'move' }
      };
      
      const event2: ChessEventPayload = {
        type: 'reset',
        payload: { fen: 'fen2', source: 'reset' }
      };
      
      eventBus.emit(event1);
      eventBus.emit(event2);
      
      expect(eventBus.getLastEvent()).toEqual(event2);
    });
    
    it('should filter events by type', () => {
      eventBus.emit({ type: 'move', payload: { fen: 'fen1', source: 'move' } });
      eventBus.emit({ type: 'reset', payload: { fen: 'fen2', source: 'reset' } });
      eventBus.emit({ type: 'move', payload: { fen: 'fen3', source: 'move' } });
      eventBus.emit({ type: 'error', payload: { error: new Error('test'), message: 'Test error' } });
      
      const moveEvents = eventBus.getEventsByType('move');
      expect(moveEvents).toHaveLength(2);
      expect(moveEvents[0].payload.fen).toBe('fen1');
      expect(moveEvents[1].payload.fen).toBe('fen3');
      
      const errorEvents = eventBus.getEventsByType('error');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].payload.message).toBe('Test error');
    });
    
    it('should return copy of history', () => {
      eventBus.emit({ type: 'move', payload: { fen: 'test', source: 'move' } });
      
      const history1 = eventBus.getHistory();
      const history2 = eventBus.getHistory();
      
      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
      
      history1.push({ type: 'reset', payload: { fen: 'fake', source: 'reset' } });
      expect(eventBus.getHistory()).toHaveLength(1); // Original unchanged
    });
  });
  
  describe('Listener Management', () => {
    it('should clear all listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.subscribe(handler1);
      eventBus.subscribe(handler2);
      
      expect(eventBus.getListenerCount()).toBe(2);
      
      eventBus.clear();
      
      expect(eventBus.getListenerCount()).toBe(0);
    });
    
    it('should remove specific listener', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.subscribe(handler1);
      eventBus.subscribe(handler2);
      
      const removed = eventBus.removeListener(handler1);
      
      expect(removed).toBe(true);
      expect(eventBus.getListenerCount()).toBe(1);
      
      const removedAgain = eventBus.removeListener(handler1);
      expect(removedAgain).toBe(false);
    });
    
    it('should check if listener exists', () => {
      const handler = vi.fn();
      
      expect(eventBus.hasListener(handler)).toBe(false);
      
      eventBus.subscribe(handler);
      
      expect(eventBus.hasListener(handler)).toBe(true);
      
      eventBus.removeListener(handler);
      
      expect(eventBus.hasListener(handler)).toBe(false);
    });
    
    it('should check if enabled', () => {
      expect(eventBus.isEventBusEnabled()).toBe(true);
      
      eventBus.setEnabled(false);
      expect(eventBus.isEventBusEnabled()).toBe(false);
      
      eventBus.setEnabled(true);
      expect(eventBus.isEventBusEnabled()).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty event bus', () => {
      expect(eventBus.getListenerCount()).toBe(0);
      expect(eventBus.getHistory()).toEqual([]);
      expect(eventBus.getLastEvent()).toBeUndefined();
      expect(eventBus.getEventsByType('move')).toEqual([]);
    });
    
    it('should emit to no listeners without error', () => {
      const event: ChessEventPayload = {
        type: 'move',
        payload: { fen: 'test', source: 'move' }
      };
      
      expect(() => eventBus.emit(event)).not.toThrow();
      expect(eventBus.getHistory()).toHaveLength(1);
    });
    
    it('should handle clearing already empty bus', () => {
      expect(() => eventBus.clear()).not.toThrow();
      expect(() => eventBus.clearHistory()).not.toThrow();
    });
  });
});