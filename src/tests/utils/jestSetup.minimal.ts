import { vi } from 'vitest';
/**
 * Minimal Jest Setup - Temporary while fixing tests
 */

import "@testing-library/jest-dom";

// Mock console to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Setup basic test environment
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});