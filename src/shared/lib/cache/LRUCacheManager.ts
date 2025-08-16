/**
 * LRU Cache Manager Implementation
 *
 * @remarks
 * Implements Least Recently Used (LRU) eviction policy with TTL support.
 * Uses Map for O(1) operations and leverages insertion order for LRU tracking.
 *
 * Features:
 * - O(1) get/set operations
 * - Automatic TTL expiration
 * - LRU eviction when capacity is exceeded
 * - Metrics tracking for monitoring
 * - Configurable size limits and default TTL
 *
 * Algorithm:
 * - Map maintains insertion order (ES2015+)
 * - Most recently used items are moved to end
 * - When eviction needed, oldest entries are removed first
 * - Expired entries are cleaned up lazily during access
 *
 * @example
 * ```typescript
 * // Create cache: 200 max entries, 5-minute default TTL
 * const cache = new LRUCacheManager<string, TablebaseEntry>(200, LRU_CACHE_CONFIG.DUE_CARDS_MAX_AGE_MS);
 *
 * // Store with default TTL
 * cache.set('position1', tablebaseData);
 *
 * // Store with custom TTL (10 seconds)
 * cache.set('temp', tempData, 10000);
 *
 * // Retrieve (automatically handles expiration)
 * const data = cache.get('position1');
 * ```
 */

import type { CacheManager, CacheEntry, CacheStats, CacheOptions } from './types';
import { LRU_CACHE_CONFIG } from '../../../constants/cache.constants';

export class LRUCacheManager<K, V> implements CacheManager<K, V> {
  private readonly cache = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  // Statistics for monitoring
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0,
  };

  /**
   * Create a new LRU cache manager
   *
   * @param maxSize - Maximum number of entries to store
   * @param defaultTtlMs - Default TTL in milliseconds for entries without explicit TTL
   *
   * @throws {Error} If maxSize <= 0 or defaultTtlMs <= 0
   */
  constructor(
    maxSize: number = LRU_CACHE_CONFIG.DUE_CARDS_SIZE,
    defaultTtlMs: number = LRU_CACHE_CONFIG.DUE_CARDS_MAX_AGE_MS
  ) {
    if (maxSize <= 0) {
      throw new Error('maxSize must be positive');
    }
    if (defaultTtlMs <= 0) {
      throw new Error('defaultTtlMs must be positive');
    }

    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Retrieve a value from cache
   *
   * @param key - The cache key to look up
   * @returns The cached value if present and not expired, undefined otherwise
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    if (entry.expiry <= now) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.expirations++;
      return undefined;
    }

    // Move to end (most recently used) by re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Store a value in cache with optional TTL
   *
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttlMs - Time-to-live in milliseconds (uses default if not specified)
   */
  set(key: K, value: V, ttlMs?: number): void {
    const now = Date.now();
    const actualTtl = ttlMs ?? this.defaultTtlMs;

    // Create cache entry with expiration
    const entry: CacheEntry<V> = {
      value,
      expiry: now + actualTtl,
      lastAccess: now,
    };

    // If key already exists, remove it first (will be re-added at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add new entry (goes to end of insertion order)
    this.cache.set(key, entry);

    // Evict oldest entries if we exceed capacity
    this._evictIfNeeded();
  }

  /**
   * Check if a key exists in cache (and is not expired)
   *
   * @param key - The cache key to check
   * @returns True if key exists and is not expired, false otherwise
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiry <= Date.now()) {
      this.cache.delete(key);
      this.stats.expirations++;
      return false;
    }

    return true;
  }

  /**
   * Remove a specific key from cache
   *
   * @param key - The cache key to remove
   * @returns True if the key existed and was removed, false otherwise
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    // Reset stats except for cumulative counters
    // (keep hits/misses/evictions/expirations for historical tracking)
  }

  /**
   * Get current number of entries in cache
   *
   * @returns Number of cached entries (excluding expired ones)
   */
  get size(): number {
    // Clean up expired entries to get accurate count
    this._cleanupExpired();
    return this.cache.size;
  }

  /**
   * Get cache statistics for monitoring
   *
   * @returns Current cache statistics
   */
  getStats(): CacheStats {
    this._cleanupExpired();

    const totalRequests = this.stats.hits + this.stats.misses;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
    };
  }

  /**
   * Evict oldest entries if cache exceeds capacity
   * @private
   */
  private _evictIfNeeded(): void {
    while (this.cache.size > this.maxSize) {
      // Get oldest key (first in iteration order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      } else {
        break; // Safety check
      }
    }
  }

  /**
   * Clean up expired entries
   * @private
   */
  private _cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    // Collect expired keys
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        keysToDelete.push(key);
      }
    }

    // Remove expired keys
    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.stats.expirations++;
    }
  }

  /**
   * Create cache manager from options
   * @param options - Configuration options
   * @returns Configured LRU cache manager
   */
  static fromOptions<K, V>(options: CacheOptions): LRUCacheManager<K, V> {
    return new LRUCacheManager<K, V>(
      options.maxSize ?? LRU_CACHE_CONFIG.DUE_CARDS_SIZE,
      options.defaultTtlMs ?? LRU_CACHE_CONFIG.DUE_CARDS_MAX_AGE_MS
    );
  }
}
