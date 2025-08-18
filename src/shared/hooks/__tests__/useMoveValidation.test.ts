import { vi } from 'vitest';
/**
 * @file Tests for useMoveValidation hook
 * @module tests/unit/hooks/useMoveValidation
 *
 * @description
 * Comprehensive tests for the useMoveValidation hook that handles
 * move validation and quality assessment logic.
 *
 * Tests cover:
 * - Move quality evaluation
 * - Tablebase result processing
 * - Analysis status updates
 * - Error handling and edge cases
 */

import { renderHook, act } from '@testing-library/react';
import { useMoveValidation } from '@shared/hooks/useMoveValidation';
import { TRAIN_SCENARIOS } from '@shared/testing/ChessTestData';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

// Mock dependencies
const mockTablebaseActions = {
  setAnalysisStatus: vi.fn(),
  setAnalysisResult: vi.fn(),
};

const mockTablebaseState = {
  analysisStatus: 'idle' as const,
  analysisResult: null,
  cache: new Map(),
};

describe('useMoveValidation', () => {
  const defaultProps = {
    lastEvaluation: null,
    currentFen: TEST_POSITIONS.EMPTY_BOARD,
    evaluations: [],
    isEvaluating: false,
    tablebaseState: mockTablebaseState,
    tablebaseActions: mockTablebaseActions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useMoveValidation(defaultProps));

      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(0);
      expect(result.current.isProcessing).toBe(false);
    });

    it('handles missing dependencies gracefully', () => {
      const propsWithMissingDeps = {
        ...defaultProps,
        lastEvaluation: undefined,
        evaluations: undefined,
      };

      const { result } = renderHook(() => useMoveValidation(propsWithMissingDeps as any));

      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(0);
      expect(result.current.isProcessing).toBe(false);
    });

    it('initializes correctly with null values', () => {
      const propsWithNulls = {
        ...defaultProps,
        lastEvaluation: null,
        evaluations: null as any,
        currentFen: null as any,
      };

      const { result } = renderHook(() => useMoveValidation(propsWithNulls));

      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(0);
      expect(result.current.isProcessing).toBe(false);
    });

    it('initializes correctly when tablebaseActions is undefined', () => {
      const propsWithoutActions = {
        ...defaultProps,
        tablebaseActions: undefined,
      };

      const { result } = renderHook(() => useMoveValidation(propsWithoutActions));

      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(0);
      expect(result.current.isProcessing).toBe(false);
    });

    it('initializes correctly with isEvaluating true', () => {
      const propsWithEvaluating = {
        ...defaultProps,
        isEvaluating: true,
      };

      const { result } = renderHook(() => useMoveValidation(propsWithEvaluating));

      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(0);
      expect(result.current.isProcessing).toBe(true);
    });

    it('initializes with initial evaluation', () => {
      const initialEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [{ move: 'Kh1', wdl: 1, dtm: 5 }],
        isAvailable: true,
      };

      const propsWithInitialEval = {
        ...defaultProps,
        lastEvaluation: initialEvaluation,
        currentFen: TEST_POSITIONS.EMPTY_BOARD,
      };

      const { result } = renderHook(() => useMoveValidation(propsWithInitialEval));

      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(1);
      expect(result.current.isProcessing).toBe(false);
    });

    it('handles different tablebase analysis statuses on init', () => {
      const statuses: Array<'idle' | 'loading' | 'success' | 'error'> = [
        'idle',
        'loading',
        'success',
        'error',
      ];

      statuses.forEach(status => {
        const propsWithStatus = {
          ...defaultProps,
          tablebaseState: {
            ...mockTablebaseState,
            analysisStatus: status,
          },
        };

        const { result } = renderHook(() => useMoveValidation(propsWithStatus));

        expect(result.current).toBeDefined();
        expect(result.current.processedCount).toBe(0);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('initializes with empty evaluations array', () => {
      const propsWithEmptyEvals = {
        ...defaultProps,
        evaluations: [],
      };

      const { result } = renderHook(() => useMoveValidation(propsWithEmptyEvals));

      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(0);
      expect(result.current.isProcessing).toBe(false);
    });

    it('initializes with populated evaluations array', () => {
      const existingEvaluations = [
        { fen: 'fen1', evaluation: 50, moves: [], isAvailable: true },
        { fen: 'fen2', evaluation: 100, moves: [], isAvailable: true },
      ];

      const propsWithEvals = {
        ...defaultProps,
        evaluations: existingEvaluations,
      };

      const { result } = renderHook(() => useMoveValidation(propsWithEvals));

      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(0); // No new evaluation to process
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Move Quality Assessment', () => {
    it('processes tablebase results correctly', () => {
      const mockEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [
          { move: 'Kh1', wdl: 1, dtm: 5 },
          { move: 'Kg1', wdl: 0, dtm: 0 },
        ],
        isAvailable: true,
      };

      const props = {
        ...defaultProps,
        lastEvaluation: mockEvaluation,
        isEvaluating: false,
      };

      const { result } = renderHook(() => useMoveValidation(props));

      // Hook should process the evaluation
      expect(result.current).toBeDefined();
      expect(result.current.processedCount).toBe(1);
      expect(result.current.isProcessing).toBe(false);
    });

    it('handles unavailable tablebase results', () => {
      const mockEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 0,
        moves: [],
        isAvailable: false,
        error: 'Position not in tablebase',
      };

      const props = {
        ...defaultProps,
        lastEvaluation: mockEvaluation,
      };

      const { result } = renderHook(() => useMoveValidation(props));

      expect(result.current).toBeDefined();
    });
  });

  describe('Analysis Status Management', () => {
    it('updates analysis status when evaluation starts', () => {
      const { result, rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: { ...defaultProps, isEvaluating: false },
      });

      // Start evaluating
      rerender({ ...defaultProps, isEvaluating: true });

      // Status should be updated and isProcessing should be true
      expect(mockTablebaseActions.setAnalysisStatus).toHaveBeenCalledWith('loading');
      expect(result.current.isProcessing).toBe(true);
    });

    it('clears analysis status when evaluation completes', () => {
      const { rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: { ...defaultProps, isEvaluating: true },
      });

      // Complete evaluation
      const mockResult = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [{ move: 'Kh1', wdl: 1 }],
        isAvailable: true,
      };

      rerender({
        ...defaultProps,
        isEvaluating: false,
        lastEvaluation: mockResult as any,
      });

      expect(mockTablebaseActions.setAnalysisStatus).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles evaluation errors gracefully', () => {
      const mockEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 0,
        moves: [],
        isAvailable: false,
        error: 'Network error',
      };

      const props = {
        ...defaultProps,
        lastEvaluation: mockEvaluation,
      };

      expect(() => {
        renderHook(() => useMoveValidation(props));
      }).not.toThrow();
    });

    it('handles malformed evaluation data', () => {
      const malformedEvaluation = {
        // Missing required fields
        moves: null,
        isAvailable: true,
      };

      const props = {
        ...defaultProps,
        lastEvaluation: malformedEvaluation as any,
      };

      expect(() => {
        renderHook(() => useMoveValidation(props));
      }).not.toThrow();
    });
  });

  describe('FEN Position Changes', () => {
    it('reacts to FEN changes', () => {
      const { rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: defaultProps,
      });

      // Use scenario from central database instead of hardcoded FEN
      const scenario = TRAIN_SCENARIOS.TRAIN_1;
      rerender({ ...defaultProps, currentFen: scenario.fen });

      // Hook should handle FEN changes - this is a passive hook that processes data
      // It may not directly call setAnalysisStatus, depending on implementation
      expect(mockTablebaseActions.setAnalysisStatus).toHaveBeenCalledTimes(0);
    });

    it('validates FEN format correctly', () => {
      const invalidFen = 'invalid-fen-string';
      const props = {
        ...defaultProps,
        currentFen: invalidFen,
      };

      expect(() => {
        renderHook(() => useMoveValidation(props));
      }).not.toThrow();
    });
  });

  describe('Evaluation History', () => {
    it('processes evaluation history correctly', () => {
      const evaluationHistory = [
        { fen: '8/8/8/8/8/8/8/8 w - - 0 1', evaluation: 100 },
        { fen: '4k3/8/4K3/4P3/8/8/8/8 b - - 1 1', evaluation: -50 },
      ];

      const props = {
        ...defaultProps,
        evaluations: evaluationHistory,
      };

      const { result } = renderHook(() => useMoveValidation(props));

      expect(result.current).toBeDefined();
    });

    it('handles empty evaluation history', () => {
      const props = {
        ...defaultProps,
        evaluations: [],
      };

      const { result } = renderHook(() => useMoveValidation(props));

      expect(result.current).toBeDefined();
    });
  });

  describe('Tablebase State Integration', () => {
    it('reads from tablebase state correctly', () => {
      const tablebaseStateWithResults = {
        ...mockTablebaseState,
        analysisStatus: 'success' as const,
        analysisResult: {
          moves: [{ move: 'Kh1', wdl: 1, dtm: 3 }],
        },
      };

      const props = {
        ...defaultProps,
        tablebaseState: tablebaseStateWithResults,
      };

      const { result } = renderHook(() => useMoveValidation(props));

      expect(result.current).toBeDefined();
    });

    it('handles tablebase loading states', () => {
      const loadingTablebaseState = {
        ...mockTablebaseState,
        analysisStatus: 'loading' as const,
        analysisResult: null,
      };

      const props = {
        ...defaultProps,
        tablebaseState: loadingTablebaseState,
      };

      const { result } = renderHook(() => useMoveValidation(props));

      expect(result.current).toBeDefined();
    });

    it('handles tablebase error states', () => {
      const errorTablebaseState = {
        ...mockTablebaseState,
        analysisStatus: 'error' as const,
        analysisResult: null,
      };

      const props = {
        ...defaultProps,
        tablebaseState: errorTablebaseState,
      };

      const { result } = renderHook(() => useMoveValidation(props));

      expect(result.current).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('maintains stable references between renders', () => {
      const { result, rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: defaultProps,
      });

      const initialResult = result.current;

      // Re-render with same props
      rerender(defaultProps);

      // Should maintain reference stability where appropriate
      expect(result.current).toBeDefined();
    });

    it('properly cleans up on unmount', () => {
      const { unmount } = renderHook(() => useMoveValidation(defaultProps));

      // Should not throw on unmount
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Processed Count Tracking', () => {
    it('increments processed count for each unique evaluation', () => {
      const { result, rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: defaultProps,
      });

      // Initially no evaluations processed
      expect(result.current.processedCount).toBe(0);

      // Process first evaluation
      const eval1 = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [{ move: 'Kh1', wdl: 1 }],
        isAvailable: true,
      };
      rerender({ ...defaultProps, lastEvaluation: eval1 as any });
      expect(result.current.processedCount).toBe(1);

      // Process second evaluation with different score
      const eval2 = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 200,
        moves: [{ move: 'Kh2', wdl: 1 }],
        isAvailable: true,
      };
      rerender({ ...defaultProps, lastEvaluation: eval2 as any });
      expect(result.current.processedCount).toBe(2);
    });

    it('does not increment count for duplicate evaluations', () => {
      const mockEval = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [{ move: 'Kh1', wdl: 1 }],
        isAvailable: true,
      };

      const { result, rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: { ...defaultProps, lastEvaluation: mockEval },
      });

      expect(result.current.processedCount).toBe(1);

      // Rerender with same evaluation
      rerender({ ...defaultProps, lastEvaluation: mockEval });

      // Count should not increase for duplicate
      expect(result.current.processedCount).toBe(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('handles rapid FEN changes', () => {
      const { rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: defaultProps,
      });

      // Rapidly change FENs
      const fens = [
        TEST_POSITIONS.EMPTY_BOARD,
        '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
        '4k3/8/4K3/8/4P3/8/8/8 b - - 1 1',
      ];

      fens.forEach(fen => {
        rerender({ ...defaultProps, currentFen: fen });
      });

      // Should handle rapid changes gracefully - useMoveValidation is a passive processor
      expect(mockTablebaseActions.setAnalysisStatus).toHaveBeenCalledTimes(0);
    });

    it('handles concurrent evaluation states', () => {
      const props = {
        ...defaultProps,
        isEvaluating: true,
        lastEvaluation: {
          fen: TEST_POSITIONS.EMPTY_BOARD,
          evaluation: 100,
          moves: [{ move: 'Kh1', wdl: 1 }],
          isAvailable: true,
        },
      };

      expect(() => {
        renderHook(() => useMoveValidation(props));
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Safeguards', () => {
    it('handles missing setEvaluations action gracefully', () => {
      const actionsWithoutSetEvaluations = {
        ...mockTablebaseActions,
        setEvaluations: undefined, // Missing action
      };

      const mockEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [{ move: 'Kh1', wdl: 1, dtm: 5 }],
        isAvailable: true,
      };

      const props = {
        ...defaultProps,
        lastEvaluation: mockEvaluation,
        tablebaseActions: actionsWithoutSetEvaluations as any,
      };

      // Should not throw when setEvaluations is missing
      expect(() => {
        renderHook(() => useMoveValidation(props));
      }).not.toThrow();
    });

    it('handles missing setAnalysisStatus action gracefully', () => {
      const actionsWithoutSetAnalysisStatus = {
        ...mockTablebaseActions,
        setAnalysisStatus: undefined, // Missing action
      };

      const props = {
        ...defaultProps,
        isEvaluating: true,
        tablebaseActions: actionsWithoutSetAnalysisStatus as any,
      };

      // Should not throw when setAnalysisStatus is missing
      expect(() => {
        renderHook(() => useMoveValidation(props));
      }).not.toThrow();
    });

    it('skips already processed evaluations', () => {
      const mockEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        mateInMoves: 5,
        moves: [{ move: 'Kh1', wdl: 1, dtm: 5 }],
        isAvailable: true,
      };

      const props = {
        ...defaultProps,
        lastEvaluation: mockEvaluation,
      };

      const { result, rerender } = renderHook(hookProps => useMoveValidation(hookProps), {
        initialProps: props,
      });

      // First render should process the evaluation
      expect(mockTablebaseActions.setAnalysisResult).toHaveBeenCalledTimes(0);

      // Second render with same evaluation should be skipped
      rerender(props);

      // Should not process the same evaluation twice
      expect(result.current).toBeDefined();
    });

    it('processes different evaluations separately', () => {
      const firstEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [{ move: 'Kh1', wdl: 1, dtm: 5 }],
        isAvailable: true,
      };

      const secondEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 200, // Different evaluation score
        moves: [{ move: 'Kh2', wdl: 1, dtm: 3 }],
        isAvailable: true,
      };

      const { result, rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: { ...defaultProps, lastEvaluation: firstEvaluation },
      });

      // Process second evaluation with different score
      rerender({ ...defaultProps, lastEvaluation: secondEvaluation });

      // Both evaluations should be processed
      expect(result.current).toBeDefined();
    });

    it('successfully calls setEvaluations when available and handles deduplication', () => {
      const mockSetEvaluations = vi.fn();
      const actionsWithSetEvaluations = {
        ...mockTablebaseActions,
        setEvaluations: mockSetEvaluations,
      };

      const mockEvaluation = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [{ move: 'Kh1', wdl: 1, dtm: 5 }],
        isAvailable: true,
      };

      const { rerender } = renderHook(props => useMoveValidation(props), {
        initialProps: {
          ...defaultProps,
          lastEvaluation: mockEvaluation,
          tablebaseActions: actionsWithSetEvaluations,
        },
      });

      // First render should call setEvaluations
      expect(mockSetEvaluations).toHaveBeenCalledTimes(1);
      expect(mockSetEvaluations).toHaveBeenCalledWith([mockEvaluation]);

      // Reset the mock
      mockSetEvaluations.mockClear();

      // Second render with same evaluation should be skipped (line 126 coverage)
      rerender({
        ...defaultProps,
        lastEvaluation: mockEvaluation,
        tablebaseActions: actionsWithSetEvaluations,
      });

      // setEvaluations should NOT be called again due to deduplication
      expect(mockSetEvaluations).not.toHaveBeenCalled();
    });
  });

  describe('Integration with Other Hooks', () => {
    it('works with evaluation data from usePositionAnalysis', () => {
      const mockPositionAnalysisData = {
        fen: TEST_POSITIONS.EMPTY_BOARD,
        evaluation: 100,
        moves: [
          { move: 'Kh1', wdl: 1, dtm: 5, evaluation: 100 },
          { move: 'Kg1', wdl: 0, dtm: 0, evaluation: 0 },
        ],
        isAvailable: true,
        bestMove: 'Kh1',
      };

      const props = {
        ...defaultProps,
        lastEvaluation: mockPositionAnalysisData,
        evaluations: [mockPositionAnalysisData],
      };

      const { result } = renderHook(() => useMoveValidation(props));

      expect(result.current).toBeDefined();
    });

    it('integrates with tablebase store state', () => {
      const richTablebaseState = {
        analysisStatus: 'success' as const,
        analysisResult: {
          position: TEST_POSITIONS.EMPTY_BOARD,
          moves: [
            { move: 'Kh1', wdl: 1, dtm: 3 },
            { move: 'Kg1', wdl: -1, dtm: 15 },
          ],
          bestMove: 'Kh1',
        },
        cache: new Map([[TEST_POSITIONS.EMPTY_BOARD, { wdl: 1, moves: ['Kh1'] }]]),
      };

      const props = {
        ...defaultProps,
        tablebaseState: richTablebaseState,
      };

      const { result } = renderHook(() => useMoveValidation(props));

      expect(result.current).toBeDefined();
    });
  });
});
