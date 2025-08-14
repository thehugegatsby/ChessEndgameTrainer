/**
 * @fileoverview Test constants for consistent values across test suites
 * @module tests/constants/test
 * 
 * @description
 * Provides shared constants used across multiple test files to ensure
 * consistency and make test maintenance easier.
 */

/* eslint-disable no-magic-numbers */
// Test constants are context-specific and often need specific values for assertions

/**
 * Factory and Mock Constants
 */
export const TEST_FACTORY = {
  /**
   * Starting ID counter to avoid conflicts with fixtures
   */
  ID_COUNTER_START: 1000,
  
  /**
   * Maximum number of moves for position generation
   */
  MAX_MOVES: 10,
  
  /**
   * Default mock DTZ (Distance to Zeroing) value
   */
  DEFAULT_DTZ: 10,
} as const;

/**
 * Performance Test Configuration
 */
export const PERFORMANCE_TEST = {
  /**
   * Cache sizes for performance testing
   */
  CACHE_SIZES: [50, 100, 200, 500] as const,
  
  /**
   * Small cache size for eviction testing
   */
  SMALL_CACHE_SIZE: 50,
  
  /**
   * Medium cache size for standard tests
   */
  MEDIUM_CACHE_SIZE: 100,
  
  /**
   * Large cache size for bulk operations
   */
  LARGE_CACHE_SIZE: 200,
  
  /**
   * Maximum cache size for stress testing
   */
  MAX_CACHE_SIZE: 500,
  
  /**
   * Number of iterations for performance benchmarks
   */
  BENCHMARK_ITERATIONS: {
    SMALL: 100,
    MEDIUM: 1000,
    LARGE: 10000,
  },
  
  /**
   * Performance thresholds in milliseconds
   */
  PERFORMANCE_THRESHOLDS_MS: {
    FAST: 50,
    NORMAL: 100,
  },
  
  /**
   * TTL values for cache testing (in milliseconds)
   */
  CACHE_TTL: {
    VERY_SHORT: 50,  // For fast test execution
    SHORT: 60,       // Slightly longer for timing tests
    MEDIUM: 300,     // 5 minutes for extended tests
  },
} as const;

/**
 * Mock Service Configuration
 */
export const MOCK_SERVICE = {
  /**
   * Default timestamp for consistent mock dates
   */
  DEFAULT_TIMESTAMP: 1000,
  
  /**
   * Mock tablebase service cache size
   */
  TABLEBASE_CACHE_SIZE: 200,
} as const;

/**
 * Test Timeout Values (in milliseconds)
 */
export const TEST_TIMEOUTS = {
  /**
   * CI environment timeout (longer for slower CI machines)
   */
  CI: 5000,
  
  /**
   * Development environment timeout
   */
  DEV: 2000,
  
  /**
   * Fast test timeout for unit tests
   */
  FAST: 1000,
  
  /**
   * Integration test timeout
   */
  INTEGRATION: 10000,
} as const;

/**
 * Test Data Sizes
 */
export const TEST_DATA_SIZES = {
  /**
   * Number of items for array generation tests
   */
  ARRAY_SIZE: 20,
  
  /**
   * Percentage values for testing
   */
  PERCENTAGE: {
    QUARTER: 25,
    HALF: 50,
    THREE_QUARTERS: 75,
    FULL: 100,
  },
} as const;

/**
 * Helper function to get appropriate timeout based on environment
 */
export const getTestTimeout = (): number => {
  // This function can be used in test files to get environment-appropriate timeouts
  const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'ci';
  return isCI ? TEST_TIMEOUTS.CI : TEST_TIMEOUTS.DEV;
};

/**
 * Helper function to create test data arrays of specified size
 */
export const createTestArray = <T>(size: number, generator: (index: number) => T): T[] => {
  return Array(size).fill(null).map((_, i) => generator(i));
};

/**
 * Type exports for strict typing
 */
export type TestFactoryConstants = typeof TEST_FACTORY;
export type PerformanceTestConstants = typeof PERFORMANCE_TEST;
export type MockServiceConstants = typeof MOCK_SERVICE;
export type TestTimeoutConstants = typeof TEST_TIMEOUTS;
export type TestDataSizeConstants = typeof TEST_DATA_SIZES;