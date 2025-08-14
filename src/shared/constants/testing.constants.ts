/**
 * @fileoverview Testing configuration and constants
 * @module constants/testing
 * 
 * @description
 * Centralized testing constants for unit tests, integration tests, and E2E tests.
 * Includes timeouts, viewport configurations, test data, and testing tool settings.
 * Designed for optimal LLM readability with comprehensive documentation.
 */

/**
 * Common test timeouts
 * 
 * @description
 * Reusable timeout values for different test scenarios.
 * Use these instead of magic numbers for consistency.
 */
export const TEST_TIMEOUTS = {
  /**
   * Instant operations (100ms)
   * For synchronous or nearly instant operations
   */
  INSTANT: 100,
  
  /**
   * Very short timeout (500ms)
   * For quick async operations
   */
  VERY_SHORT: 500,
  
  /**
   * Short timeout (1 second)
   * For simple async operations
   */
  SHORT: 1000,
  
  /**
   * Medium timeout (3 seconds)
   * For moderate async operations
   */
  MEDIUM: 3000,
  
  /**
   * Long timeout (5 seconds)
   * For complex async operations
   */
  LONG: 5000,
  
  /**
   * Very long timeout (10 seconds)
   * For API calls or heavy operations
   */
  VERY_LONG: 10000,
  
  /**
   * Extended timeout (30 seconds)
   * For integration tests or E2E scenarios
   */
  EXTENDED: 30000,
  
  /**
   * Maximum timeout (60 seconds)
   * For extremely long operations
   */
  MAX: 60000,
} as const;

/**
 * Test runner configuration
 * 
 * @description
 * Configuration for Vitest test runner including parallelization,
 * timeouts, and resource management.
 */
export const TEST_RUNNER = {
  /**
   * Unit test configuration
   */
  UNIT: {
    /**
     * Maximum number of parallel test forks
     */
    MAX_FORKS: 1,
    
    /**
     * Minimum number of parallel test forks
     */
    MIN_FORKS: 1,
    
    /**
     * Maximum number of worker threads
     */
    MAX_WORKERS: 1,
    
    /**
     * Test timeout in milliseconds (5 seconds)
     */
    TIMEOUT: TEST_TIMEOUTS.LONG,
    
    /**
     * Hook timeout in milliseconds
     */
    HOOK_TIMEOUT: TEST_TIMEOUTS.LONG,
  },
  
  /**
   * Integration test configuration
   */
  INTEGRATION: {
    /**
     * Maximum number of parallel test forks
     */
    MAX_FORKS: 4,
    
    /**
     * Minimum number of parallel test forks
     */
    MIN_FORKS: 1,
    
    /**
     * Test timeout in milliseconds (30 seconds)
     */
    TIMEOUT: TEST_TIMEOUTS.EXTENDED,
    
    /**
     * Hook timeout in milliseconds
     */
    HOOK_TIMEOUT: TEST_TIMEOUTS.EXTENDED,
  },
  
  /**
   * Default polling interval for async checks
   */
  POLL_INTERVAL: 50,
  
  /**
   * Default API call timeout
   */
  DEFAULT_API_TIMEOUT: 1000,
} as const;

/**
 * Playwright E2E test configuration
 * 
 * @description
 * Configuration for Playwright end-to-end tests including viewport sizes,
 * timeouts, and browser settings.
 */
export const E2E_CONFIG = {
  /**
   * Viewport dimensions
   */
  VIEWPORT: {
    /**
     * Desktop viewport
     */
    DESKTOP: {
      WIDTH: 1280,
      HEIGHT: 720,
    },
    
    /**
     * Tablet viewport
     */
    TABLET: {
      WIDTH: 1024,
      HEIGHT: 768,
    },
    
    /**
     * Mobile viewport
     */
    MOBILE: {
      WIDTH: 375,
      HEIGHT: 667,
    },
  },
  
  /**
   * Timeout configurations in milliseconds
   */
  TIMEOUTS: {
    /**
     * Default action timeout (10 seconds)
     */
    ACTION: 10000,
    
    /**
     * Navigation timeout (30 seconds)
     */
    NAVIGATION: 30000,
    
    /**
     * Test timeout (60 seconds)
     */
    TEST: 60000,
    
    /**
     * Assertion timeout (5 seconds)
     */
    ASSERTION: 5000,
    
    /**
     * Extended action timeout for CI (15 seconds)
     */
    ACTION_CI: 15000,
    
    /**
     * Extended navigation timeout for CI (45 seconds)
     */
    NAVIGATION_CI: 45000,
  },
  
  /**
   * Screenshot comparison configuration
   */
  SCREENSHOT: {
    /**
     * Maximum allowed pixel difference
     */
    MAX_DIFF_PIXELS: 100,
    
    /**
     * Pixel difference threshold (0-1)
     */
    THRESHOLD: 0.2,
  },
  
  /**
   * Retry configuration
   */
  RETRY: {
    /**
     * Number of retries in CI environment
     */
    CI: 2,
    
    /**
     * Number of retries in local environment
     */
    LOCAL: 0,
  },
  
  /**
   * Worker configuration
   */
  WORKERS: {
    /**
     * Number of workers in CI environment
     */
    CI: 4,
    
    /**
     * Number of workers in local environment (undefined = auto)
     */
    LOCAL: undefined,
  },
} as const;

/**
 * Test data and fixtures
 * 
 * @description
 * Common test data used across different test suites.
 */
export const TEST_DATA = {
  /**
   * Test positions for endgame scenarios
   */
  POSITIONS: {
    /**
     * King and Pawn vs King endgame
     */
    KPK: {
      FEN: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
      DESCRIPTION: 'King and Pawn vs King',
      TARGET_MOVES: 3,
    },
    
    /**
     * Rook and King vs King endgame
     */
    RK_VS_K: {
      FEN: '8/8/8/8/8/3k4/8/R3K3 w - - 0 1',
      DESCRIPTION: 'Rook and King vs King',
      TARGET_MOVES: 3,
    },
    
    /**
     * Pawn race endgame
     */
    PAWN_RACE: {
      FEN: '8/p7/8/8/8/8/P7/8 w - - 0 1',
      DESCRIPTION: 'Pawn Race',
      TARGET_MOVES: 5,
    },
  },
  
  /**
   * Test user data
   */
  USER: {
    /**
     * Default test user rating
     */
    RATING: 1500,
    
    /**
     * Test user streak count
     */
    STREAK: 5,
    
    /**
     * Test user ID
     */
    ID: 'test-user-123',
  },
  
  /**
   * Test moves for move validation
   */
  MOVES: {
    /**
     * Valid opening moves
     */
    OPENING: [
      { from: 'e2', to: 'e4', san: 'e4' },
      { from: 'e7', to: 'e5', san: 'e5' },
    ],
    
    /**
     * Invalid move example
     */
    INVALID: { from: 'e2', to: 'e5', san: null },
  },
} as const;

/**
 * Firebase emulator ports
 * 
 * @description
 * Port configuration for Firebase emulators used in testing.
 */
export const FIREBASE_EMULATOR_PORTS = {
  /**
   * Authentication emulator port
   */
  AUTH: 9099,
  
  /**
   * Firestore emulator port
   */
  FIRESTORE: 8080,
  
  /**
   * Storage emulator port
   */
  STORAGE: 9199,
  
  /**
   * Emulator host
   */
  HOST: 'localhost',
} as const;

/**
 * Mock service delays
 * 
 * @description
 * Artificial delays for mock services to simulate real-world conditions.
 */
export const MOCK_DELAYS = {
  /**
   * Minimal delay for instant responses (10ms)
   */
  INSTANT: 10,
  
  /**
   * Fast response delay (100ms)
   */
  FAST: 100,
  
  /**
   * Normal response delay (500ms)
   */
  NORMAL: 500,
  
  /**
   * Slow response delay (1500ms)
   */
  SLOW: 1500,
  
  /**
   * Timeout simulation delay (5000ms)
   */
  TIMEOUT: 5000,
} as const;

/**
 * Test environment variables
 * 
 * @description
 * Environment-specific configuration for testing.
 */
export const TEST_ENV = {
  /**
   * Check if running in CI environment
   */
  IS_CI: process.env['CI'] === 'true',
  
  /**
   * Check if running in GitHub Actions
   */
  IS_GITHUB_ACTIONS: process.env['GITHUB_ACTIONS'] === 'true',
  
  /**
   * Check if running in debug mode
   */
  DEBUG: process.env['DEBUG'] === 'true',
  
  /**
   * Test environment name
   */
  NODE_ENV: 'test',
} as const;

/**
 * Type exports for strict typing
 */
export type TestRunnerConstants = typeof TEST_RUNNER;
export type E2EConfigConstants = typeof E2E_CONFIG;
export type TestDataConstants = typeof TEST_DATA;
export type FirebaseEmulatorConstants = typeof FIREBASE_EMULATOR_PORTS;
export type MockDelayConstants = typeof MOCK_DELAYS;
export type TestEnvConstants = typeof TEST_ENV;