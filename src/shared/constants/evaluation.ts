/**
 * Evaluation and scoring constants
 * @module constants/evaluation
 *
 * @description
 * Constants for chess position evaluation, move quality assessment,
 * and scoring thresholds.
 */

/**
 * Evaluation score constants (in centipawns unless noted)
 */
export const EVAL_SCORES = {
  // Special scores
  MATE_SCORE: 100000,
  MATE_THRESHOLD: 10000,
  TABLEBASE_WIN: 10000,
  TABLEBASE_LOSS: -10000,

  // Position evaluation thresholds (in centipawns)
  WINNING_THRESHOLD: 300, // +3.00 pawns
  ADVANTAGE_THRESHOLD: 150, // +1.50 pawns
  SLIGHT_ADVANTAGE: 50, // +0.50 pawns
  EQUAL_THRESHOLD: 20, // ±0.20 pawns

  // Move quality thresholds (relative to best move)
  BEST_MOVE_THRESHOLD: 0,
  GOOD_MOVE_THRESHOLD: -20, // Within 0.20 pawns of best
  INACCURACY_THRESHOLD: -50, // 0.50 pawns worse
  MISTAKE_THRESHOLD: -200, // 2.00 pawns worse
  BLUNDER_THRESHOLD: -500, // 5.00 pawns worse
} as const;

/**
 * Evaluation display constants
 */
export const EVAL_DISPLAY = {
  // Decimal places for display
  DECIMALS_STANDARD: 1,
  DECIMALS_PRECISE: 2,

  // Display thresholds (in pawns, not centipawns)
  SHOW_ADVANTAGE_THRESHOLD: 0.1,
  ROUND_TO_ZERO_THRESHOLD: 0.01,

  // Percentage conversion
  PERCENTAGE_MULTIPLIER: 100,

  // Display limits
  MAX_DISPLAY_MOVES: 10,
  MAX_DEPTH_DISPLAY: 20,
} as const;

/**
 * WDL (Win/Draw/Loss) constants
 */
export const WDL_VALUES = {
  WIN: 1,
  DRAW: 0,
  LOSS: -1,
  CURSED_WIN: 2, // Win but can be drawn with perfect play
  BLESSED_LOSS: -2, // Loss but can be drawn with perfect play
} as const;

/**
 * Spaced repetition factors
 */
export const SPACED_REPETITION = {
  INITIAL_EASE: 2.5,
  MIN_EASE: 1.3,
  MAX_EASE: 2.5,
  EASE_INCREMENT: 0.1,
  EASE_DECREMENT: 0.2,

  // Success thresholds
  PERFECT_THRESHOLD: 1.0, // 100% success
  GOOD_THRESHOLD: 0.8, // 80% success
  PASSING_THRESHOLD: 0.6, // 60% success
  REVIEW_THRESHOLD: 0.5, // 50% - needs review
} as const;

/**
 * Performance rating constants
 */
export const PERFORMANCE_RATINGS = {
  EXCELLENT: 90,
  GOOD: 75,
  AVERAGE: 60,
  BELOW_AVERAGE: 40,
  POOR: 20,
} as const;
