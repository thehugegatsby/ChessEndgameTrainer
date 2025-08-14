/**
 * @fileoverview Centralized constants for chess position evaluation and analysis.
 *
 * This file defines standardized values for interpreting chess engine scores,
 * classifying move quality, and configuring analysis parameters. Adopting
 * standards similar to popular platforms like Lichess ensures a familiar
 * user experience.
 */

// ============================================================================
// SCORE THRESHOLDS
// ============================================================================

/**
 * Defines thresholds for interpreting raw centipawn scores from the engine.
 * A positive score favors White, a negative score favors Black.
 */
export const SCORE_THRESHOLDS = Object.freeze({
  /**
   * A conventional value representing a checkmate. Engines often use values
   * around 32000. This is distinct from a centipawn score. When an engine
   * reports mate, it usually also provides the number of moves (e.g., M8).
   * The logic should prioritize mate over centipawn scores.
   */
  MATE_SCORE: 32000,

  /**
   * The score above which a position is considered decisively winning for White.
   * Lowered to 400cp (4-pawn advantage) for a more assertive evaluation.
   */
  WIN_THRESHOLD: 400,

  /**
   * The score below which a position is considered decisively winning for Black.
   * Lowered to -400cp (4-pawn advantage).
   */
  LOSS_THRESHOLD: -400,

  /**
   * The upper bound of the draw range. Scores between this and the lower
   * bound are considered roughly equal.
   */
  DRAW_UPPER_BOUND: 50,

  /**
   * The lower bound of the draw range. Scores between this and the upper
   * bound are considered roughly equal.
   */
  DRAW_LOWER_BOUND: -50,
});


// ============================================================================
// MOVE QUALITY
// ============================================================================

/**
 * Defines centipawn loss thresholds for classifying the quality of a move.
 * These values are based on the difference between the evaluation before the
 * move and the evaluation after the move, adjusted for whose turn it is.
 */
export const MOVE_QUALITY = Object.freeze({
  /**
   * For calculating centipawn loss, engine evaluations are capped at this
   * value (in pawns). This prevents misclassifying moves in already
   * decided positions (e.g., a blunder in a +15 vs. an equal position).
   * Lichess uses a cap of 10 pawns (1000 centipawns).
   */
  EVALUATION_CAP_PAWNS: 10,

  /**
   * The maximum centipawn loss for a move to be considered 'Excellent'.
   * A small tolerance of 2cp accounts for minor engine fluctuations.
   */
  EXCELLENT_THRESHOLD: 2,

  /**
   * The maximum centipawn loss for a move to be considered 'Good'. This
   * represents a slight deviation that doesn't alter the position's nature.
   */
  GOOD_THRESHOLD: 49,

  /**
   * The minimum centipawn loss for a move to be classified as an 'Inaccuracy'.
   * Range: 50-99 cp loss. (Lichess: 50+)
   */
  INACCURACY_THRESHOLD: 50,

  /**
   * The minimum centipawn loss for a move to be classified as a 'Mistake'.
   * Range: 100-299 cp loss. (Lichess: 100+)
   */
  MISTAKE_THRESHOLD: 100,

  /**
   * The minimum centipawn loss for a move to be classified as a 'Blunder'.
   * Range: 300+ cp loss. (Lichess: 300+)
   */
  BLUNDER_THRESHOLD: 300,
});


// ============================================================================
// EVALUATION CONFIGURATION
// ============================================================================

/**
 * Configurable parameters for the chess engine analysis.
 */
export const EVALUATION_CONFIG = Object.freeze({
  /**
   * Analysis depths for different levels of scrutiny.
   */
  DEPTHS: Object.freeze({
    SHALLOW: 12,
    NORMAL: 18,
    DEEP: 24,
  }),

  /**
   * The number of principal variations (best lines) for the engine to find.
   */
  MULTI_PV: Object.freeze({
    DEFAULT: 3,
    DETAILED: 5,
  }),

  /**
   * Timeouts for engine analysis, in milliseconds.
   */
  TIMEOUTS_MS: Object.freeze({
    QUICK: 1000,
    NORMAL: 5000,
    DEEP: 15000,
  }),
});


// ============================================================================
// CENTIPAWN CONVERSION
// ============================================================================

/**
 * Constants for converting and displaying centipawn values.
 */
export const CENTIPAWN_CONVERSION = Object.freeze({
  /**
   * The number of centipawns in a single pawn unit.
   */
  PAWN_VALUE: 100,

  /**
   * The number of decimal places to use when displaying pawn-based evaluations.
   * E.g., a precision of 1 will display 150cp as "+1.5".
   */
  DISPLAY_PRECISION: 1,
});