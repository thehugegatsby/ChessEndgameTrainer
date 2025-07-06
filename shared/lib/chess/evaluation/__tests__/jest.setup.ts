/**
 * Jest setup for evaluation tests
 * Provides common mocks and test utilities
 */

// Mock Logger service
jest.mock('@shared/services/logging', () => ({
  getLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    withFields: jest.fn().mockReturnThis(),
  })),
}));

// Mock Worker API
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
})) as any;

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  getEntries: jest.fn(() => []),
  toJSON: jest.fn(),
} as any;