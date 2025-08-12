/**
 * Tests for FenCache service
 * Tests LRU cache functionality for FEN positions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { IFenCache } from '../types/interfaces';
import FenCache from '../services/FenCache';

describe('FenCache', () => {
  let cache: IFenCache;
  
  beforeEach(() => {
    cache = new FenCache(3); // Small cache for testing
  });
  
  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });
    
    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });
    
    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
    
    it('should update existing values', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'updated');
      expect(cache.get('key1')).toBe('updated');
      expect(cache.size()).toBe(1);
    });
    
    it('should clear the cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.size()).toBe(2);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });
  
  describe('LRU Eviction', () => {
    it('should evict least recently used item when full', () => {
      // Fill cache
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Add one more - should evict key1
      cache.set('key4', 'value4');
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
    
    it('should update LRU order on get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 - moves it to front
      cache.get('key1');
      
      // Add key4 - should evict key2 (now LRU)
      cache.set('key4', 'value4');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
    
    it('should update LRU order on set of existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Update key1 - moves it to front
      cache.set('key1', 'updated');
      
      // Add key4 - should evict key2 (now LRU)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('updated');
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
    
    it('should maintain correct order with complex access patterns', () => {
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3'); // Order: c, b, a
      
      cache.get('a');     // Order: a, c, b
      cache.get('b');     // Order: b, a, c
      cache.set('d', '4'); // Order: d, b, a (c evicted)
      
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(false);
      expect(cache.has('d')).toBe(true);
    });
  });
  
  describe('Size Management', () => {
    it('should track cache size correctly', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.set('key3', 'value3');
      expect(cache.size()).toBe(3);
      
      // Should maintain max size
      cache.set('key4', 'value4');
      expect(cache.size()).toBe(3);
    });
    
    it('should handle setMaxSize correctly', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Reduce size - should evict LRU items
      cache.setMaxSize(2);
      
      expect(cache.size()).toBe(2);
      expect(cache.has('key1')).toBe(false); // LRU evicted
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });
    
    it('should handle increasing max size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.setMaxSize(5);
      expect(cache.getMaxSize()).toBe(5);
      
      // Should be able to add more items
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');
      
      expect(cache.size()).toBe(5);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key5')).toBe(true);
    });
    
    it('should throw error for invalid max size', () => {
      expect(() => cache.setMaxSize(0)).toThrow('Cache size must be positive');
      expect(() => cache.setMaxSize(-1)).toThrow('Cache size must be positive');
      expect(() => new FenCache(0)).toThrow('Cache size must be positive');
    });
  });
  
  describe('Keys and Stats', () => {
    it('should return keys in MRU order', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      let keys = cache.keys();
      expect(keys).toEqual(['key3', 'key2', 'key1']);
      
      // Access key1 to make it MRU
      cache.get('key1');
      
      keys = cache.keys();
      expect(keys).toEqual(['key1', 'key3', 'key2']);
    });
    
    it('should return empty array for empty cache', () => {
      expect(cache.keys()).toEqual([]);
    });
    
    it('should return cache statistics', () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(3);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats2 = cache.getStats();
      expect(stats2.size).toBe(2);
      expect(stats2.maxSize).toBe(3);
    });
  });
  
  describe('FEN-specific Use Cases', () => {
    it('should cache FEN positions efficiently', () => {
      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const midFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const endFen = '8/8/8/4k3/8/8/3K4/8 w - - 0 1';
      
      cache.set(startFen, 'starting position');
      cache.set(midFen, 'e4 opening');
      cache.set(endFen, 'king endgame');
      
      expect(cache.get(startFen)).toBe('starting position');
      expect(cache.get(midFen)).toBe('e4 opening');
      expect(cache.get(endFen)).toBe('king endgame');
    });
    
    it('should handle repeated position lookups', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      cache.set(fen, 'evaluation: 0.0');
      
      // Multiple lookups should work
      for (let i = 0; i < 10; i++) {
        expect(cache.get(fen)).toBe('evaluation: 0.0');
      }
      
      expect(cache.size()).toBe(1);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle cache size of 1', () => {
      const singleCache = new FenCache(1);
      
      singleCache.set('key1', 'value1');
      expect(singleCache.get('key1')).toBe('value1');
      
      singleCache.set('key2', 'value2');
      expect(singleCache.has('key1')).toBe(false);
      expect(singleCache.get('key2')).toBe('value2');
    });
    
    it('should handle large cache', () => {
      const largeCache = new FenCache(1000);
      
      // Add many items
      for (let i = 0; i < 1000; i++) {
        largeCache.set(`key${i}`, `value${i}`);
      }
      
      expect(largeCache.size()).toBe(1000);
      
      // Add one more - should evict first
      largeCache.set('key1000', 'value1000');
      expect(largeCache.size()).toBe(1000);
      expect(largeCache.has('key0')).toBe(false);
      expect(largeCache.has('key1000')).toBe(true);
    });
    
    it('should handle empty string keys and values', () => {
      cache.set('', 'empty key');
      expect(cache.get('')).toBe('empty key');
      
      cache.set('key', '');
      expect(cache.get('key')).toBe('');
    });
    
    it('should maintain consistency after clear', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      
      // Should be able to add items again
      cache.set('key3', 'value3');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.size()).toBe(1);
    });
    
    it('should handle rapid set/get cycles', () => {
      for (let i = 0; i < 100; i++) {
        const key = `key${i % 5}`; // Cycle through 5 keys
        cache.set(key, `value${i}`);
        
        if (i % 2 === 0) {
          cache.get(key);
        }
      }
      
      // Cache should still be consistent
      expect(cache.size()).toBeLessThanOrEqual(3);
      const keys = cache.keys();
      expect(keys.length).toBe(cache.size());
    });
  });
  
  describe('Default Configuration', () => {
    it('should use default max size when not specified', () => {
      const defaultCache = new FenCache();
      expect(defaultCache.getMaxSize()).toBe(100);
      
      // Should be able to add 100 items
      for (let i = 0; i < 100; i++) {
        defaultCache.set(`key${i}`, `value${i}`);
      }
      expect(defaultCache.size()).toBe(100);
      
      // 101st item should trigger eviction
      defaultCache.set('key100', 'value100');
      expect(defaultCache.size()).toBe(100);
    });
  });
});