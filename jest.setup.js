// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom')

// Mock für Web Worker
const mockWorker = {
  postMessage: jest.fn(),
  addEventListener: jest.fn((event, callback) => {
    if (event === 'message') {
      mockWorker.onmessage = callback;
    } else if (event === 'error') {
      mockWorker.onerror = callback;
    }
  }),
  removeEventListener: jest.fn(),
  terminate: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn()
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

// Mock für fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true
  })
);

// Mock für ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock für window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router (useRouter)
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: 'test-scenario' },
    push: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    route: '/',
    asPath: '/',
  }),
}));

// Stub window.alert for tests
global.alert = jest.fn(); 