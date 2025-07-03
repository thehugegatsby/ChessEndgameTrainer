import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEvaluation } from '../useEvaluation';
import { useEngine } from '../useEngine';

// Mock the useEngine hook
jest.mock('../useEngine');

const mockEngine = {
  updatePosition: jest.fn(),
  getDualEvaluation: jest.fn().mockResolvedValue({
    engine: { score: 0.5, mate: null },
    tablebase: null
  })
};

(useEngine as jest.Mock).mockReturnValue({
  engine: mockEngine,
  isLoading: false,
  error: null
});

describe('useEvaluation Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Baseline Performance - Current Implementation', () => {
    it('should measure evaluation calls on rapid FEN changes', async () => {
      const fens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2'
      ];

      const { result, rerender } = renderHook(
        ({ fen }) => useEvaluation({ fen, isEnabled: true }),
        { initialProps: { fen: fens[0] } }
      );

      // Rapidly change FEN positions
      for (let i = 1; i < fens.length; i++) {
        act(() => {
          rerender({ fen: fens[i] });
        });
      }

      // Wait for all evaluations to complete
      await waitFor(() => {
        expect(mockEngine.getDualEvaluation).toHaveBeenCalled();
      }, { timeout: 1000 });

      console.log(`Baseline: getDualEvaluation called ${mockEngine.getDualEvaluation.mock.calls.length} times for ${fens.length} FEN changes`);
      
      // Without debouncing, expect one call per FEN change
      expect(mockEngine.getDualEvaluation.mock.calls.length).toBe(fens.length);
    });

    it('should measure evaluation time with sequential calls', async () => {
      // Mock with delay to simulate real evaluation time
      mockEngine.getDualEvaluation.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          engine: { score: 0.5, mate: null },
          tablebase: { isAvailable: true, result: { wdl: 2, category: 'win', dtz: 10 } }
        }), 50))
      );

      const { result } = renderHook(() => 
        useEvaluation({ 
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          isEnabled: true,
          previousFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
        })
      );

      const start = performance.now();
      
      await waitFor(() => {
        expect(result.current.isEvaluating).toBe(false);
      }, { timeout: 500 });

      const duration = performance.now() - start;
      
      console.log(`Baseline: Evaluation with tablebase comparison took ${duration.toFixed(2)}ms`);
      console.log(`Baseline: getDualEvaluation called ${mockEngine.getDualEvaluation.mock.calls.length} times (sequential)`);
      
      // With tablebase comparison, expect 2 sequential calls
      expect(mockEngine.getDualEvaluation.mock.calls.length).toBe(2);
    });

    it('should measure cache misses on repeated positions', async () => {
      const commonFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      const { result, rerender } = renderHook(
        ({ fen }) => useEvaluation({ fen, isEnabled: true }),
        { initialProps: { fen: commonFen } }
      );

      await waitFor(() => {
        expect(result.current.isEvaluating).toBe(false);
      });

      // Change to different position
      act(() => {
        rerender({ fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2' });
      });

      await waitFor(() => {
        expect(result.current.isEvaluating).toBe(false);
      });

      // Return to original position (should be cached but isn't)
      mockEngine.getDualEvaluation.mockClear();
      
      act(() => {
        rerender({ fen: commonFen });
      });

      await waitFor(() => {
        expect(mockEngine.getDualEvaluation).toHaveBeenCalled();
      });

      console.log(`Baseline: Returning to previous position triggered ${mockEngine.getDualEvaluation.mock.calls.length} new evaluation(s) (no cache)`);
      
      // Without caching, expect evaluation to be called again
      expect(mockEngine.getDualEvaluation.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics Summary', () => {
    it('should generate baseline performance report', async () => {
      const metrics = {
        evaluationCalls: 0,
        evaluationTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };

      // Measure rapid FEN changes
      mockEngine.getDualEvaluation.mockResolvedValue({
        engine: { score: 0.5, mate: null },
        tablebase: null
      });

      const { rerender } = renderHook(
        ({ fen }) => useEvaluation({ fen, isEnabled: true }),
        { initialProps: { fen: 'startpos' } }
      );

      // Simulate 5 rapid moves
      for (let i = 0; i < 5; i++) {
        act(() => {
          rerender({ fen: `position-${i}` });
        });
      }

      await waitFor(() => {
        metrics.evaluationCalls = mockEngine.getDualEvaluation.mock.calls.length;
      });

      console.log('\\n=== BASELINE EVALUATION PERFORMANCE ===');
      console.log(`Evaluation calls for 5 moves: ${metrics.evaluationCalls}`);
      console.log(`Cache hits: ${metrics.cacheHits} (no cache implemented)`);
      console.log(`Target after optimization:`);
      console.log(`  - Evaluation calls: 1 (with debouncing)`);
      console.log(`  - Cache hit rate: >80% for repeated positions`);
      console.log(`  - Parallel API calls for tablebase comparison`);
      console.log('=====================================\\n');
    });
  });
});