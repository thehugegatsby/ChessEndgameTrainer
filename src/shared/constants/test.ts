/**
 * Test-specific constants
 * @module constants/test
 *
 * @description
 * Constants used specifically in test files including timeouts,
 * delays, and test configuration values.
 */

/**
 * Test timeout constants in milliseconds
 */
export const TEST_TIMEOUTS = {
  SHORT: 1000, // 1 second for quick operations
  DEFAULT: 5000, // 5 seconds default timeout
  LONG: 10000, // 10 seconds for complex operations
  EXTRA_LONG: 15000, // 15 seconds for E2E tests
  NETWORK: 30000, // 30 seconds for network operations
} as const;

/**
 * Test delay constants for animations and UI updates
 */
export const TEST_DELAYS = {
  QUICK: 50, // 50ms for quick waits
  SHORT: 100, // 100ms for short delays
  ANIMATION: 150, // 150ms for animations
  STANDARD: 200, // 200ms standard delay
  MEDIUM: 300, // 300ms for medium delays
  LONG: 500, // 500ms for longer operations
  EXTRA_LONG: 1000, // 1 second for complex UI updates
  NETWORK: 2000, // 2 seconds for network simulation
} as const;

/**
 * Test iteration and sample size constants
 */
export const TEST_ITERATIONS = {
  SMALL: 10, // Small test iterations
  MEDIUM: 20, // Medium test iterations
  LARGE: 50, // Large test iterations
  STRESS: 100, // Stress test iterations
  PERFORMANCE: 1000, // Performance test iterations
} as const;

/**
 * Test evaluation and score constants
 */
export const TEST_SCORES = {
  // Evaluation scores
  MATE_SCORE: 10000,
  WIN_SCORE: 100,
  DRAW_SCORE: 0,
  LOSS_SCORE: -100,

  // Move quality thresholds
  EXCELLENT: 50,
  GOOD: 25,
  NEUTRAL: 0,
  INACCURATE: -5,
  MISTAKE: -10,
  BLUNDER: -25,

  // Percentage thresholds
  SUCCESS_THRESHOLD: 75,
  CRITICAL_THRESHOLD: 50,
  WARNING_THRESHOLD: 20,
} as const;

/**
 * Mock data constants for tests
 */
export const TEST_MOCK_VALUES = {
  DEFAULT_RATING: 1500,
  RANDOM_SEED: 42,
  SAMPLE_SIZE: 100,
  CACHE_SIZE: 200,
  BATCH_SIZE: 10,
} as const;
