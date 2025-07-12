/**
 * Firebase Test Configuration Constants
 * Centralized configuration for Firebase testing
 */

export const FIREBASE_TEST_CONFIG = {
  EMULATOR_HOST: 'localhost',
  FIRESTORE_PORT: 8080,
  AUTH_PORT: 9099,
  UI_PORT: 4000,
  PROJECT_ID: 'endgame-trainer-test'
} as const;

export const TEST_SCENARIOS = {
  EMPTY: 'empty',
  BASIC: 'basic',
  ADVANCED: 'advanced',
  EDGE_CASES: 'edge-cases'
} as const;

export const TEST_TIMEOUTS = {
  DEFAULT_WAIT: 5000,
  EMULATOR_START: 30000,
  AUTH_OPERATION: 10000,
  DATA_OPERATION: 5000,
  POLLING_INTERVAL: 100
} as const;

export const TEST_LIMITS = {
  MAX_RETRY_ATTEMPTS: 3,
  BATCH_SIZE: 50,
  MAX_TEST_USERS: 100
} as const;

// Type exports
export type TestScenario = typeof TEST_SCENARIOS[keyof typeof TEST_SCENARIOS];