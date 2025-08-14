/**
 * Cache and Buffer Configuration Constants
 * Performance-critical values for caching systems
 */

/**
 * LRU Cache configuration
 * From LRUCache.ts and LRUCacheManager.ts
 */
export const LRU_CACHE_CONFIG = {
  DEFAULT_SIZE: 1000,           // Default cache size
  DUE_CARDS_SIZE: 100,          // Due cards manager cache size  
  DUE_CARDS_MAX_AGE_MS: 300000, // 5 minutes max age
  ESTIMATED_ENTRY_SIZE_BYTES: 1000, // Estimated bytes per cache entry
} as const;

/**
 * HTTP Buffer configuration  
 * From http.constants.ts
 */
export const HTTP_BUFFER_CONFIG = {
  SIZE_MULTIPLIER: 10,          // 10 * 1024 * 1024 = 10MB
  BYTES_PER_KB: 1024,
  KB_PER_MB: 1024,
} as const;

/**
 * Computed values for HTTP buffer sizes
 * Making the calculation explicit instead of magic numbers
 */
export const HTTP_BUFFER_SIZES = {
  MAX_BODY_SIZE_BYTES: HTTP_BUFFER_CONFIG.SIZE_MULTIPLIER * 
                       HTTP_BUFFER_CONFIG.BYTES_PER_KB * 
                       HTTP_BUFFER_CONFIG.KB_PER_MB, // 10MB
} as const;