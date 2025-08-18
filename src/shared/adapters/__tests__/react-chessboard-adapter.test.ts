/**
 * Unit Tests for React-Chessboard Adapter
 * 
 * Tests the anti-corruption adapter that normalizes react-chessboard
 * events to our canonical internal format. These tests ensure that
 * external data variations are properly handled at the boundary.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  adaptSquareClickEvent,
  adaptPieceDropEvent,
  createSquareClickHandler,
  createPieceDropHandler,
  createMoveContext,
  extractPieceColorSafely,
  isPieceOfColor,
  type MoveContext,
  type NormalizedSquareClickEvent,
  type NormalizedPieceDropEvent
} from '../react-chessboard-adapter';

// Mock the logger to avoid console noise in tests
vi.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}));

describe('Move Context', () => {
  describe('createMoveContext', () => {
    it('should create context with default source', () => {
      const context = createMoveContext();
      
      expect(context.source).toBe('ui');
      expect(context.chainId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(typeof context.startedAt).toBe('number');
      expect(context.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should create context with custom source', () => {
      const context = createMoveContext('test');
      expect(context.source).toBe('test');
    });

    it('should generate unique chain IDs', () => {
      const context1 = createMoveContext();
      const context2 = createMoveContext();
      
      expect(context1.chainId).not.toBe(context2.chainId);
    });
  });
});

describe('adaptSquareClickEvent', () => {
  let mockContext: MoveContext;

  beforeEach(() => {
    mockContext = {
      chainId: 'test-chain-id',
      source: 'test',
      startedAt: Date.now(),
      timestamp: new Date().toISOString()
    };
  });

  describe('Valid inputs', () => {
    it('should adapt string piece format', () => {
      const rawEvent = {
        piece: 'wK',
        square: 'e1'
      };

      const result = adaptSquareClickEvent(rawEvent, mockContext);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          piece: {
            code: 'wK',
            color: 'w',
            kind: 'K'
          },
          square: 'e1',
          context: mockContext
        });
      }
    });

    it('should adapt object piece format', () => {
      const rawEvent = {
        piece: { pieceType: 'bQ' },
        square: 'd8'
      };

      const result = adaptSquareClickEvent(rawEvent, mockContext);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.piece).toEqual({
          code: 'bQ',
          color: 'b',
          kind: 'Q'
        });
        expect(result.value.square).toBe('d8');
      }
    });

    it('should handle null piece (empty square)', () => {
      const rawEvent = {
        piece: null,
        square: 'e4'
      };

      const result = adaptSquareClickEvent(rawEvent, mockContext);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.piece).toBeNull();
        expect(result.value.square).toBe('e4');
      }
    });

    it('should create context if not provided', () => {
      const rawEvent = {
        piece: 'wP',
        square: 'e2'
      };

      const result = adaptSquareClickEvent(rawEvent);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.context.source).toBe('ui');
        expect(result.value.context.chainId).toBeDefined();
      }
    });
  });

  describe('Invalid inputs', () => {
    it('should return error for invalid piece', () => {
      const rawEvent = {
        piece: 'invalid',
        square: 'e1'
      };

      const result = adaptSquareClickEvent(rawEvent, mockContext);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Invalid input');
      }
    });

    it('should return error for invalid square', () => {
      const rawEvent = {
        piece: 'wK',
        square: 'invalid'
      };

      const result = adaptSquareClickEvent(rawEvent, mockContext);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Invalid option');
      }
    });

    it('should return error for missing fields', () => {
      const invalidEvents = [
        'invalid', // not an object
        null,
        undefined
      ];

      invalidEvents.forEach(event => {
        const result = adaptSquareClickEvent(event, mockContext);
        expect(result.ok).toBe(false);
      });
    });
  });

  describe('Regression test for navigation bug', () => {
    it('should handle the exact bug scenario', () => {
      // This is the exact input that caused our navigation bug
      const rawEvent = {
        piece: { pieceType: 'wK' }, // Object format that broke piece?.[0]
        square: 'e6'
      };

      const result = adaptSquareClickEvent(rawEvent, mockContext);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should correctly extract color as 'w'
        expect(result.value.piece?.color).toBe('w');
        expect(result.value.piece?.code).toBe('wK');
        expect(result.value.square).toBe('e6');
      }
    });
  });
});

describe('adaptPieceDropEvent', () => {
  let mockContext: MoveContext;

  beforeEach(() => {
    mockContext = {
      chainId: 'test-chain-id',
      source: 'test',
      startedAt: Date.now(),
      timestamp: new Date().toISOString()
    };
  });

  describe('Valid inputs', () => {
    it('should adapt basic piece drop', () => {
      const result = adaptPieceDropEvent('e2', 'e4', 'wP', undefined, mockContext);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          sourceSquare: 'e2',
          targetSquare: 'e4',
          piece: {
            code: 'wP',
            color: 'w',
            kind: 'P'
          },
          promotion: undefined,
          context: mockContext
        });
      }
    });

    it('should handle promotion', () => {
      const result = adaptPieceDropEvent('e7', 'e8', 'wP', 'Q', mockContext);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.promotion).toBe('Q');
      }
    });

    it('should create context if not provided', () => {
      const result = adaptPieceDropEvent('e2', 'e4', 'wP');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.context.source).toBe('ui');
      }
    });
  });

  describe('Invalid inputs', () => {
    it('should return error for invalid source square', () => {
      const result = adaptPieceDropEvent('invalid', 'e4', 'wP', undefined, mockContext);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Invalid option');
      }
    });

    it('should return error for invalid target square', () => {
      const result = adaptPieceDropEvent('e2', 'invalid', 'wP', undefined, mockContext);
      
      expect(result.ok).toBe(false);
    });

    it('should return error for invalid piece', () => {
      const result = adaptPieceDropEvent('e2', 'e4', 'invalid', undefined, mockContext);
      
      expect(result.ok).toBe(false);
    });

    it('should return error for null piece', () => {
      const result = adaptPieceDropEvent('e2', 'e4', null, undefined, mockContext);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Invalid option');
      }
    });
  });
});

describe('createSquareClickHandler', () => {
  it('should create handler that calls domain handler on valid input', () => {
    const domainHandler = vi.fn();
    const errorHandler = vi.fn();
    
    const handler = createSquareClickHandler(domainHandler, errorHandler);
    
    const rawEvent = {
      piece: 'wK',
      square: 'e1'
    };
    
    handler(rawEvent);
    
    expect(domainHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        piece: {
          code: 'wK',
          color: 'w',
          kind: 'K'
        },
        square: 'e1',
        context: expect.any(Object)
      })
    );
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('should call error handler on invalid input', () => {
    const domainHandler = vi.fn();
    const errorHandler = vi.fn();
    
    const handler = createSquareClickHandler(domainHandler, errorHandler);
    
    const rawEvent = {
      piece: 'invalid',
      square: 'e1'
    };
    
    handler(rawEvent);
    
    expect(domainHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledWith(
      expect.stringContaining('Invalid input'),
      expect.any(Object)
    );
  });

  it('should work without error handler', () => {
    const domainHandler = vi.fn();
    
    const handler = createSquareClickHandler(domainHandler);
    
    const rawEvent = {
      piece: 'invalid',
      square: 'e1'
    };
    
    expect(() => handler(rawEvent)).not.toThrow();
    expect(domainHandler).not.toHaveBeenCalled();
  });
});

describe('createPieceDropHandler', () => {
  it('should create handler that calls domain handler on valid input', () => {
    const domainHandler = vi.fn().mockReturnValue(true);
    const errorHandler = vi.fn();
    
    const handler = createPieceDropHandler(domainHandler, errorHandler);
    
    const result = handler('e2', 'e4', 'wP');
    
    expect(result).toBe(true);
    expect(domainHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceSquare: 'e2',
        targetSquare: 'e4',
        piece: {
          code: 'wP',
          color: 'w',
          kind: 'P'
        },
        context: expect.any(Object)
      })
    );
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('should return false and call error handler on invalid input', () => {
    const domainHandler = vi.fn();
    const errorHandler = vi.fn();
    
    const handler = createPieceDropHandler(domainHandler, errorHandler);
    
    const result = handler('invalid', 'e4', 'wP');
    
    expect(result).toBe(false);
    expect(domainHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalledWith(
      expect.stringContaining('Invalid option'),
      expect.any(Object)
    );
  });

  it('should work without error handler', () => {
    const domainHandler = vi.fn();
    
    const handler = createPieceDropHandler(domainHandler);
    
    const result = handler('invalid', 'e4', 'wP');
    
    expect(result).toBe(false);
    expect(domainHandler).not.toHaveBeenCalled();
  });
});

describe('Legacy Compatibility Helpers', () => {
  describe('extractPieceColorSafely', () => {
    it('should extract color from various formats', () => {
      expect(extractPieceColorSafely('wK')).toBe('w');
      expect(extractPieceColorSafely('bQ')).toBe('b');
      expect(extractPieceColorSafely({ pieceType: 'wR' })).toBe('w');
      expect(extractPieceColorSafely({ type: 'bN' })).toBe('b');
    });

    it('should return null for invalid input', () => {
      expect(extractPieceColorSafely(null)).toBeNull();
      expect(extractPieceColorSafely(undefined)).toBeNull();
      expect(extractPieceColorSafely('invalid')).toBeNull();
      expect(extractPieceColorSafely(123)).toBeNull();
    });

    it('should solve the original navigation bug', () => {
      // The exact piece format that caused our bug
      const piece = { pieceType: 'wK' };
      
      // Old code: piece?.[0] → undefined (caused bug)
      // New code: extractPieceColorSafely(piece) → 'w' (fixed)
      expect(extractPieceColorSafely(piece)).toBe('w');
    });
  });

  describe('isPieceOfColor', () => {
    it('should correctly identify piece colors', () => {
      expect(isPieceOfColor('wK', 'w')).toBe(true);
      expect(isPieceOfColor('wK', 'b')).toBe(false);
      expect(isPieceOfColor({ pieceType: 'bQ' }, 'b')).toBe(true);
      expect(isPieceOfColor({ pieceType: 'bQ' }, 'w')).toBe(false);
    });

    it('should return false for invalid pieces', () => {
      expect(isPieceOfColor(null, 'w')).toBe(false);
      expect(isPieceOfColor('invalid', 'w')).toBe(false);
      expect(isPieceOfColor(123, 'w')).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete workflow from raw event to domain handler', () => {
    const moves: NormalizedSquareClickEvent[] = [];
    
    const domainHandler = (event: NormalizedSquareClickEvent) => {
      moves.push(event);
    };
    
    const handler = createSquareClickHandler(domainHandler);
    
    // Simulate the exact sequence that caused our bug
    handler({ piece: { pieceType: 'wK' }, square: 'e6' });
    handler({ piece: null, square: 'd6' });
    
    expect(moves).toHaveLength(2);
    
    // First move: selecting piece
    expect(moves[0].piece?.color).toBe('w');
    expect(moves[0].piece?.code).toBe('wK');
    expect(moves[0].square).toBe('e6');
    
    // Second move: target square
    expect(moves[1].piece).toBeNull();
    expect(moves[1].square).toBe('d6');
  });

  it('should handle mixed format sequences', () => {
    const events: any[] = [];
    
    const squareHandler = createSquareClickHandler((event) => {
      events.push({ type: 'click', ...event });
    });
    
    const dropHandler = createPieceDropHandler((event) => {
      events.push({ type: 'drop', ...event });
      return true;
    });
    
    // Mix of formats
    squareHandler({ piece: 'wK', square: 'e1' }); // String format
    squareHandler({ piece: { pieceType: 'bQ' }, square: 'd8' }); // Object format
    dropHandler('e2', 'e4', 'wP'); // Drop with string
    
    expect(events).toHaveLength(3);
    expect(events[0].piece.code).toBe('wK');
    expect(events[1].piece.code).toBe('bQ');
    expect(events[2].piece.code).toBe('wP');
  });
});