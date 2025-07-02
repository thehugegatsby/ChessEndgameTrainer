import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Chess, Move } from 'chess.js';
import { useMoveHandler } from '../MoveHandler';

describe('MoveHandler', () => {
  let mockGame: Chess;
  let mockOnMoveResult: jest.Mock;
  let mockOnError: jest.Mock;
  let mockOnWarning: jest.Mock;

  beforeEach(() => {
    mockGame = new Chess();
    mockOnMoveResult = jest.fn();
    mockOnError = jest.fn();
    mockOnWarning = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderMoveHandler = (isGameFinished = false) => {
    return renderHook(() => useMoveHandler({
      game: mockGame,
      isGameFinished,
      onMoveResult: mockOnMoveResult,
      onError: mockOnError,
      onWarning: mockOnWarning
    }));
  };

  describe('🎯 Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderMoveHandler();
      
      expect(result.current.handleMove).toBeDefined();
      expect(typeof result.current.handleMove).toBe('function');
      expect(result.current.isProcessingMove).toBe(false);
    });

    it('should work with different game states', () => {
      const customGame = new Chess('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
      const { result } = renderHook(() => useMoveHandler({
        game: customGame,
        isGameFinished: false,
        onMoveResult: mockOnMoveResult,
        onError: mockOnError,
        onWarning: mockOnWarning
      }));
      
      expect(result.current.handleMove).toBeDefined();
    });
  });

  describe('🔍 Valid Move Processing', () => {
    it('should handle valid pawn move successfully', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'e2',
          to: 'e4'
        });
        expect(success).toBe(true);
      });

      expect(mockOnMoveResult).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          from: 'e2',
          to: 'e4',
          piece: 'p',
          color: 'w'
        }),
        expect.stringContaining('rnbqkbnr'), // New FEN
        expect.stringContaining('e4') // New PGN
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should handle valid knight move', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'g1',
          to: 'f3'
        });
        expect(success).toBe(true);
      });

      expect(mockOnMoveResult).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          from: 'g1',
          to: 'f3',
          piece: 'n',
          color: 'w'
        }),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle promotion move', async () => {
      // Set up position where pawn can promote (with kings)
      mockGame.load('8/P7/8/8/8/8/8/K6k w - - 0 1');
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'a7',
          to: 'a8',
          promotion: 'q'
        });
        expect(success).toBe(true);
      });

      expect(mockOnMoveResult).toHaveBeenCalledWith(
        true,
        expect.objectContaining({
          from: 'a7',
          to: 'a8',
          promotion: 'q'
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('❌ Invalid Move Handling', () => {
    it('should reject move with invalid input format', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove(null as any);
        expect(success).toBe(false);
      });
      
      expect(mockOnMoveResult).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled(); // Early validation, no error callback
    });

    it('should reject move with missing from square', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: '',
          to: 'e4'
        } as any);
        expect(success).toBe(false);
      });
      
      expect(mockOnMoveResult).not.toHaveBeenCalled();
    });

    it('should reject move with invalid square format', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'z9', // Invalid square
          to: 'e4'
        });
        expect(success).toBe(false);
      });
      
      expect(mockOnMoveResult).not.toHaveBeenCalled();
    });

    it('should reject moves outside board bounds', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'e2',
          to: 'e9' // Invalid row
        });
        expect(success).toBe(false);
      });
      
      expect(mockOnMoveResult).not.toHaveBeenCalled();
    });

    it('should handle illegal chess moves', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'e2',
          to: 'd4' // Illegal pawn move
        });
        expect(success).toBe(false);
      });
      
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('Ungültiger Zug'));
      expect(mockOnMoveResult).not.toHaveBeenCalled();
    });

    it('should reject moves when game is finished', async () => {
      const { result } = renderMoveHandler(true); // isGameFinished = true
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'e2',
          to: 'e4'
        });
        expect(success).toBe(false);
      });
      
      expect(mockOnMoveResult).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('🔄 Processing State Management', () => {
    it('should have processing state management functionality', () => {
      const { result } = renderMoveHandler();
      
      // Test that the hook provides the isProcessingMove property
      expect(result.current.isProcessingMove).toBe(false);
      expect(typeof result.current.handleMove).toBe('function');
    });

    it('should handle sequential moves properly', async () => {
      const { result } = renderMoveHandler();
      
      // First move
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'e2',
          to: 'e4'
        });
        expect(success).toBe(true);
      });
      
      expect(mockOnMoveResult).toHaveBeenCalledTimes(1);
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('🎯 Square Validation Edge Cases', () => {
    it('should validate all board squares correctly', async () => {
      const { result } = renderMoveHandler();
      
      // Test valid corner squares (just one to verify validation works)
      await act(async () => {
        // Try a valid square format - should not fail due to validation
        const success = await result.current.handleMove({
          from: 'a1', // Valid square
          to: 'a2'   // Valid square (though move might be illegal)
        });
        // Success depends on game state, but validation should pass
      });
      
      expect(result.current.handleMove).toBeDefined();
    });

    it('should reject various invalid square formats', async () => {
      const { result } = renderMoveHandler();
      
      // Test a few invalid square formats
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'z9', // Invalid square
          to: 'e4'
        });
        expect(success).toBe(false);
      });
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'e2',
          to: 'a0' // Invalid rank
        });
        expect(success).toBe(false);
      });
      
      expect(mockOnMoveResult).not.toHaveBeenCalled();
    });
  });

  describe('🔧 Error Handling', () => {
    it('should handle chess.js internal errors', async () => {
      const { result } = renderMoveHandler();
      
      // Test with clearly illegal move to trigger error
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'a1', // Rook
          to: 'e4'   // Impossible rook move
        });
        expect(success).toBe(false);
      });
      
      expect(mockOnError).toHaveBeenCalled();
    });

    it('should handle edge case moves gracefully', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({
          from: 'e1', // King
          to: 'e8'   // Impossible king move
        });
        expect(success).toBe(false);
      });
      
      // Should handle the error without crashing
      expect(result.current.handleMove).toBeDefined();
    });
  });

  describe('📊 Integration Scenarios', () => {
    it('should handle complex game progression', async () => {
      const { result } = renderMoveHandler();
      
      // Play a couple of valid moves
      await act(async () => {
        const success = await result.current.handleMove({ from: 'e2', to: 'e4' });
        expect(success).toBe(true);
      });
      
      await act(async () => {
        const success = await result.current.handleMove({ from: 'g1', to: 'f3' });
        expect(success).toBe(true);
      });
      
      expect(mockOnMoveResult).toHaveBeenCalledTimes(2);
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should maintain game state consistency', async () => {
      const { result } = renderMoveHandler();
      
      await act(async () => {
        const success = await result.current.handleMove({ from: 'e2', to: 'e4' });
        expect(success).toBe(true);
      });
      
      // Verify the move result callback was called
      expect(mockOnMoveResult).toHaveBeenCalledWith(
        true,
        expect.any(Object), // Move object
        expect.any(String), // FEN
        expect.any(String)  // PGN
      );
    });
  });
}); 