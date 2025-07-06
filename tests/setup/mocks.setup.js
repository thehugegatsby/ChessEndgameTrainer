/**
 * Global mocks setup for all tests
 */

// Mock Worker API
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onmessage: null,
  onerror: null
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ wdl: 2, dtm: 15, dtz: 15 }),
    text: () => Promise.resolve('2,15,15')
  })
);

// Mock logger for evaluation tests
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  getInstance: jest.fn(() => mockLogger)
};

// Set up module mocks
jest.mock('@shared/services/loggerService', () => ({
  getLogger: jest.fn(() => mockLogger),
  Logger: {
    getInstance: jest.fn(() => mockLogger)
  }
}));

// Mock AbortController for older Node versions
if (!global.AbortController) {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
}