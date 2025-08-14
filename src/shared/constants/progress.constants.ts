/**
 * @fileoverview Manages constants related to user progress tracking, spaced repetition, and success metrics.
 * 
 * These values are foundational for the learning algorithm that helps users master chess endgames.
 * They are based on a modified SM-2 algorithm for spaced repetition.
 */

// ============================================================================
// SPACED REPETITION
// ============================================================================

/**
 * Constants governing the spaced repetition system (SRS).
 * These values determine how review intervals are calculated and adjusted based on user performance.
 */
export const SPACED_REPETITION = Object.freeze({
  /**
   * The initial intervals for a new endgame problem (learning phase).
   * The user progresses through these steps before graduating to the main review schedule.
   * Values are in milliseconds.
   * Step 1: 10 minutes
   * Step 2: 1 hour
   * Step 3: 1 day
   */
  INITIAL_INTERVALS_MS: [
    10 * 60 * 1000,  // 10 minutes
    60 * 60 * 1000,  // 1 hour
    24 * 60 * 60 * 1000,  // 1 day
  ],

  /**
   * The default starting interval (in days) for an item that has graduated from the initial steps.
   * This is the first "long" interval.
   */
  DEFAULT_INTERVAL_DAYS: 4,

  /**
   * The multiplier applied to the last interval upon a successful review.
   * A value of 2.5 means the next interval will be 2.5 times the previous one.
   * This is the "Easiness Factor" (E-Factor) in SM-2 terminology.
   * We use a constant factor here for simplicity, but it could be dynamic.
   */
  SUCCESS_INTERVAL_MULTIPLIER: 2.5,

  /**
   * The multiplier applied to the current interval when a user fails a review.
   * A value of 0.5 would halve the interval, but we reset to a specific step.
   * This value is used to penalize lapses more gracefully if we choose not to reset completely.
   * For now, our logic resets to the first initial interval, so this is a placeholder.
   */
  FAILURE_INTERVAL_MULTIPLIER: 0.5,

  /**
   * The minimum possible Easiness Factor. The multiplier cannot go below this.
   * SM-2 recommends 1.3.
   */
  MIN_EASINESS_FACTOR: 1.3,

  /**
   * The factor by which the success multiplier itself is adjusted based on performance.
   * This allows the system to adapt to the difficulty of a specific endgame for a user.
   * For example, a perfect, quick answer might slightly increase the E-Factor for the next review.
   * A difficult but correct answer might decrease it.
   * Not currently implemented in the core logic, but here for future extension.
   */
  EASINESS_FACTOR_ADJUSTMENT: 0.1,
});


// ============================================================================
// SUCCESS METRICS
// ============================================================================

/**
 * Defines metrics for evaluating user success and mastery.
 */
export const SUCCESS_METRICS = Object.freeze({
  /**
   * The minimum success rate required to be considered "learning" an endgame.
   * Below this, progress might be reset.
   * e.g., 60% success rate over the last 10 attempts.
   */
  MIN_SUCCESS_RATE_THRESHOLD: 0.6,

  /**
   * The success rate above which performance is considered "good".
   */
  GOOD_SUCCESS_RATE_THRESHOLD: 0.75,

  /**
   * The success rate above which performance is considered "excellent".
   */
  EXCELLENT_SUCCESS_RATE_THRESHOLD: 0.9,

  /**
   * The number of consecutive successful reviews required to earn a streak bonus.
   */
  STREAK_THRESHOLD: 3,

  /**
   * The multiplier applied to the interval when a streak is achieved.
   * e.g., 1.2 means a 20% bonus to the next interval.
   */
  STREAK_BONUS_MULTIPLIER: 1.2,

  /**
   * An interval (in days) at which an endgame is considered "learned" and has
   * graduated from the initial learning phase.
   */
  LEARNED_INTERVAL_DAYS: 21,

  /**
   * An interval (in days) at which an endgame is considered "mastered" (long-term memory).
   * For example, if the next review is scheduled more than 90 days away.
   */
  MASTERY_INTERVAL_DAYS: 90,
});


// ============================================================================
// PROGRESS CONFIGURATION
// ============================================================================

/**
 * General configuration for what constitutes a valid attempt or requires a progress reset.
 */
export const PROGRESS_CONFIG = Object.freeze({
  /**
   * The minimum number of moves a user must make for the attempt to be recorded.
   * This prevents accidental submissions or trivial puzzles from skewing data.
   */
  MIN_MOVES_FOR_COMPLETION: 2,

  /**
   * The maximum number of hints a user can receive for an attempt to still be
   * considered a "successful" independent solve. If more hints are used,
   * it should be treated as a failure for SRS purposes.
   */
  MAX_HINTS_FOR_SUCCESS: 0,

  /**
   * If a user's success rate for an endgame drops below this threshold after a
   * certain number of attempts, their progress for that specific endgame is reset.
   * This is tied to SUCCESS_METRICS.MIN_SUCCESS_RATE_THRESHOLD.
   */
  PROGRESS_RESET_THRESHOLD: 0.4,

  /**
   * The number of attempts to consider when calculating the success rate for a potential reset.
   * e.g., if success rate over the last 10 attempts is below the threshold, reset.
   */
  RESET_ATTEMPTS_WINDOW: 10,

  /**
   * The maximum number of attempts allowed before forcing a reset.
   * This prevents endless struggling on a single position.
   */
  MAX_ATTEMPTS_BEFORE_RESET: 20,

  /**
   * The time (in milliseconds) after which a puzzle is considered "timed out"
   * and should be marked as incomplete/failed.
   */
  ATTEMPT_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes
});