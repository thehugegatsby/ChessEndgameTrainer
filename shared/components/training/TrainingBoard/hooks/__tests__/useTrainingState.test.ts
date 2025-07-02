import { renderHook, act } from '@testing-library/react';
import { useTrainingState } from '../useTrainingState';

describe('useTrainingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useTrainingState());

      expect(result.current.warning).toBeNull();
      expect(result.current.engineError).toBeNull();
      expect(result.current.moveError).toBeNull();
      expect(result.current.showMoveErrorDialog).toBe(false);
      expect(result.current.showLastEvaluation).toBe(false);
      expect(result.current.resetKey).toBe(0);
    });

    it('should provide all expected action handlers', () => {
      const { result } = renderHook(() => useTrainingState());

      expect(typeof result.current.setWarning).toBe('function');
      expect(typeof result.current.setEngineError).toBe('function');
      expect(typeof result.current.setMoveError).toBe('function');
      expect(typeof result.current.setShowMoveErrorDialog).toBe('function');
      expect(typeof result.current.setShowLastEvaluation).toBe('function');
      expect(typeof result.current.handleReset).toBe('function');
      expect(typeof result.current.handleDismissMoveError).toBe('function');
      expect(typeof result.current.handleClearWarning).toBe('function');
      expect(typeof result.current.handleClearEngineError).toBe('function');
      expect(typeof result.current.showEvaluationBriefly).toBe('function');
    });
  });

  describe('State Setters', () => {
    it('should set warning correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      act(() => {
        result.current.setWarning('Test warning');
      });

      expect(result.current.warning).toBe('Test warning');

      act(() => {
        result.current.setWarning(null);
      });

      expect(result.current.warning).toBeNull();
    });

    it('should set engine error correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      act(() => {
        result.current.setEngineError('Engine failed');
      });

      expect(result.current.engineError).toBe('Engine failed');

      act(() => {
        result.current.setEngineError(null);
      });

      expect(result.current.engineError).toBeNull();
    });

    it('should set move error correctly', () => {
      const { result } = renderHook(() => useTrainingState());
      const moveError = {
        move: 'e2e4',
        message: 'Invalid move',
        engineResponded: false
      };

      act(() => {
        result.current.setMoveError(moveError);
      });

      expect(result.current.moveError).toEqual(moveError);

      act(() => {
        result.current.setMoveError(null);
      });

      expect(result.current.moveError).toBeNull();
    });

    it('should set show move error dialog correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      act(() => {
        result.current.setShowMoveErrorDialog(true);
      });

      expect(result.current.showMoveErrorDialog).toBe(true);

      act(() => {
        result.current.setShowMoveErrorDialog(false);
      });

      expect(result.current.showMoveErrorDialog).toBe(false);
    });

    it('should set show last evaluation correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      act(() => {
        result.current.setShowLastEvaluation(true);
      });

      expect(result.current.showLastEvaluation).toBe(true);

      act(() => {
        result.current.setShowLastEvaluation(false);
      });

      expect(result.current.showLastEvaluation).toBe(false);
    });
  });

  describe('Action Handlers', () => {
    it('should handle reset correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      // Set some state first
      act(() => {
        result.current.setWarning('Test warning');
        result.current.setEngineError('Test error');
        result.current.setMoveError({
          move: 'e2e4',
          message: 'Invalid',
          engineResponded: false
        });
        result.current.setShowMoveErrorDialog(true);
        result.current.setShowLastEvaluation(true);
      });

      const initialResetKey = result.current.resetKey;

      act(() => {
        result.current.handleReset();
      });

      expect(result.current.warning).toBeNull();
      expect(result.current.engineError).toBeNull();
      expect(result.current.moveError).toBeNull();
      expect(result.current.showMoveErrorDialog).toBe(false);
      expect(result.current.showLastEvaluation).toBe(false);
      expect(result.current.resetKey).toBe(initialResetKey + 1);
    });

    it('should handle dismiss move error correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      // Set move error first
      act(() => {
        result.current.setMoveError({
          move: 'e2e4',
          message: 'Invalid',
          engineResponded: false
        });
        result.current.setShowMoveErrorDialog(true);
      });

      act(() => {
        result.current.handleDismissMoveError();
      });

      expect(result.current.moveError).toBeNull();
      expect(result.current.showMoveErrorDialog).toBe(false);
    });

    it('should handle clear warning correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      // Set warning first
      act(() => {
        result.current.setWarning('Test warning');
      });

      act(() => {
        result.current.handleClearWarning();
      });

      expect(result.current.warning).toBeNull();
    });

    it('should handle clear engine error correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      // Set engine error first
      act(() => {
        result.current.setEngineError('Test error');
      });

      act(() => {
        result.current.handleClearEngineError();
      });

      expect(result.current.engineError).toBeNull();
    });
  });

  describe('showEvaluationBriefly', () => {
    it('should show evaluation briefly and auto-hide after 3 seconds', () => {
      const { result } = renderHook(() => useTrainingState());

      expect(result.current.showLastEvaluation).toBe(false);

      act(() => {
        result.current.showEvaluationBriefly();
      });

      expect(result.current.showLastEvaluation).toBe(true);

      // Fast-forward time by 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.showLastEvaluation).toBe(false);
    });

    it('should handle multiple rapid calls correctly', () => {
      const { result } = renderHook(() => useTrainingState());

      // Call multiple times rapidly
      act(() => {
        result.current.showEvaluationBriefly();
        result.current.showEvaluationBriefly();
        result.current.showEvaluationBriefly();
      });

      expect(result.current.showLastEvaluation).toBe(true);

      // Should still hide after 3 seconds (not 9)
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.showLastEvaluation).toBe(false);
    });

    it('should allow manual override before timeout', () => {
      const { result } = renderHook(() => useTrainingState());

      act(() => {
        result.current.showEvaluationBriefly();
      });

      expect(result.current.showLastEvaluation).toBe(true);

      // Manually hide before timeout
      act(() => {
        result.current.setShowLastEvaluation(false);
      });

      expect(result.current.showLastEvaluation).toBe(false);

      // Time should not override manual setting
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.showLastEvaluation).toBe(false);
    });
  });

  describe('Reset Key Behavior', () => {
    it('should increment reset key on each reset', () => {
      const { result } = renderHook(() => useTrainingState());

      const key1 = result.current.resetKey;

      act(() => {
        result.current.handleReset();
      });

      const key2 = result.current.resetKey;
      expect(key2).toBe(key1 + 1);

      act(() => {
        result.current.handleReset();
      });

      const key3 = result.current.resetKey;
      expect(key3).toBe(key2 + 1);
    });

    it('should only increment reset key during full reset', () => {
      const { result } = renderHook(() => useTrainingState());

      const initialKey = result.current.resetKey;

      // These actions should not affect reset key
      act(() => {
        result.current.setWarning('test');
        result.current.handleClearWarning();
        result.current.setEngineError('test');
        result.current.handleClearEngineError();
        result.current.handleDismissMoveError();
      });

      expect(result.current.resetKey).toBe(initialKey);

      // Only full reset should increment
      act(() => {
        result.current.handleReset();
      });

      expect(result.current.resetKey).toBe(initialKey + 1);
    });
  });

  describe('State Isolation', () => {
    it('should maintain independent state for each hook instance', () => {
      const { result: result1 } = renderHook(() => useTrainingState());
      const { result: result2 } = renderHook(() => useTrainingState());

      act(() => {
        result1.current.setWarning('Warning 1');
        result2.current.setWarning('Warning 2');
      });

      expect(result1.current.warning).toBe('Warning 1');
      expect(result2.current.warning).toBe('Warning 2');

      act(() => {
        result1.current.handleReset();
      });

      expect(result1.current.warning).toBeNull();
      expect(result2.current.warning).toBe('Warning 2'); // Unchanged
    });
  });

  describe('Complex State Scenarios', () => {
    it('should handle multiple simultaneous errors', () => {
      const { result } = renderHook(() => useTrainingState());

      const moveError = {
        move: 'e2e4',
        message: 'Invalid move',
        engineResponded: true
      };

      act(() => {
        result.current.setWarning('Warning message');
        result.current.setEngineError('Engine error');
        result.current.setMoveError(moveError);
        result.current.setShowMoveErrorDialog(true);
      });

      expect(result.current.warning).toBe('Warning message');
      expect(result.current.engineError).toBe('Engine error');
      expect(result.current.moveError).toEqual(moveError);
      expect(result.current.showMoveErrorDialog).toBe(true);

      // Clear them individually
      act(() => {
        result.current.handleClearWarning();
      });

      expect(result.current.warning).toBeNull();
      expect(result.current.engineError).toBe('Engine error'); // Still there
      expect(result.current.moveError).toEqual(moveError); // Still there
    });
  });
}); 