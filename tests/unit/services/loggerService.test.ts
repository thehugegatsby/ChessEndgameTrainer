/**
 * @fileoverview Tests for Logger service
 * @description Comprehensive tests for structured logging functionality
 */

import { Logger, createLogger, getLogger, resetLogger } from '@/services/logging/Logger';
import { LogLevel } from '@/services/logging/types';

// Mock platform detection
jest.mock('@/services/platform', () => ({
  getPlatformDetection: jest.fn(() => ({
    isWeb: () => true,
    isMobile: () => false,
    isAndroid: () => false,
    isIOS: () => false
  }))
}));

describe('Logger', () => {
  let logger: Logger;
  
  beforeEach(() => {
    resetLogger();
    logger = createLogger({
      minLevel: LogLevel.DEBUG,
      enableConsole: false, // Disable console for tests
      enableRemote: false
    }) as Logger;
    
    // Mock console methods
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { key: 'value' });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].data).toEqual({ key: 'value' });
    });

    it('should log info messages', () => {
      logger.info('Info message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Info message');
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe('Warning message');
    });

    it('should log error messages with error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { context: 'test' });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Error occurred');
      expect(logs[0].error).toBe(error);
      expect(logs[0].stack).toBe(error.stack);
      expect(logs[0].data).toEqual({ context: 'test' });
    });

    it('should log fatal messages', () => {
      logger.fatal('Fatal error');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.FATAL);
      expect(logs[0].message).toBe('Fatal error');
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect minimum log level', () => {
      const warnLogger = createLogger({ minLevel: LogLevel.WARN });
      
      warnLogger.debug('Should be filtered');
      warnLogger.info('Should be filtered');
      warnLogger.warn('Should be logged');
      warnLogger.error('Should be logged');
      
      const logs = warnLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[1].level).toBe(LogLevel.ERROR);
    });
  });

  describe('Context Logging', () => {
    it('should set and use context', () => {
      const contextLogger = logger.setContext('TestContext');
      contextLogger.info('Message with context');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBe('TestContext');
    });

    it('should filter by context whitelist', () => {
      const filteredLogger = createLogger({
        contextWhitelist: ['AllowedContext']
      });
      
      const allowedLogger = filteredLogger.setContext('AllowedContext');
      const blockedLogger = filteredLogger.setContext('BlockedContext');
      
      allowedLogger.info('Should be logged');
      blockedLogger.info('Should be filtered');
      
      const logs = filteredLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBe('AllowedContext');
    });

    it('should filter by context blacklist', () => {
      const filteredLogger = createLogger({
        contextBlacklist: ['BlockedContext']
      });
      
      const normalLogger = filteredLogger.setContext('NormalContext');
      const blockedLogger = filteredLogger.setContext('BlockedContext');
      
      normalLogger.info('Should be logged');
      blockedLogger.info('Should be filtered');
      
      const logs = filteredLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBe('NormalContext');
    });
  });

  describe('Performance Timing', () => {
    it('should measure timing', () => {
      logger.time('testOperation');
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {} // Wait 10ms
      
      logger.timeEnd('testOperation');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('testOperation:');
      expect(logs[0].data?.duration).toBeGreaterThan(0);
    });

    it('should warn about non-existent timers', () => {
      logger.timeEnd('nonExistentTimer');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toContain('does not exist');
    });
  });

  describe('Field Logger', () => {
    it('should add fields to all logs', () => {
      const fieldLogger = logger.withFields({ userId: '123', sessionId: 'abc' });
      fieldLogger.info('Test message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].data).toEqual({ userId: '123', sessionId: 'abc' });
    });

    it('should merge fields with log data', () => {
      const fieldLogger = logger.withFields({ global: 'value' });
      fieldLogger.info('Test message', { local: 'data' });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].data).toEqual({ global: 'value', local: 'data' });
    });
  });

  describe('Log Management', () => {
    it('should limit log entry count', () => {
      const limitedLogger = createLogger({ maxLogSize: 3 });
      
      limitedLogger.info('Log 1');
      limitedLogger.info('Log 2');
      limitedLogger.info('Log 3');
      limitedLogger.info('Log 4'); // Should push out Log 1
      
      const logs = limitedLogger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Log 2');
      expect(logs[2].message).toBe('Log 4');
    });

    it('should clear logs', () => {
      logger.info('Test message');
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('Log Filtering', () => {
    beforeEach(() => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
    });

    it('should filter by log level', () => {
      const filtered = logger.getLogs({
        minLevel: LogLevel.WARN,
        maxLevel: LogLevel.ERROR
      });
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].level).toBe(LogLevel.WARN);
      expect(filtered[1].level).toBe(LogLevel.ERROR);
    });

    it('should filter by search text', () => {
      const filtered = logger.getLogs({
        searchText: 'warning'
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].message).toBe('Warning message');
    });

    it('should filter by time range', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneMinuteFromNow = new Date(now.getTime() + 60000);
      
      const filtered = logger.getLogs({
        startTime: oneMinuteAgo,
        endTime: oneMinuteFromNow
      });
      
      expect(filtered).toHaveLength(4); // All logs should be within range
    });
  });

  describe('Global Logger', () => {
    it('should return singleton instance', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      
      expect(logger1).toBe(logger2);
    });

    it('should reset global instance', () => {
      const logger1 = getLogger();
      resetLogger();
      const logger2 = getLogger();
      
      expect(logger1).not.toBe(logger2);
    });
  });

  describe('Error Handling', () => {
    it('should handle string errors', () => {
      logger.error('String error', 'This is a string error');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].error).toBeInstanceOf(Error);
      expect(logs[0].error?.message).toBe('This is a string error');
    });

    it('should handle null/undefined errors', () => {
      logger.error('Null error', null);
      logger.error('Undefined error', undefined);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      
      // null and undefined errors should not create error objects
      expect(logs[0].error).toBeUndefined();
      expect(logs[1].error).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const initialConfig = logger.getConfig();
      expect(initialConfig.minLevel).toBe(LogLevel.DEBUG);
      
      logger.updateConfig({ minLevel: LogLevel.ERROR });
      
      const updatedConfig = logger.getConfig();
      expect(updatedConfig.minLevel).toBe(LogLevel.ERROR);
    });

    it('should not log below updated minimum level', () => {
      logger.updateConfig({ minLevel: LogLevel.ERROR });
      
      logger.debug('Should be filtered');
      logger.info('Should be filtered');
      logger.warn('Should be filtered');
      logger.error('Should be logged');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
    });
  });
});