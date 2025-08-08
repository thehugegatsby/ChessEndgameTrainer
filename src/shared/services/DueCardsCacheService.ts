/**
 * @file DueCardsCacheService
 * @description High-performance localStorage cache for Due Cards with TTL and LRU
 * 
 * This service provides intelligent caching for due cards calculation with:
 * - 24h TTL with midnight invalidation (UTC-based)
 * - LRU-based memory management for large collections
 * - Graceful fallback on cache corruption or localStorage issues
 * - Performance optimization for collections >500 cards
 * 
 * @example
 * ```typescript
 * const cacheService = DueCardsCacheService.getInstance();
 * 
 * // Get cached due cards (returns null if cache miss/expired)
 * const cachedResult = cacheService.getDueCards(userId);
 * 
 * // Cache new calculation result
 * cacheService.setDueCards(userId, { dueCards, timestamp, stats });
 * 
 * // Clear cache on user logout
 * cacheService.clearUserCache(userId);
 * ```
 */

import type { DueCard, DueCardsStats } from '@shared/types/progress';
import { getLogger } from '@shared/services/logging/Logger';

const logger = getLogger().setContext('DueCardsCacheService');

/**
 * Cache entry interface for due cards calculation result
 */
export interface DueCacheEntry {
  /** Array of due cards at time of calculation */
  dueCards: DueCard[];
  
  /** Timestamp when this calculation was performed */
  calculatedAt: number;
  
  /** Statistics at time of calculation */
  stats: DueCardsStats;
  
  /** Input hash for invalidation detection */
  inputHash: string;
  
  /** Entry creation timestamp for TTL */
  createdAt: number;
  
  /** Last access timestamp for LRU */
  lastAccessedAt: number;
}

/**
 * Cache metadata for memory management
 */
interface CacheMetadata {
  /** Total number of cached entries */
  totalEntries: number;
  
  /** Combined size estimate in bytes */
  estimatedSize: number;
  
  /** Last cleanup timestamp */
  lastCleanup: number;
  
  /** Cache version for migration support */
  version: number;
}

/**
 * Cache configuration constants
 */
const CACHE_CONFIG = {
  /** Cache key prefix in localStorage */
  KEY_PREFIX: 'endgame_due_cards_',
  
  /** Metadata key in localStorage */
  METADATA_KEY: 'endgame_cache_metadata',
  
  /** Current cache version */
  VERSION: 1,
  
  /** TTL in milliseconds (24 hours) */
  TTL_MS: 24 * 60 * 60 * 1000,
  
  /** Maximum entries before LRU cleanup */
  MAX_ENTRIES: 50,
  
  /** Maximum estimated size in bytes (5MB) */
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  
  /** Cleanup interval in milliseconds (1 hour) */
  CLEANUP_INTERVAL_MS: 60 * 60 * 1000,
  
  /** Large collection threshold for performance warnings */
  LARGE_COLLECTION_THRESHOLD: 500,
} as const;

/**
 * High-performance Due Cards cache service with localStorage persistence
 * 
 * Features:
 * - Singleton pattern for consistent cache state
 * - UTC-based midnight invalidation 
 * - LRU eviction for memory management
 * - Input hash validation for cache invalidation
 * - Performance monitoring and warnings
 * - Graceful error handling with fallback
 */
export class DueCardsCacheService {
  private static instance: DueCardsCacheService | null = null;
  private cleanupTimeoutId: NodeJS.Timeout | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.scheduleCleanup();
    logger.debug('DueCardsCacheService initialized');
  }

  /**
   * Get singleton instance
   * 
   * @returns DueCardsCacheService instance
   */
  public static getInstance(): DueCardsCacheService {
    if (!DueCardsCacheService.instance) {
      DueCardsCacheService.instance = new DueCardsCacheService();
    }
    return DueCardsCacheService.instance;
  }

  /**
   * Get cached due cards for a user
   * 
   * @param userId - User identifier
   * @param inputHash - Hash of input data for validation
   * @returns Cached result or null if cache miss/expired
   */
  public getDueCards(userId: string, inputHash: string): DueCacheEntry | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(userId);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        logger.debug('Cache miss for user', { userId });
        return null;
      }

      const entry: DueCacheEntry = JSON.parse(cached);
      
      // Validate cache entry structure
      if (!this.isValidCacheEntry(entry)) {
        logger.warn('Invalid cache entry structure, removing', { userId });
        this.clearUserCache(userId);
        return null;
      }

      // Check TTL expiration
      if (this.isExpired(entry)) {
        logger.debug('Cache expired for user', { 
          userId, 
          age: Date.now() - entry.createdAt 
        });
        this.clearUserCache(userId);
        return null;
      }

      // Check midnight invalidation (UTC)
      if (this.isAfterMidnight(entry.createdAt)) {
        logger.debug('Cache invalid due to midnight rollover', { userId });
        this.clearUserCache(userId);
        return null;
      }

      // Validate input hash for cache invalidation
      if (entry.inputHash !== inputHash) {
        logger.debug('Cache invalid due to input change', { userId });
        this.clearUserCache(userId);
        return null;
      }

      // Update last accessed timestamp for LRU
      const updatedEntry = {
        ...entry,
        lastAccessedAt: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(updatedEntry));

      logger.debug('Cache hit for user', { 
        userId,
        dueCount: entry.dueCards.length,
        age: Date.now() - entry.createdAt
      });

      return updatedEntry;

    } catch (error) {
      logger.error('Error reading from cache', { 
        userId, 
        error: (error as Error).message 
      });
      this.clearUserCache(userId);
      return null;
    }
  }

  /**
   * Cache due cards calculation result
   * 
   * @param userId - User identifier
   * @param dueCards - Calculated due cards
   * @param stats - Calculation statistics
   * @param inputHash - Hash of input data
   */
  public setDueCards(
    userId: string, 
    dueCards: DueCard[], 
    stats: DueCardsStats,
    inputHash: string
  ): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      // Performance warning for large collections
      if (dueCards.length > CACHE_CONFIG.LARGE_COLLECTION_THRESHOLD) {
        logger.warn('Caching large collection', { 
          userId, 
          count: dueCards.length 
        });
      }

      const now = Date.now();
      const entry: DueCacheEntry = {
        dueCards,
        calculatedAt: now,
        stats,
        inputHash,
        createdAt: now,
        lastAccessedAt: now
      };

      const cacheKey = this.getCacheKey(userId);
      const serialized = JSON.stringify(entry);
      
      // Check if we need to make space
      this.ensureSpaceAvailable(serialized.length);
      
      localStorage.setItem(cacheKey, serialized);
      this.updateMetadata(1, serialized.length);

      logger.debug('Cached due cards for user', { 
        userId,
        dueCount: dueCards.length,
        size: serialized.length
      });

    } catch (error) {
      logger.error('Error writing to cache', { 
        userId, 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Clear cache for specific user
   * 
   * @param userId - User identifier
   */
  public clearUserCache(userId: string): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      const cacheKey = this.getCacheKey(userId);
      const existing = localStorage.getItem(cacheKey);
      
      if (existing) {
        localStorage.removeItem(cacheKey);
        this.updateMetadata(-1, -existing.length);
        logger.debug('Cleared cache for user', { userId });
      }
    } catch (error) {
      logger.error('Error clearing user cache', { 
        userId, 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Clear all cache entries
   */
  public clearAllCache(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      
      // Find all cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      // Remove all cache entries
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Reset metadata
      localStorage.removeItem(CACHE_CONFIG.METADATA_KEY);
      
      logger.info('Cleared all cache entries', { 
        removedKeys: keysToRemove.length 
      });
    } catch (error) {
      logger.error('Error clearing all cache', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  public getCacheStats() {
    if (!this.isLocalStorageAvailable()) {
      return {
        available: false,
        totalEntries: 0,
        estimatedSize: 0,
        lastCleanup: null
      };
    }

    const metadata = this.getMetadata();
    return {
      available: true,
      totalEntries: metadata.totalEntries,
      estimatedSize: metadata.estimatedSize,
      lastCleanup: metadata.lastCleanup ? new Date(metadata.lastCleanup) : null,
      maxEntries: CACHE_CONFIG.MAX_ENTRIES,
      maxSize: CACHE_CONFIG.MAX_SIZE_BYTES
    };
  }

  /**
   * Force cleanup of expired and least recently used entries
   */
  public forceCleanup(): void {
    this.performCleanup();
  }

  /**
   * Destroy service and cleanup resources
   */
  public destroy(): void {
    if (this.cleanupTimeoutId) {
      clearTimeout(this.cleanupTimeoutId);
      this.cleanupTimeoutId = null;
    }
    DueCardsCacheService.instance = null;
    logger.debug('DueCardsCacheService destroyed');
  }

  // Private helper methods

  /**
   * Generate cache key for user
   */
  private getCacheKey(userId: string): string {
    return `${CACHE_CONFIG.KEY_PREFIX}${userId}`;
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate cache entry structure
   */
  private isValidCacheEntry(entry: any): entry is DueCacheEntry {
    return (
      typeof entry === 'object' &&
      entry !== null &&
      Array.isArray(entry.dueCards) &&
      typeof entry.calculatedAt === 'number' &&
      typeof entry.stats === 'object' &&
      typeof entry.inputHash === 'string' &&
      typeof entry.createdAt === 'number' &&
      typeof entry.lastAccessedAt === 'number'
    );
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: DueCacheEntry): boolean {
    return Date.now() - entry.createdAt > CACHE_CONFIG.TTL_MS;
  }

  /**
   * Check if entry was created before last midnight (UTC)
   */
  private isAfterMidnight(createdAt: number): boolean {
    const now = Date.now();
    const nowDate = new Date(now);
    const todayMidnightUTC = new Date(
      Date.UTC(
        nowDate.getUTCFullYear(),
        nowDate.getUTCMonth(),
        nowDate.getUTCDate(),
        0, 0, 0, 0
      )
    ).getTime();
    
    return createdAt < todayMidnightUTC;
  }

  /**
   * Get cache metadata
   */
  private getMetadata(): CacheMetadata {
    try {
      const stored = localStorage.getItem(CACHE_CONFIG.METADATA_KEY);
      if (stored) {
        const metadata = JSON.parse(stored) as CacheMetadata;
        if (metadata.version === CACHE_CONFIG.VERSION) {
          return metadata;
        }
      }
    } catch {
      // Fall through to default
    }

    return {
      totalEntries: 0,
      estimatedSize: 0,
      lastCleanup: 0,
      version: CACHE_CONFIG.VERSION
    };
  }

  /**
   * Update cache metadata
   */
  private updateMetadata(entriesDelta: number, sizeDelta: number): void {
    try {
      const metadata = this.getMetadata();
      metadata.totalEntries = Math.max(0, metadata.totalEntries + entriesDelta);
      metadata.estimatedSize = Math.max(0, metadata.estimatedSize + sizeDelta);
      
      localStorage.setItem(
        CACHE_CONFIG.METADATA_KEY, 
        JSON.stringify(metadata)
      );
    } catch (error) {
      logger.warn('Failed to update cache metadata', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Ensure space is available for new entry
   */
  private ensureSpaceAvailable(newEntrySize: number): void {
    const metadata = this.getMetadata();
    
    // Check if cleanup is needed
    const needsCleanup = (
      metadata.totalEntries >= CACHE_CONFIG.MAX_ENTRIES ||
      metadata.estimatedSize + newEntrySize > CACHE_CONFIG.MAX_SIZE_BYTES
    );

    if (needsCleanup) {
      logger.debug('Cache space cleanup needed', {
        totalEntries: metadata.totalEntries,
        estimatedSize: metadata.estimatedSize,
        newEntrySize
      });
      
      this.performCleanup();
    }
  }

  /**
   * Perform cache cleanup (expired entries and LRU eviction)
   */
  private performCleanup(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      const entries: Array<{ key: string; entry: DueCacheEntry }> = [];
      const now = Date.now();
      
      // Collect all cache entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const entry = JSON.parse(stored) as DueCacheEntry;
              if (this.isValidCacheEntry(entry)) {
                entries.push({ key, entry });
              } else {
                // Remove invalid entry
                localStorage.removeItem(key);
              }
            }
          } catch {
            // Remove corrupted entry
            localStorage.removeItem(key);
          }
        }
      }

      let removedCount = 0;
      let removedSize = 0;

      // Remove expired entries
      entries.forEach(({ key, entry }) => {
        if (this.isExpired(entry) || this.isAfterMidnight(entry.createdAt)) {
          const serialized = JSON.stringify(entry);
          localStorage.removeItem(key);
          removedCount++;
          removedSize += serialized.length;
        }
      });

      // Remove LRU entries if still over limit
      const remaining = entries.filter(({ key }) => {
        return localStorage.getItem(key) !== null;
      });

      if (remaining.length > CACHE_CONFIG.MAX_ENTRIES) {
        // Sort by last accessed (LRU first)
        remaining.sort((a, b) => a.entry.lastAccessedAt - b.entry.lastAccessedAt);
        
        const toRemove = remaining.length - CACHE_CONFIG.MAX_ENTRIES;
        for (let i = 0; i < toRemove; i++) {
          const { key, entry } = remaining[i];
          const serialized = JSON.stringify(entry);
          localStorage.removeItem(key);
          removedCount++;
          removedSize += serialized.length;
        }
      }

      // Update metadata
      if (removedCount > 0) {
        this.updateMetadata(-removedCount, -removedSize);
        
        const metadata = this.getMetadata();
        metadata.lastCleanup = now;
        localStorage.setItem(
          CACHE_CONFIG.METADATA_KEY, 
          JSON.stringify(metadata)
        );

        logger.info('Cache cleanup completed', {
          removedEntries: removedCount,
          removedSize,
          remainingEntries: metadata.totalEntries
        });
      }

    } catch (error) {
      logger.error('Cache cleanup failed', { 
        error: (error as Error).message 
      });
    }
  }

  /**
   * Schedule periodic cleanup
   */
  private scheduleCleanup(): void {
    if (this.cleanupTimeoutId) {
      clearTimeout(this.cleanupTimeoutId);
    }

    this.cleanupTimeoutId = setTimeout(() => {
      this.performCleanup();
      this.scheduleCleanup(); // Reschedule
    }, CACHE_CONFIG.CLEANUP_INTERVAL_MS);
  }
}

/**
 * Create simple hash for input validation
 * 
 * @param input - Input to hash
 * @returns Simple hash string
 */
export function createInputHash(input: any): string {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Export singleton instance for convenience
export const dueCardsCacheService = DueCardsCacheService.getInstance();