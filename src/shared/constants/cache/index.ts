/**
 * @fileoverview Cache constants barrel export
 * @module constants/cache
 */

export * from '../cache';

// Import all from cache.ts to re-export
import {
  CACHE_SIZES,
  CACHE_TTL,
  CACHE_STRATEGIES,
} from '../cache';

// Create a consolidated CACHE export for backward compatibility
export const CACHE = {
  SIZES: CACHE_SIZES,
  TTL: CACHE_TTL,
  STRATEGIES: CACHE_STRATEGIES,
} as const;