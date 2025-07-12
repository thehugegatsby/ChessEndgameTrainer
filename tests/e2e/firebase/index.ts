/**
 * Firebase E2E Test Utilities
 * Central exports for Firebase-specific test utilities and constants
 */

// Re-export test data from firebase-test-helpers
export {
  TEST_POSITIONS,
  TEST_CATEGORIES,
  TEST_CHAPTERS,
  initializeTestFirebase,
  clearFirestoreData,
  seedTestPositions,
  seedTestCategories,
  seedTestChapters,
  cleanupTestFirebase,
  waitForFirestore
} from '../../utils/firebase-test-helpers';

// Export constants
export {
  FIREBASE_TEST_CONFIG,
  TEST_SCENARIOS,
  TEST_TIMEOUTS,
  TEST_LIMITS,
  type TestScenario
} from './firebase.constants';

// Export utilities
export {
  generateTestUserEmail,
  generateTestId,
  waitForCondition,
  withRetry,
  generateDeterministicId,
  isValidTestEmail,
  cleanupWithTimeout
} from './firebase.utils';

// Export test fixtures
export {
  TEST_USER_TEMPLATES,
  TEST_AUTH_DATA,
  type TestUserTemplate,
  type TestUserTemplateKey,
  type TestUserCustomClaim,
  type TestUserProgress
} from './fixtures/users';

export {
  SCENARIO_DEFINITIONS,
  type TestScenarioDefinition,
  type ScenarioName
} from './fixtures/scenarios';