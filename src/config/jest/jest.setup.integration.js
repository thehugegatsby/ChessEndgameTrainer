// Learn more: https://github.com/testing-library/jest-dom
require("@testing-library/jest-dom");

// Mock für Web Worker (Node.js compatible)
const mockWorker = {
  postMessage: jest.fn(),
  addEventListener: jest.fn((event, callback) => {
    if (event === "message") {
      mockWorker.onmessage = callback;
    } else if (event === "error") {
      mockWorker.onerror = callback;
    }
  }),
  removeEventListener: jest.fn(),
  terminate: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn(),
};

// Reset mock before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockWorker.onmessage = jest.fn();
  mockWorker.onerror = jest.fn();
});

global.Worker = jest.fn(() => mockWorker);

// Export mockWorker for use in tests
global.mockWorker = mockWorker;

// NOTE: No fetch mock needed - using Node.js native fetch with MSW
// NOTE: No window/DOM mocks needed - running in Node.js environment

// Mock Next.js router (useRouter)
jest.mock("next/router", () => ({
  /**
   *
   */
  useRouter: () => ({
    query: { id: "test-scenario" },
    push: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/",
    route: "/",
    asPath: "/",
  }),
}));

// Stub console methods that might be called during tests
if (typeof global.alert === "undefined") {
  global.alert = jest.fn();
}
