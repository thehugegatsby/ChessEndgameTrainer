import { LRUCache } from '../LRUCache';

describe('LRUCache', () => {
  describe('Basic Operations', () => {
    test('should create cache with specified capacity', () => {
      const cache = new LRUCache<number>(3);
      expect(cache.size()).toBe(0);
    });

    test('should set and get values', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.size()).toBe(3);
    });

    test('should return undefined for missing keys', () => {
      const cache = new LRUCache<number>(3);
      
      expect(cache.get('missing')).toBeUndefined();
    });

    test('should update existing values', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('a', 2);
      
      expect(cache.get('a')).toBe(2);
      expect(cache.size()).toBe(1);
    });

    test('should check if key exists', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    test('should delete values', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      
      expect(cache.delete('a')).toBe(true);
      expect(cache.has('a')).toBe(false);
      expect(cache.size()).toBe(1);
      
      expect(cache.delete('missing')).toBe(false);
    });

    test('should clear all values', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(false);
    });
  });

  describe('LRU Behavior', () => {
    test('should evict least recently used item when capacity exceeded', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Should evict 'a'
      
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
      expect(cache.size()).toBe(3);
    });

    test('should update item to most recently used on get', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      // Access 'a' to make it most recently used
      cache.get('a');
      
      // Add new item, should evict 'b' (now least recently used)
      cache.set('d', 4);
      
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    test('should update item to most recently used on set', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      // Update 'a' to make it most recently used
      cache.set('a', 10);
      
      // Add new item, should evict 'b'
      cache.set('d', 4);
      
      expect(cache.get('a')).toBe(10);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle cache with capacity 1', () => {
      const cache = new LRUCache<string, number>(1);
      
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
      
      cache.set('b', 2);
      expect(cache.has('a')).toBe(false);
      expect(cache.get('b')).toBe(2);
    });

    test('should handle cache with capacity 0', () => {
      const cache = new LRUCache<string, number>(0);
      
      cache.set('a', 1);
      expect(cache.has('a')).toBe(false);
      expect(cache.size()).toBe(0);
    });

    test('should handle negative capacity as 0', () => {
      const cache = new LRUCache<string, number>(-5);
      
      cache.set('a', 1);
      expect(cache.has('a')).toBe(false);
      expect(cache.size()).toBe(0);
    });

    test('should handle null and undefined values', () => {
      const cache = new LRUCache<string, any>(3);
      
      cache.set('null', null);
      cache.set('undefined', undefined);
      
      expect(cache.get('null')).toBe(null);
      expect(cache.get('undefined')).toBe(undefined);
      expect(cache.has('null')).toBe(true);
      expect(cache.has('undefined')).toBe(true);
    });

    test('should handle complex objects as values', () => {
      const cache = new LRUCache<string, object>(3);
      
      const obj1 = { name: 'test', value: 42 };
      const obj2 = { data: [1, 2, 3] };
      
      cache.set('obj1', obj1);
      cache.set('obj2', obj2);
      
      expect(cache.get('obj1')).toBe(obj1); // Same reference
      expect(cache.get('obj2')).toEqual(obj2);
    });
  });

  describe('Performance', () => {
    test('should handle large number of operations', () => {
      const cache = new LRUCache<number, number>(100);
      
      // Add 1000 items
      for (let i = 0; i < 1000; i++) {
        cache.set(i, i * 2);
      }
      
      // Cache should only contain last 100 items
      expect(cache.size()).toBe(100);
      expect(cache.has(899)).toBe(false); // Evicted
      expect(cache.has(900)).toBe(true); // Still in cache
      expect(cache.get(999)).toBe(1998);
    });

    test('should maintain order with many accesses', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      // Access in specific order
      cache.get('b');
      cache.get('a');
      cache.get('c');
      cache.get('b');
      
      // Add new item, should evict 'a' (least recently accessed)
      cache.set('d', 4);
      
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });
  });

  describe('Iterator Support', () => {
    test('should iterate over entries', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      const entries: Array<[string, number]> = [];
      cache.forEach((value, key) => {
        entries.push([key, value]);
      });
      
      expect(entries).toHaveLength(3);
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
      expect(entries).toContainEqual(['c', 3]);
    });

    test('should get all keys', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      const keys = cache.keys();
      
      expect(keys).toHaveLength(3);
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
    });

    test('should get all values', () => {
      const cache = new LRUCache<number>(3);
      
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      const values = cache.values();
      
      expect(values).toHaveLength(3);
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(values).toContain(3);
    });
  });

  describe('Type Safety', () => {
    test('should work with different key types', () => {
      const numberCache = new LRUCache<number, string>(3);
      numberCache.set(1, 'one');
      numberCache.set(2, 'two');
      expect(numberCache.get(1)).toBe('one');
      
      const objectCache = new LRUCache<{id: number}, string>(3);
      const key1 = {id: 1};
      const key2 = {id: 2};
      objectCache.set(key1, 'first');
      objectCache.set(key2, 'second');
      expect(objectCache.get(key1)).toBe('first');
    });
  });
});