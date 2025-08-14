/**
 * Cache-specific constants
 * @module constants/cache
 * 
 * @description
 * Constants for cache management including sizes, TTLs, and memory limits
 */

/**
 * Cache size constants (number of items)
 */
export const CACHE_SIZES = {
  TINY: 10,
  SMALL: 50,
  MEDIUM: 100,
  LARGE: 200,
  EXTRA_LARGE: 500,
  HUGE: 1000,
  MASSIVE: 5000,
} as const;

/**
 * Cache TTL (Time To Live) constants in milliseconds
 */
export const CACHE_TTL = {
  INSTANT: 1000,           // 1 second
  SHORT: 10 * 1000,        // 10 seconds
  MEDIUM: 30 * 1000,       // 30 seconds
  STANDARD: 60 * 1000,     // 1 minute
  LONG: 5 * 60 * 1000,     // 5 minutes
  EXTENDED: 10 * 60 * 1000, // 10 minutes
  HOUR: 60 * 60 * 1000,    // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Memory size constants in bytes
 */
export const MEMORY_SIZES = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  
  // Specific memory limits
  SMALL_OBJECT: 1024,           // 1KB
  MEDIUM_OBJECT: 10 * 1024,     // 10KB
  LARGE_OBJECT: 100 * 1024,     // 100KB
  MAX_CACHE_ITEM: 1024 * 1024,  // 1MB
  MAX_STORAGE: 100 * 1024 * 1024, // 100MB
} as const;

/**
 * Cache cleanup and maintenance intervals
 */
export const CACHE_INTERVALS = {
  CLEANUP: 30 * 1000,      // 30 seconds
  PERSIST: 60 * 1000,      // 1 minute
  EXPIRE_CHECK: 10 * 1000, // 10 seconds
  MEMORY_CHECK: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Cache hit rate thresholds for monitoring
 */
export const CACHE_THRESHOLDS = {
  MIN_HIT_RATE: 0.3,  // 30% minimum hit rate
  GOOD_HIT_RATE: 0.5, // 50% good hit rate
  EXCELLENT_HIT_RATE: 0.8, // 80% excellent hit rate
  EVICTION_THRESHOLD: 0.9, // 90% capacity triggers eviction
} as const;