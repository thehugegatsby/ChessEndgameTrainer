/**
 * Hybrid cache implementation combining memory and persistent storage
 * 
 * Provides L1 (memory) and L2 (IndexedDB) caching with fallback strategy
 * Optimized for chess evaluations with intelligent promotion/demotion
 * 
 * @module HybridCache
 */

import type { ICacheProvider } from '../chess/evaluation/providers';
import { LRUCache } from './LRUCache';
import { IndexedDBCache } from './IndexedDBCache';
import { Logger } from '@shared/services/logging/Logger';

const logger = new Logger();

export interface HybridCacheOptions {
  /** Memory cache size */
  memorySize: number;
  /** IndexedDB cache size */
  persistentSize: number;
  /** Default TTL for memory cache */
  memoryTtl: number;
  /** Default TTL for persistent cache */
  persistentTtl: number;
  /** Enable IndexedDB fallback */
  enablePersistent: boolean;
}

export class HybridCache<T> implements ICacheProvider<T> {
  private readonly memoryCache: LRUCache<T>;
  private readonly persistentCache: IndexedDBCache<T> | null;
  private readonly options: HybridCacheOptions;

  constructor(options: Partial<HybridCacheOptions> = {}) {
    this.options = {
      memorySize: options.memorySize || 200,
      persistentSize: options.persistentSize || 1000,
      memoryTtl: options.memoryTtl || 5 * 60 * 1000, // 5 minutes
      persistentTtl: options.persistentTtl || 30 * 60 * 1000, // 30 minutes
      enablePersistent: options.enablePersistent ?? true,
      ...options
    };

    // Initialize memory cache (L1)
    this.memoryCache = new LRUCache<T>(this.options.memorySize);

    // Initialize persistent cache (L2) if enabled
    this.persistentCache = this.options.enablePersistent 
      ? new IndexedDBCache<T>({
          dbName: 'chess-evaluations',
          storeName: 'hybrid-cache',
          defaultTtl: this.options.persistentTtl,
          maxSize: this.options.persistentSize
        })
      : null;
  }

  /**
   * Get cached value with L1 -> L2 fallback
   */
  async get(key: string): Promise<T | null> {
    try {
      // Try L1 cache first (memory)
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult !== null) {
        logger.debug('[HybridCache] L1 cache hit', { key: key.slice(0, 20) + '...' });
        return memoryResult;
      }

      // Try L2 cache (IndexedDB) if enabled
      if (this.persistentCache) {
        const persistentResult = await this.persistentCache.get(key);
        if (persistentResult !== null) {
          logger.debug('[HybridCache] L2 cache hit, promoting to L1', { key: key.slice(0, 20) + '...' });
          
          // Promote to L1 cache
          this.memoryCache.set(key, persistentResult);
          return persistentResult;
        }
      }

      logger.debug('[HybridCache] Cache miss', { key: key.slice(0, 20) + '...' });
      return null;
    } catch (error) {
      logger.error('[HybridCache] Error getting value', error);
      return null;
    }
  }

  /**
   * Set cached value in both L1 and L2
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    try {
      // Set in L1 cache (memory)
      this.memoryCache.set(key, value);

      // Set in L2 cache (IndexedDB) if enabled
      if (this.persistentCache) {
        await this.persistentCache.set(key, value, ttl || this.options.persistentTtl);
      }

      logger.debug('[HybridCache] Value cached', { 
        key: key.slice(0, 20) + '...',
        hasL1: true,
        hasL2: !!this.persistentCache
      });
    } catch (error) {
      logger.error('[HybridCache] Error setting value', error);
      throw error;
    }
  }

  /**
   * Delete cached value from both L1 and L2
   */
  async delete(key: string): Promise<void> {
    try {
      // Delete from L1 cache
      this.memoryCache.delete(key);

      // Delete from L2 cache if enabled
      if (this.persistentCache) {
        await this.persistentCache.delete(key);
      }

      logger.debug('[HybridCache] Value deleted', { key: key.slice(0, 20) + '...' });
    } catch (error) {
      logger.error('[HybridCache] Error deleting value', error);
    }
  }

  /**
   * Clear both L1 and L2 caches
   */
  async clear(): Promise<void> {
    try {
      // Clear L1 cache
      this.memoryCache.clear();

      // Clear L2 cache if enabled
      if (this.persistentCache) {
        await this.persistentCache.clear();
      }

      logger.info('[HybridCache] All caches cleared');
    } catch (error) {
      logger.error('[HybridCache] Error clearing caches', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    l1: { size: number; maxSize: number; hitRate: number };
    l2: { size: number; oldestEntry: number | null } | null;
  }> {
    try {
      const l1Stats = this.memoryCache.getStats();
      const l2Stats = this.persistentCache 
        ? await this.persistentCache.getStats()
        : null;

      return {
        l1: {
          size: l1Stats.size,
          maxSize: l1Stats.maxSize,
          hitRate: l1Stats.hitRate
        },
        l2: l2Stats
      };
    } catch (error) {
      logger.error('[HybridCache] Error getting stats', error);
      return {
        l1: { size: 0, maxSize: this.options.memorySize, hitRate: 0 },
        l2: null
      };
    }
  }

  /**
   * Preload frequently used positions into memory cache
   */
  async warmup(positions: string[]): Promise<void> {
    if (!this.persistentCache) {
      return;
    }

    try {
      logger.info('[HybridCache] Starting cache warmup', { positions: positions.length });
      
      let promoted = 0;
      for (const position of positions) {
        const value = await this.persistentCache.get(position);
        if (value !== null) {
          this.memoryCache.set(position, value);
          promoted++;
        }
      }

      logger.info('[HybridCache] Cache warmup completed', { 
        promoted,
        total: positions.length
      });
    } catch (error) {
      logger.error('[HybridCache] Error during warmup', error);
    }
  }

  /**
   * Close persistent cache connections
   */
  close(): void {
    if (this.persistentCache) {
      this.persistentCache.close();
    }
  }
}