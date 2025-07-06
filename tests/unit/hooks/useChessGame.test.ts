/**
 * @fileoverview Unit tests for useChessGame hook
 * @description Tests chess game state management, move validation, and position tracking
 */

import { renderHook, act } from '@testing-library/react';
import { Chess } from 'chess.js';
import { useChessGame } from '@shared/hooks/useChessGame';
import { TEST_POSITIONS } from '../../helpers/testPositions';
import { createTestMove, TEST_MOVES } from '../../helpers/moveFactory';

// Mock Chess.js to control behavior
jest.mock('chess.js');

const MockedChess = Chess as jest.MockedClass<typeof Chess>;

describe('useChessGame Hook', () => {
  let mockChessInstance: jest.Mocked<Chess>;
  let onCompleteMock: jest.Mock;
  let onPositionChangeMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Chess instance
    mockChessInstance = {
      fen: jest.fn(),
      pgn: jest.fn(),
      move: jest.fn(),
      isGameOver: jest.fn(),
      reset: jest.fn(),
      load: jest.fn(),
      history: jest.fn()
    } as any;

    // Mock Chess constructor
    MockedChess.mockImplementation(() => mockChessInstance);

    // Set up default mock return values
    mockChessInstance.fen.mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
    mockChessInstance.pgn.mockReturnValue('');
    mockChessInstance.isGameOver.mockReturnValue(false);

    // Create callback mocks
    onCompleteMock = jest.fn();
    onPositionChangeMock = jest.fn();
  });

  describe('Initialization', () => {
    it('should initialize with provided FEN position', () => {
      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      expect(MockedChess).toHaveBeenCalledWith(TEST_POSITIONS.STARTING_POSITION);
      expect(result.current.currentFen).toBe(TEST_POSITIONS.STARTING_POSITION);
      expect(result.current.history).toEqual([]);
      expect(result.current.isGameFinished).toBe(false);
    });

    it('should initialize with different starting position', () => {
      renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.KQK_TABLEBASE_WIN,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      expect(MockedChess).toHaveBeenCalledWith(TEST_POSITIONS.KQK_TABLEBASE_WIN);
    });
  });

  describe('Making Moves', () => {
    it('should make a legal move successfully', async () => {
      const mockMove = createTestMove({ from: 'e2', to: 'e4', san: 'e4' });
      mockChessInstance.move.mockReturnValue(mockMove);
      mockChessInstance.fen.mockReturnValue('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
      mockChessInstance.pgn.mockReturnValue('1. e4');

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      let moveResult: boolean;
      await act(async () => {
        moveResult = await result.current.makeMove(TEST_MOVES.E2E4);
      });

      expect(moveResult!).toBe(true);
      expect(mockChessInstance.move).toHaveBeenCalledWith(TEST_MOVES.E2E4);
      expect(result.current.history).toContain(mockMove);
      expect(onPositionChangeMock).toHaveBeenCalledWith(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        '1. e4'
      );
    });

    it('should reject illegal moves', async () => {
      mockChessInstance.move.mockImplementation(() => {
        throw new Error('Invalid move');
      });

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      let moveResult: boolean;
      await act(async () => {
        moveResult = await result.current.makeMove(TEST_MOVES.ILLEGAL_MOVE);
      });

      expect(moveResult!).toBe(false);
      expect(result.current.history).toEqual([]);
      expect(onPositionChangeMock).not.toHaveBeenCalled();
    });

    it('should handle null move result', async () => {
      mockChessInstance.move.mockReturnValue(null as any);

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      let moveResult: boolean;
      await act(async () => {
        moveResult = await result.current.makeMove(TEST_MOVES.E2E4);
      });

      expect(moveResult!).toBe(false);
      expect(result.current.history).toEqual([]);
    });

    it('should detect game completion and call onComplete', async () => {
      const mockMove = createTestMove({ from: 'f7', to: 'f8', san: 'f8=Q#', promotion: 'q' });
      mockChessInstance.move.mockReturnValue(mockMove);
      mockChessInstance.isGameOver.mockReturnValue(true);

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      await act(async () => {
        await result.current.makeMove({ from: 'f7', to: 'f8', promotion: 'q' });
      });

      expect(result.current.isGameFinished).toBe(true);
      expect(onCompleteMock).toHaveBeenCalledWith(true);
    });

    it('should not allow moves when game is finished', async () => {
      // Set up a finished game by triggering game completion first
      mockChessInstance.move.mockReturnValue(createTestMove({ from: 'f7', to: 'f8', san: 'f8=Q#', promotion: 'q' }));
      mockChessInstance.isGameOver.mockReturnValue(true);

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      // Make a move that finishes the game
      await act(async () => {
        await result.current.makeMove({ from: 'f7', to: 'f8', promotion: 'q' });
      });

      // Reset mock to return null for subsequent moves
      mockChessInstance.move.mockReturnValue(null as any);

      // Now the game should be finished and reject new moves
      let moveResult: boolean;
      await act(async () => {
        moveResult = await result.current.makeMove(TEST_MOVES.E2E4);
      });

      expect(moveResult!).toBe(false);
      expect(result.current.isGameFinished).toBe(true);
    });

    it('should handle promotion moves', async () => {
      const mockMove = createTestMove({ from: 'e7', to: 'e8', san: 'e8=Q', promotion: 'q' });
      mockChessInstance.move.mockReturnValue(mockMove);

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      await act(async () => {
        await result.current.makeMove(TEST_MOVES.PROMOTION_QUEEN);
      });

      expect(mockChessInstance.move).toHaveBeenCalledWith(TEST_MOVES.PROMOTION_QUEEN);
      expect(result.current.history).toContain(mockMove);
    });
  });

  describe('Game Navigation', () => {
    it('should jump to specific move in history', async () => {
      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      // First, make some moves to build up history
      const moves = [
        createTestMove({ from: 'e2', to: 'e4', san: 'e4' }),
        createTestMove({ from: 'e7', to: 'e5', san: 'e5', color: 'b' }),
        createTestMove({ from: 'g1', to: 'f3', san: 'Nf3', piece: 'n' })
      ];

      for (const move of moves) {
        mockChessInstance.move.mockReturnValueOnce(move);
        await act(async () => {
          await result.current.makeMove(move);
        });
      }

      // Now test jump to move
      const newGame = {
        fen: jest.fn().mockReturnValue('position-after-move-1'),
        pgn: jest.fn().mockReturnValue('1. e4 e5'),
        move: jest.fn(),
        reset: jest.fn(),
        load: jest.fn()
      } as any;

      MockedChess.mockReturnValue(newGame);

      act(() => {
        result.current.jumpToMove(1); // Jump to move index 1 (second move)
      });

      expect(newGame.reset).toHaveBeenCalled();
      expect(newGame.load).toHaveBeenCalledWith(TEST_POSITIONS.STARTING_POSITION);
      expect(onPositionChangeMock).toHaveBeenCalled();
    });

    it('should undo last move successfully', async () => {
      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      // First, make some moves to build up history
      mockChessInstance.move.mockReturnValueOnce(createTestMove({ from: 'e2', to: 'e4', san: 'e4' }));
      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
      });

      mockChessInstance.move.mockReturnValueOnce(createTestMove({ from: 'e7', to: 'e5', san: 'e5', color: 'b' }));
      await act(async () => {
        await result.current.makeMove({ from: 'e7', to: 'e5' });
      });

      const tempGame = {
        fen: jest.fn().mockReturnValue('position-after-undo'),
        pgn: jest.fn().mockReturnValue('1. e4'),
        move: jest.fn()
      } as any;

      MockedChess.mockReturnValue(tempGame);

      let undoResult: boolean;
      act(() => {
        undoResult = result.current.undoMove();
      });

      expect(undoResult!).toBe(true);
      expect(result.current.isGameFinished).toBe(false);
      expect(onPositionChangeMock).toHaveBeenCalledWith('position-after-undo', '1. e4');
    });

    it('should not undo when no moves in history', () => {
      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      let undoResult: boolean;
      act(() => {
        undoResult = result.current.undoMove();
      });

      expect(undoResult!).toBe(false);
      expect(onPositionChangeMock).not.toHaveBeenCalled();
    });

    it('should reset game to initial position', async () => {
      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      // First make a move to create some game state
      mockChessInstance.move.mockReturnValueOnce(createTestMove({ from: 'e2', to: 'e4', san: 'e4' }));
      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
      });

      // Verify we have some history
      expect(result.current.history.length).toBeGreaterThan(0);

      const newGame = {
        fen: jest.fn().mockReturnValue(TEST_POSITIONS.STARTING_POSITION),
        pgn: jest.fn().mockReturnValue('')
      } as any;

      MockedChess.mockReturnValue(newGame);

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.history).toEqual([]);
      expect(result.current.isGameFinished).toBe(false);
      expect(result.current.currentFen).toBe(TEST_POSITIONS.STARTING_POSITION);
      expect(onPositionChangeMock).toHaveBeenCalledWith(TEST_POSITIONS.STARTING_POSITION, '');
    });
  });

  describe('Error Handling', () => {
    it('should handle move errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockChessInstance.move.mockImplementation(() => {
        throw new Error('Unexpected chess.js error');
      });

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      let moveResult: boolean;
      await act(async () => {
        moveResult = await result.current.makeMove(TEST_MOVES.E2E4);
      });

      expect(moveResult!).toBe(false);
      // Error is handled silently in the hook
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Callback Integration', () => {
    it('should work without optional callbacks', async () => {
      const mockMove = createTestMove({ from: 'e2', to: 'e4', san: 'e4' });
      mockChessInstance.move.mockReturnValue(mockMove);

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION
      }));

      let moveResult: boolean;
      await act(async () => {
        moveResult = await result.current.makeMove(TEST_MOVES.E2E4);
      });

      expect(moveResult!).toBe(true);
      // Should not throw error even without callbacks
    });
  });

  describe('Performance Optimizations', () => {
    it('should reuse game instance instead of creating new ones', async () => {
      const mockMove = createTestMove({ from: 'e2', to: 'e4', san: 'e4' });
      mockChessInstance.move.mockReturnValue(mockMove);

      const { result } = renderHook(() => useChessGame({
        initialFen: TEST_POSITIONS.STARTING_POSITION,
        onComplete: onCompleteMock,
        onPositionChange: onPositionChangeMock
      }));

      const initialGameInstance = result.current.game;

      await act(async () => {
        await result.current.makeMove(TEST_MOVES.E2E4);
      });

      // Should reuse the same instance
      expect(result.current.game).toBe(initialGameInstance);
    });
  });
});