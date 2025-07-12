/**
 * @fileoverview Navigation Actions Tests for Zustand Store
 * @description Tests navigation functionality (goToMove, goToFirst, goToNext, etc.)
 */

import { act, renderHook } from '@testing-library/react';
import { useStore } from '../../../shared/store/store';
import { EndgamePosition } from '../../../shared/types/endgame';
import { Move } from '../../../shared/types';

// Mock the logger
jest.mock('../../../shared/services/logging', 
  require('../../shared/logger-utils').getMockLoggerDefinition()
);

describe('Store Navigation Actions', () => {
  const mockPosition: EndgamePosition = {
    id: 1,
    title: 'Test Position',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    description: 'Starting position',
    category: 'opening',
    difficulty: 'beginner',
    goal: 'win',
    sideToMove: 'white',
    targetMoves: 10
  };

  const mockMoves: Partial<Move>[] = [
    { from: 'e2', to: 'e4', san: 'e4', piece: 'p', color: 'w' },
    { from: 'e7', to: 'e5', san: 'e5', piece: 'p', color: 'b' },
    { from: 'g1', to: 'f3', san: 'Nf3', piece: 'n', color: 'w' },
    { from: 'b8', to: 'c6', san: 'Nc6', piece: 'n', color: 'b' }
  ];

  beforeEach(() => {
    act(() => {
      useStore.getState().reset();
    });
  });

  describe('goToMove', () => {
    it('should navigate to specific move index', () => {
      const { result } = renderHook(() => useStore());

      // Setup position and make moves
      act(() => {
        result.current.setPosition(mockPosition);
        mockMoves.forEach(move => {
          result.current.makeMove(move as Move);
        });
      });

      expect(result.current.training.currentMoveIndex).toBe(3); // At last move

      // Navigate to move 1 (after e4 e5)
      act(() => {
        result.current.goToMove(1);
      });

      expect(result.current.training.currentMoveIndex).toBe(1);
      expect(result.current.training.isPlayerTurn).toBe(true); // White's turn after Black's e5
      expect(result.current.training.currentFen).toContain('4p3'); // Black pawn on e5 in FEN notation
      expect(result.current.training.currentFen).not.toContain('Nf3'); // Knight not yet moved
    });

    it('should handle navigation to initial position (-1)', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setPosition(mockPosition);
        mockMoves.forEach(move => {
          result.current.makeMove(move as Move);
        });
      });

      // Navigate to initial position
      act(() => {
        result.current.goToMove(-1);
      });

      expect(result.current.training.currentMoveIndex).toBe(-1);
      expect(result.current.training.isPlayerTurn).toBe(true); // White's turn at start
      expect(result.current.training.currentFen).toBe(mockPosition.fen);
    });

    it('should handle out-of-bounds navigation', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setPosition(mockPosition);
        result.current.makeMove(mockMoves[0] as Move);
      });

      // Try to navigate beyond bounds
      act(() => {
        result.current.goToMove(10); // Beyond last move
      });

      expect(result.current.training.currentMoveIndex).toBe(0); // Clamped to last move

      act(() => {
        result.current.goToMove(-5); // Before initial position
      });

      expect(result.current.training.currentMoveIndex).toBe(-1); // Clamped to initial
    });

    it('should not navigate when already at target index', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setPosition(mockPosition);
        result.current.makeMove(mockMoves[0] as Move);
      });

      const fenBefore = result.current.training.currentFen;

      // Navigate to current position (should be no-op)
      act(() => {
        result.current.goToMove(0);
      });

      expect(result.current.training.currentFen).toBe(fenBefore);
    });

    it('should correctly determine turn after navigation', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setPosition(mockPosition);
        mockMoves.forEach(move => {
          result.current.makeMove(move as Move);
        });
      });

      // Test turn determination at various positions
      const testCases = [
        { moveIndex: -1, expectedTurn: true }, // Initial: White's turn
        { moveIndex: 0, expectedTurn: false }, // After e4: Black's turn
        { moveIndex: 1, expectedTurn: true },  // After e5: White's turn
        { moveIndex: 2, expectedTurn: false }, // After Nf3: Black's turn
        { moveIndex: 3, expectedTurn: true }   // After Nc6: White's turn
      ];

      testCases.forEach(({ moveIndex, expectedTurn }) => {
        act(() => {
          result.current.goToMove(moveIndex);
        });
        expect(result.current.training.isPlayerTurn).toBe(expectedTurn);
      });
    });
  });

  describe('Navigation helper actions', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useStore());
      
      // Setup position with multiple moves
      act(() => {
        result.current.setPosition(mockPosition);
        mockMoves.forEach(move => {
          result.current.makeMove(move as Move);
        });
      });
    });

    it('should navigate to first move', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.goToFirst();
      });

      expect(result.current.training.currentMoveIndex).toBe(-1);
      expect(result.current.training.currentFen).toBe(mockPosition.fen);
    });

    it('should navigate to previous move', () => {
      const { result } = renderHook(() => useStore());

      // Start at last move (index 3)
      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.training.currentMoveIndex).toBe(2);

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.training.currentMoveIndex).toBe(1);
    });

    it('should navigate to next move', () => {
      const { result } = renderHook(() => useStore());

      // Go to beginning first
      act(() => {
        result.current.goToFirst();
      });

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.training.currentMoveIndex).toBe(0);

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.training.currentMoveIndex).toBe(1);
    });

    it('should navigate to last move', () => {
      const { result } = renderHook(() => useStore());

      // Go to beginning first
      act(() => {
        result.current.goToFirst();
      });

      act(() => {
        result.current.goToLast();
      });

      expect(result.current.training.currentMoveIndex).toBe(3);
    });

    it('should handle navigation from undefined currentMoveIndex', () => {
      const { result } = renderHook(() => useStore());

      // Manually set currentMoveIndex to undefined
      act(() => {
        useStore.setState((state) => ({
          training: { ...state.training, currentMoveIndex: undefined }
        }));
      });

      // goToPrevious should use moveHistory.length - 1 as current
      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.training.currentMoveIndex).toBe(2); // 3 - 1

      // Reset to undefined again
      act(() => {
        useStore.setState((state) => ({
          training: { ...state.training, currentMoveIndex: undefined }
        }));
      });

      // goToNext should use -1 as current
      act(() => {
        result.current.goToNext();
      });

      expect(result.current.training.currentMoveIndex).toBe(0); // -1 + 1
    });
  });

  describe('Edge cases', () => {
    it('should handle navigation without game instance', () => {
      const { result } = renderHook(() => useStore());

      // Set position without game (simulate error state)
      act(() => {
        useStore.setState((state) => ({
          training: { 
            ...state.training, 
            game: null,
            currentPosition: mockPosition,
            moveHistory: [mockMoves[0] as Move]
          }
        }));
      });

      // Should not throw when navigating
      act(() => {
        result.current.goToMove(0);
      });

      // State should remain unchanged - when game is null, currentMoveIndex defaults to -1
      expect(result.current.training.currentMoveIndex).toBe(-1); // Should stay at -1 when game is null
    });

    it('should handle moves with promotion', () => {
      const { result } = renderHook(() => useStore());

      const promotionPosition: EndgamePosition = {
        ...mockPosition,
        fen: '8/P7/8/8/8/8/8/k6K w - - 0 1' // Pawn ready to promote
      };

      const promotionMove: Partial<Move> = {
        from: 'a7',
        to: 'a8',
        san: 'a8=Q',
        piece: 'p',
        color: 'w',
        promotion: 'q'
      };

      act(() => {
        result.current.setPosition(promotionPosition);
        result.current.makeMove(promotionMove as Move);
      });

      // Navigate back and forth
      act(() => {
        result.current.goToFirst();
      });

      act(() => {
        result.current.goToLast();
      });

      // Should handle promotion correctly
      expect(result.current.training.currentFen).toContain('Q'); // Queen on board
    });
  });
});