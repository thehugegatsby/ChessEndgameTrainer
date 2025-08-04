/**
 * @fileoverview Clean Store Integration Tests
 * @description Tests core store functionality with modern patterns
 */

import { act, renderHook } from '@testing-library/react';
import { useStore } from '../../../shared/store/rootStore';
import { EndgamePosition } from '../../../shared/types/endgame';

// Mock the logger
jest.mock('../../../shared/services/logging', 
  require('../../shared/logger-utils').getMockLoggerDefinition()
);

describe('Store Integration Tests', () => {
  const mockPosition: EndgamePosition = {
    id: 1,
    title: 'Test Position',
    fen: 'k7/8/8/8/8/8/P7/K7 w - - 0 1',
    description: 'Simple king and pawn endgame',
    category: 'pawn',
    difficulty: 'beginner',
    goal: 'win',
    sideToMove: 'white',
    targetMoves: 4
  };

  beforeEach(() => {
    act(() => {
      useStore.getState().reset();
    });
  });

  describe('Basic Position Management', () => {
    it('should set and retrieve current position', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setPosition(mockPosition);
      });

      expect(result.current.currentPosition).toEqual(mockPosition);
      expect(result.current.mistakeCount).toBe(0);
    });

    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useStore());

      // First set some state
      act(() => {
        result.current.setPosition(mockPosition);
      });

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentPosition).toBeUndefined();
      expect(result.current.mistakeCount).toBe(0);
      // isLoadingNavigation may be undefined in initial state
      expect(result.current.isLoadingNavigation).toBeFalsy();
    });
  });

  describe('Game State Integration', () => {
    it('should handle position changes correctly', () => {
      const { result } = renderHook(() => useStore());

      const newPosition: EndgamePosition = {
        ...mockPosition,
        id: 2,
        title: 'Second Position',
        fen: 'k7/8/8/8/8/8/1P6/K7 w - - 0 1'
      };

      // Set initial position
      act(() => {
        result.current.setPosition(mockPosition);
      });

      expect(result.current.currentPosition?.id).toBe(1);

      // Change to new position
      act(() => {
        result.current.setPosition(newPosition);
      });

      expect(result.current.currentPosition?.id).toBe(2);
      expect(result.current.currentPosition?.fen).toBe('k7/8/8/8/8/8/1P6/K7 w - - 0 1');
    });
  });

  describe('Store Stability', () => {
    it('should maintain consistent state during updates', () => {
      const { result } = renderHook(() => useStore());

      // Multiple position updates should work consistently
      const positions = [1, 2, 3].map(id => ({
        ...mockPosition,
        id,
        title: `Position ${id}`
      }));

      positions.forEach(position => {
        act(() => {
          result.current.setPosition(position);
        });
        expect(result.current.currentPosition?.id).toBe(position.id);
      });
    });
  });
});