/**
 * @file Minimal LRU Cache implementation for position caching
 * @module lib/cache/LRUCache
 * 
 * @description
 * Lightweight Least Recently Used (LRU) cache implementation designed
 * specifically for chess position caching without external dependencies.
 * Provides efficient memory management with automatic eviction of least
 * recently used entries when capacity is exceeded.
 * 
 * @remarks
 * Key features:
 * - Generic type support for flexible data storage
 * - Automatic LRU eviction policy
 * - Cache statistics tracking (hits, misses, hit rate)
 * - Memory usage estimation
 * - Performance metrics for optimization
 * - Clean, minimal API without external dependencies
 * 
 * The cache uses JavaScript's Map for O(1) operations and maintains
 * insertion order for efficient LRU tracking.
 */

/**
 * Cache statistics interface for performance monitoring
 * 
 * @interface CacheStats
 * 
 * @property {number} hits - Number of successful cache lookups
 * @property {number} misses - Number of failed cache lookups
 * @property {number} size - Current number of items in cache
 * @property {number} maxSize - Maximum cache capacity
 * @property {number} hitRate - Cache hit rate as a decimal (0.0 to 1.0)
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * LRU Cache implementation with generic type support
 * 
 * @template T The type of values stored in the cache
 * 
 * @class LRUCache
 * @description
 * Implements a Least Recently Used cache with automatic eviction.
 * Uses a Map for O(1) operations and maintains insertion order for
 * efficient LRU tracking. Provides comprehensive statistics tracking.
 * 
 * @example
 * ```typescript
 * // Create cache for chess positions
 * const positionCache = new LRUCache<PositionEvaluation>(200);
 * 
 * // Store and retrieve values
 * positionCache.set('fen1', evaluation);
 * const cached = positionCache.get('fen1');
 * 
 * // Monitor performance
 * const stats = positionCache.getStats();
 * console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
 * ```
 */
export class LRUCache<T> {
  private cache = new Map<string, T>();
  private readonly maxSize: number;
  private hits = 0;
  private misses = 0;

  /**
   * Create a new LRU cache
   * 
   * @param {number} [maxSize=100] - Maximum number of items to store
   */
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   * 
   * @param {string} key - The cache key to look up
   * @returns {T | undefined} The cached value or undefined if not found
   * 
   * @description
   * Retrieves a value from the cache and marks it as recently used.
   * Updates hit/miss statistics and moves the accessed item to the
   * end of the cache (most recently used position).
   */
  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Set a value in the cache
   * 
   * @param {string} key - The cache key
   * @param {T} value - The value to store
   * 
   * @description
   * Stores a value in the cache. If the cache is at capacity,
   * evicts the least recently used item. If the key already exists,
   * updates the value and marks it as recently used.
   */
  set(key: string, value: T): void {
    // Remove if exists (to reorder)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * Check if a key exists in the cache
   * 
   * @param {string} key - The cache key to check
   * @returns {boolean} True if the key exists in the cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from the cache
   * 
   * @param {string} key - The cache key to delete
   * @returns {boolean} True if the key was deleted, false if it didn't exist
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache and reset statistics
   * 
   * @description
   * Removes all cached items and resets hit/miss counters to zero.
   * Useful for testing or when cache needs to be completely refreshed.
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache performance statistics
   * 
   * @returns {CacheStats} Object containing cache statistics
   * 
   * @description
   * Returns comprehensive statistics including hit rate, current size,
   * and total hits/misses for performance monitoring and optimization.
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Estimate memory usage of the cache
   * 
   * @returns {number} Estimated memory usage in bytes
   * 
   * @description
   * Provides a rough estimate of memory usage by assuming
   * approximately 1KB per cache entry. Useful for monitoring
   * memory consumption in production environments.
   */
  getMemoryUsage(): number {
    // Rough estimate
    return this.cache.size * 1000; // Assume 1KB per entry
  }

  /**
   * Get all cache keys
   * 
   * @returns {string[]} Array of all cache keys
   * 
   * @description
   * Returns an array of all keys currently in the cache.
   * Keys are returned in insertion order (least to most recent).
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}
