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
 * Algorithm-specific multipliers
 */
export const ALGORITHM_MULTIPLIERS = {
  /**
   * Default batch size (10)
   */
  DEFAULT_BATCH_SIZE: 10,
  
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