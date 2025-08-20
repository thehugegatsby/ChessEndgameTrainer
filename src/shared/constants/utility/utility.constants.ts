/**
 * @fileoverview Utility constants for mathematical operations and common calculations
 * @module constants/utility
 *
 * @description
 * Centralizes mathematical, string, and utility constants used across the application.
 * Merged from number.constants.ts and utility.constants.ts for consistency.
 *
 * @remarks
 * All constants use `as const` assertion for type safety and immutability.
 * Constants are grouped by logical operation type for easy discovery.
 */

/**
 * Percentage base constant
 * Used for converting decimal values to percentages
 * Merged from src/constants/number.constants.ts
 */
export const PERCENT = 100 as const;

/**
 * Common percentage decimal values
 * Merged from src/constants/number.constants.ts
 */
export const PERCENT_DECIMALS = {
  ONE_PERCENT: 0.01,
  FIVE_PERCENT: 0.05,
  TEN_PERCENT: 0.1,
  TWENTY_FIVE_PERCENT: 0.25,
  FIFTY_PERCENT: 0.5,
  SEVENTY_FIVE_PERCENT: 0.75,
  ONE_HUNDRED_PERCENT: 1.0,
} as const;

/**
 * Number base constants for encoding operations
 * Merged from src/constants/utility.constants.ts
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
 * Merged from src/constants/utility.constants.ts
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
 * Merged from src/constants/utility.constants.ts
 */
export const RANDOM_GENERATION = {
  /** Multiplier for UUID fallback random component */
  UUID_RANDOM_MULTIPLIER: 9,
  /** Scale factor for timestamp-based ID generation */
  TIMESTAMP_SCALE_FACTOR: 1000,
} as const;

/**
 * Priority and offset constants
 * Merged from src/constants/utility.constants.ts
 */
export const PRIORITY_VALUES = {
  /** Negative offset for error priority adjustment */
  ERROR_PRIORITY_OFFSET: -5,
  /** Default priority for normal operations */
  DEFAULT_PRIORITY: 0,
  /** High priority value */
  HIGH_PRIORITY: 10,
} as const;

/**
 * Mathematical constants
 */
export const MATH_CONSTANTS = {
  /** Zero value for comparisons */
  ZERO: 0,
  /** One value for multiplicative identity */
  ONE: 1,
  /** Negative one for sign flipping */
  NEGATIVE_ONE: -1,
  /** Two for binary operations */
  TWO: 2,
  /** Half value for division by two */
  HALF: 0.5,
} as const;

/**
 * Array and collection constants
 */
export const ARRAY_CONSTANTS = {
  /** Empty array length */
  EMPTY_LENGTH: 0,
  /** First index in zero-based arrays */
  FIRST_INDEX: 0,
  /** Not found indicator for indexOf operations */
  NOT_FOUND_INDEX: -1,
  /** Single item array length */
  SINGLE_ITEM_LENGTH: 1,
} as const;

/**
 * Type exports for strict typing
 */
export type PercentDecimalsConstants = typeof PERCENT_DECIMALS;
export type EncodingBasesConstants = typeof ENCODING_BASES;
export type StringOperationsConstants = typeof STRING_OPERATIONS;
export type RandomGenerationConstants = typeof RANDOM_GENERATION;
export type PriorityValuesConstants = typeof PRIORITY_VALUES;
export type MathConstants = typeof MATH_CONSTANTS;
export type ArrayConstants = typeof ARRAY_CONSTANTS;