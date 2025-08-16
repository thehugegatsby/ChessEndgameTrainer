/**
 * Global mocks setup for all tests
 */

// Mock Worker API
global.Worker = vi.fn(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onmessage: null,
  onerror: null,
}));

// Mock fetch API
/**
 * Mock fetch API
 * @returns {Promise} Mock response
 */
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    /** @returns Promise with mock tablebase data */
    json: () => Promise.resolve({ wdl: 2, dtm: 15, dtz: 15 }),
    /** @returns Promise with mock tablebase text */
    text: () => Promise.resolve('2,15,15'),
  })
);

// Mock logger for evaluation tests
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  getInstance: vi.fn(() => mockLogger),
};

// Set up module mocks
vi.mock('@shared/services/loggerService', () => ({
  getLogger: vi.fn(() => mockLogger),
  Logger: {
    getInstance: vi.fn(() => mockLogger),
  },
}));

// Mock AbortController for older Node versions
if (!global.AbortController) {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }

    /**
     * Abort the signal
     */
    abort(): void {
      this.signal.aborted = true;
    }
  };
}
