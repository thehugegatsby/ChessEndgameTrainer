/**
 * @file Tests for useMoveHandlers hook
 * @module tests/unit/hooks/useMoveHandlers
 * 
 * @description
 * Comprehensive tests for the useMoveHandlers hook that encapsulates
 * all move handling logic for chess training board interactions.
 * 
 * Tests cover:
 * - Drag and drop event handling
 * - Click-to-move functionality  
 * - Move validation and execution
 * - Position readiness checks
 * - Pawn promotion detection
 * - Selection state management
 */

import { renderHook, act } from '@testing-library/react';
import { useMoveHandlers } from '@shared/hooks/useMoveHandlers';
import { getLogger } from '@shared/services/logging/Logger';

// Mock dependencies
jest.mock('@shared/services/logging/Logger', () => ({
  getLogger: jest.fn(() => ({
    setContext: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('@shared/store/hooks', () => ({
  useUIStore: jest.fn(() => [
    {}, // UI state
    { showToast: jest.fn() } // UI actions
  ]),
}));

jest.mock('chess.js', () => ({
  Chess: jest.fn().mockImplementation((fen) => ({
    turn: jest.fn(() => 'w'), // Default to white's turn
    fen: jest.fn(() => fen),
  })),
}));

describe('useMoveHandlers', () => {
  const mockTrainingState = {
    currentPosition: {
      id: 1,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    },
    isPlayerTurn: true,
    isOpponentThinking: false,
  };

  const defaultProps = {
    currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    isGameFinished: false,
    isPositionReady: true,
    trainingState: mockTrainingState,
    onMove: jest.fn(),
  };

  const mockUIActions = { showToast: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset useUIStore mock
    const { useUIStore } = require('@shared/store/hooks');
    useUIStore.mockReturnValue([{}, mockUIActions]);
  });

  describe('Hook Initialization', () => {
    it('returns all required interface properties', () => {
      const { result } = renderHook(() => useMoveHandlers(defaultProps));

      expect(result.current).toHaveProperty('onDrop');
      expect(result.current).toHaveProperty('onSquareClick');
      expect(result.current).toHaveProperty('selectedSquare');
      expect(result.current).toHaveProperty('clearSelection');

      expect(typeof result.current.onDrop).toBe('function');
      expect(typeof result.current.onSquareClick).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
      expect(result.current.selectedSquare).toBeNull();
    });

    it('initializes with null selected square', () => {
      const { result } = renderHook(() => useMoveHandlers(defaultProps));
      expect(result.current.selectedSquare).toBeNull();
    });
  });

  describe('onDrop Handling', () => {
    it('executes move when position is ready and game not finished', async () => {
      const mockOnMove = jest.fn().mockResolvedValue(true);
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        const dropResult = result.current.onDrop('e2', 'e4', 'wP');
        expect(dropResult).toBe(true);
      });

      // Move should be called asynchronously
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
    });

    it('blocks moves when position is not ready', () => {
      const mockOnMove = jest.fn();
      const props = { 
        ...defaultProps, 
        isPositionReady: false,
        onMove: mockOnMove 
      };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        const dropResult = result.current.onDrop('e2', 'e4', 'wP');
        expect(dropResult).toBe(false);
      });

      expect(mockOnMove).not.toHaveBeenCalled();
    });

    it('blocks moves when game is finished', () => {
      const mockOnMove = jest.fn();
      const props = { 
        ...defaultProps, 
        isGameFinished: true,
        onMove: mockOnMove 
      };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        const dropResult = result.current.onDrop('e2', 'e4', 'wP');
        expect(dropResult).toBe(false);
      });

      expect(mockOnMove).not.toHaveBeenCalled();
    });

    it('detects pawn promotion and adds promotion property', async () => {
      const mockOnMove = jest.fn().mockResolvedValue(true);
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        result.current.onDrop('e7', 'e8', 'wP');
      });

      // Wait for async move execution
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should have added promotion to move
      expect(mockOnMove).toHaveBeenCalledWith({
        from: 'e7',
        to: 'e8',
        promotion: 'q'
      });
    });

    it('handles black pawn promotion to first rank', async () => {
      const mockOnMove = jest.fn().mockResolvedValue(true);
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        result.current.onDrop('e2', 'e1', 'bP');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockOnMove).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e1',
        promotion: 'q'
      });
    });

    it('does not add promotion for non-pawn pieces', async () => {
      const mockOnMove = jest.fn().mockResolvedValue(true);
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        result.current.onDrop('d1', 'd8', 'wQ');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockOnMove).toHaveBeenCalledWith({
        from: 'd1',
        to: 'd8'
      });
    });

    it('does not add promotion for pawn not reaching promotion rank', async () => {
      const mockOnMove = jest.fn().mockResolvedValue(true);
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        result.current.onDrop('e2', 'e4', 'wP');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockOnMove).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4'
      });
    });
  });

  describe('onSquareClick Handling', () => {
    it('selects square with piece when no square is selected', () => {
      const { result } = renderHook(() => useMoveHandlers(defaultProps));

      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      expect(result.current.selectedSquare).toBe('e2');
    });

    it('does not select square without piece', () => {
      const { result } = renderHook(() => useMoveHandlers(defaultProps));

      act(() => {
        result.current.onSquareClick({ 
          piece: null, 
          square: 'e4' 
        });
      });

      expect(result.current.selectedSquare).toBeNull();
    });

    it('deselects square when same square is clicked', () => {
      const { result } = renderHook(() => useMoveHandlers(defaultProps));

      // First click selects
      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      expect(result.current.selectedSquare).toBe('e2');

      // Second click deselects
      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      expect(result.current.selectedSquare).toBeNull();
    });

    it('attempts move when different square is clicked after selection', async () => {
      const mockOnMove = jest.fn().mockResolvedValue(true);
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      // First click selects
      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      // Second click attempts move
      act(() => {
        result.current.onSquareClick({ 
          piece: null, 
          square: 'e4' 
        });
      });

      // Selection should be cleared after move attempt
      expect(result.current.selectedSquare).toBeNull();
    });

    it('blocks clicks when position is not ready', () => {
      const props = { ...defaultProps, isPositionReady: false };
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      expect(result.current.selectedSquare).toBeNull();
    });

    it('blocks clicks when game is finished', () => {
      const props = { ...defaultProps, isGameFinished: true };
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      expect(result.current.selectedSquare).toBeNull();
    });

    it('validates piece color matches current turn', () => {
      // Mock Chess to return white's turn
      const { Chess } = require('chess.js');
      Chess.mockImplementation(() => ({
        turn: () => 'w',
      }));

      const { result } = renderHook(() => useMoveHandlers(defaultProps));

      // White piece should be selectable
      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      expect(result.current.selectedSquare).toBe('e2');

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      // Black piece should not be selectable on white's turn
      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'bP' }, 
          square: 'e7' 
        });
      });

      expect(result.current.selectedSquare).toBeNull();
    });
  });

  describe('clearSelection', () => {
    it('clears the selected square', () => {
      const { result } = renderHook(() => useMoveHandlers(defaultProps));

      // Select a square
      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      expect(result.current.selectedSquare).toBe('e2');

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedSquare).toBeNull();
    });

    it('is safe to call when no square is selected', () => {
      const { result } = renderHook(() => useMoveHandlers(defaultProps));

      expect(result.current.selectedSquare).toBeNull();

      // Should not throw
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedSquare).toBeNull();
    });
  });

  describe('Move Execution Error Handling', () => {
    it('shows toast on move execution error', async () => {
      const mockOnMove = jest.fn().mockRejectedValue(new Error('Invalid move'));
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        result.current.onDrop('e2', 'e5', 'wP'); // Invalid move
      });

      // Wait for async error handling
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockUIActions.showToast).toHaveBeenCalledWith('Invalid move', 'error');
    });

    it('handles non-Error exceptions gracefully', async () => {
      const mockOnMove = jest.fn().mockRejectedValue('String error');
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        result.current.onDrop('e2', 'e4', 'wP');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockUIActions.showToast).toHaveBeenCalledWith('Move failed', 'error');
    });
  });

  describe('Edge Cases', () => {
    it('handles same-square drop (no move)', () => {
      const mockOnMove = jest.fn();
      const props = { ...defaultProps, onMove: mockOnMove };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        const dropResult = result.current.onDrop('e2', 'e2', 'wP');
        // onDrop returns true but handleMove internally checks for same square
        expect(dropResult).toBe(true);
      });

      // The move should not be executed due to same-square check in handleMove
      expect(mockOnMove).not.toHaveBeenCalled();
    });

    it('handles missing currentPosition gracefully', () => {
      const trainingStateWithoutPosition = {
        ...mockTrainingState,
        currentPosition: null,
      };
      
      const props = { 
        ...defaultProps, 
        trainingState: trainingStateWithoutPosition,
        isPositionReady: false 
      };
      
      const { result } = renderHook(() => useMoveHandlers(props));

      act(() => {
        const dropResult = result.current.onDrop('e2', 'e4', 'wP');
        expect(dropResult).toBe(false);
      });
    });

    it('handles chess.js validation error in onSquareClick', () => {
      // Mock Chess to throw error
      const { Chess } = require('chess.js');
      Chess.mockImplementation(() => {
        throw new Error('Invalid FEN');
      });

      const { result } = renderHook(() => useMoveHandlers(defaultProps));

      // Should not crash on validation error
      act(() => {
        result.current.onSquareClick({ 
          piece: { pieceType: 'wP' }, 
          square: 'e2' 
        });
      });

      // Should not select square due to error
      expect(result.current.selectedSquare).toBeNull();
    });
  });

  describe('Props Dependencies', () => {
    it('updates when currentFen changes', () => {
      const { result, rerender } = renderHook(
        (props) => useMoveHandlers(props),
        { initialProps: defaultProps }
      );

      const newFen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';
      const newProps = { ...defaultProps, currentFen: newFen };

      rerender(newProps);

      // Hook should handle the new FEN
      act(() => {
        result.current.onDrop('d1', 'd5', 'wQ');
      });

      expect(defaultProps.onMove).toHaveBeenCalled();
    });

    it('reacts to isPositionReady changes', () => {
      const { result, rerender } = renderHook(
        (props) => useMoveHandlers(props),
        { initialProps: { ...defaultProps, isPositionReady: false } }
      );

      // Should block moves initially
      act(() => {
        const dropResult = result.current.onDrop('e2', 'e4', 'wP');
        expect(dropResult).toBe(false);
      });

      // Update to ready
      rerender({ ...defaultProps, isPositionReady: true });

      // Should allow moves now
      act(() => {
        const dropResult = result.current.onDrop('e2', 'e4', 'wP');
        expect(dropResult).toBe(true);
      });
    });
  });
});