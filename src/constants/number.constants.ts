/**
 * Number Constants - Mathematical and Percentage Values
 * Centralized numeric constants for calculations
 */

/**
 * Percentage base constant
 * Used for converting decimal values to percentages
 */
export const PERCENT = 100 as const;

/**
 * Common percentage decimal values
 */
export const PERCENT_DECIMALS = {
  ONE_PERCENT: 0.01,
  FIVE_PERCENT: 0.05,
  TEN_PERCENT: 0.10,
  TWENTY_FIVE_PERCENT: 0.25,
  FIFTY_PERCENT: 0.50,
  SEVENTY_FIVE_PERCENT: 0.75,
  ONE_HUNDRED_PERCENT: 1.00,
} as const;