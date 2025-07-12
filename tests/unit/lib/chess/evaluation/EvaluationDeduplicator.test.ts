/**
 * @fileoverview Unit tests for EvaluationDeduplicator
 * @version 1.0.0
 * @description Tests deduplication of concurrent evaluation requests
 * Following TESTING_GUIDELINES.md principles
 */

import { EvaluationDeduplicator } from '../../../../../shared/lib/chess/evaluation/EvaluationDeduplicator';

// Test constants
const TEST_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const TEST_FEN_2 = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4';
const EVALUATION_DELAY = 50; // ms

// Mock evaluation result
interface MockEvaluation {
  score: number;
  timestamp: number;
}

describe('EvaluationDeduplicator_[method]_[condition]_[expected]', () => {
  let deduplicator: EvaluationDeduplicator;
  let evaluationCallCount: number;
  let mockEvaluationFn: jest.Mock<Promise<MockEvaluation>>;

  beforeEach(() => {
    deduplicator = new EvaluationDeduplicator();
    evaluationCallCount = 0;

    // Create mock evaluation function that tracks calls
    mockEvaluationFn = jest.fn((fen: string) => {
      evaluationCallCount++;
      return new Promise<MockEvaluation>((resolve) => {
        setTimeout(() => {
          resolve({
            score: fen.length * 10, // Dummy score based on FEN length
            timestamp: Date.now()
          });
        }, EVALUATION_DELAY);
      });
    });
  });

  afterEach(() => {
    deduplicator.clear();
    jest.clearAllMocks();
  });

  describe('evaluate', () => {
    it('should return evaluation result for single request', async () => {
      const result = await deduplicator.evaluate(TEST_FEN, mockEvaluationFn);

      expect(result.score).toBe(TEST_FEN.length * 10);
      expect(mockEvaluationFn).toHaveBeenCalledTimes(1);
      expect(mockEvaluationFn).toHaveBeenCalledWith(TEST_FEN);
    });

    it('should deduplicate concurrent requests for same position', async () => {
      // Start 5 concurrent evaluations for the same position
      const promises = Array(5).fill(null).map(() => 
        deduplicator.evaluate(TEST_FEN, mockEvaluationFn)
      );

      const results = await Promise.all(promises);

      // Evaluation function should only be called once
      expect(mockEvaluationFn).toHaveBeenCalledTimes(1);

      // All results should be identical (same object reference)
      results.forEach(result => {
        expect(result).toBe(results[0]);
      });
      
      // All results should have the same score
      results.forEach(result => {
        expect(result.score).toBe(results[0].score);
        expect(result.timestamp).toBe(results[0].timestamp);
      });
    });

    it('should allow new evaluation after previous completes', async () => {
      // First evaluation
      const result1 = await deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      expect(mockEvaluationFn).toHaveBeenCalledTimes(1);

      // Second evaluation (after first completes)
      const result2 = await deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      expect(mockEvaluationFn).toHaveBeenCalledTimes(2);

      // Results should be different objects
      expect(result1).not.toBe(result2);
      expect(result1.timestamp).toBeLessThan(result2.timestamp);
    });

    it('should handle different positions independently', async () => {
      // Start evaluations for two different positions
      const promise1 = deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      const promise2 = deduplicator.evaluate(TEST_FEN_2, mockEvaluationFn);

      // Should be different promises
      expect(promise1).not.toBe(promise2);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both positions should be evaluated
      expect(mockEvaluationFn).toHaveBeenCalledTimes(2);
      expect(mockEvaluationFn).toHaveBeenCalledWith(TEST_FEN);
      expect(mockEvaluationFn).toHaveBeenCalledWith(TEST_FEN_2);

      // Different results
      expect(result1.score).not.toBe(result2.score);
    });

    it('should handle evaluation errors properly', async () => {
      const errorFn = jest.fn(() => Promise.reject(new Error('Evaluation failed')));

      // First request that will fail
      const promise1 = deduplicator.evaluate(TEST_FEN, errorFn);
      
      // Concurrent request while first is still pending
      const promise2 = deduplicator.evaluate(TEST_FEN, errorFn);

      // Both should reject with the same error
      await expect(promise1).rejects.toThrow('Evaluation failed');
      await expect(promise2).rejects.toThrow('Evaluation failed');
      
      // Error function should only be called once due to deduplication
      expect(errorFn).toHaveBeenCalledTimes(1);

      // After error, position should not be pending
      expect(deduplicator.isPending(TEST_FEN)).toBe(false);
    });

    it('should clean up pending map after evaluation completes', async () => {
      const promise = deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      
      // Should be pending during evaluation
      expect(deduplicator.isPending(TEST_FEN)).toBe(true);
      expect(deduplicator.getPendingCount()).toBe(1);

      await promise;

      // Should be cleaned up after completion
      expect(deduplicator.isPending(TEST_FEN)).toBe(false);
      expect(deduplicator.getPendingCount()).toBe(0);
    });
  });

  describe('isPending', () => {
    it('should return true for pending evaluation', async () => {
      const promise = deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      
      expect(deduplicator.isPending(TEST_FEN)).toBe(true);
      
      await promise;
      
      expect(deduplicator.isPending(TEST_FEN)).toBe(false);
    });

    it('should return false for non-existent position', () => {
      expect(deduplicator.isPending('non-existent-fen')).toBe(false);
    });
  });

  describe('getPendingCount', () => {
    it('should track pending evaluation count accurately', async () => {
      expect(deduplicator.getPendingCount()).toBe(0);

      // Start multiple evaluations
      const promise1 = deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      expect(deduplicator.getPendingCount()).toBe(1);

      const promise2 = deduplicator.evaluate(TEST_FEN_2, mockEvaluationFn);
      expect(deduplicator.getPendingCount()).toBe(2);

      // Duplicate request shouldn't increase count
      const promise3 = deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      expect(deduplicator.getPendingCount()).toBe(2);

      // Wait for all to complete
      await Promise.all([promise1, promise2, promise3]);
      expect(deduplicator.getPendingCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all pending evaluations', () => {
      // Start multiple evaluations
      deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      deduplicator.evaluate(TEST_FEN_2, mockEvaluationFn);

      expect(deduplicator.getPendingCount()).toBe(2);

      deduplicator.clear();

      expect(deduplicator.getPendingCount()).toBe(0);
      expect(deduplicator.isPending(TEST_FEN)).toBe(false);
      expect(deduplicator.isPending(TEST_FEN_2)).toBe(false);
    });

    it('should not affect completed evaluations', async () => {
      const result = await deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      
      deduplicator.clear(); // Should have no effect
      
      expect(result.score).toBe(TEST_FEN.length * 10);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      // Initial stats
      let stats = deduplicator.getStats();
      expect(stats.pendingEvaluations).toBe(0);
      expect(stats.activeFENs).toEqual([]);

      // Start evaluations
      const promise1 = deduplicator.evaluate(TEST_FEN, mockEvaluationFn);
      const promise2 = deduplicator.evaluate(TEST_FEN_2, mockEvaluationFn);

      stats = deduplicator.getStats();
      expect(stats.pendingEvaluations).toBe(2);
      expect(stats.activeFENs).toHaveLength(2);
      expect(stats.activeFENs).toContain(TEST_FEN);
      expect(stats.activeFENs).toContain(TEST_FEN_2);

      // After completion
      await Promise.all([promise1, promise2]);
      
      stats = deduplicator.getStats();
      expect(stats.pendingEvaluations).toBe(0);
      expect(stats.activeFENs).toEqual([]);
    });
  });

  describe('Race conditions and edge cases', () => {
    it('should handle rapid sequential requests correctly', async () => {
      const results: MockEvaluation[] = [];
      
      // Rapid fire requests
      for (let i = 0; i < 10; i++) {
        results.push(await deduplicator.evaluate(TEST_FEN, mockEvaluationFn));
      }

      // Each should be a new evaluation
      expect(mockEvaluationFn).toHaveBeenCalledTimes(10);
      
      // Timestamps should be increasing
      for (let i = 1; i < results.length; i++) {
        expect(results[i].timestamp).toBeGreaterThanOrEqual(results[i-1].timestamp);
      }
    });

    it('should handle mixed concurrent and sequential requests', async () => {
      // First batch of concurrent requests
      const batch1 = Array(3).fill(null).map(() => 
        deduplicator.evaluate(TEST_FEN, mockEvaluationFn)
      );
      
      const results1 = await Promise.all(batch1);
      expect(mockEvaluationFn).toHaveBeenCalledTimes(1);

      // Second batch after first completes
      const batch2 = Array(3).fill(null).map(() => 
        deduplicator.evaluate(TEST_FEN, mockEvaluationFn)
      );
      
      const results2 = await Promise.all(batch2);
      expect(mockEvaluationFn).toHaveBeenCalledTimes(2);

      // Results within batch should be identical
      expect(results1[0]).toBe(results1[1]);
      expect(results1[0]).toBe(results1[2]);
      expect(results2[0]).toBe(results2[1]);
      expect(results2[0]).toBe(results2[2]);

      // Results between batches should differ
      expect(results1[0]).not.toBe(results2[0]);
    });
  });

  describe('Memory management', () => {
    it('should not leak memory with many evaluations', async () => {
      const positions = Array(100).fill(null).map((_, i) => `position-${i}`);
      
      // Start all evaluations
      const promises = positions.map(fen => 
        deduplicator.evaluate(fen, mockEvaluationFn)
      );

      expect(deduplicator.getPendingCount()).toBe(100);

      // Complete all
      await Promise.all(promises);

      // All should be cleaned up
      expect(deduplicator.getPendingCount()).toBe(0);
      positions.forEach(fen => {
        expect(deduplicator.isPending(fen)).toBe(false);
      });
    });
  });

  describe('Performance characteristics', () => {
    it('should handle high-frequency deduplication efficiently', async () => {
      const start = performance.now();
      
      // 10,000 duplicate requests
      const promises = Array(10000).fill(null).map(() => 
        deduplicator.evaluate(TEST_FEN, mockEvaluationFn)
      );

      const duration = performance.now() - start;
      
      // Should be very fast (no actual evaluations yet)
      // More lenient threshold in CI environments
      const CI = process.env.CI === 'true';
      const timeLimit = CI ? 200 : 50;
      expect(duration).toBeLessThan(timeLimit);
      
      // Only one actual evaluation should be queued
      expect(mockEvaluationFn).toHaveBeenCalledTimes(1);
      
      // All results should be the same
      const results = await Promise.all(promises);
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(1);
    });
  });
});