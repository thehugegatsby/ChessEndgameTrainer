/**
 * @fileoverview Test Logger Utilities
 * @description Provides reusable logger implementations for testing
 *
 * Benefits:
 * - Single Source of Truth for test loggers
 * - Type-safe implementations that stay in sync with ILogger interface
 * - Prevents duplication and inconsistencies across test files
 */

import {
  type Logger,
  type LoggerConfig,
  LogLevel,
} from "../../shared/services/logging/types";

/**
 * Creates a no-op logger configuration with all features disabled
 * @returns A minimal LoggerConfig suitable for tests that don't need logging
 */
export function createNoopLoggerConfig(): LoggerConfig {
  return {
    minLevel: LogLevel.FATAL, // Highest level to ensure nothing is logged
    enableConsole: false,
    enableRemote: false,
    enableFileLogging: false,
    maxLogSize: 0,
  };
}

/**
 * A complete no-op logger implementation for use in tests
 * All methods are no-ops and configuration is minimal
 */
export const noopLogger: Logger = {
  // Logging methods - all no-op
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},

  // Context management
  setContext: () => noopLogger,
  clearContext: () => {},

  // Configuration
  getConfig: createNoopLoggerConfig,
  updateConfig: () => {},

  // Log management
  getLogs: () => [],
  clearLogs: () => {},

  // Performance logging (if part of interface)
  time: () => {},
  timeEnd: () => {},

  // Structured logging (if part of interface)
  withFields: () => noopLogger,
} satisfies ILogger;

/**
 * Creates a silent logger that only logs FATAL messages
 * Useful for tests where you want to suppress all but critical errors
 */
export function createSilentLogger(): Logger {
  return {
    ...noopLogger,
    getConfig: () => ({
      minLevel: LogLevel.FATAL,
      enableConsole: false,
      enableRemote: false,
      enableFileLogging: false,
      maxLogSize: 0,
    }),
  } satisfies Logger;
}

/**
 * Creates a test logger that captures logs in memory for assertions
 * Useful for tests that need to verify logging behavior
 */
export function createTestLogger(): Logger {
  const logs: Array<{ level: LogLevel; message: string; data?: any }> = [];

  const logMethod = (level: LogLevel) => (message: string, data?: any) => {
    logs.push({ level, message, data });
  };

  return {
    debug: logMethod(LogLevel.DEBUG),
    info: logMethod(LogLevel.INFO),
    warn: logMethod(LogLevel.WARN),
    error: logMethod(LogLevel.ERROR),
    fatal: logMethod(LogLevel.FATAL),

    setContext: function () {
      return this;
    },
    clearContext: () => {},

    getConfig: () => ({
      minLevel: LogLevel.DEBUG, // Capture all levels
      enableConsole: false,
      enableRemote: false,
      enableFileLogging: false,
      maxLogSize: 1000,
    }),
    updateConfig: () => {},

    getLogs: () =>
      logs.map((log) => ({
        level: log.level,
        message: log.message,
        timestamp: new Date(),
        data: log.data,
      })),
    clearLogs: () => {
      logs.length = 0;
    },

    time: () => {},
    timeEnd: () => {},

    withFields: function () {
      return this;
    },
  } satisfies Logger;
}

/**
 * Creates a debug logger for development that outputs to console
 * WARNING: Only use during test development, not in CI
 */
export function createDebugLogger(): Logger {
  return {
    ...noopLogger,
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    fatal: console.error,

    getConfig: () => ({
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: false,
      enableFileLogging: false,
      maxLogSize: 0,
    }),
  } satisfies Logger;
}

/**
 * Performance-optimized factory function for Jest mock definitions
 * Returns a reusable mock logger definition that's compatible with clearMocks: true
 *
 * @description This factory creates a standardized logger mock that:
 * - Works correctly with Jest's clearMocks: true configuration
 * - Provides consistent mock behavior across all test files
 * - Optimizes performance by reusing mock function definitions
 * - Maintains type safety with the ILogger interface
 *
 * @returns A Jest-compatible mock object for the logging service
 *
 * @example
 * ```typescript
 * // In your test file:
 * vi.mock('../../../shared/services/logging', getMockLoggerDefinition);
 * ```
 */
export function getMockLoggerDefinition() {
  // Pre-create mock functions for reuse across test instances
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    setContext: vi.fn().mockReturnThis(),
    clearContext: vi.fn(),
    getConfig: vi.fn(() => createNoopLoggerConfig()),
    updateConfig: vi.fn(),
    getLogs: vi.fn(() => []),
    clearLogs: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    withFields: vi.fn().mockReturnThis(),
  };

  return () => ({
    getLogger: vi.fn(() => mockLogger),
    createLogger: vi.fn(() => mockLogger),
    resetLogger: vi.fn(),
  });
}

/**
 * Simplified mock logger definition for basic use cases
 * Use when you don't need advanced logger features or performance optimization
 *
 * @returns A minimal Jest mock for the logging service
 */
export function getBasicMockLoggerDefinition() {
  return () => ({
    getLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      setContext: vi.fn().mockReturnThis(),
      clearContext: vi.fn(),
    })),
  });
}
