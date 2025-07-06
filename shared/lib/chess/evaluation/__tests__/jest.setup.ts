/**
 * Test setup for evaluation system tests
 */

// Mock the logger for tests
jest.mock('@shared/services/logging/LoggerCompat', () => ({
  Logger: {
    getInstance: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn().mockReturnThis()
    })
  }
}));

// Mock getLogger
jest.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setContext: jest.fn().mockReturnThis()
  })
}));

export {};