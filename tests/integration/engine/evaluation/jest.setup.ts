// Jest setup for evaluation tests
// Mock browser APIs that are not available in Jest environment

// Mock logger
jest.mock('@/shared/utils/logger', () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));