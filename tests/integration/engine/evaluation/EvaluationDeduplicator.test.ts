/**
 * @fileoverview Tests for EvaluationDeduplicator
 * @description Tests for preventing duplicate evaluation requests
 */

import { EvaluationDeduplicator } from '@/shared/lib/chess/evaluation/EvaluationDeduplicator';

describe('EvaluationDeduplicator', () => {
  let deduplicator: EvaluationDeduplicator;

  beforeEach(() => {
    deduplicator = new EvaluationDeduplicator();
  });

  describe('Basic Deduplication', () => {
    test('should prevent duplicate evaluations for same FEN', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      let evaluationCount = 0;
      
      const mockEvaluationFn = jest.fn(async (position: string) => {
        evaluationCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async work
        return { score: 0, fen: position };
      });

      // Start multiple evaluations for the same position
      const promises = [
        deduplicator.evaluate(fen, mockEvaluationFn),
        deduplicator.evaluate(fen, mockEvaluationFn),
        deduplicator.evaluate(fen, mockEvaluationFn)
      ];

      const results = await Promise.all(promises);

      // All should return the same result
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
      
      // But evaluation function should only be called once
      expect(mockEvaluationFn).toHaveBeenCalledTimes(1);
      expect(evaluationCount).toBe(1);
    });

    test('should allow separate evaluations for different FENs', async () => {
      const fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fen2 = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      
      const mockEvaluationFn = jest.fn(async (position: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { score: 0, fen: position };
      });

      const promise1 = deduplicator.evaluate(fen1, mockEvaluationFn);
      const promise2 = deduplicator.evaluate(fen2, mockEvaluationFn);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.fen).toBe(fen1);
      expect(result2.fen).toBe(fen2);
      expect(mockEvaluationFn).toHaveBeenCalledTimes(2);
    });

    test('should handle sequential evaluations of same FEN', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      const mockEvaluationFn = jest.fn(async (position: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { score: Math.random(), fen: position };
      });

      // First evaluation
      const result1 = await deduplicator.evaluate(fen, mockEvaluationFn);
      
      // Second evaluation after first completes
      const result2 = await deduplicator.evaluate(fen, mockEvaluationFn);

      // Should be separate evaluations with different results
      expect(mockEvaluationFn).toHaveBeenCalledTimes(2);
      expect(result1.score).not.toBe(result2.score);
    });
  });

  describe('Pending Status Tracking', () => {
    test('should track pending evaluations', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      let resolveEvaluation: () => void;
      
      const mockEvaluationFn = jest.fn(async () => {
        return new Promise(resolve => {
          resolveEvaluation = () => resolve({ score: 0 });
        });
      });

      // Start evaluation but don't wait for it
      const promise = deduplicator.evaluate(fen, mockEvaluationFn);

      // Should be pending
      expect(deduplicator.isPending(fen)).toBe(true);
      expect(deduplicator.getPendingCount()).toBe(1);

      // Complete the evaluation
      resolveEvaluation!();
      await promise;

      // Should no longer be pending
      expect(deduplicator.isPending(fen)).toBe(false);
      expect(deduplicator.getPendingCount()).toBe(0);
    });

    test('should handle multiple pending evaluations', async () => {
      const fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fen2 = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      
      let resolveEvaluation1: () => void;
      let resolveEvaluation2: () => void;
      
      const mockEvaluationFn = jest.fn((fen: string) => {
        return new Promise(resolve => {
          if (fen === fen1) {
            resolveEvaluation1 = () => resolve({ score: 0, fen });
          } else {
            resolveEvaluation2 = () => resolve({ score: 100, fen });
          }
        });
      });

      // Start both evaluations
      const promise1 = deduplicator.evaluate(fen1, mockEvaluationFn);
      const promise2 = deduplicator.evaluate(fen2, mockEvaluationFn);

      // Both should be pending
      expect(deduplicator.getPendingCount()).toBe(2);
      expect(deduplicator.isPending(fen1)).toBe(true);
      expect(deduplicator.isPending(fen2)).toBe(true);

      // Complete first evaluation
      resolveEvaluation1!();
      await promise1;

      // Only second should be pending
      expect(deduplicator.getPendingCount()).toBe(1);
      expect(deduplicator.isPending(fen1)).toBe(false);
      expect(deduplicator.isPending(fen2)).toBe(true);

      // Complete second evaluation
      resolveEvaluation2!();
      await promise2;

      // None should be pending
      expect(deduplicator.getPendingCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle evaluation errors correctly', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const errorMessage = 'Evaluation failed';
      
      const mockEvaluationFn = jest.fn(async () => {
        throw new Error(errorMessage);
      });

      // Multiple calls should all receive the same error
      const promises = [
        deduplicator.evaluate(fen, mockEvaluationFn),
        deduplicator.evaluate(fen, mockEvaluationFn),
        deduplicator.evaluate(fen, mockEvaluationFn)
      ];

      for (const promise of promises) {
        await expect(promise).rejects.toThrow(errorMessage);
      }

      // Should only call evaluation function once
      expect(mockEvaluationFn).toHaveBeenCalledTimes(1);
      
      // Should clean up after error
      expect(deduplicator.isPending(fen)).toBe(false);
      expect(deduplicator.getPendingCount()).toBe(0);
    });

    test('should allow retry after error', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      let shouldFail = true;
      const mockEvaluationFn = jest.fn(async () => {
        if (shouldFail) {
          throw new Error('First attempt failed');
        }
        return { score: 100 };
      });

      // First attempt should fail
      await expect(deduplicator.evaluate(fen, mockEvaluationFn)).rejects.toThrow();
      
      // Should be cleaned up
      expect(deduplicator.isPending(fen)).toBe(false);

      // Second attempt should succeed
      shouldFail = false;
      const result = await deduplicator.evaluate(fen, mockEvaluationFn);
      
      expect(result).toEqual({ score: 100 });
      expect(mockEvaluationFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide accurate statistics', async () => {
      const fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fen2 = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      
      let resolveEvaluations: (() => void)[] = [];
      
      const mockEvaluationFn = jest.fn((fen: string) => {
        return new Promise(resolve => {
          resolveEvaluations.push(() => resolve({ score: 0, fen }));
        });
      });

      // Start evaluations
      deduplicator.evaluate(fen1, mockEvaluationFn);
      deduplicator.evaluate(fen2, mockEvaluationFn);

      const stats = deduplicator.getStats();
      
      expect(stats.pendingEvaluations).toBe(2);
      expect(stats.activeFENs).toContain(fen1);
      expect(stats.activeFENs).toContain(fen2);
      expect(stats.activeFENs).toHaveLength(2);

      // Complete evaluations
      resolveEvaluations.forEach(resolve => resolve());
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const finalStats = deduplicator.getStats();
      expect(finalStats.pendingEvaluations).toBe(0);
      expect(finalStats.activeFENs).toHaveLength(0);
    });

    test('should handle empty state correctly', () => {
      const stats = deduplicator.getStats();
      
      expect(stats.pendingEvaluations).toBe(0);
      expect(stats.activeFENs).toHaveLength(0);
      expect(deduplicator.getPendingCount()).toBe(0);
      expect(deduplicator.isPending('any-fen')).toBe(false);
    });
  });

  describe('Cleanup Operations', () => {
    test('should clear all pending evaluations', async () => {
      const fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const fen2 = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      
      const mockEvaluationFn = jest.fn(async () => {
        return new Promise(() => {}); // Never resolves
      });

      // Start evaluations
      deduplicator.evaluate(fen1, mockEvaluationFn);
      deduplicator.evaluate(fen2, mockEvaluationFn);

      expect(deduplicator.getPendingCount()).toBe(2);

      // Clear all
      deduplicator.clear();

      expect(deduplicator.getPendingCount()).toBe(0);
      expect(deduplicator.isPending(fen1)).toBe(false);
      expect(deduplicator.isPending(fen2)).toBe(false);
    });

    test('should handle clear on empty deduplicator', () => {
      expect(() => {
        deduplicator.clear();
      }).not.toThrow();
      
      expect(deduplicator.getPendingCount()).toBe(0);
    });
  });

  describe('Performance', () => {
    test('should handle rapid duplicate requests efficiently', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      let evaluationCount = 0;
      
      const mockEvaluationFn = jest.fn(async () => {
        evaluationCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return { score: evaluationCount };
      });

      const promises = [];
      
      // Fire many rapid requests
      for (let i = 0; i < 100; i++) {
        promises.push(deduplicator.evaluate(fen, mockEvaluationFn));
      }

      const results = await Promise.all(promises);

      // All should have the same result
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });

      // Should only call evaluation once
      expect(mockEvaluationFn).toHaveBeenCalledTimes(1);
      expect(evaluationCount).toBe(1);
    });

    test('should handle mixed FENs efficiently', async () => {
      const fens = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
        'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1'
      ];
      
      let evaluationCount = 0;
      const mockEvaluationFn = jest.fn(async (fen: string) => {
        evaluationCount++;
        await new Promise(resolve => setTimeout(resolve, 5));
        return { score: evaluationCount, fen };
      });

      const promises = [];
      
      // Create mixed requests (some duplicates, some unique)
      for (let i = 0; i < 50; i++) {
        const fen = fens[i % fens.length];
        promises.push(deduplicator.evaluate(fen, mockEvaluationFn));
      }

      const results = await Promise.all(promises);

      // Should have called evaluation once per unique FEN
      expect(mockEvaluationFn).toHaveBeenCalledTimes(fens.length);
      expect(evaluationCount).toBe(fens.length);

      // Results should be consistent for same FEN
      const resultsByFen = new Map();
      results.forEach(result => {
        if (resultsByFen.has(result.fen)) {
          expect(result).toEqual(resultsByFen.get(result.fen));
        } else {
          resultsByFen.set(result.fen, result);
        }
      });
    });
  });
});