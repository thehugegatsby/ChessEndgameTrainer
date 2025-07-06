/**
 * @fileoverview Cache Performance Unit Tests
 * @description Performance benchmarks and memory tests for caching systems
 */

import { LRUCache } from '../../../shared/lib/cache/LRUCache';
import { EvaluationCache } from '../../../shared/lib/cache/EvaluationCache';
import type { Engine } from '../../../shared/lib/chess/engine';

// Performance test configuration
const PERFORMANCE_CONFIG = {
  SMALL_DATASET: 100,
  MEDIUM_DATASET: 1000,
  LARGE_DATASET: 10000,
  MAX_OPERATION_TIME_MS: 10, // Max time for single operation
  MAX_BULK_TIME_MS: 1000,   // Max time for bulk operations
  MEMORY_THRESHOLD_KB: 100   // Max memory per item in KB
};

// Test data generators
const generateTestFens = (count: number): string[] => {
  const baseFens = [
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
  ];
  
  return Array(count).fill(0).map((_, i) => {
    const baseFen = baseFens[i % baseFens.length];
    return `${baseFen}_${i}`; // Make each FEN unique
  });
};

const generateTestEvaluations = (count: number) => {
  return Array(count).fill(0).map((_, i) => ({
    score: Math.floor(Math.random() * 1000) - 500,
    mate: Math.random() > 0.9 ? Math.floor(Math.random() * 10) + 1 : null
  }));
};

// Mock Engine for performance tests
const createMockEngine = (): jest.Mocked<Engine> => ({
  evaluatePosition: jest.fn().mockImplementation(async () => {
    // Simulate realistic engine delay
    await new Promise(resolve => setTimeout(resolve, 1));
    return { score: Math.floor(Math.random() * 1000) - 500, mate: null };
  }),
  getBestMove: jest.fn().mockImplementation(async () => {
    await new Promise(resolve => setTimeout(resolve, 2));
    return { from: 'e2', to: 'e4', san: 'e4' };
  }),
  analyze: jest.fn(),
  quit: jest.fn(),
  reset: jest.fn(),
  isReady: jest.fn(),
  getScore: jest.fn()
} as any);

describe('Cache Performance Tests', () => {
  // Increase timeout for performance tests
  jest.setTimeout(30000);

  describe('LRUCache_performance_operations_maintainEfficiency', () => {
    describe('LRUCache_performance_set_operations', () => {
      it('should handle small dataset set operations efficiently', () => {
        const cache = new LRUCache<string>(PERFORMANCE_CONFIG.SMALL_DATASET);
        const testData = Array(PERFORMANCE_CONFIG.SMALL_DATASET).fill(0).map((_, i) => [`key${i}`, `value${i}`]);
        
        const start = performance.now();
        
        testData.forEach(([key, value]) => {
          cache.set(key, value);
        });
        
        const duration = performance.now() - start;
        const avgTime = duration / PERFORMANCE_CONFIG.SMALL_DATASET;
        
        expect(avgTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_OPERATION_TIME_MS);
        expect(cache.size()).toBe(PERFORMANCE_CONFIG.SMALL_DATASET);
      });

      it('should handle medium dataset set operations efficiently', () => {
        const cache = new LRUCache<string>(PERFORMANCE_CONFIG.MEDIUM_DATASET);
        const testData = Array(PERFORMANCE_CONFIG.MEDIUM_DATASET).fill(0).map((_, i) => [`key${i}`, `value${i}`]);
        
        const start = performance.now();
        
        testData.forEach(([key, value]) => {
          cache.set(key, value);
        });
        
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS);
        expect(cache.size()).toBe(PERFORMANCE_CONFIG.MEDIUM_DATASET);
      });

      it('should maintain O(1) performance under capacity pressure', () => {
        const cacheSize = 1000;
        const cache = new LRUCache<string>(cacheSize);
        
        // Fill cache to capacity
        for (let i = 0; i < cacheSize; i++) {
          cache.set(`key${i}`, `value${i}`);
        }
        
        // Measure eviction performance
        const evictionTimes: number[] = [];
        
        for (let i = 0; i < 100; i++) {
          const start = performance.now();
          cache.set(`overflow${i}`, `value${i}`);
          const duration = performance.now() - start;
          evictionTimes.push(duration);
        }
        
        const avgEvictionTime = evictionTimes.reduce((a, b) => a + b, 0) / evictionTimes.length;
        
        expect(avgEvictionTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_OPERATION_TIME_MS);
        expect(cache.size()).toBe(cacheSize);
      });
    });

    describe('LRUCache_performance_get_operations', () => {
      let cache: LRUCache<string>;
      
      beforeEach(() => {
        cache = new LRUCache<string>(PERFORMANCE_CONFIG.MEDIUM_DATASET);
        
        // Populate cache
        for (let i = 0; i < PERFORMANCE_CONFIG.MEDIUM_DATASET; i++) {
          cache.set(`key${i}`, `value${i}`);
        }
      });

      it('should maintain fast get operations across different access patterns', () => {
        const accessPatterns = [
          // Sequential access
          () => Array(100).fill(0).map((_, i) => `key${i}`),
          // Random access
          () => Array(100).fill(0).map(() => `key${Math.floor(Math.random() * PERFORMANCE_CONFIG.MEDIUM_DATASET)}`),
          // Hot spot access (80/20 rule)
          () => Array(100).fill(0).map(() => 
            Math.random() < 0.8 ? `key${Math.floor(Math.random() * 200)}` : `key${Math.floor(Math.random() * PERFORMANCE_CONFIG.MEDIUM_DATASET)}`
          )
        ];
        
        accessPatterns.forEach((patternGen, patternIndex) => {
          const keys = patternGen();
          const start = performance.now();
          
          keys.forEach(key => cache.get(key));
          
          const duration = performance.now() - start;
          const avgTime = duration / keys.length;
          
          expect(avgTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_OPERATION_TIME_MS);
        });
      });

      it('should handle cache hit rate optimization', () => {
        const totalRequests = 1000;
        let hits = 0;
        
        const start = performance.now();
        
        for (let i = 0; i < totalRequests; i++) {
          // 70% chance of hitting existing keys
          const key = Math.random() < 0.7 
            ? `key${Math.floor(Math.random() * PERFORMANCE_CONFIG.MEDIUM_DATASET)}`
            : `missing${i}`;
          
          const result = cache.get(key);
          if (result !== undefined) hits++;
        }
        
        const duration = performance.now() - start;
        const hitRate = hits / totalRequests;
        
        expect(duration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS);
        expect(hitRate).toBeGreaterThan(0.6); // Should achieve reasonable hit rate
      });
    });

    describe('LRUCache_performance_memory_efficiency', () => {
      it('should provide accurate memory usage estimates', () => {
        const cache = new LRUCache<string>(1000);
        
        expect(cache.getMemoryUsage()).toBe(0);
        
        cache.set('key1', 'value1');
        expect(cache.getMemoryUsage()).toBe(350);
        
        cache.set('key2', 'value2');
        expect(cache.getMemoryUsage()).toBe(700);
      });

      it('should maintain reasonable memory footprint per item', () => {
        const cache = new LRUCache<string>(100);
        const testValue = 'a'.repeat(100); // 100-character string
        
        cache.set('test', testValue);
        
        const memoryPerItem = cache.getMemoryUsage() / cache.size();
        
        // Should be reasonable overhead (less than 100KB per item)
        expect(memoryPerItem).toBeLessThan(PERFORMANCE_CONFIG.MEMORY_THRESHOLD_KB * 1024);
      });

      it('should handle memory usage with complex objects', () => {
        interface ComplexObject {
          id: number;
          data: string[];
          metadata: { [key: string]: any };
        }
        
        const cache = new LRUCache<ComplexObject>(100);
        
        for (let i = 0; i < 50; i++) {
          cache.set(`complex${i}`, {
            id: i,
            data: Array(10).fill(`data${i}`),
            metadata: { timestamp: Date.now(), version: '1.0' }
          });
        }
        
        const memoryUsage = cache.getMemoryUsage();
        const memoryPerItem = memoryUsage / cache.size();
        
        // Memory estimation should be consistent
        expect(memoryPerItem).toBe(350); // Fixed estimation from LRU cache
        expect(cache.size()).toBe(50);
      });
    });

    describe('LRUCache_performance_stress_testing', () => {
      it('should handle rapid mixed operations without degradation', () => {
        const cache = new LRUCache<string>(5000);
        const operationTimes: number[] = [];
        
        for (let i = 0; i < 10000; i++) {
          const start = performance.now();
          
          const operation = Math.random();
          if (operation < 0.5) {
            // Set operation
            cache.set(`key${i}`, `value${i}`);
          } else if (operation < 0.8) {
            // Get operation
            cache.get(`key${Math.floor(Math.random() * i)}`);
          } else {
            // Delete operation
            cache.delete(`key${Math.floor(Math.random() * i)}`);
          }
          
          const duration = performance.now() - start;
          operationTimes.push(duration);
        }
        
        // Check performance distribution
        const avgTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
        const maxTime = Math.max(...operationTimes);
        const p95Time = operationTimes.sort((a, b) => a - b)[Math.floor(operationTimes.length * 0.95)];
        
        expect(avgTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_OPERATION_TIME_MS);
        expect(p95Time).toBeLessThan(PERFORMANCE_CONFIG.MAX_OPERATION_TIME_MS * 2);
        expect(maxTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_OPERATION_TIME_MS * 5);
      });
    });
  });

  describe('EvaluationCache_performance_operations_maintainEfficiency', () => {
    let cache: EvaluationCache;
    let mockEngine: jest.Mocked<Engine>;

    beforeEach(() => {
      cache = new EvaluationCache(1000, 500);
      mockEngine = createMockEngine();
    });

    afterEach(() => {
      cache.clear();
    });

    describe('EvaluationCache_performance_evaluation_caching', () => {
      it('should demonstrate significant performance improvement with caching', async () => {
        const testFens = generateTestFens(100);
        
        // Measure performance without cache (first run)
        const uncachedStart = performance.now();
        for (const fen of testFens) {
          await cache.evaluatePositionCached(mockEngine, fen);
        }
        const uncachedDuration = performance.now() - uncachedStart;
        
        // Reset mock call count
        mockEngine.evaluatePosition.mockClear();
        
        // Measure performance with cache (second run)
        const cachedStart = performance.now();
        for (const fen of testFens) {
          await cache.evaluatePositionCached(mockEngine, fen);
        }
        const cachedDuration = performance.now() - cachedStart;
        
        // Cache should provide significant speedup
        expect(cachedDuration).toBeLessThan(uncachedDuration * 0.1); // 10x speedup
        expect(mockEngine.evaluatePosition).not.toHaveBeenCalled(); // No engine calls on cache hits
        
        const stats = cache.getStats();
        // Hit rate should be 0.5 (100 misses + 100 hits = 50% hit rate)
        expect(stats.hitRate).toBeCloseTo(0.5, 1);
      });

      it('should handle concurrent evaluation requests efficiently', async () => {
        const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const concurrentRequests = 50;
        
        const start = performance.now();
        
        // Launch concurrent requests for the same position
        const promises = Array(concurrentRequests).fill(0).map(() =>
          cache.evaluatePositionCached(mockEngine, testFen)
        );
        
        await Promise.all(promises);
        
        const duration = performance.now() - start;
        
        // Should be much faster than sequential requests
        expect(duration).toBeLessThan(100); // Should complete quickly
        expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(1); // Only one actual engine call
        
        const stats = cache.getStats();
        expect(stats.deduplicationHits).toBe(concurrentRequests - 1);
      });

      it('should maintain performance under mixed hit/miss scenarios', async () => {
        const testFens = generateTestFens(200);
        
        // Pre-populate half the cache
        for (let i = 0; i < 100; i++) {
          await cache.evaluatePositionCached(mockEngine, testFens[i]);
        }
        
        mockEngine.evaluatePosition.mockClear();
        
        // Test mixed scenario (50% hits, 50% misses)
        const start = performance.now();
        for (const fen of testFens) {
          await cache.evaluatePositionCached(mockEngine, fen);
        }
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS);
        expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(100); // Only misses call engine
        
        const stats = cache.getStats();
        // Hit rate calculation: (100 initial misses + 100 hits + 100 new misses) = 300 total, 100 hits = 33.3%
        expect(stats.hitRate).toBeCloseTo(0.33, 1); // ~33% hit rate
      });
    });

    describe('EvaluationCache_performance_best_move_caching', () => {
      it('should efficiently cache best move requests', async () => {
        const testFens = generateTestFens(50);
        const timeLimit = 1000;
        
        // First pass - populate cache
        const firstPassStart = performance.now();
        for (const fen of testFens) {
          await cache.getBestMoveCached(mockEngine, fen, timeLimit);
        }
        const firstPassDuration = performance.now() - firstPassStart;
        
        mockEngine.getBestMove.mockClear();
        
        // Second pass - all cache hits
        const secondPassStart = performance.now();
        for (const fen of testFens) {
          await cache.getBestMoveCached(mockEngine, fen, timeLimit);
        }
        const secondPassDuration = performance.now() - secondPassStart;
        
        expect(secondPassDuration).toBeLessThan(firstPassDuration * 0.1);
        expect(mockEngine.getBestMove).not.toHaveBeenCalled();
      });

      it('should handle different time limits efficiently', async () => {
        const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const timeLimits = [500, 1000, 2000, 5000];
        
        const start = performance.now();
        
        // Cache for different time limits
        for (const timeLimit of timeLimits) {
          await cache.getBestMoveCached(mockEngine, testFen, timeLimit);
        }
        
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS);
        expect(mockEngine.getBestMove).toHaveBeenCalledTimes(timeLimits.length);
      });
    });

    describe('EvaluationCache_performance_memory_management', () => {
      it('should maintain reasonable memory footprint', async () => {
        const testFens = generateTestFens(500);
        
        for (const fen of testFens) {
          await cache.evaluatePositionCached(mockEngine, fen);
        }
        
        const stats = cache.getStats();
        const memoryPerItem = stats.memoryUsageBytes / stats.size;
        
        expect(memoryPerItem).toBeLessThan(1000); // Less than 1KB per cached item
        expect(stats.memoryUsageBytes).toBeLessThan(500 * 1024); // Less than 500KB total
      });

      it('should handle cache eviction efficiently', async () => {
        const smallCache = new EvaluationCache(100, 50); // Small cache sizes
        const testFens = generateTestFens(200); // More items than cache can hold
        
        const start = performance.now();
        
        for (const fen of testFens) {
          await smallCache.evaluatePositionCached(mockEngine, fen);
        }
        
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS);
        
        const stats = smallCache.getStats();
        expect(stats.size).toBeLessThanOrEqual(150); // Respects cache limits
      });
    });

    describe('EvaluationCache_performance_warmup_optimization', () => {
      it('should efficiently warm up cache with common positions', async () => {
        const commonPositions = generateTestFens(100);
        
        const warmupStart = performance.now();
        await cache.warmupCache(mockEngine, commonPositions);
        const warmupDuration = performance.now() - warmupStart;
        
        expect(warmupDuration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS);
        
        // Verify all positions are cached (only first 10 due to warmup limit)
        mockEngine.evaluatePosition.mockClear();
        
        const testStart = performance.now();
        for (let i = 0; i < 10; i++) {
          await cache.evaluatePositionCached(mockEngine, commonPositions[i]);
        }
        const testDuration = performance.now() - testStart;
        
        expect(testDuration).toBeLessThan(50); // Should be very fast (cache hits)
        expect(mockEngine.evaluatePosition).not.toHaveBeenCalled();
      });
    });

    describe('EvaluationCache_performance_statistics_tracking', () => {
      it('should maintain statistics without performance overhead', async () => {
        const testFens = generateTestFens(1000);
        
        const start = performance.now();
        
        for (const fen of testFens) {
          await cache.evaluatePositionCached(mockEngine, fen);
          
          // Access statistics frequently
          if (Math.random() < 0.1) { // 10% of operations
            cache.getStats();
          }
        }
        
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS * 2);
        
        const finalStats = cache.getStats();
        expect(finalStats.misses).toBe(1000);
        expect(finalStats.hitRate).toBe(0);
      });
    });
  });

  describe('Cache_performance_comparative_analysis', () => {
    let mockEngine: jest.Mocked<Engine>;

    beforeEach(() => {
      mockEngine = createMockEngine();
    });

    it('should demonstrate LRU vs simple Map performance characteristics', () => {
      const cacheSize = 1000;
      const operations = 5000;
      
      // LRU Cache test
      const lruCache = new LRUCache<string>(cacheSize);
      const lruStart = performance.now();
      
      for (let i = 0; i < operations; i++) {
        lruCache.set(`key${i}`, `value${i}`);
        if (i > 500) {
          lruCache.get(`key${i - 500}`); // Access older items
        }
      }
      
      const lruDuration = performance.now() - lruStart;
      
      // Simple Map test
      const simpleMap = new Map<string, string>();
      const mapStart = performance.now();
      
      for (let i = 0; i < operations; i++) {
        simpleMap.set(`key${i}`, `value${i}`);
        if (i > 500) {
          simpleMap.get(`key${i - 500}`);
        }
        
        // Manual eviction for Map
        if (simpleMap.size > cacheSize) {
          const firstKey = simpleMap.keys().next().value;
          if (firstKey !== undefined) {
            simpleMap.delete(firstKey);
          }
        }
      }
      
      const mapDuration = performance.now() - mapStart;
      
      // LRU should be reasonably competitive with simple Map
      const performanceRatio = lruDuration / mapDuration;
      expect(performanceRatio).toBeLessThan(5); // At most 5x slower than simple Map
      
      // But LRU should properly maintain size limits
      expect(lruCache.size()).toBe(cacheSize);
      expect(simpleMap.size).toBeLessThanOrEqual(cacheSize);
    });

    it('should demonstrate cache hierarchy performance benefits', async () => {
      const positions = generateTestFens(200);
      
      // Single-level caching (just evaluation cache)
      const singleLevelCache = new EvaluationCache(1000, 500);
      const singleStart = performance.now();
      
      for (const fen of positions) {
        await singleLevelCache.evaluatePositionCached(mockEngine, fen);
      }
      // Second pass
      for (const fen of positions) {
        await singleLevelCache.evaluatePositionCached(mockEngine, fen);
      }
      
      const singleDuration = performance.now() - singleStart;
      
      // The single-level cache should be very fast on second pass
      expect(singleDuration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS);
      
      const stats = singleLevelCache.getStats();
      expect(stats.hitRate).toBeCloseTo(0.5, 1); // 50% hit rate (second pass)
    });
  });

  describe('Cache_performance_mobile_optimization', () => {
    let mockEngine: jest.Mocked<Engine>;

    beforeEach(() => {
      mockEngine = createMockEngine();
    });

    it('should maintain performance with mobile-optimized cache sizes', async () => {
      // Mobile-optimized smaller caches
      const mobileCache = new EvaluationCache(50, 25);
      const testFens = generateTestFens(100);
      
      const start = performance.now();
      
      // Simulate mobile usage pattern
      for (let round = 0; round < 3; round++) {
        for (const fen of testFens.slice(0, 30)) { // Smaller batches
          await mobileCache.evaluatePositionCached(mockEngine, fen);
        }
      }
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(PERFORMANCE_CONFIG.MAX_BULK_TIME_MS);
      
      const stats = mobileCache.getStats();
      expect(stats.memoryUsageBytes).toBeLessThan(50 * 1024); // Under 50KB for mobile
    });

    it('should optimize for mobile memory constraints', () => {
      const mobileMemoryLimit = 100 * 1024; // 100KB limit
      const cache = new LRUCache<string>(200);
      
      // Fill cache and monitor memory
      let itemCount = 0;
      while (cache.getMemoryUsage() < mobileMemoryLimit && itemCount < 1000) {
        cache.set(`key${itemCount}`, `value${itemCount}`);
        itemCount++;
      }
      
      expect(cache.getMemoryUsage()).toBeLessThan(mobileMemoryLimit * 1.1); // 10% tolerance
      expect(itemCount).toBeGreaterThan(200); // Should fit reasonable number of items
    });
  });
});