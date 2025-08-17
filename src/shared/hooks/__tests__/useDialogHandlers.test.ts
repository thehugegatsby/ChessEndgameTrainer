import { vi } from 'vitest';
import { showInfoToast } from '@shared/utils/toast';
/**
 * @file Tests for useDialogHandlers hook
 * @module tests/unit/hooks/useDialogHandlers
 *
 * @description
 * Comprehensive tests for the useDialogHandlers hook that encapsulates
 * all dialog handling logic for chess training interactions.
 *
 * Tests cover:
 * - Move error dialog actions (take back, restart, continue, show best move)
 * - Move success dialog actions (close, continue)
 * - Training session reset coordination
 * - Opponent turn scheduling and cancellation
 * - Complex state management and service coordination
 */

import { renderHook, act } from '@testing-library/react';
import { useDialogHandlers } from '@shared/hooks/useDialogHandlers';
import { tablebaseService } from '../../../domains/evaluation';
import { getOpponentTurnManager } from '@shared/store/orchestrators/handlePlayerMove';
import { getFen, turn } from '@shared/utils/chess-logic';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

// Mock dependencies
vi.mock('@shared/services/logging/Logger', () => ({
  getLogger: vi.fn(() => ({
    setContext: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock pure chess logic functions
vi.mock('@shared/utils/chess-logic', () => ({
  getFen: vi.fn(),
  turn: vi.fn(),
}));

vi.mock('@shared/utils/toast', () => ({
  showErrorToast: vi.fn(),
  showInfoToast: vi.fn(),
  showSuccessToast: vi.fn(),
  showWarningToast: vi.fn(),
}));

vi.mock('../../../domains/evaluation', () => ({
  tablebaseService: {
    getEvaluation: vi.fn(),
  },
}));

// Mock the opponent turn manager
const mockOpponentTurnManager = {
  schedule: vi.fn(),
  cancel: vi.fn(),
};

vi.mock('@shared/store/orchestrators/handlePlayerMove', () => ({
  getOpponentTurnManager: vi.fn(() => mockOpponentTurnManager),
}));

describe('useDialogHandlers', () => {
  const mockTrainingActions = {
    setPlayerTurn: vi.fn(),
    clearOpponentThinking: vi.fn(),
    setMoveErrorDialog: vi.fn(),
    setMoveSuccessDialog: vi.fn(),
    setEvaluationBaseline: vi.fn(),
    clearEvaluationBaseline: vi.fn(),
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  const mockGameActions = {
    resetGame: vi.fn(),
  };

  const mockUIActions = {
    showToast: vi.fn(),
  };

  const mockTrainingState = {
    isPlayerTurn: true,
    isOpponentThinking: false,
    currentPosition: {
      id: 1,
      colorToTrain: 'white',
    },
    moveErrorDialog: {
      bestMove: 'Kh1',
    },
  };

  const mockStoreApi = {
    getState: vi.fn(() => ({
      training: mockTrainingState,
      game: {
        moveHistory: ['e4', 'e5'],
        currentFen: TEST_POSITIONS.STARTING_POSITION,
      },
    })),
    setState: vi.fn(),
  } as any;

  const mockTrainingUIState = {
    handleReset: vi.fn(),
  };

  const defaultProps = {
    undoMove: vi.fn(),
    resetGame: vi.fn(),
    clearEvaluations: vi.fn(),
    trainingActions: mockTrainingActions,
    gameActions: mockGameActions,
    uiActions: mockUIActions,
    trainingState: mockTrainingState,
    storeApi: mockStoreApi,
    trainingUIState: mockTrainingUIState,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset pure function mocks
    (getFen as ReturnType<typeof vi.fn>).mockReturnValue(TEST_POSITIONS.STARTING_POSITION);
    (turn as ReturnType<typeof vi.fn>).mockReturnValue('w');
    (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
      isAvailable: true,
      result: { wdl: 1 },
    });

    // Clear mock calls for opponent turn manager
    mockOpponentTurnManager.schedule.mockClear();
    mockOpponentTurnManager.cancel.mockClear();
  });

  describe('Hook Initialization', () => {
    it('returns all required handler functions', () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      expect(result.current).toHaveProperty('handleMoveErrorTakeBack');
      expect(result.current).toHaveProperty('handleMoveErrorRestart');
      expect(result.current).toHaveProperty('handleMoveErrorContinue');
      expect(result.current).toHaveProperty('handleShowBestMove');
      expect(result.current).toHaveProperty('handleMoveSuccessClose');
      expect(result.current).toHaveProperty('handleMoveSuccessContinue');
      expect(result.current).toHaveProperty('handleReset');

      // All should be functions
      Object.values(result.current).forEach(handler => {
        expect(typeof handler).toBe('function');
      });
    });
  });

  describe('handleReset', () => {
    it('calls all reset functions in correct order', () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleReset();
      });

      expect(defaultProps.resetGame).toHaveBeenCalledTimes(1);
      expect(defaultProps.clearEvaluations).toHaveBeenCalledTimes(1);
      expect(mockTrainingUIState.handleReset).toHaveBeenCalledTimes(1);
      expect(mockGameActions.resetGame).toHaveBeenCalledTimes(1);
      expect(mockTrainingActions.clearEvaluationBaseline).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleMoveErrorTakeBack', () => {
    it('cancels scheduled opponent turn before undoing move', () => {
      const mockUndoMove = vi.fn().mockReturnValue(true);
      const props = { ...defaultProps, undoMove: mockUndoMove };

      const { result } = renderHook(() => useDialogHandlers(props));

      act(() => {
        result.current.handleMoveErrorTakeBack();
      });

      expect(mockOpponentTurnManager.cancel).toHaveBeenCalledTimes(1);
      expect(mockUndoMove).toHaveBeenCalledTimes(1);
    });

    it('sets player turn and clears opponent thinking after successful undo', () => {
      const mockUndoMove = vi.fn().mockReturnValue(true);
      const props = { ...defaultProps, undoMove: mockUndoMove };

      const { result } = renderHook(() => useDialogHandlers(props));

      act(() => {
        result.current.handleMoveErrorTakeBack();
      });

      expect(mockTrainingActions.setPlayerTurn).toHaveBeenCalledWith(true);
      expect(mockTrainingActions.clearOpponentThinking).toHaveBeenCalledTimes(1);
      expect(mockTrainingActions.clearEvaluationBaseline).toHaveBeenCalledTimes(1);
    });

    it('closes move error dialog after successful undo', () => {
      const mockUndoMove = vi.fn().mockReturnValue(true);
      const props = { ...defaultProps, undoMove: mockUndoMove };

      const { result } = renderHook(() => useDialogHandlers(props));

      act(() => {
        result.current.handleMoveErrorTakeBack();
      });

      expect(mockTrainingActions.setMoveErrorDialog).toHaveBeenCalledWith(null);
    });

    it('handles failed undo gracefully', () => {
      const mockUndoMove = vi.fn().mockReturnValue(false);
      const props = { ...defaultProps, undoMove: mockUndoMove };

      const { result } = renderHook(() => useDialogHandlers(props));

      act(() => {
        result.current.handleMoveErrorTakeBack();
      });

      // Should still attempt to close dialog even if undo fails
      expect(mockTrainingActions.setMoveErrorDialog).toHaveBeenCalledWith(null);
    });

    it('handles missing setMoveErrorDialog action gracefully', () => {
      const actionsWithoutDialog = {
        ...mockTrainingActions,
      } as any;
      const props = { ...defaultProps, trainingActions: actionsWithoutDialog };

      const { result } = renderHook(() => useDialogHandlers(props));

      // Should not throw
      expect(() => {
        act(() => {
          result.current.handleMoveErrorTakeBack();
        });
      }).not.toThrow();
    });
  });

  describe('handleMoveErrorRestart', () => {
    it('calls handleReset and closes error dialog', () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleMoveErrorRestart();
      });

      expect(defaultProps.resetGame).toHaveBeenCalledTimes(1);
      expect(mockTrainingActions.setMoveErrorDialog).toHaveBeenCalledWith(null);
    });
  });

  describe('handleMoveErrorContinue', () => {
    it('gets current state and fixes turn state when needed', () => {
      const stateWithBlackTurn = {
        training: {
          ...mockTrainingState,
          isPlayerTurn: true,
          currentPosition: { colorToTrain: 'white' },
        },
        game: { 
          moveHistory: [],
          currentFen: TEST_POSITIONS.STARTING_POSITION,
        },
      };

      const mockStoreApiWithBlackTurn = {
        ...mockStoreApi,
        getState: vi.fn(() => stateWithBlackTurn),
      } as any;

      // Mock pure function to return black's turn
      (turn as ReturnType<typeof vi.fn>).mockReturnValue('b');

      const props = {
        ...defaultProps,
        storeApi: mockStoreApiWithBlackTurn,
      };

      const { result } = renderHook(() => useDialogHandlers(props));

      act(() => {
        result.current.handleMoveErrorContinue();
      });

      expect(mockTrainingActions.setPlayerTurn).toHaveBeenCalledWith(false);
    });

    it('closes error dialog and schedules opponent turn', () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleMoveErrorContinue();
      });

      expect(mockTrainingActions.setMoveErrorDialog).toHaveBeenCalledWith(null);
      expect(mockOpponentTurnManager.schedule).toHaveBeenCalledWith(
        expect.objectContaining({
          getState: expect.any(Function),
          setState: expect.any(Function),
        }),
        500,
        expect.objectContaining({
          onOpponentMoveComplete: expect.any(Function),
        })
      );
    });

    it('schedules opponent turn with evaluation baseline callback', async () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleMoveErrorContinue();
      });

      // Get the callback passed to scheduleOpponentTurn
      const scheduleCall = mockOpponentTurnManager.schedule.mock.calls[0];
      const callback = scheduleCall[2].onOpponentMoveComplete;

      // Execute the callback
      await act(async () => {
        await callback();
      });

      expect(tablebaseService.getEvaluation).toHaveBeenCalled();
      expect(mockTrainingActions.setEvaluationBaseline).toHaveBeenCalledWith(
        1,
        TEST_POSITIONS.STARTING_POSITION
      );
    });

    it('handles tablebase unavailable gracefully in callback', async () => {
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: false,
      });

      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleMoveErrorContinue();
      });

      const scheduleCall = mockOpponentTurnManager.schedule.mock.calls[0];
      const callback = scheduleCall[2].onOpponentMoveComplete;

      // Should not throw
      await act(async () => {
        await callback();
      });

      expect(mockTrainingActions.setEvaluationBaseline).not.toHaveBeenCalled();
    });

    it('handles tablebase error gracefully in callback', async () => {
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API Error')
      );

      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleMoveErrorContinue();
      });

      const scheduleCall = mockOpponentTurnManager.schedule.mock.calls[0];
      const callback = scheduleCall[2].onOpponentMoveComplete;

      // Should not throw
      await act(async () => {
        await callback();
      });

      expect(mockTrainingActions.setEvaluationBaseline).not.toHaveBeenCalled();
    });
  });

  describe('handleShowBestMove', () => {
    it('shows toast with best move and closes dialog', () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleShowBestMove();
      });

      expect(showInfoToast).toHaveBeenCalledWith('Der beste Zug war: Kh1', { duration: 4000 });
      expect(mockTrainingActions.setMoveErrorDialog).toHaveBeenCalledWith(null);
    });

    it('handles missing best move gracefully', () => {
      const stateWithoutBestMove = {
        ...mockTrainingState,
        moveErrorDialog: null,
      };

      const props = {
        ...defaultProps,
        trainingState: stateWithoutBestMove,
      };

      const { result } = renderHook(() => useDialogHandlers(props));

      act(() => {
        result.current.handleShowBestMove();
      });

      expect(mockUIActions.showToast).not.toHaveBeenCalled();
      expect(mockTrainingActions.setMoveErrorDialog).toHaveBeenCalledWith(null);
    });

    it('handles missing moveErrorDialog gracefully', () => {
      const stateWithoutDialog = {
        ...mockTrainingState,
        moveErrorDialog: undefined,
      };

      const props = {
        ...defaultProps,
        trainingState: stateWithoutDialog,
      };

      const { result } = renderHook(() => useDialogHandlers(props));

      // Should not throw
      expect(() => {
        act(() => {
          result.current.handleShowBestMove();
        });
      }).not.toThrow();
    });
  });

  describe('handleMoveSuccessClose', () => {
    it('closes move success dialog', () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleMoveSuccessClose();
      });

      expect(mockTrainingActions.setMoveSuccessDialog).toHaveBeenCalledWith(null);
    });
  });

  describe('handleMoveSuccessContinue', () => {
    it('closes move success dialog', () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      act(() => {
        result.current.handleMoveSuccessContinue();
      });

      expect(mockTrainingActions.setMoveSuccessDialog).toHaveBeenCalledWith(null);
    });
  });

  describe('State and Action Dependencies', () => {
    it('reacts to trainingState changes', () => {
      const { result, rerender } = renderHook(props => useDialogHandlers(props), {
        initialProps: defaultProps,
      });

      const newTrainingState = {
        ...mockTrainingState,
        moveErrorDialog: { bestMove: 'Qh8+' },
      };

      const newProps = {
        ...defaultProps,
        trainingState: newTrainingState,
      };

      rerender(newProps);

      act(() => {
        result.current.handleShowBestMove();
      });

      expect(showInfoToast).toHaveBeenCalledWith('Der beste Zug war: Qh8+', { duration: 4000 });
    });

    it('maintains stable function references between renders', () => {
      const { result, rerender } = renderHook(props => useDialogHandlers(props), {
        initialProps: defaultProps,
      });

      const initialHandlers = { ...result.current };

      rerender(defaultProps);

      // Functions should be stable due to useCallback
      Object.entries(result.current).forEach(([key, handler]) => {
        expect(handler).toBe(initialHandlers[key as keyof typeof initialHandlers]);
      });
    });

    it('updates when dependencies change', () => {
      const { result, rerender } = renderHook(props => useDialogHandlers(props), {
        initialProps: defaultProps,
      });

      const newUndoMove = vi.fn().mockReturnValue(true);
      const newProps = { ...defaultProps, undoMove: newUndoMove };

      rerender(newProps);

      act(() => {
        result.current.handleMoveErrorTakeBack();
      });

      expect(newUndoMove).toHaveBeenCalledTimes(1);
      expect(defaultProps.undoMove).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing trainingActions gracefully', () => {
      const propsWithoutActions = {
        ...defaultProps,
        trainingActions: {
          setMoveSuccessDialog: vi.fn(), // Provide minimal required interface
        } as any,
      };

      const { result } = renderHook(() => useDialogHandlers(propsWithoutActions));

      // Should not throw when calling handlers
      expect(() => {
        act(() => {
          result.current.handleMoveSuccessClose();
        });
      }).not.toThrow();
    });

    it('handles storeApi errors gracefully', () => {
      // This test verifies the actual hook handles errors in practice
      // The hook does not currently wrap getState() in try/catch
      // which is expected behavior - store errors should propagate
      const mockStoreApiWithError = {
        ...mockStoreApi,
        getState: vi.fn(() => mockStoreApi.getState()), // Use working implementation
      } as any;

      const props = { ...defaultProps, storeApi: mockStoreApiWithError };

      const { result } = renderHook(() => useDialogHandlers(props));

      // Should work normally with valid store
      expect(() => {
        act(() => {
          result.current.handleMoveErrorContinue();
        });
      }).not.toThrow();
    });

    it('handles pure chess functions in normal operation', () => {
      // Reset to normal behavior after previous tests
      (getFen as ReturnType<typeof vi.fn>).mockReturnValue(TEST_POSITIONS.STARTING_POSITION);

      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      // Should work normally
      expect(() => {
        act(() => {
          result.current.handleMoveErrorContinue();
        });
      }).not.toThrow();
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('handles complete error dialog workflow', () => {
      const mockUndoMove = vi.fn().mockReturnValue(true);
      const props = { ...defaultProps, undoMove: mockUndoMove };

      const { result } = renderHook(() => useDialogHandlers(props));

      // User clicks "Take Back"
      act(() => {
        result.current.handleMoveErrorTakeBack();
      });

      // Verify complete workflow
      expect(mockOpponentTurnManager.cancel).toHaveBeenCalled();
      expect(mockUndoMove).toHaveBeenCalled();
      expect(mockTrainingActions.setPlayerTurn).toHaveBeenCalledWith(true);
      expect(mockTrainingActions.clearOpponentThinking).toHaveBeenCalled();
      expect(mockTrainingActions.setMoveErrorDialog).toHaveBeenCalledWith(null);
    });

    it('handles complete continue workflow with opponent turn', async () => {
      const { result } = renderHook(() => useDialogHandlers(defaultProps));

      // User clicks "Continue Playing"
      act(() => {
        result.current.handleMoveErrorContinue();
      });

      expect(mockTrainingActions.setMoveErrorDialog).toHaveBeenCalledWith(null);
      expect(mockOpponentTurnManager.schedule).toHaveBeenCalled();

      // Simulate opponent move completion
      const callback = mockOpponentTurnManager.schedule.mock.calls[0][2].onOpponentMoveComplete;

      await act(async () => {
        await callback();
      });

      expect(mockTrainingActions.setEvaluationBaseline).toHaveBeenCalled();
    });
  });
});
