/**
 * @fileoverview Comprehensive LRU Cache Unit Tests
 * @description Tests for LRU cache algorithms, memory management, and edge cases
 */

import { LRUCache } from '../../../shared/lib/cache/LRUCache';
import { getLogger } from '../../../shared/services/logging';

// Mock logger with standardized factory pattern
jest.mock('../../../shared/services/logging', 
  require('../../shared/logger-utils').getMockLoggerDefinition()
);

describe('LRUCache', () => {
  describe('LRUCache_constructor_defaultCapacity_createsInstance', () => {
    it('should create cache with default capacity of 1000', () => {
      const cache = new LRUCache<string>();
      expect(cache.size()).toBe(0);
      expect(cache.getStats().maxSize).toBe(1000);
    });

    it('should create cache with custom capacity', () => {
      const cache = new LRUCache<string>(500);
      expect(cache.getStats().maxSize).toBe(500);
    });

    it('should handle zero capacity', () => {
      const cache = new LRUCache<string>(0);
      expect(cache.getStats().maxSize).toBe(0);
    });

    it('should handle negative capacity by setting to zero', () => {
      const cache = new LRUCache<string>(-10);
      expect(cache.getStats().maxSize).toBe(0);
    });
  });

  describe('LRUCache_set_normalOperation_storesValue', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(3);
    });

    it('should store new value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.size()).toBe(1);
    });

    it('should update existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    it('should not store value in zero capacity cache', () => {
      const zeroCache = new LRUCache<string>(0);
      zeroCache.set('key1', 'value1');
      expect(zeroCache.get('key1')).toBeUndefined();
      expect(zeroCache.size()).toBe(0);
    });

    it('should handle error during set operation gracefully', () => {
      const logger = getLogger();
      const loggerSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      
      // Force an error by making the Map throw
      const mockMap = {
        get: jest.fn(),
        set: jest.fn(() => { throw new Error('Test error'); }),
        delete: jest.fn(),
        clear: jest.fn(),
        size: 0
      };
      
      // @ts-ignore - accessing private property for test
      cache['cache'] = mockMap as any;
      
      expect(() => cache.set('key1', 'value1')).not.toThrow();
      expect(loggerSpy).toHaveBeenCalledWith('[LRUCache] Error setting cache value:', expect.any(Error));
      
      loggerSpy.mockRestore();
    });
  });

  describe('LRUCache_get_existingValue_returnsValue', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(3);
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
    });

    it('should return existing value', () => {
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existing key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should update access order on get', () => {
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // This should evict key1
      
      // Access key2 to move it to front
      cache.get('key2');
      
      // Add another item, should evict key3 (least recently used)
      cache.set('key5', 'value5');
      
      expect(cache.get('key2')).toBe('value2'); // Should still exist
      expect(cache.get('key3')).toBeUndefined(); // Should be evicted
    });
  });

  describe('LRUCache_eviction_capacityExceeded_removesLRU', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(2);
    });

    it('should evict least recently used item when capacity exceeded', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Should evict key1
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.size()).toBe(2);
    });

    it('should maintain correct order after multiple operations', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.get('a'); // Move 'a' to front
      cache.set('c', '3'); // Should evict 'b'
      
      expect(cache.get('a')).toBe('1');
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe('3');
    });

    it('should handle eviction with single item cache', () => {
      const singleCache = new LRUCache<string>(1);
      singleCache.set('key1', 'value1');
      singleCache.set('key2', 'value2');
      
      expect(singleCache.get('key1')).toBeUndefined();
      expect(singleCache.get('key2')).toBe('value2');
      expect(singleCache.size()).toBe(1);
    });
  });

  describe('LRUCache_has_existenceCheck_returnsBoolean', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(3);
    });

    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existing key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should handle age-based expiration', () => {
      // Mock Date.now to control timing
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = jest.fn(() => currentTime);
      
      try {
        cache.set('key1', 'value1');
        
        // Advance time by 10 seconds
        currentTime += 10000;
        
        // Should return false for expired item (maxAge = 5000ms)
        expect(cache.has('key1', 5000)).toBe(false);
        
        // Item should be deleted after expiration check
        expect(cache.get('key1')).toBeUndefined();
      } finally {
        Date.now = originalNow;
      }
    });

    it('should return true for non-expired item', () => {
      // Mock Date.now to control timing
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = jest.fn(() => currentTime);
      
      try {
        cache.set('key1', 'value1');
        
        // Advance time by 1 second
        currentTime += 1000;
        
        expect(cache.has('key1', 5000)).toBe(true);
        expect(cache.get('key1')).toBeDefined();
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('LRUCache_delete_existingKey_removesItem', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(3);
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
    });

    it('should delete existing key and return true', () => {
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.size()).toBe(1);
    });

    it('should return false for non-existing key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
      expect(cache.size()).toBe(2);
    });

    it('should maintain correct structure after deletion', () => {
      cache.set('key3', 'value3');
      cache.delete('key2'); // Delete middle item
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.size()).toBe(2);
    });
  });

  describe('LRUCache_clear_allItems_emptiesCache', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(3);
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1'); // Generate some hits
    });

    it('should clear all items and reset statistics', () => {
      expect(cache.size()).toBe(2);
      expect(cache.getStats().hits).toBeGreaterThan(0);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
      
      // Verify item was cleared (this will increment misses)
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('LRUCache_statistics_operations_tracksMetrics', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(3);
    });

    it('should track hits and misses correctly', () => {
      cache.set('key1', 'value1');
      
      // Generate hits
      cache.get('key1');
      cache.get('key1');
      
      // Generate misses
      cache.get('nonexistent1');
      cache.get('nonexistent2');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should calculate hit rate correctly', () => {
      // No operations yet
      expect(cache.getStats().hitRate).toBe(0);
      
      cache.set('key1', 'value1');
      cache.get('key1'); // 1 hit
      cache.get('nonexistent'); // 1 miss
      
      expect(cache.getStats().hitRate).toBe(0.5);
    });

    it('should track cache size accurately', () => {
      const stats1 = cache.getStats();
      expect(stats1.size).toBe(0);
      expect(stats1.maxSize).toBe(3);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats2 = cache.getStats();
      expect(stats2.size).toBe(2);
      expect(stats2.maxSize).toBe(3);
    });
  });

  describe('LRUCache_memoryUsage_estimation_calculatesBytes', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(10);
    });

    it('should estimate memory usage based on cache size', () => {
      expect(cache.getMemoryUsage()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.getMemoryUsage()).toBe(350); // 1 item * 350 bytes
      
      cache.set('key2', 'value2');
      expect(cache.getMemoryUsage()).toBe(700); // 2 items * 350 bytes
    });

    it('should update memory usage after eviction', () => {
      const smallCache = new LRUCache<string>(2);
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      expect(smallCache.getMemoryUsage()).toBe(700);
      
      smallCache.set('key3', 'value3'); // Evicts key1
      expect(smallCache.getMemoryUsage()).toBe(700); // Still 2 items
    });
  });

  describe('LRUCache_iteration_methods_iterateItems', () => {
    let cache: LRUCache<string>;

    beforeEach(() => {
      cache = new LRUCache<string>(5);
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
    });

    it('should iterate with forEach in access order', () => {
      const visited: Array<{key: string, value: string}> = [];
      
      cache.forEach((value, key) => {
        visited.push({ key, value });
      });
      
      expect(visited).toHaveLength(3);
      expect(visited[0]).toEqual({ key: 'key3', value: 'value3' }); // Most recent
      expect(visited[2]).toEqual({ key: 'key1', value: 'value1' }); // Least recent
    });

    it('should return keys in access order', () => {
      const keys = cache.keys();
      expect(keys).toEqual(['key3', 'key2', 'key1']);
    });

    it('should return values in access order', () => {
      const values = cache.values();
      expect(values).toEqual(['value3', 'value2', 'value1']);
    });

    it('should reflect order changes after access', () => {
      cache.get('key1'); // Move key1 to front
      
      const keys = cache.keys();
      expect(keys).toEqual(['key1', 'key3', 'key2']);
    });
  });

  describe('LRUCache_edgeCases_boundaryConditions_handlesCorrectly', () => {
    it('should handle concurrent access patterns', () => {
      const cache = new LRUCache<number>(100);
      
      // Simulate concurrent access pattern
      for (let i = 0; i < 150; i++) {
        cache.set(`key${i}`, i);
        if (i > 50) {
          cache.get(`key${i - 50}`); // Access older items
        }
      }
      
      expect(cache.size()).toBe(100);
      expect(cache.getStats().size).toBe(100);
    });

    it('should handle rapid set/get operations', () => {
      const cache = new LRUCache<string>(10);
      
      // Rapid operations
      for (let i = 0; i < 1000; i++) {
        const key = `key${i % 20}`;
        cache.set(key, `value${i}`);
        cache.get(key);
      }
      
      expect(cache.size()).toBeLessThanOrEqual(10);
      expect(cache.getStats().hits).toBeGreaterThan(0);
    });

    it('should maintain data integrity with complex operations', () => {
      const cache = new LRUCache<{id: number, data: string}>(5);
      
      // Complex object storage
      cache.set('obj1', { id: 1, data: 'test1' });
      cache.set('obj2', { id: 2, data: 'test2' });
      
      const retrieved = cache.get('obj1');
      expect(retrieved).toEqual({ id: 1, data: 'test1' });
      
      // Verify object reference integrity
      if (retrieved) {
        retrieved.data = 'modified';
        const retrievedAgain = cache.get('obj1');
        expect(retrievedAgain?.data).toBe('modified');
      }
    });

    it('should handle empty string and special characters as keys', () => {
      const cache = new LRUCache<string>(5);
      
      cache.set('', 'empty');
      cache.set(' ', 'space');
      cache.set('\n', 'newline');
      cache.set('key with spaces', 'spaces');
      cache.set('key/with/slashes', 'slashes');
      
      expect(cache.get('')).toBe('empty');
      expect(cache.get(' ')).toBe('space');
      expect(cache.get('\n')).toBe('newline');
      expect(cache.get('key with spaces')).toBe('spaces');
      expect(cache.get('key/with/slashes')).toBe('slashes');
    });

    it('should handle null and undefined values correctly', () => {
      const cache = new LRUCache<any>(5); // Increase capacity to hold all test items
      
      cache.set('null', null);
      cache.set('undefined', undefined);
      cache.set('zero', 0);
      cache.set('false', false);
      cache.set('empty', '');
      
      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBeUndefined();
      expect(cache.get('zero')).toBe(0);
      expect(cache.get('false')).toBe(false);
      expect(cache.get('empty')).toBe('');
      
      expect(cache.has('null')).toBe(true);
      expect(cache.has('undefined')).toBe(true);
      
      // Note: When getting an item that doesn't exist, cache returns undefined
      // But when getting an item that exists with undefined value, it still returns undefined
      // The cache.has() method can distinguish between "not found" and "stored as undefined"
    });
  });

  describe('LRUCache_performance_largeDatasets_maintainsEfficiency', () => {
    it('should handle large capacity efficiently', () => {
      const cache = new LRUCache<string>(10000);
      
      const start = performance.now();
      
      // Fill cache to capacity
      for (let i = 0; i < 10000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Test access time for middle elements
      for (let i = 0; i < 1000; i++) {
        cache.get(`key${Math.floor(Math.random() * 10000)}`);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in reasonable time
      expect(cache.size()).toBe(10000);
    });

    it('should maintain O(1) performance characteristics', () => {
      const cache = new LRUCache<string>(1000);
      
      // Fill cache
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Time individual operations
      const startSet = performance.now();
      cache.set('newkey', 'newvalue');
      const setTime = performance.now() - startSet;
      
      const startGet = performance.now();
      cache.get('key500');
      const getTime = performance.now() - startGet;
      
      // Operations should be very fast (sub-millisecond)
      expect(setTime).toBeLessThan(10);
      expect(getTime).toBeLessThan(10);
    });
  });
});