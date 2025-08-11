/**
 * Tests for core Logger functionality
 *
 * Tests cover:
 * - Log level methods (debug, info, warn, error, fatal)
 * - minLevel filtering
 * - Context management (setContext, clearContext)
 * - ConsoleTransport
 * - Log formatting
 * - Configuration management
 * - withFields functionality
 */

import { createLogger, resetLogger } from "@shared/services/logging/Logger";
import {
  LogLevel,
  type LogEntry,
  type LogTransport,
} from "@shared/services/logging/types";

// Mock transport for testing
class MockTransport implements LogTransport {
  public logs: LogEntry[] = [];

  /**
   * Log entry to mock storage
   * @param entry Log entry to store
   */
  log(entry: LogEntry): void {
    this.logs.push(entry);
  }

  /**
   *
   */
  async flush(): Promise<void> {
    // No-op for mock
  }
}

describe("Logger", () => {
  let mockTransport: MockTransport;
  let consoleSpies: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    // Reset global logger instance
    resetLogger();

    // Create fresh mock transport
    mockTransport = new MockTransport();

    // Spy on console methods
    consoleSpies = {
      debug: jest.spyOn(console, "debug").mockImplementation(),
      info: jest.spyOn(console, "info").mockImplementation(),
      warn: jest.spyOn(console, "warn").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpies).forEach((spy) => spy.mockRestore());
  });

  describe("Method-to-Level Mapping", () => {
    it("should call transport with DEBUG level for debug()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.debug("Debug message");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.DEBUG);
      expect(mockTransport.logs[0].message).toBe("Debug message");
    });

    it("should call transport with INFO level for info()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.info("Info message");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.INFO);
      expect(mockTransport.logs[0].message).toBe("Info message");
    });

    it("should call transport with WARN level for warn()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.warn("Warning message");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.WARN);
      expect(mockTransport.logs[0].message).toBe("Warning message");
    });

    it("should call transport with ERROR level for error()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.error("Error message");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.ERROR);
      expect(mockTransport.logs[0].message).toBe("Error message");
    });

    it("should call transport with FATAL level for fatal()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.fatal("Fatal message");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.FATAL);
      expect(mockTransport.logs[0].message).toBe("Fatal message");
    });
  });

  describe("minLevel Filtering", () => {
    it("should filter out DEBUG messages when minLevel is INFO", () => {
      const logger = createLogger({
        minLevel: LogLevel.INFO,
        transports: [mockTransport],
      });

      logger.debug("Should be ignored");
      logger.info("Should be logged");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].message).toBe("Should be logged");
    });

    it("should filter out DEBUG and INFO messages when minLevel is WARN", () => {
      const logger = createLogger({
        minLevel: LogLevel.WARN,
        transports: [mockTransport],
      });

      logger.debug("Should be ignored");
      logger.info("Should be ignored");
      logger.warn("Should be logged");
      logger.error("Should be logged");

      expect(mockTransport.logs).toHaveLength(2);
      expect(mockTransport.logs[0].message).toBe("Should be logged");
      expect(mockTransport.logs[1].message).toBe("Should be logged");
    });

    it("should log all levels when minLevel is DEBUG", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");
      logger.fatal("Fatal");

      expect(mockTransport.logs).toHaveLength(5);
    });
  });

  describe("Context Management", () => {
    it("should add context to log entries with setContext()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      const contextLogger = logger.setContext("UserService");
      contextLogger.info("User action");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].context).toBe("UserService");
    });

    it("should clear context with clearContext()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      const contextLogger = logger.setContext("UserService");
      contextLogger.info("With context");

      contextLogger.clearContext();
      contextLogger.info("Without context");

      expect(mockTransport.logs).toHaveLength(2);
      expect(mockTransport.logs[0].context).toBe("UserService");
      expect(mockTransport.logs[1].context).toBeUndefined();
    });

    it("should preserve context across multiple log calls", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      const contextLogger = logger.setContext("PaymentService");
      contextLogger.info("Processing payment");
      contextLogger.warn("Payment delayed");
      contextLogger.error("Payment failed");

      expect(mockTransport.logs).toHaveLength(3);
      expect(
        mockTransport.logs.every((log) => log.context === "PaymentService"),
      ).toBe(true);
    });
  });

  describe("Data and Error Handling", () => {
    it("should include data object in log entry", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      const data = { userId: 123, action: "login" };
      logger.info("User logged in", data);

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].data).toEqual(data);
    });

    it("should include error details in log entry", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      const error = new Error("Connection failed");
      logger.error("Database error", error);

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].error).toEqual(error);
      expect(mockTransport.logs[0].stack).toBeDefined();
    });

    it("should handle error passed as data", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      const error = new Error("Connection failed");
      logger.error("Database error", error, { retries: 3 });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].error).toEqual(error);
      expect(mockTransport.logs[0].data).toEqual({ retries: 3 });
    });
  });

  describe("ConsoleTransport", () => {
    it("should log to console.info for INFO level", () => {
      const logger = createLogger({
        minLevel: LogLevel.INFO,
        enableConsole: true,
        enableRemote: false,
      });

      logger.info("Console info message");

      expect(consoleSpies.info).toHaveBeenCalled();
      const call = consoleSpies.info.mock.calls[0];
      expect(call[0]).toContain("INFO");
      expect(call[0]).toContain("Console info message");
    });

    it("should log to console.debug for DEBUG level", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        enableConsole: true,
        enableRemote: false,
      });

      logger.debug("Console debug message");

      expect(consoleSpies.debug).toHaveBeenCalled();
      const call = consoleSpies.debug.mock.calls[0];
      expect(call[0]).toContain("DEBUG");
      expect(call[0]).toContain("Console debug message");
    });

    it("should log to console.warn for WARN level", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        enableConsole: true,
        enableRemote: false,
      });

      logger.warn("Console warning");

      expect(consoleSpies.warn).toHaveBeenCalled();
      const call = consoleSpies.warn.mock.calls[0];
      expect(call[0]).toContain("WARN");
      expect(call[0]).toContain("Console warning");
    });

    it("should log to console.error for ERROR and FATAL levels", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        enableConsole: true,
        enableRemote: false,
      });

      logger.error("Console error");
      logger.fatal("Console fatal");

      expect(consoleSpies.error).toHaveBeenCalledTimes(2);
      expect(consoleSpies.error.mock.calls[0][0]).toContain("ERROR");
      expect(consoleSpies.error.mock.calls[1][0]).toContain("FATAL");
    });

    it("should include context in console output", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        enableConsole: true,
        enableRemote: false,
      });

      const contextLogger = logger.setContext("TestContext");
      contextLogger.info("Message with context");

      expect(consoleSpies.info).toHaveBeenCalled();
      const call = consoleSpies.info.mock.calls[0];
      expect(call[0]).toContain("[TestContext]");
    });
  });

  describe("Configuration", () => {
    it("should return current configuration with getConfig()", () => {
      const config = {
        minLevel: LogLevel.WARN,
        enableConsole: false,
        enableRemote: true,
        remoteEndpoint: "https://logs.example.com",
      };

      const logger = createLogger(config);
      const returnedConfig = logger.getConfig();

      expect(returnedConfig.minLevel).toBe(config.minLevel);
      expect(returnedConfig.enableConsole).toBe(config.enableConsole);
      expect(returnedConfig.enableRemote).toBe(config.enableRemote);
    });

    it("should update configuration with updateConfig()", () => {
      const logger = createLogger({
        minLevel: LogLevel.INFO,
        transports: [mockTransport],
      });

      // Log should be filtered
      logger.debug("Should be filtered");
      expect(mockTransport.logs).toHaveLength(0);

      // Update config to allow DEBUG and keep the same transport
      logger.updateConfig({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      // Now debug should work
      logger.debug("Should be logged");
      expect(mockTransport.logs).toHaveLength(1);
    });
  });

  describe("withFields", () => {
    it("should create a child logger with additional fields", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      const childLogger = logger.withFields({ requestId: "abc123" });
      childLogger.info("Request processed");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].data).toEqual({ requestId: "abc123" });
    });

    it("should merge fields with log-specific data", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      const childLogger = logger.withFields({ service: "api" });
      childLogger.info("Request received", { path: "/users" });

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].data).toEqual({
        service: "api",
        path: "/users",
      });
    });
  });

  describe("Log Storage", () => {
    it("should store logs in memory", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.info("First log");
      logger.warn("Second log");

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe("First log");
      expect(logs[1].message).toBe("Second log");
    });

    it("should respect maxLogSize configuration", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        maxLogSize: 2,
        transports: [mockTransport],
      });

      logger.info("Log 1");
      logger.info("Log 2");
      logger.info("Log 3");

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe("Log 2");
      expect(logs[1].message).toBe("Log 3");
    });

    it("should filter logs with getLogs(filter)", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.debug("Debug message");
      logger.info("Info message");
      logger.error("Error message");

      const errorLogs = logger.getLogs({ minLevel: LogLevel.ERROR });
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe("Error message");
    });

    it("should clear logs with clearLogs()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.info("Test log");
      expect(logger.getLogs()).toHaveLength(1);

      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe("Performance Timing", () => {
    it("should measure time with time() and timeEnd()", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.time("operation");

      // Simulate some delay
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait
      }

      logger.timeEnd("operation");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.DEBUG);
      expect(mockTransport.logs[0].message).toContain("operation:");
      expect((mockTransport.logs[0].data as any).duration).toBeGreaterThan(0);
    });

    it("should warn if timer does not exist", () => {
      const logger = createLogger({
        minLevel: LogLevel.DEBUG,
        transports: [mockTransport],
      });

      logger.timeEnd("nonexistent");

      expect(mockTransport.logs).toHaveLength(1);
      expect(mockTransport.logs[0].level).toBe(LogLevel.WARN);
      expect(mockTransport.logs[0].message).toContain(
        "Timer 'nonexistent' does not exist",
      );
    });
  });
});
