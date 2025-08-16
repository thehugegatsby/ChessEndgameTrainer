/**
 * Test Utilities Index
 * Central export for all Jest 30 compatible test utilities
 */

// Test Container Utilities
export {
  createTestContainer,
  setupTestContainer,
  createTestWrapper,
  createMockLocalStorage,
  TestScenarios,
  TestAssertions,
  type TestServiceOverrides,
} from './createTestContainer';

// Mock Factories
export {
  createMockPlatformStorage,
  createMockPlatformDevice,
  createMockPlatformNotification,
  createMockPlatformPerformance,
  createMockPlatformClipboard,
  createMockPlatformShare,
  createMockPlatformAnalytics,
  createMockPlatformService,
  MockScenarios,
} from './mockFactories';

// Jest Setup Utilities
export {
  setupGlobalTestContainer,
  getGlobalTestContainer,
  setupPerTestContainer,
  setupReactTestingWithContainer,
  platformServiceMatchers,
  testEnvironment,
  waitForNextTick,
  waitForServicesReady,
  debugContainer,
  mockConsole,
} from './vitestSetup';
