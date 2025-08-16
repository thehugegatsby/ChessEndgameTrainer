/**
 * Multiplier constants to avoid magic numbers
 * @module constants/multipliers
 *
 * @description
 * Named multipliers for calculations throughout the application.
 * These constants give semantic meaning to numeric factors used in
 * time, size, and other calculations.
 */

/**
 * Time-related multipliers
 */
export const TIME_MULTIPLIERS = {
  /**
   * Quick operations (10 units)
   * Used for fast cache access, quick timeouts
   */
  QUICK: 10,

  /**
   * Standard operations (30 units)
   * Used for normal cache TTL, standard intervals
   */
  STANDARD: 30,

  /**
   * Extended operations (60 units)
   * Used for minute-based calculations
   */
  MINUTE_BASED: 60,

  /**
   * Short retention periods (5 units)
   * Used for short-term caching
   */
  SHORT_RETENTION: 5,

  /**
   * Medium retention periods (10 units)
   * Used for medium-term caching
   */
  MEDIUM_RETENTION: 10,

  /**
   * Daily operations (24 units)
   * Used for hours in a day
   */
  HOURS_PER_DAY: 24,
} as const;

/**
 * Size-related multipliers
 */
export const SIZE_MULTIPLIERS = {
  /**
   * Small factor (10 units)
   * Used for small size calculations
   */
  SMALL_FACTOR: 10,

  /**
   * Medium factor (50 units)
   * Used for medium size calculations
   */
  MEDIUM_FACTOR: 50,

  /**
   * Large factor (100 units)
   * Used for large size calculations
   */
  LARGE_FACTOR: 100,

  /**
   * Extra large factor (200 units)
   * Used for extra large calculations
   */
  EXTRA_LARGE_FACTOR: 200,

  /**
   * Huge factor (500 units)
   * Used for huge calculations
   */
  HUGE_FACTOR: 500,

  /**
   * Massive factor (1000 units)
   * Used for massive calculations
   */
  MASSIVE_FACTOR: 1000,

  /**
   * Extreme factor (5000 units)
   * Used for extreme calculations
   */
  EXTREME_FACTOR: 5000,
} as const;

/**
 * Audio-related constants for fallback sound generation
 * Used in useFallbackAudio.ts
 */
export const AUDIO_CONSTANTS = {
  /**
   * Volume multiplier for audio fade-in (30% of max volume)
   */
  FADE_IN_VOLUME: 0.3,

  /**
   * Attack duration for audio envelope (10ms)
   */
  ATTACK_DURATION: 0.01,

  /**
   * Minimum volume for exponential decay (0.001)
   */
  MIN_DECAY_VOLUME: 0.001,
} as const;

/**
 * String handling and truncation constants
 * Used for logging and debugging purposes
 */
export const STRING_CONSTANTS = {
  /**
   * Standard truncation length for logging FEN strings
   */
  FEN_TRUNCATE_LENGTH: 20,
} as const;

/**
 * Percentage multipliers (as decimals)
 */
export const PERCENTAGE_MULTIPLIERS = {
  /**
   * 10% (0.1)
   */
  TEN_PERCENT: 0.1,

  /**
   * 30% (0.3)
   */
  THIRTY_PERCENT: 0.3,

  /**
   * 50% (0.5)
   */
  FIFTY_PERCENT: 0.5,

  /**
   * 80% (0.8)
   */
  EIGHTY_PERCENT: 0.8,

  /**
   * 90% (0.9)
   */
  NINETY_PERCENT: 0.9,

  /**
   * 100% (1.0)
   */
  HUNDRED_PERCENT: 1.0,
} as const;

/**
 * Binary size constants
 */
export const BINARY_MULTIPLIERS = {
  /**
   * Bytes in a kilobyte (1024)
   */
  KILOBYTE: 1024,

  /**
   * Kilobytes in a megabyte (1024)
   */
  MEGABYTE_FACTOR: 1024,

  /**
   * Megabytes in a gigabyte (1024)
   */
  GIGABYTE_FACTOR: 1024,
} as const;

/**
 * Learning and spaced repetition intervals (in days)
 */
export const LEARNING_INTERVALS = {
  /**
   * Short-term review (1 day)
   */
  SHORT_TERM: 1,

  /**
   * Medium-term review (3 days)
   */
  MEDIUM_TERM: 3,

  /**
   * Weekly review (7 days)
   */
  WEEKLY: 7,

  /**
   * Bi-weekly review (14 days)
   */
  BI_WEEKLY: 14,

  /**
   * Monthly review (30 days)
   */
  MONTHLY: 30,
} as const;

/**
 * Algorithm-specific multipliers
 */
export const ALGORITHM_MULTIPLIERS = {
  /**
   * Default batch size (10)
   */
  DEFAULT_BATCH_SIZE: 10,

  /**
   * SuperMemo-2 algorithm ease factor bounds
   */
  SUPERMEMO_MIN_EFACTOR: 1.3,
  SUPERMEMO_MAX_EFACTOR: 2.5,

  /**
   * Default page size (20)
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Default chunk size (50)
   */
  DEFAULT_CHUNK_SIZE: 50,

  /**
   * Default pool size (100)
   */
  DEFAULT_POOL_SIZE: 100,

  /**
   * Retry multiplier for exponential backoff (2)
   */
  RETRY_BACKOFF_FACTOR: 2,
} as const;

/**
 * Chess-specific evaluation constants
 */
export const CHESS_EVALUATION = {
  /**
   * Win-Draw-Loss (WDL) evaluation constants
   */
  WDL_WIN: 2,
  WDL_DRAW: 0,
  WDL_LOSS: -2,

  /**
   * Evaluation advantage thresholds
   */
  SLIGHT_ADVANTAGE: 0.5,
  SLIGHT_DISADVANTAGE: -0.5,
  SIGNIFICANT_ADVANTAGE: 2,
  SIGNIFICANT_DISADVANTAGE: -2,
} as const;

/**
 * UI-related multipliers
 */
export const UI_MULTIPLIERS = {
  /**
   * Animation speed factor (100ms base)
   */
  ANIMATION_BASE: 100,

  /**
   * Toast duration factor (1000ms base)
   */
  TOAST_BASE: 1000,

  /**
   * Debounce factor (50ms base)
   */
  DEBOUNCE_BASE: 50,

  /**
   * Throttle factor (100ms base)
   */
  THROTTLE_BASE: 100,
} as const;

/**
 * Chess-specific multipliers
 */
export const CHESS_MULTIPLIERS = {
  /**
   * Centipawn conversion (100 centipawns = 1 pawn)
   */
  CENTIPAWN_TO_PAWN: 100,

  /**
   * Board squares (64 squares)
   */
  BOARD_SQUARES: 64,

  /**
   * Max pieces in endgame (7 for tablebase)
   */
  MAX_ENDGAME_PIECES: 7,

  /**
   * Evaluation thresholds
   */
  INACCURACY_THRESHOLD: 10,
  MISTAKE_THRESHOLD: 50,
  BLUNDER_THRESHOLD: 100,
} as const;
