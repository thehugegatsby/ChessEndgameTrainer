import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useChessGame } from '../useChessGame';

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('useChessGame Performance Tests', () => {
  let renderCount = 0;
  let renderSpy: jest.Mock;

  beforeEach(() => {
    renderCount = 0;
    renderSpy = jest.fn(() => {
      renderCount++;
    });
  });

  describe('Baseline Performance - Current Implementation', () => {
    it('should measure re-renders on single move', async () => {
      const { result } = renderHook(() => {
        renderSpy();
        return useChessGame({ initialFen: DEFAULT_FEN });
      });

      renderSpy.mockClear();
      renderCount = 0;

      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
      });

      console.log(`Baseline: makeMove triggered ${renderCount} re-renders`);
      
      // Record baseline - expecting multiple renders due to separate setState calls
      expect(renderCount).toBeGreaterThan(1);
    });

    it('should measure execution time for makeMove', async () => {
      const { result } = renderHook(() => useChessGame({ initialFen: DEFAULT_FEN }));

      // Warm-up
      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
      });

      const iterations = 10;
      const timings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await act(async () => {
          await result.current.makeMove({ from: 'g1', to: 'f3' });
          await result.current.undoMove();
        });
        
        const end = performance.now();
        timings.push(end - start);
      }

      const avgTime = timings.reduce((a, b) => a + b, 0) / iterations;
      console.log(`Baseline: Average makeMove execution time: ${avgTime.toFixed(2)}ms`);
      
      // Store baseline for comparison
      expect(avgTime).toBeDefined();
    });

    it('should measure memory usage over multiple moves', async () => {
      const { result } = renderHook(() => useChessGame({ initialFen: DEFAULT_FEN }));
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const startMem = process.memoryUsage().heapUsed;
      const moves = [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
        { from: 'b8', to: 'c6' },
        { from: 'f1', to: 'c4' },
        { from: 'f8', to: 'c5' },
      ];

      await act(async () => {
        for (const move of moves) {
          await result.current.makeMove(move);
        }
      });

      if (global.gc) {
        global.gc();
      }
      
      const endMem = process.memoryUsage().heapUsed;
      const memDiff = (endMem - startMem) / 1024 / 1024; // Convert to MB
      
      console.log(`Baseline: Memory increase after ${moves.length} moves: ${memDiff.toFixed(2)}MB`);
      
      // Expect reasonable memory usage
      expect(memDiff).toBeLessThan(5); // Less than 5MB for 6 moves
    });

    it('should measure state update propagation', async () => {
      let stateUpdateCount = 0;
      const stateUpdateSpy = jest.fn();

      const { result } = renderHook(() => {
        const gameHook = useChessGame({ initialFen: DEFAULT_FEN });
        
        // Track each state update
        React.useEffect(() => {
          stateUpdateCount++;
          stateUpdateSpy();
        }, [gameHook.currentFen, gameHook.game, gameHook.history, gameHook.currentPgn]);
        
        return gameHook;
      });

      stateUpdateSpy.mockClear();
      stateUpdateCount = 0;

      await act(async () => {
        await result.current.makeMove({ from: 'e2', to: 'e4' });
      });

      console.log(`Baseline: Single move triggered ${stateUpdateCount} state update effects`);
      
      // Expecting multiple due to separate setState calls
      expect(stateUpdateCount).toBeGreaterThan(1);
    });
  });

  describe('Performance Metrics Summary', () => {
    it('should generate baseline performance report', async () => {
      const metrics = {
        rerenders: 0,
        executionTime: 0,
        memoryUsage: 0,
        stateUpdates: 0,
      };

      // Measure re-renders
      const { result: result1 } = renderHook(() => {
        renderSpy();
        return useChessGame({ initialFen: DEFAULT_FEN });
      });
      renderSpy.mockClear();
      await act(async () => {
        await result1.current.makeMove({ from: 'e2', to: 'e4' });
      });
      metrics.rerenders = renderCount;

      // Measure execution time
      const { result: result2 } = renderHook(() => useChessGame({ initialFen: DEFAULT_FEN }));
      const start = performance.now();
      await act(async () => {
        await result2.current.makeMove({ from: 'e2', to: 'e4' });
      });
      metrics.executionTime = performance.now() - start;

      // Log summary
      console.log('\\n=== BASELINE PERFORMANCE METRICS ===');
      console.log(`Re-renders per move: ${metrics.rerenders}`);
      console.log(`Execution time: ${metrics.executionTime.toFixed(2)}ms`);
      console.log(`Target after optimization:`);
      console.log(`  - Re-renders: 1 (single atomic update)`);
      console.log(`  - Execution time: <${(metrics.executionTime * 0.5).toFixed(2)}ms (50% improvement)`);
      console.log('===================================\\n');
    });
  });
});