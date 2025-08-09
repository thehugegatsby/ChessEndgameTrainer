/**
 * @jest-environment node
 *
 * Performance validation tests for CacheManager
 * 
 * @remarks
 * Tests key performance characteristics for Node.js environment:
 * - Micro-benchmarks for raw cache operations  
 * - Memory usage and GC pressure validation
 * - Async race condition detection
 * - Event loop blocking prevention
 * 
 * Based on performance validation plan for Issue #93
 */

import { LRUCacheManager } from '../../shared/lib/cache/LRUCacheManager';
import type { CacheManager } from '../../shared/lib/cache/types';

// Test data types for realistic scenarios
interface MockTablebaseEntry {
  fen: string;
  category: string;
  dtz: number;
  moves: Array<{ uci: string; san: string; }>;
  timestamp: number;
}

const createMockEntry = (id: number): MockTablebaseEntry => ({
  fen: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 ${id}`,
  category: 'draw',
  dtz: 0,
  moves: Array(20).fill(null).map((_, i) => ({
    uci: `a${i%8+1}b${i%8+1}`,
    san: `Nb${i%8+1}`
  })),
  timestamp: Date.now()
});

describe('CacheManager Performance Validation', () => {
  let cache: CacheManager<string, MockTablebaseEntry>;

  afterEach(() => {
    // Clean up cache after each test to prevent memory leaks
    if (cache) {
      cache.clear();
      cache = null as any;
    }
  });

  describe('Phase 1: Micro-Benchmarks (Raw Performance)', () => {
    beforeEach(() => {
      cache = new LRUCacheManager<string, MockTablebaseEntry>(200, 300000); // 5min TTL
    });

    it('should perform get() operations in sub-millisecond time', () => {
      // Pre-fill cache
      const testData = createMockEntry(1);
      for (let i = 0; i < 100; i++) {
        cache.set(`pos${i}`, testData);
      }

      // Benchmark get() hits
      const iterations = 10000;
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        cache.get(`pos${i % 100}`);
      }
      
      const end = process.hrtime.bigint();
      const totalMs = Number(end - start) / 1_000_000; // Convert ns to ms
      const avgMs = totalMs / iterations;

      expect(avgMs).toBeLessThan(0.1); // Sub-0.1ms per operation
      expect(totalMs).toBeLessThan(100); // Total under 100ms for 10k operations
    });

    it('should perform set() operations efficiently', () => {
      const testData = createMockEntry(1);
      const iterations = 1000;
      
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        cache.set(`perf${i}`, testData);
      }
      
      const end = process.hrtime.bigint();
      const totalMs = Number(end - start) / 1_000_000;
      const avgMs = totalMs / iterations;

      expect(avgMs).toBeLessThan(0.5); // Sub-0.5ms per operation
      expect(totalMs).toBeLessThan(50); // Total under 50ms for 1k operations
    });

    it('should handle eviction churn efficiently', () => {
      cache = new LRUCacheManager<string, MockTablebaseEntry>(50, 60000); // Small cache for testing
      const testData = createMockEntry(1);
      
      // Fill to capacity
      for (let i = 0; i < 50; i++) {
        cache.set(`init${i}`, testData);
      }

      // Benchmark eviction churn (adding beyond capacity)
      const iterations = 1000;
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        cache.set(`churn${i}`, testData); // Forces eviction
      }
      
      const end = process.hrtime.bigint();
      const totalMs = Number(end - start) / 1_000_000;
      
      expect(cache.size).toBe(50); // Should maintain max size
      expect(totalMs).toBeLessThan(100); // Eviction should be fast
    });

    it('should maintain O(1) complexity as cache size grows', () => {
      const testData = createMockEntry(1);
      const cacheSizes = [50, 100, 200, 500];
      const results: number[] = [];

      for (const size of cacheSizes) {
        const testCache = new LRUCacheManager<string, MockTablebaseEntry>(size, 60000);
        
        // Fill cache to capacity
        for (let i = 0; i < size; i++) {
          testCache.set(`test${i}`, testData);
        }

        // Benchmark get operations
        const iterations = 1000;
        const start = process.hrtime.bigint();
        
        for (let i = 0; i < iterations; i++) {
          testCache.get(`test${i % size}`);
        }
        
        const end = process.hrtime.bigint();
        const avgNs = Number(end - start) / iterations;
        results.push(avgNs);
      }

      // Performance should not degrade significantly with size (O(1))
      // Allow some variance but performance shouldn't double from smallest to largest
      const ratio = results[results.length - 1] / results[0];
      expect(ratio).toBeLessThan(3); // Performance degradation should be minimal
    });
  });

  describe('Phase 2: Memory Usage Validation', () => {
    it('should not cause memory leaks with TTL cleanup', async () => {
      cache = new LRUCacheManager<string, MockTablebaseEntry>(100, 50); // 50ms TTL for fast test
      
      // Skip memory measurement in CI environment where it's unreliable
      if (process.env.CI) {
        // Just verify the cache works and cleans up
        for (let batch = 0; batch < 3; batch++) {
          for (let i = 0; i < 50; i++) {
            cache.set(`batch${batch}_${i}`, createMockEntry(i));
          }
          await new Promise(resolve => setTimeout(resolve, 60));
          cache.get('nonexistent'); // Trigger cleanup
        }
        
        cache.clear();
        expect(cache.size).toBe(0);
        return; // Skip memory measurement in CI
      }
      
      // Local testing: measure memory more tolerantly
      const initialMemory = process.memoryUsage();
      
      // Add many entries that will expire
      for (let batch = 0; batch < 10; batch++) {
        for (let i = 0; i < 100; i++) {
          cache.set(`batch${batch}_${i}`, createMockEntry(i));
        }
        
        // Wait for entries to expire
        await new Promise(resolve => setTimeout(resolve, 60));
        
        // Access cache to trigger cleanup  
        cache.get('nonexistent');
      }

      // Clear the cache completely
      cache.clear();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Very tolerant threshold - 10MB for local testing
      // Memory usage can vary greatly depending on V8 GC timing
      expect(heapGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB threshold
      expect(cache.size).toBe(0); // All entries should be expired/cleaned up
    });

    it('should track memory usage accurately with cache stats', () => {
      cache = new LRUCacheManager<string, MockTablebaseEntry>(100, 60000);
      
      // Add known number of entries
      const entriesAdded = 50;
      for (let i = 0; i < entriesAdded; i++) {
        cache.set(`mem${i}`, createMockEntry(i));
      }

      const stats = (cache as any).getStats();
      expect(stats.size).toBe(entriesAdded);
      expect(cache.size).toBe(entriesAdded);
    });
  });

  describe('Phase 3: Async Race Condition Detection', () => {
    it('should handle concurrent async operations without corruption', async () => {
      cache = new LRUCacheManager<string, MockTablebaseEntry>(100, 60000);
      
      // Simulate concurrent async operations
      const concurrentOperations = 50;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const promise = new Promise<void>((resolve) => {
          // Simulate async work with setTimeout
          setTimeout(() => {
            const key = `async${i % 10}`; // Some key overlap to test race conditions
            const existing = cache.get(key);
            
            if (!existing) {
              cache.set(key, createMockEntry(i));
            }
            
            // Verify we can still read what we wrote
            const retrieved = cache.get(key);
            expect(retrieved).toBeDefined();
            
            resolve();
          }, Math.random() * 10); // Random delay 0-10ms
        });
        
        promises.push(promise);
      }

      await Promise.all(promises);
      
      // Cache should be in valid state
      expect(cache.size).toBeGreaterThan(0);
      expect(cache.size).toBeLessThanOrEqual(100);
      
      // Stats should be consistent
      const stats = (cache as any).getStats();
      expect(stats.hits + stats.misses).toBeGreaterThan(0);
    });

    it('should not block event loop during heavy operations', async () => {
      cache = new LRUCacheManager<string, MockTablebaseEntry>(1000, 60000);
      
      let eventLoopBlocked = false;
      
      // Monitor event loop blocking
      const monitor = setTimeout(() => {
        eventLoopBlocked = true;
      }, 10); // Should fire within 10ms if event loop not blocked

      // Perform heavy cache operations
      const testData = createMockEntry(1);
      for (let i = 0; i < 5000; i++) {
        cache.set(`heavy${i}`, testData);
        if (i % 1000 === 0) {
          // Yield control occasionally
          await new Promise(resolve => setImmediate(resolve));
        }
      }

      clearTimeout(monitor);
      
      // Event loop should not have been blocked for long periods
      expect(eventLoopBlocked).toBe(false);
    });
  });

  describe('Phase 4: Realistic Workload Simulation', () => {
    it('should perform well with chess-like access patterns', () => {
      cache = new LRUCacheManager<string, MockTablebaseEntry>(200, 300000);
      
      // Simulate chess-like access patterns:
      // - Sequential moves in a game (locality of reference)
      // - Popular opening positions (high-frequency keys)
      // - Random endgame positions (cold data)
      
      const popularPositions = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', // King's pawn
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2', // Sicilian
      ];
      
      let totalOperations = 0;
      const start = process.hrtime.bigint();
      
      // Simulate 1000 requests with realistic patterns
      for (let i = 0; i < 1000; i++) {
        let fen: string;
        
        if (i % 3 === 0) {
          // 33% chance of popular position (high cache hit rate expected)
          fen = popularPositions[i % popularPositions.length];
        } else if (i % 10 < 7) {
          // 70% chance of sequential game moves (moderate locality)
          const gameId = Math.floor(i / 10);
          const moveNum = i % 10;
          fen = `game${gameId}_move${moveNum}_fen`;
        } else {
          // 30% chance of random position (cache miss expected)  
          fen = `random_${i}_${Math.random()}`;
        }
        
        // Simulate get (analysis request)
        const existing = cache.get(fen);
        totalOperations++;
        
        if (!existing) {
          // Cache miss - add new entry (simulating API fetch + cache)
          cache.set(fen, createMockEntry(i));
          totalOperations++;
        }
      }
      
      const end = process.hrtime.bigint();
      const totalMs = Number(end - start) / 1_000_000;
      const avgMs = totalMs / totalOperations;
      
      const stats = (cache as any).getStats();
      
      // Performance expectations
      expect(avgMs).toBeLessThan(1); // Under 1ms per operation on average
      expect(stats.hitRate).toBeGreaterThan(0.25); // At least 25% hit rate (more realistic for mixed workload)
      expect(cache.size).toBeLessThanOrEqual(200); // Respects max size
      
      // Log performance results for analysis
      console.log(`\n=== Chess Workload Performance Results ===`);
      console.log(`Total operations: ${totalOperations}`);
      console.log(`Execution time: ${totalMs.toFixed(2)}ms`);
      console.log(`Average per operation: ${avgMs.toFixed(4)}ms`);
      console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
      console.log(`Cache size: ${cache.size}/${(cache as any).maxSize || 'N/A'}`);
      console.log(`Evictions: ${stats.evictions || 0}`);
      console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
      console.log(`=========================================\n`);
    });
  });
});