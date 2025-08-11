/**
 * @file Comprehensive unit tests for LRUCache implementation
 * @module tests/unit/lib/cache/LRUCache
 * 
 * @description
 * Test suite following DeepSeek planning and Gemini review feedback.
 * Target: 95%+ coverage for pure logic component.
 * Focus: Basic operations, LRU eviction policy, statistics, edge cases.
 */

import { LRUCache, CacheStats } from '@shared/lib/cache/LRUCache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3); // Small size for easier testing
  });

  describe('Basic Operations', () => {
    describe('constructor', () => {
      it('should create cache with default size 100', () => {
        const defaultCache = new LRUCache<string>();
        const stats = defaultCache.getStats();
        expect(stats.maxSize).toBe(100);
        expect(stats.size).toBe(0);
      });

      it('should create cache with custom size', () => {
        const customCache = new LRUCache<string>(50);
        const stats = customCache.getStats();
        expect(stats.maxSize).toBe(50);
      });

      it('should handle zero size cache', () => {
        const zeroCache = new LRUCache<string>(0);
        zeroCache.set('key', 'value');
        expect(zeroCache.get('key')).toBeUndefined();
        expect(zeroCache.getStats().size).toBe(0);
      });
    });

    describe('set and get', () => {
      it('should store and retrieve values', () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
      });

      it('should return undefined for non-existent keys', () => {
        expect(cache.get('nonexistent')).toBeUndefined();
      });

      it('should update existing values', () => {
        cache.set('key1', 'value1');
        cache.set('key1', 'value2');
        expect(cache.get('key1')).toBe('value2');
        expect(cache.getStats().size).toBe(1);
      });

      it('should handle different data types', () => {
        const numberCache = new LRUCache<number>(3);
        const objectCache = new LRUCache<{name: string}>(3);

        numberCache.set('num', 42);
        objectCache.set('obj', {name: 'test'});

        expect(numberCache.get('num')).toBe(42);
        expect(objectCache.get('obj')).toEqual({name: 'test'});
      });
    });

    describe('has', () => {
      it('should return true for existing keys', () => {
        cache.set('key1', 'value1');
        expect(cache.has('key1')).toBe(true);
      });

      it('should return false for non-existent keys', () => {
        expect(cache.has('nonexistent')).toBe(false);
      });

      it('should not affect statistics when checking existence', () => {
        cache.set('key1', 'value1');
        const statsBefore = cache.getStats();
        
        cache.has('key1');
        cache.has('nonexistent');
        
        const statsAfter = cache.getStats();
        expect(statsAfter.hits).toBe(statsBefore.hits);
        expect(statsAfter.misses).toBe(statsBefore.misses);
      });
    });

    describe('delete', () => {
      it('should delete existing keys', () => {
        cache.set('key1', 'value1');
        expect(cache.delete('key1')).toBe(true);
        expect(cache.has('key1')).toBe(false);
        expect(cache.getStats().size).toBe(0);
      });

      it('should return false when deleting non-existent keys', () => {
        expect(cache.delete('nonexistent')).toBe(false);
      });

      it('should maintain order after deletion', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key3', 'value3');
        
        cache.delete('key2');
        const keys = cache.keys();
        
        expect(keys).toEqual(['key1', 'key3']);
      });
    });

    describe('clear', () => {
      it('should remove all items', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        
        cache.clear();
        
        expect(cache.getStats().size).toBe(0);
        expect(cache.has('key1')).toBe(false);
        expect(cache.has('key2')).toBe(false);
      });

      it('should reset statistics', () => {
        cache.set('key1', 'value1');
        cache.get('key1'); // Hit
        cache.get('key2'); // Miss
        
        cache.clear();
        
        const stats = cache.getStats();
        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(0);
        expect(stats.hitRate).toBe(0);
      });
    });

    describe('keys', () => {
      it('should return empty array for empty cache', () => {
        expect(cache.keys()).toEqual([]);
      });

      it('should return keys in insertion order', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key3', 'value3');
        
        expect(cache.keys()).toEqual(['key1', 'key2', 'key3']);
      });

      it('should reflect key order after access (LRU reordering)', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key3', 'value3');
        
        // Access key1 - should move to end
        cache.get('key1');
        
        expect(cache.keys()).toEqual(['key2', 'key3', 'key1']);
      });
    });
  });

  describe('LRU Eviction Policy', () => {
    it('should evict least recently used item when at capacity', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Cache is full (capacity 3), adding key4 should evict key1
      cache.set('key4', 'value4');
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
      expect(cache.getStats().size).toBe(3);
    });

    it('should update LRU order on access', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 - makes it most recently used
      cache.get('key1');
      
      // Adding key4 should now evict key2 (oldest unaccessed)
      cache.set('key4', 'value4');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should handle complex access patterns', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Complex access pattern
      cache.get('key2'); // key2 becomes most recent
      cache.get('key1'); // key1 becomes most recent
      // Order now: key3 (oldest), key2, key1 (newest)
      
      cache.set('key4', 'value4'); // Should evict key3
      
      expect(cache.has('key3')).toBe(false);
      expect(cache.keys()).toEqual(['key2', 'key1', 'key4']);
    });

    it('should handle updating existing keys without eviction', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Update existing key - should not cause eviction
      cache.set('key2', 'updated_value2');
      
      expect(cache.getStats().size).toBe(3);
      expect(cache.get('key2')).toBe('updated_value2');
      expect(cache.keys()).toEqual(['key1', 'key3', 'key2']); // key2 moved to end
    });
  });

  describe('Statistics Tracking', () => {
    it('should track hits correctly', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1');
      cache.get('key1');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
    });

    it('should track misses correctly', () => {
      cache.get('nonexistent1');
      cache.get('nonexistent2');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('nonexistent'); // Miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(2/3);
    });

    it('should handle zero total accesses', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should track size correctly', () => {
      expect(cache.getStats().size).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.getStats().size).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.getStats().size).toBe(2);
      
      cache.delete('key1');
      expect(cache.getStats().size).toBe(1);
    });

    it('should not increment statistics for has() operations', () => {
      cache.set('key1', 'value1');
      const statsBefore = cache.getStats();
      
      cache.has('key1');
      cache.has('nonexistent');
      
      const statsAfter = cache.getStats();
      expect(statsAfter.hits).toBe(statsBefore.hits);
      expect(statsAfter.misses).toBe(statsBefore.misses);
    });
  });

  describe('Memory Management', () => {
    it('should estimate memory usage', () => {
      expect(cache.getMemoryUsage()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.getMemoryUsage()).toBe(1000); // 1KB per entry
      
      cache.set('key2', 'value2');
      expect(cache.getMemoryUsage()).toBe(2000);
    });

    it('should handle large cache sizes for memory estimation', () => {
      const largeCache = new LRUCache<string>(1000);
      
      // Fill cache to capacity
      for (let i = 0; i < 1000; i++) {
        largeCache.set(`key${i}`, `value${i}`);
      }
      
      expect(largeCache.getMemoryUsage()).toBe(1000000); // 1MB
      expect(largeCache.getStats().size).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single-item cache', () => {
      const singleCache = new LRUCache<string>(1);
      
      singleCache.set('key1', 'value1');
      expect(singleCache.get('key1')).toBe('value1');
      
      singleCache.set('key2', 'value2');
      expect(singleCache.get('key1')).toBeUndefined();
      expect(singleCache.get('key2')).toBe('value2');
    });

    it('should handle empty string keys', () => {
      cache.set('', 'empty_key_value');
      expect(cache.get('')).toBe('empty_key_value');
      expect(cache.has('')).toBe(true);
    });

    it('should handle null and undefined values', () => {
      const nullCache = new LRUCache<string | null | undefined>(3);
      
      nullCache.set('null_key', null);
      nullCache.set('undefined_key', undefined);
      
      expect(nullCache.get('null_key')).toBe(null);
      expect(nullCache.get('undefined_key')).toBe(undefined);
      expect(nullCache.has('null_key')).toBe(true);
      expect(nullCache.has('undefined_key')).toBe(true);
    });

    it('should handle rapid successive operations', () => {
      // Simulate rapid cache operations
      for (let i = 0; i < 10; i++) {
        cache.set(`rapid_key_${i}`, `rapid_value_${i}`);
        cache.get(`rapid_key_${i}`);
      }
      
      // Cache should maintain capacity
      expect(cache.getStats().size).toBe(3);
      expect(cache.getStats().hits).toBe(10);
    });

    it('should maintain consistency during mixed operations', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.delete('key1')).toBe(true);
      expect(cache.delete('key1')).toBe(false); // Second delete should fail
      
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      
      expect(cache.getStats().size).toBe(3); // key2, key3, key4
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large number of operations efficiently', () => {
      const performanceCache = new LRUCache<string>(100);
      const startTime = Date.now();
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        performanceCache.set(`perf_key_${i}`, `perf_value_${i}`);
        if (i % 2 === 0) {
          performanceCache.get(`perf_key_${i}`);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Operations should complete quickly (< 100ms for 1000 operations)
      expect(duration).toBeLessThan(100);
      expect(performanceCache.getStats().size).toBe(100); // Maintained capacity
    });

    it.skip('should maintain O(1) characteristics for basic operations', () => {
      const benchmarkCache = new LRUCache<string>(1000);
      
      // Fill cache
      for (let i = 0; i < 1000; i++) {
        benchmarkCache.set(`bench_key_${i}`, `bench_value_${i}`);
      }
      
      // Time single operations
      const operations = ['get', 'set', 'has', 'delete'] as const;
      
      operations.forEach(operation => {
        const start = performance.now();
        
        switch (operation) {
          case 'get':
            benchmarkCache.get('bench_key_500');
            break;
          case 'set':
            benchmarkCache.set('bench_new_key', 'bench_new_value');
            break;
          case 'has':
            benchmarkCache.has('bench_key_500');
            break;
          case 'delete':
            benchmarkCache.delete('bench_key_500');
            break;
        }
        
        const end = performance.now();
        const operationTime = end - start;
        
        // Each operation should be very fast (< 1ms)
        expect(operationTime).toBeLessThan(1);
      });
    });
  });

  describe('Type Safety & Generics', () => {
    it('should work with complex object types', () => {
      interface TestData {
        id: number;
        name: string;
        metadata: { [key: string]: any };
      }
      
      const objectCache = new LRUCache<TestData>(3);
      const testObj: TestData = {
        id: 1,
        name: 'Test Object',
        metadata: { created: new Date(), active: true }
      };
      
      objectCache.set('test_obj', testObj);
      const retrieved = objectCache.get('test_obj');
      
      expect(retrieved).toEqual(testObj);
      expect(retrieved?.id).toBe(1);
      expect(retrieved?.metadata.active).toBe(true);
    });

    it('should maintain type safety across operations', () => {
      const numberCache = new LRUCache<number>(3);
      
      numberCache.set('num1', 42);
      numberCache.set('num2', 3.14);
      
      const result1 = numberCache.get('num1');
      const result2 = numberCache.get('num2');
      
      expect(typeof result1).toBe('number');
      expect(typeof result2).toBe('number');
      expect(result1).toBe(42);
      expect(result2).toBe(3.14);
    });
  });
});