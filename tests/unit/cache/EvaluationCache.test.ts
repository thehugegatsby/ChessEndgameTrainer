/**
 * @fileoverview Comprehensive EvaluationCache Unit Tests
 * @description Tests for evaluation caching, deduplication, and performance optimization
 */

import { EvaluationCache, type EvaluationCacheStats } from '../../../shared/lib/cache/EvaluationCache';
import type { Engine } from '../../../shared/lib/chess/engine';
import { Move as ChessJsMove } from 'chess.js';

// Mock Engine for testing
const createMockEngine = (): jest.Mocked<Engine> => ({
  evaluatePosition: jest.fn(),
  getBestMove: jest.fn(),
  analyze: jest.fn(),
  quit: jest.fn(),
  reset: jest.fn(),
  isReady: jest.fn(),
  getScore: jest.fn()
} as any);

describe('EvaluationCache', () => {
  let cache: EvaluationCache;
  let mockEngine: jest.Mocked<Engine>;

  beforeEach(() => {
    cache = new EvaluationCache(100, 50); // Small sizes for testing
    mockEngine = createMockEngine();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('EvaluationCache_constructor_defaultSizes_createsInstance', () => {
    it('should create cache with default sizes', () => {
      const defaultCache = new EvaluationCache();
      const stats = defaultCache.getStats();
      
      expect(stats.maxSize).toBe(1500); // 1000 + 500
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should create cache with custom sizes', () => {
      const customCache = new EvaluationCache(200, 100);
      const stats = customCache.getStats();
      
      expect(stats.maxSize).toBe(300); // 200 + 100
      expect(stats.size).toBe(0);
    });

    it('should initialize cleanup interval in browser environment', () => {
      const originalWindow = global.window;
      global.window = {} as any;
      
      const setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation();
      
      new EvaluationCache();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
      
      setIntervalSpy.mockRestore();
      global.window = originalWindow;
    });
  });

  describe('EvaluationCache_evaluatePositionCached_normalOperation_cachesResults', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testResult = { score: 50, mate: null };

    beforeEach(() => {
      mockEngine.evaluatePosition.mockResolvedValue(testResult);
    });

    it('should call engine on cache miss and cache result', async () => {
      const result = await cache.evaluatePositionCached(mockEngine, testFen);
      
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith(testFen);
      expect(result).toEqual(testResult);
      
      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.deduplicationMisses).toBe(1);
    });

    it('should return cached result on cache hit without calling engine', async () => {
      // First call - cache miss
      await cache.evaluatePositionCached(mockEngine, testFen);
      mockEngine.evaluatePosition.mockClear();
      
      // Second call - cache hit
      const result = await cache.evaluatePositionCached(mockEngine, testFen);
      
      expect(mockEngine.evaluatePosition).not.toHaveBeenCalled();
      expect(result).toEqual(testResult);
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
    });

    it('should deduplicate concurrent requests for same position', async () => {
      // Start multiple concurrent requests
      const promises = [
        cache.evaluatePositionCached(mockEngine, testFen),
        cache.evaluatePositionCached(mockEngine, testFen),
        cache.evaluatePositionCached(mockEngine, testFen)
      ];
      
      const results = await Promise.all(promises);
      
      // Engine should only be called once
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(1);
      
      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(testResult);
      });
      
      const stats = cache.getStats();
      expect(stats.deduplicationHits).toBe(2); // 2 of 3 requests were deduplicated
    });

    it('should handle engine errors gracefully and fallback to direct call', async () => {
      const error = new Error('Engine error');
      mockEngine.evaluatePosition.mockRejectedValueOnce(error);
      mockEngine.evaluatePosition.mockResolvedValueOnce(testResult);
      
      const result = await cache.evaluatePositionCached(mockEngine, testFen);
      
      // Should call engine twice (once failed, once fallback)
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(2);
      expect(result).toEqual(testResult);
    });

    it('should expire cached results after TTL', async () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = jest.fn(() => currentTime);
      
      try {
        // First call
        await cache.evaluatePositionCached(mockEngine, testFen);
        
        // Advance time beyond TTL (30 minutes = 1800000ms)
        currentTime += 1800001;
        mockEngine.evaluatePosition.mockClear();
        
        // Second call should miss cache due to expiration
        await cache.evaluatePositionCached(mockEngine, testFen);
        
        expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(1);
      } finally {
        Date.now = originalNow;
      }
    });

    it('should not cache null results', async () => {
      mockEngine.evaluatePosition.mockResolvedValue(null as any);
      
      await cache.evaluatePositionCached(mockEngine, testFen);
      mockEngine.evaluatePosition.mockClear();
      
      // Second call should still call engine
      await cache.evaluatePositionCached(mockEngine, testFen);
      
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(1);
    });
  });

  describe('EvaluationCache_getBestMoveCached_normalOperation_cachesResults', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testMove: ChessJsMove = { from: 'e2', to: 'e4', san: 'e4' } as ChessJsMove;
    const timeLimit = 1000;

    beforeEach(() => {
      mockEngine.getBestMove.mockResolvedValue(testMove);
    });

    it('should call engine on cache miss and cache result', async () => {
      const result = await cache.getBestMoveCached(mockEngine, testFen, timeLimit);
      
      expect(mockEngine.getBestMove).toHaveBeenCalledWith(testFen, timeLimit);
      expect(result).toEqual(testMove);
    });

    it('should return cached result on cache hit', async () => {
      // First call
      await cache.getBestMoveCached(mockEngine, testFen, timeLimit);
      mockEngine.getBestMove.mockClear();
      
      // Second call
      const result = await cache.getBestMoveCached(mockEngine, testFen, timeLimit);
      
      expect(mockEngine.getBestMove).not.toHaveBeenCalled();
      expect(result).toEqual(testMove);
    });

    it('should cache different timeLimit requests separately', async () => {
      await cache.getBestMoveCached(mockEngine, testFen, 1000);
      mockEngine.getBestMove.mockClear();
      
      // Different time limit should be cache miss
      await cache.getBestMoveCached(mockEngine, testFen, 2000);
      
      expect(mockEngine.getBestMove).toHaveBeenCalledTimes(1);
      expect(mockEngine.getBestMove).toHaveBeenCalledWith(testFen, 2000);
    });

    it('should cache null results (no best move found)', async () => {
      mockEngine.getBestMove.mockResolvedValue(null);
      
      await cache.getBestMoveCached(mockEngine, testFen, timeLimit);
      mockEngine.getBestMove.mockClear();
      
      const result = await cache.getBestMoveCached(mockEngine, testFen, timeLimit);
      
      expect(mockEngine.getBestMove).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle concurrent requests for best moves', async () => {
      const promises = [
        cache.getBestMoveCached(mockEngine, testFen, timeLimit),
        cache.getBestMoveCached(mockEngine, testFen, timeLimit)
      ];
      
      await Promise.all(promises);
      
      expect(mockEngine.getBestMove).toHaveBeenCalledTimes(1);
    });
  });

  describe('EvaluationCache_statistics_tracking_accurateMetrics', () => {
    const testFen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testFen2 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

    beforeEach(() => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 50, mate: null });
      mockEngine.getBestMove.mockResolvedValue({ from: 'e2', to: 'e4', san: 'e4' } as ChessJsMove);
    });

    it('should track combined hit rate correctly', async () => {
      // First calls (misses)
      await cache.evaluatePositionCached(mockEngine, testFen1);
      await cache.getBestMoveCached(mockEngine, testFen1, 1000);
      
      // Second calls (hits)
      await cache.evaluatePositionCached(mockEngine, testFen1);
      await cache.getBestMoveCached(mockEngine, testFen1, 1000);
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track memory usage estimation', async () => {
      const initialStats = cache.getStats();
      expect(initialStats.memoryUsageBytes).toBe(0);
      
      await cache.evaluatePositionCached(mockEngine, testFen1);
      await cache.getBestMoveCached(mockEngine, testFen1, 1000);
      
      const stats = cache.getStats();
      expect(stats.memoryUsageBytes).toBeGreaterThan(0);
      expect(stats.estimatedBytes).toBe(stats.memoryUsageBytes);
    });

    it('should track deduplication statistics', async () => {
      const promises = [
        cache.evaluatePositionCached(mockEngine, testFen1),
        cache.evaluatePositionCached(mockEngine, testFen1),
        cache.evaluatePositionCached(mockEngine, testFen1)
      ];
      
      await Promise.all(promises);
      
      const stats = cache.getStats();
      expect(stats.deduplicationHits).toBe(2);
      expect(stats.deduplicationMisses).toBe(1);
    });

    it('should track cache size correctly', async () => {
      await cache.evaluatePositionCached(mockEngine, testFen1);
      await cache.evaluatePositionCached(mockEngine, testFen2);
      await cache.getBestMoveCached(mockEngine, testFen1, 1000);
      
      const stats = cache.getStats();
      expect(stats.size).toBe(3); // 2 evaluations + 1 best move
      expect(stats.engineEvals).toBe(2);
    });
  });

  describe('EvaluationCache_cleanup_staleRequests_maintainsPerformance', () => {
    it('should cleanup stale pending requests', () => {
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = jest.fn(() => currentTime);
      
      try {
        // Add some pending requests
        const pendingRequests = (cache as any).pendingRequests;
        pendingRequests.set('old1', { promise: Promise.resolve(), timestamp: currentTime - 25000 });
        pendingRequests.set('old2', { promise: Promise.resolve(), timestamp: currentTime - 30000 });
        pendingRequests.set('recent', { promise: Promise.resolve(), timestamp: currentTime - 5000 });
        
        expect(pendingRequests.size).toBe(3);
        
        // Trigger cleanup
        (cache as any).cleanupStaleRequests();
        
        expect(pendingRequests.size).toBe(1);
        expect(pendingRequests.has('recent')).toBe(true);
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('EvaluationCache_warmupCache_preloading_improvesPerformance', () => {
    const testPositions = [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
    ];

    it('should preload cache with common positions', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: null });
      
      await cache.warmupCache(mockEngine, testPositions);
      
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(3);
      
      // Verify positions are cached
      mockEngine.evaluatePosition.mockClear();
      for (const fen of testPositions) {
        await cache.evaluatePositionCached(mockEngine, fen);
      }
      
      expect(mockEngine.evaluatePosition).not.toHaveBeenCalled();
    });

    it('should limit warmup to 10 positions max', async () => {
      const manyPositions = Array(20).fill(0).map((_, i) => `position${i}`);
      mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: null });
      
      await cache.warmupCache(mockEngine, manyPositions);
      
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(10);
    });

    it('should handle warmup errors gracefully', async () => {
      mockEngine.evaluatePosition.mockRejectedValue(new Error('Warmup error'));
      
      await expect(cache.warmupCache(mockEngine, testPositions)).resolves.not.toThrow();
    });
  });

  describe('EvaluationCache_legacyInterface_compatibility_maintainsAPI', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    it('should support legacy engine evaluation methods', () => {
      const evaluation = { score: 100, mate: null };
      
      cache.setEngineEval(testFen, evaluation);
      
      expect(cache.hasEngineEval(testFen)).toBe(true);
      expect(cache.getEngineEval(testFen)).toEqual(evaluation);
    });

    it('should support legacy tablebase methods', () => {
      const tablebaseData = { wdl: 2, dtm: 5 };
      
      cache.setTablebase(testFen, tablebaseData);
      
      expect(cache.hasTablebase(testFen)).toBe(true);
      expect(cache.getTablebase(testFen)).toEqual(tablebaseData);
    });

    it('should clear engine evaluations selectively', () => {
      cache.setEngineEval(testFen, { score: 50, mate: null });
      cache.setTablebase(testFen, { wdl: 2 });
      
      cache.clearEngineEvals();
      
      expect(cache.hasEngineEval(testFen)).toBe(false);
      expect(cache.hasTablebase(testFen)).toBe(true);
    });

    it('should clear tablebase data selectively', () => {
      cache.setEngineEval(testFen, { score: 50, mate: null });
      cache.setTablebase(testFen, { wdl: 2 });
      
      cache.clearTablebase();
      
      expect(cache.hasEngineEval(testFen)).toBe(true);
      expect(cache.hasTablebase(testFen)).toBe(false);
    });

    it('should return memory usage from both caches', () => {
      cache.setEngineEval(testFen, { score: 50, mate: null });
      
      const memoryUsage = cache.getMemoryUsage();
      expect(memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('EvaluationCache_clear_allData_resetsState', () => {
    it('should clear all caches and reset statistics', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 50, mate: null });
      mockEngine.getBestMove.mockResolvedValue({ from: 'e2', to: 'e4', san: 'e4' } as ChessJsMove);
      
      // Add some data
      await cache.evaluatePositionCached(mockEngine, 'fen1');
      await cache.getBestMoveCached(mockEngine, 'fen2', 1000);
      
      const statsBefore = cache.getStats();
      expect(statsBefore.size).toBeGreaterThan(0);
      
      cache.clear();
      
      const statsAfter = cache.getStats();
      expect(statsAfter.size).toBe(0);
      expect(statsAfter.hits).toBe(0);
      expect(statsAfter.misses).toBe(0);
      expect(statsAfter.deduplicationHits).toBe(0);
      expect(statsAfter.deduplicationMisses).toBe(0);
      expect(statsAfter.memoryUsageBytes).toBe(0);
    });
  });

  describe('EvaluationCache_edgeCases_boundary_handlesCorrectly', () => {
    it('should handle empty FEN strings', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: null });
      
      const result = await cache.evaluatePositionCached(mockEngine, '');
      
      expect(result).toEqual({ score: 0, mate: null });
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith('');
    });

    it('should handle very long FEN strings', async () => {
      const longFen = 'a'.repeat(1000);
      mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: null });
      
      const result = await cache.evaluatePositionCached(mockEngine, longFen);
      
      expect(result).toEqual({ score: 0, mate: null });
    });

    it('should handle zero time limit for best moves', async () => {
      const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      mockEngine.getBestMove.mockResolvedValue({ from: 'e2', to: 'e4', san: 'e4' } as ChessJsMove);
      
      const result = await cache.getBestMoveCached(mockEngine, testFen, 0);
      
      expect(mockEngine.getBestMove).toHaveBeenCalledWith(testFen, 0);
    });

    it('should handle negative scores in evaluations', async () => {
      const negativeEval = { score: -500, mate: null };
      mockEngine.evaluatePosition.mockResolvedValue(negativeEval);
      
      const result = await cache.evaluatePositionCached(mockEngine, 'test-fen');
      
      expect(result).toEqual(negativeEval);
    });

    it('should handle mate evaluations correctly', async () => {
      const mateEval = { score: 0, mate: 5 };
      mockEngine.evaluatePosition.mockResolvedValue(mateEval);
      
      const result = await cache.evaluatePositionCached(mockEngine, 'mate-fen');
      
      expect(result).toEqual(mateEval);
    });
  });

  describe('EvaluationCache_memoryManagement_efficiency_optimizesUsage', () => {
    it('should respect cache size limits', async () => {
      const smallCache = new EvaluationCache(2, 1); // Very small limits
      mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: null });
      mockEngine.getBestMove.mockResolvedValue({ from: 'e2', to: 'e4', san: 'e4' } as ChessJsMove);
      
      // Fill evaluation cache beyond limit
      await smallCache.evaluatePositionCached(mockEngine, 'fen1');
      await smallCache.evaluatePositionCached(mockEngine, 'fen2');
      await smallCache.evaluatePositionCached(mockEngine, 'fen3'); // Should evict fen1
      
      // Fill best move cache beyond limit
      await smallCache.getBestMoveCached(mockEngine, 'fen1', 1000);
      await smallCache.getBestMoveCached(mockEngine, 'fen2', 1000); // Should evict previous
      
      const stats = smallCache.getStats();
      expect(stats.size).toBe(3); // 2 evaluations + 1 best move (respecting limits)
    });

    it('should provide accurate memory usage estimates', async () => {
      mockEngine.evaluatePosition.mockResolvedValue({ score: 0, mate: null });
      
      const initialMemory = cache.getMemoryUsage();
      expect(initialMemory).toBe(0);
      
      await cache.evaluatePositionCached(mockEngine, 'test-fen');
      
      const afterMemory = cache.getMemoryUsage();
      expect(afterMemory).toBeGreaterThan(0);
      expect(afterMemory).toBe(350); // Based on LRU cache estimation
    });
  });

  describe('EvaluationCache_concurrency_raceConditions_handlesCorrectly', () => {
    it('should handle rapid successive calls without race conditions', async () => {
      let callCount = 0;
      mockEngine.evaluatePosition.mockImplementation(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return { score: callCount, mate: null };
      });
      
      const promises = Array(10).fill(0).map(() => 
        cache.evaluatePositionCached(mockEngine, 'same-fen')
      );
      
      const results = await Promise.all(promises);
      
      // All results should be identical (deduplication worked)
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });
      
      // Engine should only be called once despite 10 requests
      expect(callCount).toBe(1);
    });

    it('should handle mixed position requests concurrently', async () => {
      mockEngine.evaluatePosition.mockImplementation(async (fen) => ({
        score: fen.length,
        mate: null
      }));
      
      const promises = [
        cache.evaluatePositionCached(mockEngine, 'fen1'),
        cache.evaluatePositionCached(mockEngine, 'fen2'),
        cache.evaluatePositionCached(mockEngine, 'fen1'), // Duplicate
        cache.evaluatePositionCached(mockEngine, 'fen3'),
        cache.evaluatePositionCached(mockEngine, 'fen2')  // Duplicate
      ];
      
      await Promise.all(promises);
      
      // Should only call engine for unique positions
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(3);
    });
  });
});