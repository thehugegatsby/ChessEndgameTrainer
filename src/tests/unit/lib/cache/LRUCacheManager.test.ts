/**
 * @jest-environment node
 *
 * Comprehensive test suite for LRUCacheManager
 *
 * @remarks
 * Tests all LRU cache functionality including:
 * - Basic operations (get, set, delete, clear)
 * - LRU eviction policy
 * - TTL expiration handling
 * - Edge cases and error conditions
 * - Performance characteristics
 * - Statistics tracking
 */

import { LRUCacheManager } from '../../../../shared/lib/cache/LRUCacheManager';
import type { CacheManager } from '../../../../shared/lib/cache/types';

// Test data types
interface TestData {
  id: number;
  name: string;
  data: string;
}

const createTestData = (id: number): TestData => ({
  id,
  name: `Test${id}`,
  data: `TestData${id}`.repeat(10) // Some content to make it more realistic
});

describe('LRUCacheManager', () => {
  describe('Constructor and Configuration', () => {
    it('should create cache with default parameters', () => {
      const cache = new LRUCacheManager<string, TestData>();
      expect(cache).toBeInstanceOf(LRUCacheManager);
      expect(cache.size).toBe(0);
    });

    it('should create cache with custom parameters', () => {
      const cache = new LRUCacheManager<string, TestData>(50, 10000);
      expect(cache).toBeInstanceOf(LRUCacheManager);
      expect(cache.size).toBe(0);
    });

    it('should validate constructor parameters', () => {
      expect(() => new LRUCacheManager(0, 1000))
        .toThrow('maxSize must be positive');
      
      expect(() => new LRUCacheManager(-1, 1000))
        .toThrow('maxSize must be positive');
      
      expect(() => new LRUCacheManager(10, 0))
        .toThrow('defaultTtlMs must be positive');
      
      expect(() => new LRUCacheManager(10, -1))
        .toThrow('defaultTtlMs must be positive');
    });

    it('should create from options', () => {
      const cache = LRUCacheManager.fromOptions<string, TestData>({
        maxSize: 75,
        defaultTtlMs: 15000
      });
      expect(cache).toBeInstanceOf(LRUCacheManager);
    });

    it('should use defaults when creating from empty options', () => {
      const cache = LRUCacheManager.fromOptions<string, TestData>({});
      expect(cache).toBeInstanceOf(LRUCacheManager);
    });
  });

  describe('Basic Operations', () => {
    let cache: CacheManager<string, TestData>;

    beforeEach(() => {
      cache = new LRUCacheManager<string, TestData>(5, 10000); // 5 items, 10s TTL
    });

    it('should store and retrieve values', () => {
      const testData = createTestData(1);
      cache.set('key1', testData);
      
      const retrieved = cache.get('key1');
      expect(retrieved).toEqual(testData);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should handle has() correctly', () => {
      const testData = createTestData(1);
      
      expect(cache.has('key1')).toBe(false);
      
      cache.set('key1', testData);
      expect(cache.has('key1')).toBe(true);
      
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete entries', () => {
      const testData = createTestData(1);
      cache.set('key1', testData);
      
      expect(cache.has('key1')).toBe(true);
      
      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.has('key1')).toBe(false);
      
      const deletedAgain = cache.delete('key1');
      expect(deletedAgain).toBe(false);
    });

    it('should clear all entries', () => {
      // Add multiple entries
      for (let i = 1; i <= 3; i++) {
        cache.set(`key${i}`, createTestData(i));
      }
      
      expect(cache.size).toBe(3);
      
      cache.clear();
      expect(cache.size).toBe(0);
      
      // Verify all entries are gone
      for (let i = 1; i <= 3; i++) {
        expect(cache.has(`key${i}`)).toBe(false);
      }
    });

    it('should track size correctly', () => {
      expect(cache.size).toBe(0);
      
      cache.set('key1', createTestData(1));
      expect(cache.size).toBe(1);
      
      cache.set('key2', createTestData(2));
      expect(cache.size).toBe(2);
      
      cache.delete('key1');
      expect(cache.size).toBe(1);
      
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('LRU Eviction Policy', () => {
    let cache: CacheManager<string, TestData>;

    beforeEach(() => {
      cache = new LRUCacheManager<string, TestData>(3, 10000); // 3 items max
    });

    it('should evict least recently used entries when capacity exceeded', () => {
      // Fill cache to capacity
      cache.set('key1', createTestData(1));
      cache.set('key2', createTestData(2));
      cache.set('key3', createTestData(3));
      
      expect(cache.size).toBe(3);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      
      // Add fourth item - should evict key1 (oldest)
      cache.set('key4', createTestData(4));
      
      expect(cache.size).toBe(3);
      expect(cache.has('key1')).toBe(false); // Evicted
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update LRU order on get operations', () => {
      // Fill cache
      cache.set('key1', createTestData(1));
      cache.set('key2', createTestData(2));
      cache.set('key3', createTestData(3));
      
      // Access key1 (makes it most recently used)
      cache.get('key1');
      
      // Add fourth item - should evict key2 (now oldest)
      cache.set('key4', createTestData(4));
      
      expect(cache.has('key1')).toBe(true);  // Not evicted (was accessed)
      expect(cache.has('key2')).toBe(false); // Evicted
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update LRU order on set operations (overwrite)', () => {
      // Fill cache
      cache.set('key1', createTestData(1));
      cache.set('key2', createTestData(2));
      cache.set('key3', createTestData(3));
      
      // Overwrite key1 (makes it most recently used)
      cache.set('key1', createTestData(10));
      
      // Add fourth item - should evict key2 (now oldest)
      cache.set('key4', createTestData(4));
      
      expect(cache.has('key1')).toBe(true);  // Not evicted (was overwritten)
      expect(cache.get('key1')?.id).toBe(10); // Has new value
      expect(cache.has('key2')).toBe(false); // Evicted
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should handle rapid evictions correctly', () => {
      const maxSize = 3;
      cache = new LRUCacheManager<string, TestData>(maxSize, 10000);
      
      // Add more items than capacity
      for (let i = 1; i <= 10; i++) {
        cache.set(`key${i}`, createTestData(i));
      }
      
      expect(cache.size).toBe(maxSize);
      
      // Only the last 3 items should remain
      expect(cache.has('key8')).toBe(true);
      expect(cache.has('key9')).toBe(true);
      expect(cache.has('key10')).toBe(true);
      
      // Earlier items should be evicted
      for (let i = 1; i <= 7; i++) {
        expect(cache.has(`key${i}`)).toBe(false);
      }
    });
  });

  describe('TTL (Time-To-Live) Handling', () => {
    let cache: CacheManager<string, TestData>;

    beforeEach(() => {
      cache = new LRUCacheManager<string, TestData>(5, 100); // 100ms default TTL
    });

    it('should store entries with default TTL', async () => {
      const testData = createTestData(1);
      cache.set('key1', testData);
      
      expect(cache.get('key1')).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    it('should store entries with custom TTL', async () => {
      const testData = createTestData(1);
      
      // Store with longer TTL
      cache.set('key1', testData, 500); // 500ms
      
      // Should still be available after default TTL
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.get('key1')).toEqual(testData);
      
      // Should expire after custom TTL
      await new Promise(resolve => setTimeout(resolve, 400));
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should handle mixed TTL entries', async () => {
      cache.set('short', createTestData(1), 50);   // 50ms
      cache.set('medium', createTestData(2), 150); // 150ms
      cache.set('long', createTestData(3), 300);   // 300ms
      
      // All should be available initially
      expect(cache.size).toBe(3);
      
      // After 75ms, short should expire
      await new Promise(resolve => setTimeout(resolve, 75));
      expect(cache.has('short')).toBe(false);
      expect(cache.has('medium')).toBe(true);
      expect(cache.has('long')).toBe(true);
      
      // After another 100ms, medium should expire
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(cache.has('medium')).toBe(false);
      expect(cache.has('long')).toBe(true);
      
      // After another 150ms, long should expire
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.has('long')).toBe(false);
    });

    it('should clean up expired entries on size check', async () => {
      // Add entries that will expire
      for (let i = 1; i <= 3; i++) {
        cache.set(`key${i}`, createTestData(i), 50);
      }
      
      expect(cache.size).toBe(3);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 75));
      
      // Size check should trigger cleanup
      expect(cache.size).toBe(0);
    });

    it('should not affect LRU order with TTL', async () => {
      cache = new LRUCacheManager<string, TestData>(2, 200); // 2 max, 200ms TTL
      
      cache.set('key1', createTestData(1));
      cache.set('key2', createTestData(2));
      
      // Wait a bit but not enough to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Add third item - should evict by LRU, not TTL
      cache.set('key3', createTestData(3));
      
      expect(cache.has('key1')).toBe(false); // Evicted by LRU
      expect(cache.has('key2')).toBe(true);  // Still valid
      expect(cache.has('key3')).toBe(true);  // New entry
    });
  });

  describe('Statistics and Monitoring', () => {
    let cache: LRUCacheManager<string, TestData>;

    beforeEach(() => {
      cache = new LRUCacheManager<string, TestData>(3, 10000);
    });

    it('should track cache hits and misses', () => {
      let stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);

      // Miss
      cache.get('nonexistent');
      stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0);

      // Set and hit
      cache.set('key1', createTestData(1));
      cache.get('key1');
      stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);

      // Another hit
      cache.get('key1');
      stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 3);
    });

    it('should track evictions', () => {
      // Fill beyond capacity to trigger evictions
      for (let i = 1; i <= 5; i++) {
        cache.set(`key${i}`, createTestData(i));
      }

      const stats = cache.getStats();
      expect(stats.evictions).toBe(2); // 5 items - 3 capacity = 2 evictions
      expect(stats.size).toBe(3);
      expect(stats.maxSize).toBe(3);
    });

    it('should track expirations', async () => {
      cache = new LRUCacheManager<string, TestData>(5, 50); // 50ms TTL

      // Add entries that will expire
      cache.set('key1', createTestData(1));
      cache.set('key2', createTestData(2));

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 75));

      // Trigger cleanup by accessing expired entries
      cache.get('key1');
      cache.get('key2');

      const stats = cache.getStats();
      expect(stats.expirations).toBe(2);
    });

    it('should provide accurate statistics after clear', () => {
      // Generate some activity
      cache.set('key1', createTestData(1));
      cache.set('key2', createTestData(2));
      cache.get('key1');
      cache.get('nonexistent');

      let stats = cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);

      cache.clear();
      stats = cache.getStats();
      
      // Clear should reset size but keep historical stats
      expect(stats.size).toBe(0);
      expect(stats.hits).toBeGreaterThan(0); // Historical data preserved
      expect(stats.misses).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    let cache: CacheManager<string, TestData>;

    beforeEach(() => {
      cache = new LRUCacheManager<string, TestData>(3, 1000);
    });

    it('should handle null and undefined values', () => {
      // TypeScript should prevent this, but test runtime behavior
      cache.set('null', null as any);
      cache.set('undefined', undefined as any);

      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBeUndefined();
      expect(cache.has('null')).toBe(true);
      expect(cache.has('undefined')).toBe(true);
    });

    it('should handle empty strings as keys', () => {
      const testData = createTestData(1);
      cache.set('', testData);
      
      expect(cache.get('')).toEqual(testData);
      expect(cache.has('')).toBe(true);
    });

    it('should handle rapid operations', () => {
      const testData = createTestData(1);
      
      // Rapid set/get operations
      for (let i = 0; i < 100; i++) {
        cache.set('rapid', { ...testData, id: i });
        expect(cache.get('rapid')?.id).toBe(i);
      }

      expect(cache.size).toBe(1);
    });

    it('should handle size=1 cache correctly', () => {
      cache = new LRUCacheManager<string, TestData>(1, 1000);
      
      cache.set('key1', createTestData(1));
      expect(cache.size).toBe(1);
      
      cache.set('key2', createTestData(2));
      expect(cache.size).toBe(1);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });

    it('should handle concurrent access patterns', () => {
      // Simulate concurrent access
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise(resolve => {
            cache.set(`concurrent${i}`, createTestData(i));
            cache.get(`concurrent${i}`);
            resolve();
          })
        );
      }

      return Promise.all(promises).then(() => {
        // Should not crash and should have some entries
        expect(cache.size).toBeGreaterThan(0);
        expect(cache.size).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Performance Characteristics', () => {
    it('should perform operations in reasonable time', () => {
      const cache = new LRUCacheManager<string, TestData>(1000, 10000);
      const testData = createTestData(1);

      // Measure set performance
      const setStart = Date.now();
      for (let i = 0; i < 1000; i++) {
        cache.set(`perf${i}`, testData);
      }
      const setTime = Date.now() - setStart;
      expect(setTime).toBeLessThan(100); // Should be very fast

      // Measure get performance
      const getStart = Date.now();
      for (let i = 0; i < 1000; i++) {
        cache.get(`perf${i}`);
      }
      const getTime = Date.now() - getStart;
      expect(getTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle large datasets efficiently', () => {
      const cache = new LRUCacheManager<string, TestData>(10000, 60000);
      
      // Add large dataset
      for (let i = 0; i < 5000; i++) {
        cache.set(`large${i}`, createTestData(i));
      }

      expect(cache.size).toBe(5000);

      // Random access should still be fast
      const accessStart = Date.now();
      for (let i = 0; i < 1000; i++) {
        const key = `large${Math.floor(Math.random() * 5000)}`;
        cache.get(key);
      }
      const accessTime = Date.now() - accessStart;
      expect(accessTime).toBeLessThan(100);
    });
  });
});