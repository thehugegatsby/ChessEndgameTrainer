/**
 * Cache Management Library
 *
 * @remarks
 * This module provides generic caching capabilities with support for
 * different eviction strategies and TTL-based expiration.
 *
 * Current implementations:
 * - LRUCacheManager: Least Recently Used eviction policy
 *
 * @example
 * ```typescript
 * import { CacheManager, LRUCacheManager } from '@shared/lib/cache';
 *
 * // Create LRU cache with 200 entries max, 5 minute default TTL
 * const cache: CacheManager<string, TablebaseEntry> =
 *   new LRUCacheManager(200, 300000);
 * ```
 */

// Export types and interfaces
export type { CacheManager, CacheOptions, CacheEntry, CacheStats } from './types';

// Export implementations
export { LRUCacheManager } from './LRUCacheManager';
