/**
 * Generic Cache Manager Interface
 *
 * @remarks
 * This interface provides a clean abstraction for caching operations,
 * enabling different caching strategies (LRU, LFU, TTL-based) while
 * maintaining a consistent API for consumers.
 *
 * Key Features:
 * - Generic key-value storage with TypeScript type safety
 * - TTL (Time-To-Live) support for automatic expiration
 * - Size management and cleanup capabilities
 * - Metrics-friendly design for monitoring cache performance
 *
 * @example
 * ```typescript
 * const cache: CacheManager<string, UserData> = new LRUCacheManager(100, 300000);
 *
 * // Set with default TTL
 * cache.set('user123', userData);
 *
 * // Set with custom TTL (10 seconds)
 * cache.set('temp456', tempData, 10000);
 *
 * // Get with automatic expiry check
 * const user = cache.get('user123'); // UserData | undefined
 * ```
 */

/**
 * Core cache management interface
 *
 * @template K - Key type (usually string)
 * @template V - Value type
 */
export interface CacheManager<K, V> {
  /**
   * Retrieve a value from cache
   *
   * @param key - The cache key to look up
   * @returns The cached value if present and not expired, undefined otherwise
   *
   * @remarks
   * This method automatically handles TTL expiration - expired entries
   * are treated as cache misses and may be cleaned up during access.
   */
  get(key: K): V | undefined;

  /**
   * Store a value in cache with optional TTL
   *
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttlMs - Time-to-live in milliseconds (optional, uses default if not specified)
   *
   * @remarks
   * If the cache is at capacity, the implementation's eviction policy
   * (e.g., LRU) will be applied to make space for the new entry.
   */
  set(key: K, value: V, ttlMs?: number): void;

  /**
   * Check if a key exists in cache (and is not expired)
   *
   * @param key - The cache key to check
   * @returns True if key exists and is not expired, false otherwise
   */
  has(key: K): boolean;

  /**
   * Remove a specific key from cache
   *
   * @param key - The cache key to remove
   * @returns True if the key existed and was removed, false otherwise
   */
  delete(key: K): boolean;

  /**
   * Clear all entries from cache
   *
   * @remarks
   * This operation removes all cached data and resets internal state.
   * Use with caution in production environments.
   */
  clear(): void;

  /**
   * Get current number of entries in cache
   *
   * @returns Number of cached entries (excluding expired ones)
   *
   * @remarks
   * This count represents active entries only. Expired entries that
   * haven't been cleaned up yet may not be included in this count.
   */
  readonly size: number;
}

/**
 * Configuration options for cache implementations
 */
export interface CacheOptions {
  /** Maximum number of entries to store */
  maxSize?: number;

  /** Default TTL in milliseconds for entries without explicit TTL */
  defaultTtlMs?: number;

  /** How often to run cleanup of expired entries (milliseconds) */
  cleanupIntervalMs?: number;
}

/**
 * Internal cache entry structure with TTL support
 *
 * @template V - Value type
 * @private
 */
export interface CacheEntry<V> {
  /** The cached value */
  value: V;

  /** Timestamp when this entry expires (Date.now() + ttlMs) */
  expiry: number;

  /** Last access timestamp for LRU tracking */
  lastAccess?: number;
}

/**
 * Cache statistics for monitoring and debugging
 */
export interface CacheStats {
  /** Total cache hits since creation */
  hits: number;

  /** Total cache misses since creation */
  misses: number;

  /** Current number of entries */
  size: number;

  /** Maximum size allowed */
  maxSize: number;

  /** Cache hit rate (0.0 to 1.0) */
  hitRate: number;

  /** Number of entries evicted due to size limits */
  evictions: number;

  /** Number of entries expired due to TTL */
  expirations: number;
}
