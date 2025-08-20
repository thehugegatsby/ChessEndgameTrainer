/**
 * Cache-specific constants
 * @module constants/cache
 *
 * @description
 * Constants for cache management including sizes, TTLs, and memory limits
 */

import { TIME_UNITS } from './time.constants';
import {
  TIME_MULTIPLIERS,
  SIZE_MULTIPLIERS,
  PERCENTAGE_MULTIPLIERS,
  BINARY_MULTIPLIERS,
} from './multipliers';

/**
 * Cache size constants (number of items)
 */
export const CACHE_SIZES = {
  TINY: TIME_MULTIPLIERS.QUICK,
  SMALL: SIZE_MULTIPLIERS.MEDIUM_FACTOR,
  MEDIUM: SIZE_MULTIPLIERS.LARGE_FACTOR,
  LARGE: SIZE_MULTIPLIERS.EXTRA_LARGE_FACTOR,
  EXTRA_LARGE: SIZE_MULTIPLIERS.HUGE_FACTOR,
  HUGE: SIZE_MULTIPLIERS.MASSIVE_FACTOR,
  MASSIVE: SIZE_MULTIPLIERS.EXTREME_FACTOR,
} as const;

/**
 * Cache TTL (Time To Live) constants in milliseconds
 */
export const CACHE_TTL = {
  INSTANT: TIME_UNITS.SECOND, // 1 second
  SHORT: TIME_MULTIPLIERS.QUICK * TIME_UNITS.SECOND, // 10 seconds
  MEDIUM: TIME_MULTIPLIERS.STANDARD * TIME_UNITS.SECOND, // 30 seconds
  STANDARD: TIME_UNITS.MINUTE, // 1 minute
  LONG: TIME_MULTIPLIERS.SHORT_RETENTION * TIME_UNITS.MINUTE, // 5 minutes
  EXTENDED: TIME_MULTIPLIERS.MEDIUM_RETENTION * TIME_UNITS.MINUTE, // 10 minutes
  HOUR: TIME_UNITS.HOUR, // 1 hour
  DAY: TIME_UNITS.DAY, // 24 hours
} as const;

/**
 * Memory size constants in bytes
 */
export const MEMORY_SIZES = {
  KB: BINARY_MULTIPLIERS.KILOBYTE,
  MB: BINARY_MULTIPLIERS.KILOBYTE * BINARY_MULTIPLIERS.KILOBYTE,
  GB: BINARY_MULTIPLIERS.KILOBYTE * BINARY_MULTIPLIERS.KILOBYTE * BINARY_MULTIPLIERS.KILOBYTE,

  // Specific memory limits
  SMALL_OBJECT: BINARY_MULTIPLIERS.KILOBYTE, // 1KB
  MEDIUM_OBJECT: SIZE_MULTIPLIERS.SMALL_FACTOR * BINARY_MULTIPLIERS.KILOBYTE, // 10KB
  LARGE_OBJECT: SIZE_MULTIPLIERS.LARGE_FACTOR * BINARY_MULTIPLIERS.KILOBYTE, // 100KB
  MAX_CACHE_ITEM: BINARY_MULTIPLIERS.KILOBYTE * BINARY_MULTIPLIERS.KILOBYTE, // 1MB
  MAX_STORAGE:
    SIZE_MULTIPLIERS.LARGE_FACTOR * BINARY_MULTIPLIERS.KILOBYTE * BINARY_MULTIPLIERS.KILOBYTE, // 100MB
} as const;

/**
 * Cache cleanup and maintenance intervals
 */
export const CACHE_INTERVALS = {
  CLEANUP: TIME_MULTIPLIERS.STANDARD * TIME_UNITS.SECOND, // 30 seconds
  PERSIST: TIME_UNITS.MINUTE, // 1 minute
  EXPIRE_CHECK: TIME_MULTIPLIERS.QUICK * TIME_UNITS.SECOND, // 10 seconds
  MEMORY_CHECK: TIME_MULTIPLIERS.SHORT_RETENTION * TIME_UNITS.MINUTE, // 5 minutes
} as const;

/**
 * Cache hit rate thresholds for monitoring
 */
export const CACHE_THRESHOLDS = {
  MIN_HIT_RATE: PERCENTAGE_MULTIPLIERS.THIRTY_PERCENT, // 30% minimum hit rate
  GOOD_HIT_RATE: PERCENTAGE_MULTIPLIERS.FIFTY_PERCENT, // 50% good hit rate
  EXCELLENT_HIT_RATE: PERCENTAGE_MULTIPLIERS.EIGHTY_PERCENT, // 80% excellent hit rate
  EVICTION_THRESHOLD: PERCENTAGE_MULTIPLIERS.NINETY_PERCENT, // 90% capacity triggers eviction
} as const;

/**
 * Cache strategies and algorithms
 */
export const CACHE_STRATEGIES = {
  /**
   * Least Recently Used - removes least recently accessed items
   */
  LRU: 'lru',

  /**
   * First In First Out - removes oldest items first
   */
  FIFO: 'fifo',

  /**
   * Least Frequently Used - removes least frequently accessed items
   */
  LFU: 'lfu',

  /**
   * Time-based eviction - removes items after TTL expires
   */
  TTL: 'ttl',
} as const;

/**
 * LRU Cache specific configurations
 */
export const LRU_CONFIG = {
  /**
   * Default maximum number of items in LRU cache
   */
  DEFAULT_MAX_SIZE: SIZE_MULTIPLIERS.LARGE_FACTOR,

  /**
   * Maximum age for items before forced eviction (ms)
   */
  MAX_AGE_MS: TIME_UNITS.HOUR, // 1 hour

  /**
   * Update age on get operations
   */
  UPDATE_AGE_ON_GET: true,

  /**
   * Allow stale items while revalidating
   */
  STALE_WHILE_REVALIDATE: true,

  /**
   * Revalidation window in milliseconds
   */
  REVALIDATION_WINDOW_MS: TIME_MULTIPLIERS.SHORT_RETENTION * TIME_UNITS.SECOND, // 5 seconds
} as const;

/**
 * Memory management and limits
 */
export const MEMORY_LIMITS = {
  /**
   * Maximum memory per cache instance
   */
  PER_CACHE_MAX_MB: 50,

  /**
   * Global cache memory limit
   */
  GLOBAL_MAX_MB: 200,

  /**
   * Memory warning threshold (percentage)
   */
  WARNING_THRESHOLD: 0.75, // 75%

  /**
   * Memory critical threshold (percentage)
   */
  CRITICAL_THRESHOLD: 0.95, // 95%

  /**
   * Minimum free memory to maintain (MB)
   */
  MIN_FREE_MEMORY_MB: 10,
} as const;

/**
 * Cache invalidation rules
 */
export const CACHE_INVALIDATION = {
  /**
   * Invalidate on data mutation
   */
  ON_MUTATION: true,

  /**
   * Invalidate on error
   */
  ON_ERROR: false,

  /**
   * Batch invalidation delay (ms)
   */
  BATCH_DELAY_MS: 100,

  /**
   * Maximum items in invalidation batch
   */
  MAX_BATCH_SIZE: 50,

  /**
   * Cascade invalidation to related caches
   */
  CASCADE: true,
} as const;

/**
 * HTTP buffer sizes for network operations
 */
export const HTTP_BUFFER_SIZES = {
  /**
   * Maximum HTTP request body size (10MB)
   */
  MAX_BODY_SIZE_BYTES: 10 * 1024 * 1024,
  
  /**
   * Default chunk size for streaming (64KB)
   */
  CHUNK_SIZE_BYTES: 64 * 1024,
  
  /**
   * Maximum header size (8KB)
   */
  MAX_HEADER_SIZE_BYTES: 8 * 1024,
} as const;
