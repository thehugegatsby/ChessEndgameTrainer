/**
 * @fileoverview Time-related constants for consistent duration calculations
 * @module constants/time
 *
 * @description
 * Provides a clear, readable, and consistent way to define time durations.
 * Base units are defined and then composed into common durations.
 * All values are in milliseconds for JavaScript compatibility.
 */

/* eslint-disable no-magic-numbers */
// Time unit calculations use fundamental temporal constants (60 seconds/minute, 24 hours/day, etc.)

/**
 * @example
 * ```typescript
 * import { TIME_UNITS } from '@/shared/constants/time.constants';
 *
 * // Clear intent: 30 minute timeout
 * const sessionTimeout = 30 * TIME_UNITS.MINUTE;
 *
 * // Clear intent: 2 day cache TTL
 * const cacheTtl = 2 * TIME_UNITS.DAY;
 *
 * // Clear intent: 500ms debounce
 * const debounceDelay = 500; // OK to use literal for sub-second values
 * ```
 */

/**
 * Base time units in milliseconds
 *
 * @description
 * Building blocks for all time calculations. Use these to compose
 * durations that clearly express intent rather than using raw numbers.
 */
export const TIME_UNITS = {
  /**
   * Milliseconds in one second (1000ms)
   */
  SECOND: 1000,

  /**
   * Milliseconds in one minute (60 seconds)
   */
  MINUTE: 60 * 1000,

  /**
   * Milliseconds in one hour (60 minutes)
   */
  HOUR: 60 * 60 * 1000,

  /**
   * Milliseconds in one day (24 hours)
   */
  DAY: 24 * 60 * 60 * 1000,

  /**
   * Milliseconds in one week (7 days)
   */
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Common durations for application features
 *
 * @description
 * Pre-calculated durations for frequently used timeouts and intervals.
 * These provide semantic meaning beyond just the numeric value.
 */
export const DURATIONS = {
  /**
   * Animation and UI feedback durations
   */
  ANIMATION: {
    /**
     * Fast animations (200ms)
     */
    FAST: 200,

    /**
     * Normal animations (300ms)
     */
    NORMAL: 300,

    /**
     * Slow animations (500ms)
     */
    SLOW: 500,

    /**
     * Very slow animations (1000ms)
     */
    VERY_SLOW: TIME_UNITS.SECOND,
  },

  /**
   * Debounce delays for user input
   */
  DEBOUNCE: {
    /**
     * Fast debounce for responsive UI (100ms)
     */
    FAST: 100,

    /**
     * Normal debounce for search/filter (300ms)
     */
    NORMAL: 300,

    /**
     * Slow debounce for expensive operations (500ms)
     */
    SLOW: 500,
  },

  /**
   * Toast notification durations
   */
  TOAST: {
    /**
     * Short toast display (3 seconds)
     */
    SHORT: 3 * TIME_UNITS.SECOND,

    /**
     * Medium toast display (4 seconds)
     */
    MEDIUM: 4 * TIME_UNITS.SECOND,

    /**
     * Long toast display (6 seconds)
     */
    LONG: 6 * TIME_UNITS.SECOND,
  },

  /**
   * Cache TTL values
   */
  CACHE_TTL: {
    /**
     * Very short cache (10 seconds)
     * For rapidly changing data
     */
    VERY_SHORT: 10 * TIME_UNITS.SECOND,

    /**
     * Short cache (1 minute)
     * For frequently updated data
     */
    SHORT: TIME_UNITS.MINUTE,

    /**
     * Medium cache (5 minutes)
     * For moderately stable data
     */
    MEDIUM: 5 * TIME_UNITS.MINUTE,

    /**
     * Long cache (30 minutes)
     * For stable data
     */
    LONG: 30 * TIME_UNITS.MINUTE,

    /**
     * Very long cache (1 hour)
     * For rarely changing data
     */
    VERY_LONG: TIME_UNITS.HOUR,

    /**
     * Extended cache (24 hours)
     * For static or daily-updated data
     */
    EXTENDED: TIME_UNITS.DAY,
  },

  /**
   * API and network timeouts
   */
  TIMEOUT: {
    /**
     * Very short timeout (2 seconds)
     * For quick health checks
     */
    VERY_SHORT: 2 * TIME_UNITS.SECOND,

    /**
     * Short timeout (5 seconds)
     * For simple API calls
     */
    SHORT: 5 * TIME_UNITS.SECOND,

    /**
     * Medium timeout (10 seconds)
     * For standard API calls
     */
    MEDIUM: 10 * TIME_UNITS.SECOND,

    /**
     * Long timeout (30 seconds)
     * For complex operations
     */
    LONG: 30 * TIME_UNITS.SECOND,

    /**
     * Very long timeout (60 seconds)
     * For file uploads or heavy processing
     */
    VERY_LONG: 60 * TIME_UNITS.SECOND,
  },

  /**
   * Polling intervals
   */
  POLL: {
    /**
     * Fast polling (1 second)
     * For real-time updates
     */
    FAST: TIME_UNITS.SECOND,

    /**
     * Normal polling (5 seconds)
     * For regular updates
     */
    NORMAL: 5 * TIME_UNITS.SECOND,

    /**
     * Slow polling (30 seconds)
     * For background checks
     */
    SLOW: 30 * TIME_UNITS.SECOND,
  },
} as const;

/**
 * Helper functions for time calculations
 */

/**
 * Convert seconds to milliseconds
 * @param seconds - Number of seconds
 * @returns Milliseconds
 */
export const secondsToMs = (seconds: number): number => seconds * TIME_UNITS.SECOND;

/**
 * Convert minutes to milliseconds
 * @param minutes - Number of minutes
 * @returns Milliseconds
 */
export const minutesToMs = (minutes: number): number => minutes * TIME_UNITS.MINUTE;

/**
 * Convert hours to milliseconds
 * @param hours - Number of hours
 * @returns Milliseconds
 */
export const hoursToMs = (hours: number): number => hours * TIME_UNITS.HOUR;

/**
 * Convert days to milliseconds
 * @param days - Number of days
 * @returns Milliseconds
 */
export const daysToMs = (days: number): number => days * TIME_UNITS.DAY;

/**
 * Format milliseconds to human-readable string
 * @param ms - Milliseconds
 * @returns Formatted string like "2h 30m"
 */
export const formatDuration = (ms: number): string => {
  const days = Math.floor(ms / TIME_UNITS.DAY);
  const hours = Math.floor((ms % TIME_UNITS.DAY) / TIME_UNITS.HOUR);
  const minutes = Math.floor((ms % TIME_UNITS.HOUR) / TIME_UNITS.MINUTE);
  const seconds = Math.floor((ms % TIME_UNITS.MINUTE) / TIME_UNITS.SECOND);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
};

/**
 * Type exports for strict typing
 */
export type TimeUnitsConstants = typeof TIME_UNITS;
export type DurationsConstants = typeof DURATIONS;
