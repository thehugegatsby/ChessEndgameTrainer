/**
 * @fileoverview Async Actions Tests for Zustand Store
 * @description Tests asynchronous operations like loadTrainingContext
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useStore } from '../../../shared/store/store';
import { EndgamePosition } from '../../../shared/types/endgame';
import * as positionService from '../../../shared/services/database/positionService';

// Mock the logger
jest.mock('../../../shared/services/logging', 
  require('../../shared/logger-utils').getMockLoggerDefinition()
);

// Mock position service
jest.mock('../../../shared/services/database/positionService');
const mockPositionService = positionService as jest.Mocked<typeof positionService>;

describe('Store Async Actions', () => {
  const mockPosition: EndgamePosition = {
    id: 1,
    title: 'Test Position',
    fen: 'k7/8/8/8/8/8/P7/K7 w - - 0 1',
    description: 'Test',
    category: 'pawn',
    difficulty: 'beginner',
    goal: 'win',
    sideToMove: 'white',
    targetMoves: 4
  };

  const nextPosition: EndgamePosition = {
    ...mockPosition,
    id: 2,
    title: 'Next Position'
  };

  const prevPosition: EndgamePosition = {
    ...mockPosition,
    id: 0,
    title: 'Previous Position'
  };

  beforeEach(() => {
    act(() => {
      useStore.getState().reset();
    });
    jest.clearAllMocks();
  });

  describe('loadTrainingContext', () => {
    it('should load next and previous positions successfully', async () => {
      const { result } = renderHook(() => useStore());

      // Mock successful responses
      mockPositionService.getNextPosition.mockResolvedValue(nextPosition);
      mockPositionService.getPreviousPosition.mockResolvedValue(prevPosition);

      // Load training context
      await act(async () => {
        await result.current.loadTrainingContext(mockPosition);
      });

      // Should set loading state initially
      expect(result.current.training.currentPosition).toEqual(mockPosition);

      // Wait for async operations to complete
      await waitFor(() => {
        expect(result.current.training.isLoadingNavigation).toBe(false);
      });

      // Should set navigation positions
      expect(result.current.training.nextPosition).toEqual(nextPosition);
      expect(result.current.training.previousPosition).toEqual(prevPosition);
      expect(result.current.training.navigationError).toBeNull();

      // Should call position service correctly
      expect(mockPositionService.getNextPosition).toHaveBeenCalledWith(1, 'pawn');
      expect(mockPositionService.getPreviousPosition).toHaveBeenCalledWith(1, 'pawn');
    });

    it('should handle navigation loading errors', async () => {
      const { result } = renderHook(() => useStore());

      // Mock error responses
      const error = new Error('Network error');
      mockPositionService.getNextPosition.mockRejectedValue(error);
      mockPositionService.getPreviousPosition.mockRejectedValue(error);

      // Load training context
      await act(async () => {
        await result.current.loadTrainingContext(mockPosition);
      });

      // Wait for error handling
      await waitFor(() => {
        expect(result.current.training.isLoadingNavigation).toBe(false);
      });

      // Should set error state
      expect(result.current.training.navigationError).toBe('Navigation konnte nicht geladen werden');
      expect(result.current.training.nextPosition).toBeUndefined();
      expect(result.current.training.previousPosition).toBeUndefined();
    });

    it('should skip loading if already loaded for same position', async () => {
      const { result } = renderHook(() => useStore());

      // Setup initial state with already loaded context
      act(() => {
        useStore.setState((state) => ({
          training: {
            ...state.training,
            currentPosition: mockPosition,
            nextPosition: nextPosition,
            previousPosition: prevPosition
          }
        }));
      });

      // Try to load same position again
      await act(async () => {
        await result.current.loadTrainingContext(mockPosition);
      });

      // Should not call position service
      expect(mockPositionService.getNextPosition).not.toHaveBeenCalled();
      expect(mockPositionService.getPreviousPosition).not.toHaveBeenCalled();
    });

    it('should handle partial failures gracefully', async () => {
      const { result } = renderHook(() => useStore());

      // Mock mixed responses - next succeeds, prev fails
      mockPositionService.getNextPosition.mockResolvedValue(nextPosition);
      mockPositionService.getPreviousPosition.mockRejectedValue(new Error('Not found'));

      // Load training context
      await act(async () => {
        await result.current.loadTrainingContext(mockPosition);
      });

      await waitFor(() => {
        expect(result.current.training.isLoadingNavigation).toBe(false);
      });

      // Should still set error state even with partial success
      expect(result.current.training.navigationError).toBe('Navigation konnte nicht geladen werden');
    });

    it('should handle null navigation positions', async () => {
      const { result } = renderHook(() => useStore());

      // Mock null responses (no next/prev positions)
      mockPositionService.getNextPosition.mockResolvedValue(null);
      mockPositionService.getPreviousPosition.mockResolvedValue(null);

      // Load training context
      await act(async () => {
        await result.current.loadTrainingContext(mockPosition);
      });

      await waitFor(() => {
        expect(result.current.training.isLoadingNavigation).toBe(false);
      });

      // Should handle null positions gracefully
      expect(result.current.training.nextPosition).toBeNull();
      expect(result.current.training.previousPosition).toBeNull();
      expect(result.current.training.navigationError).toBeNull();
    });

    it('should reset navigation state while loading new position', async () => {
      const { result } = renderHook(() => useStore());

      // Setup initial state with existing navigation
      act(() => {
        useStore.setState((state) => ({
          training: {
            ...state.training,
            currentPosition: { ...mockPosition, id: 999 },
            nextPosition: nextPosition,
            previousPosition: prevPosition,
            navigationError: 'Old error'
          }
        }));
      });

      // Mock delayed response to observe intermediate state
      mockPositionService.getNextPosition.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(nextPosition), 100))
      );
      mockPositionService.getPreviousPosition.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(prevPosition), 100))
      );

      // Load new training context
      act(() => {
        result.current.loadTrainingContext(mockPosition);
      });

      // Should immediately reset navigation state
      expect(result.current.training.nextPosition).toBeUndefined();
      expect(result.current.training.previousPosition).toBeUndefined();
      expect(result.current.training.navigationError).toBeNull();
      expect(result.current.training.isLoadingNavigation).toBe(true);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.training.isLoadingNavigation).toBe(false);
      });

      expect(result.current.training.nextPosition).toEqual(nextPosition);
      expect(result.current.training.previousPosition).toEqual(prevPosition);
    });
  });

  describe('Async Edge Cases', () => {
    it('should handle rapid context switches', async () => {
      const { result } = renderHook(() => useStore());

      const position1 = { ...mockPosition, id: 1 };
      const position2 = { ...mockPosition, id: 2 };

      // Mock different delays for each position
      mockPositionService.getNextPosition
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ ...nextPosition, id: 11 }), 200)
        ))
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ ...nextPosition, id: 21 }), 50)
        ));

      mockPositionService.getPreviousPosition
        .mockImplementation(() => Promise.resolve(null));

      // Start loading position 1
      act(() => {
        result.current.loadTrainingContext(position1);
      });

      // Immediately switch to position 2
      act(() => {
        result.current.loadTrainingContext(position2);
      });

      // Wait for all operations to complete
      await waitFor(() => {
        expect(result.current.training.isLoadingNavigation).toBe(false);
      }, { timeout: 300 });

      // Should have loaded position 2's context (faster response)
      expect(result.current.training.currentPosition?.id).toBe(2);
      expect(result.current.training.nextPosition?.id).toBe(21);
    });

    it('should handle memory leaks from unmounted components', async () => {
      const { result, unmount } = renderHook(() => useStore());

      // Mock slow response
      mockPositionService.getNextPosition.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(nextPosition), 200))
      );
      mockPositionService.getPreviousPosition.mockResolvedValue(null);

      // Start loading
      act(() => {
        result.current.loadTrainingContext(mockPosition);
      });

      // Unmount before completion
      unmount();

      // Wait to ensure no errors occur
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });

      // Should not throw errors
      expect(true).toBe(true);
    });
  });
});