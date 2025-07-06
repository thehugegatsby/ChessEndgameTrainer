/**
 * @fileoverview Unit tests for useEvaluation hook
 * @description Tests unified evaluation service integration, caching, and state management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEvaluation } from '@shared/hooks/useEvaluation';
import { TEST_POSITIONS } from '../../helpers/testPositions';

// Mock the unified evaluation service and dependencies
const mockFormattedEvaluation = {
  mainText: '+1.5',
  className: 'winning',
  metadata: {
    isTablebase: false,
    isMate: false,
    isDrawn: false
  }
};

const mockTablebaseFormattedEvaluation = {
  mainText: 'Win',
  className: 'winning',
  metadata: {
    isTablebase: true,
    isMate: false,
    isDrawn: false
  }
};

const mockPerspectiveEvaluation = {
  isTablebasePosition: true,
  wdl: 2,
  dtz: 5
};

const mockUnifiedService = {
  getFormattedEvaluation: jest.fn(),
  getPerspectiveEvaluation: jest.fn()
};

// Mock the service factory
jest.mock('@shared/lib/chess/evaluation/unifiedService', () => ({
  UnifiedEvaluationService: jest.fn().mockImplementation(() => mockUnifiedService)
}));

jest.mock('@shared/lib/chess/evaluation/providerAdapters', () => ({
  EngineProviderAdapter: jest.fn(),
  TablebaseProviderAdapter: jest.fn()
}));

jest.mock('@shared/lib/cache/LRUCache', () => ({
  LRUCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  }))
}));

jest.mock('@shared/lib/chess/evaluation/cacheAdapter', () => ({
  LRUCacheAdapter: jest.fn()
}));

describe('useEvaluation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Set up default mock implementations
    mockUnifiedService.getFormattedEvaluation.mockResolvedValue(mockFormattedEvaluation);
    mockUnifiedService.getPerspectiveEvaluation.mockResolvedValue(mockPerspectiveEvaluation);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: false
      }));

      expect(result.current.evaluations).toEqual([]);
      expect(result.current.lastEvaluation).toBeNull();
      expect(result.current.isEvaluating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not evaluate when disabled', async () => {
      renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: false
      }));

      // Wait for any potential async operations
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockUnifiedService.getFormattedEvaluation).not.toHaveBeenCalled();
    });

    it('should not evaluate with empty FEN', async () => {
      renderHook(() => useEvaluation({
        fen: '',
        isEnabled: true
      }));

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockUnifiedService.getFormattedEvaluation).not.toHaveBeenCalled();
    });
  });

  describe('Engine Evaluations', () => {
    it('should evaluate position when enabled', async () => {
      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: true
      }));

      expect(result.current.isEvaluating).toBe(true);

      await act(async () => {
        await waitFor(() => {
          expect(mockUnifiedService.getFormattedEvaluation).toHaveBeenCalledWith(
            TEST_POSITIONS.STARTING_POSITION,
            'w'
          );
        });
      });

      expect(result.current.isEvaluating).toBe(false);
      expect(result.current.evaluations).toHaveLength(1);
      expect(result.current.lastEvaluation).toEqual({
        evaluation: 150, // +1.5 * 100
        mateInMoves: undefined
      });
    });

    it('should handle mate evaluations', async () => {
      const mateEvaluation = {
        mainText: 'M3',
        className: 'winning',
        metadata: {
          isTablebase: false,
          isMate: true,
          isDrawn: false
        }
      };

      mockUnifiedService.getFormattedEvaluation.mockResolvedValueOnce(mateEvaluation);

      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.KQK_TABLEBASE_WIN,
        isEnabled: true
      }));

      await act(async () => {
        await waitFor(() => {
          expect(result.current.lastEvaluation?.mateInMoves).toBe(3);
        });
      });
    });

    it('should determine player perspective from FEN', async () => {
      // Black to move position
      const blackToMoveFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

      renderHook(() => useEvaluation({
        fen: blackToMoveFen,
        isEnabled: true
      }));

      await act(async () => {
        await waitFor(() => {
          expect(mockUnifiedService.getFormattedEvaluation).toHaveBeenCalledWith(
            blackToMoveFen,
            'b'
          );
        });
      });
    });
  });

  describe('Tablebase Evaluations', () => {
    beforeEach(() => {
      mockUnifiedService.getFormattedEvaluation.mockResolvedValue(mockTablebaseFormattedEvaluation);
    });

    it('should handle tablebase position without previous FEN', async () => {
      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.KQK_TABLEBASE_WIN,
        isEnabled: true
      }));

      await act(async () => {
        await waitFor(() => {
          expect(result.current.lastEvaluation?.tablebase).toEqual({
            isTablebasePosition: true,
            wdlAfter: 2,
            category: 'win',
            dtz: 5
          });
        });
      });
    });

    it('should handle tablebase comparison with previous FEN', async () => {
      const previousFen = TEST_POSITIONS.STARTING_POSITION;
      const currentFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;

      const { result } = renderHook(() => useEvaluation({
        fen: currentFen,
        isEnabled: true,
        previousFen
      }));

      await act(async () => {
        await waitFor(() => {
          expect(mockUnifiedService.getPerspectiveEvaluation).toHaveBeenCalledWith(
            previousFen,
            'b' // Player who made the move (since current position has white to move)
          );
          expect(mockUnifiedService.getPerspectiveEvaluation).toHaveBeenCalledWith(
            currentFen,
            'b'
          );
        });
      });

      expect(result.current.lastEvaluation?.tablebase).toEqual({
        isTablebasePosition: true,
        wdlBefore: 2,
        wdlAfter: 2,
        category: 'win',
        dtz: 5
      });
    });

    it('should handle black to move in tablebase comparison', async () => {
      const blackToMoveFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

      renderHook(() => useEvaluation({
        fen: blackToMoveFen,
        isEnabled: true,
        previousFen: TEST_POSITIONS.STARTING_POSITION
      }));

      await act(async () => {
        await waitFor(() => {
          expect(mockUnifiedService.getPerspectiveEvaluation).toHaveBeenCalledWith(
            TEST_POSITIONS.STARTING_POSITION,
            'w' // White made the move to reach black-to-move position
          );
        });
      });
    });

    it('should handle drawn tablebase positions', async () => {
      const drawEvaluation = {
        mainText: 'Draw',
        className: 'neutral',
        metadata: {
          isTablebase: true,
          isMate: false,
          isDrawn: true
        }
      };

      mockUnifiedService.getFormattedEvaluation.mockResolvedValueOnce(drawEvaluation);

      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.KRK_TABLEBASE_DRAW,
        isEnabled: true
      }));

      await act(async () => {
        await waitFor(() => {
          expect(result.current.lastEvaluation?.tablebase?.category).toBe('draw');
        });
      });
    });
  });

  describe('State Management', () => {
    it('should add evaluations to history', async () => {
      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: true
      }));

      await act(async () => {
        await waitFor(() => {
          expect(result.current.evaluations).toHaveLength(1);
        });
      });

      const testEvaluation = { evaluation: 200, mateInMoves: undefined };
      act(() => {
        result.current.addEvaluation(testEvaluation);
      });

      expect(result.current.evaluations).toHaveLength(2);
      expect(result.current.lastEvaluation).toEqual(testEvaluation);
    });

    it('should clear evaluations', async () => {
      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: true
      }));

      await act(async () => {
        await waitFor(() => {
          expect(result.current.evaluations).toHaveLength(1);
        });
      });

      act(() => {
        result.current.clearEvaluations();
      });

      expect(result.current.evaluations).toEqual([]);
      expect(result.current.lastEvaluation).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle evaluation errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Evaluation failed');
      
      mockUnifiedService.getFormattedEvaluation.mockRejectedValueOnce(testError);

      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: true
      }));

      await act(async () => {
        await waitFor(() => {
          expect(result.current.error).toBe('Evaluation failed');
        });
      });

      expect(result.current.isEvaluating).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unified evaluation failed:', testError);
      
      consoleErrorSpy.mockRestore();
    });

    it('should not set error for AbortError', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      
      mockUnifiedService.getFormattedEvaluation.mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: true
      }));

      await act(async () => {
        await waitFor(() => {
          expect(result.current.isEvaluating).toBe(false);
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Abort Controller', () => {
    it('should cancel previous evaluation when FEN changes', async () => {
      let resolveFirstEvaluation: (value: any) => void;
      const firstEvaluationPromise = new Promise(resolve => {
        resolveFirstEvaluation = resolve;
      });

      mockUnifiedService.getFormattedEvaluation.mockReturnValueOnce(firstEvaluationPromise);

      const { result, rerender } = renderHook(
        ({ fen }: { fen: string }) => useEvaluation({
          fen,
          isEnabled: true
        }),
        {
          initialProps: { fen: TEST_POSITIONS.STARTING_POSITION }
        }
      );

      expect(result.current.isEvaluating).toBe(true);

      // Change FEN before first evaluation completes
      rerender({ fen: TEST_POSITIONS.WHITE_ADVANTAGE });

      // Resolve first evaluation (should be ignored)
      await act(async () => {
        resolveFirstEvaluation(mockFormattedEvaluation);
      });

      // Should still be evaluating the new position
      expect(mockUnifiedService.getFormattedEvaluation).toHaveBeenCalledTimes(2);
    });

    it('should not update state if evaluation was aborted', async () => {
      let rejectEvaluation: (error: any) => void;
      const evaluationPromise = new Promise((_, reject) => {
        rejectEvaluation = reject;
      });

      mockUnifiedService.getFormattedEvaluation.mockReturnValueOnce(evaluationPromise);

      const { result, unmount } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: true
      }));

      expect(result.current.isEvaluating).toBe(true);

      // Unmount component (should abort evaluation)
      unmount();

      // Reject the evaluation
      await act(async () => {
        const abortError = new Error('AbortError');
        abortError.name = 'AbortError';
        rejectEvaluation(abortError);
      });

      // State should not have been updated
      expect(result.current.evaluations).toEqual([]);
    });
  });

  describe('Position Changes', () => {
    it('should re-evaluate when FEN changes', async () => {
      const { rerender } = renderHook(
        ({ fen }: { fen: string }) => useEvaluation({
          fen,
          isEnabled: true
        }),
        {
          initialProps: { fen: TEST_POSITIONS.STARTING_POSITION }
        }
      );

      await act(async () => {
        await waitFor(() => {
          expect(mockUnifiedService.getFormattedEvaluation).toHaveBeenCalledTimes(1);
        });
      });

      rerender({ fen: TEST_POSITIONS.WHITE_ADVANTAGE });

      await act(async () => {
        await waitFor(() => {
          expect(mockUnifiedService.getFormattedEvaluation).toHaveBeenCalledTimes(2);
        });
      });
    });

    it('should re-evaluate when enabled state changes', async () => {
      const { rerender } = renderHook(
        ({ isEnabled }: { isEnabled: boolean }) => useEvaluation({
          fen: TEST_POSITIONS.STARTING_POSITION,
          isEnabled
        }),
        {
          initialProps: { isEnabled: false }
        }
      );

      expect(mockUnifiedService.getFormattedEvaluation).not.toHaveBeenCalled();

      rerender({ isEnabled: true });

      await act(async () => {
        await waitFor(() => {
          expect(mockUnifiedService.getFormattedEvaluation).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('Cache Stats', () => {
    it('should return undefined cache stats (TODO feature)', () => {
      const { result } = renderHook(() => useEvaluation({
        fen: TEST_POSITIONS.STARTING_POSITION,
        isEnabled: false
      }));

      expect(result.current.cacheStats).toBeUndefined();
    });
  });
});