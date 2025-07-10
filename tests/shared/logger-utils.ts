/**
 * @fileoverview Test Logger Utilities
 * @description Provides reusable logger implementations for testing
 * 
 * Benefits:
 * - Single Source of Truth for test loggers
 * - Type-safe implementations that stay in sync with ILogger interface
 * - Prevents duplication and inconsistencies across test files
 */

import { ILogger, LoggerConfig, LogLevel } from '../../shared/services/logging/types';

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
    maxLogSize: 0
  };
}

/**
 * A complete no-op logger implementation for use in tests
 * All methods are no-ops and configuration is minimal
 */
export const noopLogger: ILogger = {
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
  withFields: () => noopLogger
} satisfies ILogger;

/**
 * Creates a silent logger that only logs FATAL messages
 * Useful for tests where you want to suppress all but critical errors
 */
export function createSilentLogger(): ILogger {
  return {
    ...noopLogger,
    getConfig: () => ({
      minLevel: LogLevel.FATAL,
      enableConsole: false,
      enableRemote: false,
      enableFileLogging: false,
      maxLogSize: 0
    })
  } satisfies ILogger;
}

/**
 * Creates a test logger that captures logs in memory for assertions
 * Useful for tests that need to verify logging behavior
 */
export function createTestLogger(): ILogger {
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
    
    setContext: function() { return this; },
    clearContext: () => {},
    
    getConfig: () => ({
      minLevel: LogLevel.DEBUG, // Capture all levels
      enableConsole: false,
      enableRemote: false,
      enableFileLogging: false,
      maxLogSize: 1000
    }),
    updateConfig: () => {},
    
    getLogs: () => logs.map(log => ({
      level: log.level,
      message: log.message,
      timestamp: new Date(),
      data: log.data
    })),
    clearLogs: () => { logs.length = 0; },
    
    time: () => {},
    timeEnd: () => {},
    
    withFields: function() { return this; }
  } satisfies ILogger;
}

/**
 * Creates a debug logger for development that outputs to console
 * WARNING: Only use during test development, not in CI
 */
export function createDebugLogger(): ILogger {
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
      maxLogSize: 0
    })
  } satisfies ILogger;
}