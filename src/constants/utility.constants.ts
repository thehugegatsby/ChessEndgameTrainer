/**
 * Utility constants for common operations across services
 * Provides semantic constants for encoding, string operations, and algorithmic values
 */

/**
 * Number base constants for encoding operations
 */
export const ENCODING_BASES = {
  /** Base 36 for alphanumeric encoding (0-9, a-z) */
  BASE36: 36,
  /** Base 10 for decimal encoding */
  BASE10: 10,
  /** Base 16 for hexadecimal encoding */
  BASE16: 16,
} as const;

/**
 * String operation constants
 */
export const STRING_OPERATIONS = {
  /** Maximum length for truncated error messages and logs */
  ERROR_TRUNCATE_LENGTH: 50,
  /** Maximum length for truncated FEN strings in logs */
  FEN_TRUNCATE_LENGTH: 20,
  /** Default truncation length for general strings */
  DEFAULT_TRUNCATE_LENGTH: 30,
} as const;

/**
 * Random generation constants
 */
export const RANDOM_GENERATION = {
  /** Multiplier for UUID fallback random component */
  UUID_RANDOM_MULTIPLIER: 9,
  /** Scale factor for timestamp-based ID generation */
  TIMESTAMP_SCALE_FACTOR: 1000,
} as const;

/**
 * Priority and offset constants
 */
export const PRIORITY_VALUES = {
  /** Negative offset for error priority adjustment */
  ERROR_PRIORITY_OFFSET: -5,
  /** Default priority for normal operations */
  DEFAULT_PRIORITY: 0,
  /** High priority value */
  HIGH_PRIORITY: 10,
} as const;
