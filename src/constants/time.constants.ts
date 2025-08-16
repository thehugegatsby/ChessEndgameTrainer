/**
 * Time Constants - Durations and Delays
 * Centralized time-related magic numbers
 */

/**
 * Fundamental time unit constants
 * These are the base units from which all other time values are derived
 */
export const TIME_BASE_UNITS = {
  MS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
} as const;

/**
 * Base time units in milliseconds
 * Derived from TIME_BASE_UNITS to avoid magic numbers
 */
export const TIME_IN_MS = {
  SECOND: TIME_BASE_UNITS.MS_PER_SECOND,
  MINUTE: TIME_BASE_UNITS.SECONDS_PER_MINUTE * TIME_BASE_UNITS.MS_PER_SECOND,
  HOUR:
    TIME_BASE_UNITS.MINUTES_PER_HOUR *
    TIME_BASE_UNITS.SECONDS_PER_MINUTE *
    TIME_BASE_UNITS.MS_PER_SECOND,
  DAY:
    TIME_BASE_UNITS.HOURS_PER_DAY *
    TIME_BASE_UNITS.MINUTES_PER_HOUR *
    TIME_BASE_UNITS.SECONDS_PER_MINUTE *
    TIME_BASE_UNITS.MS_PER_SECOND,
} as const;

/**
 * Common time buckets for data aggregation
 */
export const TIME_BUCKETS_MS = {
  FIVE_MINUTES: 5 * TIME_IN_MS.MINUTE,
} as const;

/**
 * UI Duration constants for delays and timeouts
 * From EndgameTrainingPage, useDialogHandlers, etc.
 */
export const UI_DURATIONS_MS = {
  DIALOG_CLOSE_DELAY: 500, // useDialogHandlers.ts
  ENDGAME_FEEDBACK_SHORT: 2000, // EndgameTrainingPage.tsx
  ENDGAME_FEEDBACK_LONG: 2500, // EndgameTrainingPage.tsx
  STORE_TIMEOUT: 5000, // rootStore.ts
} as const;

/**
 * Toast duration constants
 * From toast.ts - different types of notifications
 */
export const TOAST_DURATIONS_MS = {
  INFO: 4000, // Info messages
  SUCCESS: 5000, // Success messages
  ERROR: 6000, // Error messages
  WARNING: 4000, // Warning messages (same as info)
} as const;

/**
 * API timeout constants
 * From LichessApiClient.ts and related services
 */
export const API_TIMEOUTS_MS = {
  LICHESS_DEFAULT: 5000, // Default Lichess timeout
  LICHESS_TABLEBASE: 10000, // Tablebase queries (longer)
  RETRY_DELAY_BASE: 250, // Base retry delay
  RETRY_DELAY_MAX: 1000, // Maximum retry delay
} as const;
