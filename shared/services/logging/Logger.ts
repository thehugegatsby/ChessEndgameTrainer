/**
 * @file Core Logger implementation
 * @module services/logging/Logger
 * 
 * @description
 * Provides structured, multi-level logging with different transports.
 * Supports console, file, and remote logging with configurable log levels,
 * filtering, and formatting. Designed for both development and production use.
 * 
 * @remarks
 * Key features:
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR)
 * - Contextual logging with metadata
 * - Configurable transports (console, file, remote)
 * - Circular buffer for log history
 * - Error tracking with stack traces
 * - Performance monitoring
 * - Filtered logging by context or level
 */

import {
  ILogger,
  LogLevel,
  LogEntry,
  LoggerConfig,
  LogFilter,
  ILogTransport,
  ILogFormatter,
} from "./types";
import { getPlatformDetection } from "../platform";

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel:
    process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: false,
  enableFileLogging: false,
  maxLogSize: 1000,
};

/**
 * Default log formatter implementation
 * 
 * @class DefaultLogFormatter
 * @implements {ILogFormatter}
 * 
 * @description
 * Formats log entries into human-readable strings with timestamp,
 * level, context, message, and optional data/error information.
 */
class DefaultLogFormatter implements ILogFormatter {
  /**
   * Formats a log entry into a string
   * 
   * @param {LogEntry} entry - The log entry to format
   * @returns {string} Formatted log message
   * 
   * @example
   * ```typescript
   * const formatter = new DefaultLogFormatter();
   * const formatted = formatter.format({
   *   timestamp: new Date(),
   *   level: LogLevel.INFO,
   *   message: "User logged in",
   *   context: "Auth",
   *   data: { userId: 123 }
   * });
   * // "2024-01-20T10:30:00.000Z INFO [Auth] User logged in { userId: 123 }"
   * ```
   */
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : "";

    let message = `${timestamp} ${level} ${context} ${entry.message}`;

    if (entry.data) {
      try {
        message += ` ${JSON.stringify(entry.data, null, 2)}`;
      } catch (e) {
        // Fallback for circular references or other stringify errors
        message += ` ${String(entry.data)}`;
      }
    }

    if (entry.error) {
      message += ` Error: ${entry.error.message}`;
      if (entry.stack) {
        message += `\nStack: ${entry.stack}`;
      }
    }

    return message;
  }
}

/**
 * Console transport implementation for logging
 * 
 * @class ConsoleTransport
 * @implements {ILogTransport}
 * 
 * @description
 * Outputs log entries to the browser console with appropriate log levels.
 * Uses native console methods (debug, info, warn, error) based on log level
 * for better developer experience.
 * 
 * @example
 * ```typescript
 * const transport = new ConsoleTransport();
 * transport.log({
 *   level: LogLevel.INFO,
 *   message: "Application started",
 *   timestamp: new Date(),
 *   context: "Main"
 * });
 * ```
 */
class ConsoleTransport implements ILogTransport {
  private formatter: ILogFormatter;

  /**
   * Creates a new console transport
   * 
   * @param {ILogFormatter} [formatter] - Optional custom formatter, defaults to DefaultLogFormatter
   */
  constructor(formatter?: ILogFormatter) {
    this.formatter = formatter || new DefaultLogFormatter();
  }

  /**
   * Logs an entry to the console
   * 
   * @param {LogEntry} entry - The log entry to output
   * 
   * @remarks
   * Maps log levels to appropriate console methods:
   * - DEBUG → console.debug()
   * - INFO → console.info()
   * - WARN → console.warn()
   * - ERROR/FATAL → console.error()
   * 
   * If the entry contains data, it's logged as a second parameter
   * for better console formatting.
   */
  log(entry: LogEntry): void {
    const formatted = this.formatter.format(entry);

    // If there's additional data, log it separately for better visibility
    if (entry.data) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formatted, entry.data);
          break;
        case LogLevel.INFO:
          console.info(formatted, entry.data);
          break;
        case LogLevel.WARN:
          console.warn(formatted, entry.data);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted, entry.data);
          break;
      }
    } else {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted);
          break;
      }
    }
  }

  /**
   * Flushes pending logs (no-op for console transport)
   * 
   * @returns {Promise<void>} Resolves immediately as console has no buffer
   * 
   * @remarks
   * Console transport writes immediately, so no flushing is needed.
   * This method exists to satisfy the ILogTransport interface.
   */
  async flush(): Promise<void> {
    // Console doesn't need flushing
  }
}

/**
 * Remote transport implementation for centralized logging
 * 
 * @class RemoteTransport
 * @implements {ILogTransport}
 * 
 * @description
 * Buffers log entries and sends them to a remote endpoint in batches.
 * Includes retry logic and maintains chronological order of logs.
 * Useful for production monitoring and debugging.
 * 
 * @example
 * ```typescript
 * const transport = new RemoteTransport('https://logs.myapp.com/ingest');
 * transport.log({
 *   level: LogLevel.ERROR,
 *   message: "Database connection failed",
 *   timestamp: new Date(),
 *   error: new Error("Connection timeout")
 * });
 * // Logs are buffered and sent in batches
 * await transport.flush(); // Force send pending logs
 * ```
 */
class RemoteTransport implements ILogTransport {
  private buffer: LogEntry[] = [];
  private batchSize = 50;
  private endpoint: string;
  private isFlushing = false;

  /**
   * Creates a new remote transport
   * 
   * @param {string} endpoint - The URL to send logs to
   * 
   * @example
   * ```typescript
   * const transport = new RemoteTransport('https://logs.myapp.com/ingest');
   * ```
   */
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * Adds a log entry to the buffer and triggers flush if needed
   * 
   * @param {LogEntry} entry - The log entry to buffer
   * 
   * @remarks
   * Logs are buffered until batch size is reached, then automatically
   * sent to the remote endpoint. Use flush() to send immediately.
   */
  log(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flush().catch(console.error);
    }
  }

  /**
   * Flushes buffered logs to the remote endpoint
   * 
   * @returns {Promise<void>} Resolves when flush completes or fails
   * 
   * @remarks
   * - Prevents concurrent flushes
   * - Preserves log order on failure by re-buffering
   * - Uses console.error as fallback for logging failures
   * - Automatically called when buffer reaches batch size
   * 
   * @example
   * ```typescript
   * // Force send all pending logs
   * await transport.flush();
   * 
   * // Ensure logs are sent before shutdown
   * process.on('SIGTERM', async () => {
   *   await transport.flush();
   *   process.exit(0);
   * });
   * ```
   */
  async flush(): Promise<void> {
    // Prevent concurrent flushes and exit if there's nothing to do
    if (this.isFlushing || this.buffer.length === 0 || !this.endpoint) {
      return;
    }

    this.isFlushing = true;

    // Atomically grab the current logs and clear the buffer for new entries
    const entriesToFlush = [...this.buffer];
    this.buffer.length = 0;

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: entriesToFlush }),
      });

      if (!response.ok) {
        // The request was made, but the server responded with an error
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      // FALLBACK: Using console.error as last resort when logging infrastructure itself fails
      // This prevents infinite loops and ensures critical logging failures are still visible
      console.error("Failed to send logs to remote:", error);

      // If the request fails, put the logs back at the front of the buffer to be retried
      // This preserves chronological order
      this.buffer.unshift(...entriesToFlush);
    } finally {
      // Ensure we always reset the flushing state
      this.isFlushing = false;
    }
  }
}

/**
 * Main Logger implementation
 * 
 * @class Logger
 * @implements {ILogger}
 * 
 * @description
 * Core logging service providing structured, multi-level logging with
 * configurable transports, contexts, and filtering. Supports development
 * and production use cases with features like timing, field enrichment,
 * and log buffering.
 * 
 * @example
 * ```typescript
 * // Create a logger with custom configuration
 * const logger = new Logger({
 *   minLevel: LogLevel.INFO,
 *   enableRemote: true,
 *   remoteEndpoint: 'https://logs.myapp.com/ingest'
 * });
 * 
 * // Create a context-specific logger
 * const authLogger = logger.setContext('AuthService');
 * 
 * // Log with structured data
 * authLogger.info('User authenticated', {
 *   userId: 123,
 *   method: 'OAuth2'
 * });
 * 
 * // Measure performance
 * logger.time('api-call');
 * await fetchData();
 * logger.timeEnd('api-call');
 * ```
 */
export class Logger implements ILogger {
  private config: LoggerConfig;
  private context?: string;
  private logs: LogEntry[] = [];
  private transports: ILogTransport[] = [];
  private timers: Map<string, number> = new Map();
  private fields: Record<string, any> = {};

  /**
   * Creates a new logger instance
   * 
   * @param {Partial<LoggerConfig>} [config] - Configuration options
   * 
   * @example
   * ```typescript
   * // Default logger
   * const logger = new Logger();
   * 
   * // Production logger with custom config
   * const prodLogger = new Logger({
   *   minLevel: LogLevel.WARN,
   *   enableRemote: true,
   *   remoteEndpoint: 'https://logs.myapp.com',
   *   maxLogSize: 5000
   * });
   * ```
   */
  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Use injected transports if provided, otherwise setup default transports
    if (config?.transports && config.transports.length > 0) {
      this.transports = config.transports;
    } else {
      this.setupTransports();
    }
  }

  /**
   * Sets up logging transports based on configuration
   * 
   * @private
   * @remarks
   * Called during initialization and when configuration changes.
   * Creates console and/or remote transports as configured.
   */
  private setupTransports(): void {
    this.transports = [];

    if (this.config.enableConsole) {
      this.transports.push(new ConsoleTransport());
    }

    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.transports.push(new RemoteTransport(this.config.remoteEndpoint));
    }
  }

  /**
   * Determines if a log entry should be processed
   * 
   * @private
   * @param {LogLevel} level - The log level to check
   * @param {string} [context] - Optional context to check against filters
   * @returns {boolean} True if the log should be processed
   * 
   * @remarks
   * Checks against minimum level, context whitelist, and blacklist
   */
  private shouldLog(level: LogLevel, context?: string): boolean {
    if (level < this.config.minLevel) return false;

    const logContext = context || this.context;

    if (logContext && this.config.contextWhitelist?.length) {
      return this.config.contextWhitelist.includes(logContext);
    }

    if (logContext && this.config.contextBlacklist?.length) {
      return !this.config.contextBlacklist.includes(logContext);
    }

    return true;
  }

  /**
   * Core logging method used by all public log methods
   * 
   * @private
   * @param {LogLevel} level - The severity level
   * @param {string} message - The log message
   * @param {Error|any} [error] - Optional error object
   * @param {any} [data] - Optional structured data
   * 
   * @remarks
   * - Checks if log should be processed
   * - Creates log entry with metadata
   * - Adds to memory buffer
   * - Sends to all configured transports
   */
  private log(
    level: LogLevel,
    message: string,
    error?: Error | any,
    data?: any,
  ): void {
    if (!this.shouldLog(level, this.context)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      data: { ...this.fields, ...data },
    };

    if (error !== undefined && error !== null) {
      if (error instanceof Error) {
        entry.error = error;
        entry.stack = error.stack;
      } else {
        entry.error = new Error(String(error));
      }
    }

    // Add to memory log
    this.logs.push(entry);
    if (this.logs.length > this.config.maxLogSize) {
      this.logs.shift();
    }

    // Send to transports
    this.transports.forEach((transport) => transport.log(entry));
  }

  /**
   * Logs a message at the DEBUG level.
   *
   * Debug messages are intended for detailed information that is typically only
   * of interest when diagnosing problems or during development. They will be
   * filtered out in production environments unless explicitly enabled.
   *
   * @param {string} message - The primary log message to record.
   * @param {any} [data] - Optional structured data to include with the log entry.
   *   This data will be serialized and attached to the log for additional context.
   * @returns {void}
   * @example
   * // Simple debug message
   * logger.debug('Application initialization complete');
   *
   * @example
   * // Debug message with structured data
   * logger.debug('Processing user request', { userId: 123, requestId: 'abc-xyz' });
   *
   * @see {@link Logger.info} - For general informational messages
   * @see {@link Logger.withFields} - To add persistent fields to all logs
   * @memberof Logger
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, undefined, data);
  }

  /**
   * Logs a message at the INFO level.
   *
   * Info messages are for general informational events that highlight the
   * progress of the application at a coarse-grained level. These are typically
   * shown in production environments.
   *
   * @param {string} message - The primary log message to record.
   * @param {any} [data] - Optional structured data to include with the log entry.
   *   This data will be serialized and attached to the log for additional context.
   * @returns {void}
   * @example
   * // Simple info message
   * logger.info('Server started on port 3000');
   *
   * @example
   * // Info message with structured data
   * logger.info('User logged in', { userId: 456, timestamp: Date.now() });
   *
   * @see {@link Logger.debug} - For detailed debugging information
   * @see {@link Logger.warn} - For warning messages
   * @memberof Logger
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, undefined, data);
  }

  /**
   * Logs a message at the WARN level.
   *
   * Warning messages indicate potentially harmful situations or deprecated usage
   * that should be addressed but don't prevent the application from functioning.
   *
   * @param {string} message - The primary log message to record.
   * @param {any} [data] - Optional structured data to include with the log entry.
   *   This data will be serialized and attached to the log for additional context.
   * @returns {void}
   * @example
   * // Simple warning
   * logger.warn('API rate limit approaching');
   *
   * @example
   * // Warning with context
   * logger.warn('Deprecated method called', { method: 'oldFunction', replacement: 'newFunction' });
   *
   * @see {@link Logger.error} - For error conditions
   * @see {@link Logger.info} - For general information
   * @memberof Logger
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, undefined, data);
  }

  /**
   * Logs a message at the ERROR level.
   *
   * Error messages indicate error conditions that might still allow the application
   * to continue running. Stack traces are automatically captured when an Error
   * object is provided.
   *
   * @param {string} message - The primary log message describing the error.
   * @param {Error|any} [error] - Optional error object or any value that caused the error.
   *   If an Error object is provided, its stack trace will be captured.
   * @param {any} [data] - Optional additional context data about the error.
   * @returns {void}
   * @example
   * // Simple error message
   * logger.error('Failed to connect to database');
   *
   * @example
   * // Error with exception object
   * try {
   *   await connectToDatabase();
   * } catch (err) {
   *   logger.error('Database connection failed', err, { retryCount: 3 });
   * }
   *
   * @see {@link Logger.fatal} - For unrecoverable errors
   * @see {@link Logger.warn} - For warning conditions
   * @memberof Logger
   */
  error(message: string, error?: Error | any, data?: any): void {
    this.log(LogLevel.ERROR, message, error, data);
  }

  /**
   * Logs a message at the FATAL level.
   *
   * Fatal messages indicate severe error conditions that will likely cause the
   * application to abort. These should be reserved for unrecoverable errors.
   *
   * @param {string} message - The primary log message describing the fatal error.
   * @param {Error|any} [error] - Optional error object or any value that caused the fatal error.
   *   If an Error object is provided, its stack trace will be captured.
   * @param {any} [data] - Optional additional context data about the fatal error.
   * @returns {void}
   * @example
   * // Fatal error with process exit
   * logger.fatal('Critical configuration missing');
   * process.exit(1);
   *
   * @example
   * // Fatal error with exception
   * try {
   *   loadCriticalResource();
   * } catch (err) {
   *   logger.fatal('Failed to load critical resource', err, { resource: 'config.json' });
   *   process.exit(1);
   * }
   *
   * @see {@link Logger.error} - For recoverable errors
   * @memberof Logger
   */
  fatal(message: string, error?: Error | any, data?: any): void {
    this.log(LogLevel.FATAL, message, error, data);
  }

  /**
   * Creates a new logger instance with the specified context.
   *
   * The context is a string identifier that helps categorize logs by their source
   * (e.g., module name, component name, service name). The context appears in
   * formatted log output and can be used for filtering. The returned logger
   * shares configuration and log storage with the parent logger.
   *
   * @param {string} context - The context identifier for the new logger instance.
   * @returns {ILogger} A new logger instance with the specified context.
   * @example
   * // Create a logger for a specific module
   * const userLogger = logger.setContext('UserService');
   * userLogger.info('User created'); // Logs: [UserService] User created
   *
   * @example
   * // Create nested contexts
   * const apiLogger = logger.setContext('API');
   * const authLogger = apiLogger.setContext('API.Auth');
   * authLogger.info('Authentication successful');
   *
   * @see {@link Logger.clearContext} - To remove the context
   * @see {@link Logger.withFields} - To add persistent fields
   * @memberof Logger
   */
  setContext(context: string): ILogger {
    const contextLogger = new Logger({
      ...this.config,
      transports: this.transports,
    });
    contextLogger.context = context;
    contextLogger.logs = this.logs; // Share log storage
    contextLogger.fields = { ...this.fields };
    return contextLogger;
  }

  /**
   * Removes the context from this logger instance.
   *
   * After calling this method, logs will no longer include a context identifier.
   * This is useful when transitioning from module-specific logging back to
   * general application logging.
   *
   * @returns {void}
   * @example
   * const moduleLogger = logger.setContext('DataProcessor');
   * moduleLogger.info('Processing started');
   * // ... processing logic ...
   * moduleLogger.clearContext();
   * moduleLogger.info('Back to general logging'); // No context in output
   *
   * @see {@link Logger.setContext} - To set a context
   * @memberof Logger
   */
  clearContext(): void {
    this.context = undefined;
  }

  /**
   * Returns a copy of the current logger configuration.
   *
   * This method provides read-only access to the logger's configuration,
   * including minimum log level, enabled transports, and other settings.
   * The returned object is a shallow copy to prevent external modifications.
   *
   * @returns {LoggerConfig} A copy of the current logger configuration.
   * @example
   * const config = logger.getConfig();
   * console.log('Current log level:', LogLevel[config.minLevel]);
   * console.log('Console logging enabled:', config.enableConsole);
   *
   * @see {@link Logger.updateConfig} - To modify the configuration
   * @memberof Logger
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Updates the logger configuration with the provided settings.
   *
   * This method allows runtime modification of logger behavior, including
   * changing the minimum log level, enabling/disabling transports, and
   * updating other configuration options. Only the provided properties
   * are updated; others retain their current values.
   *
   * @param {Partial<LoggerConfig>} config - Configuration properties to update.
   *   Only specified properties will be changed.
   * @returns {void}
   * @example
   * // Change minimum log level to WARN in production
   * if (process.env.NODE_ENV === 'production') {
   *   logger.updateConfig({ minLevel: LogLevel.WARN });
   * }
   *
   * @example
   * // Enable remote logging with custom endpoint
   * logger.updateConfig({
   *   enableRemote: true,
   *   remoteEndpoint: 'https://logs.myapp.com/ingest'
   * });
   *
   * @see {@link Logger.getConfig} - To read current configuration
   * @memberof Logger
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // Only setup transports if no custom transports were provided
    if (!config.transports) {
      this.setupTransports();
    } else {
      this.transports = config.transports;
    }
  }

  /**
   * Retrieves stored log entries, optionally filtered by criteria.
   *
   * This method returns logs that have been stored in memory (up to maxLogSize).
   * When a filter is provided, only logs matching ALL specified criteria are returned.
   * The returned array is a copy to prevent external modifications.
   *
   * @param {LogFilter} [filter] - Optional filter criteria to apply.
   * @param {LogLevel} [filter.minLevel] - Minimum log level to include.
   * @param {LogLevel} [filter.maxLevel] - Maximum log level to include.
   * @param {string} [filter.context] - Only include logs with this exact context.
   * @param {Date} [filter.startTime] - Only include logs after this time.
   * @param {Date} [filter.endTime] - Only include logs before this time.
   * @param {string} [filter.searchText] - Text to search for in message, context, or data.
   * @returns {LogEntry[]} Array of log entries matching the filter criteria.
   * @example
   * // Get all stored logs
   * const allLogs = logger.getLogs();
   *
   * @example
   * // Get only error and fatal logs
   * const errors = logger.getLogs({ minLevel: LogLevel.ERROR });
   *
   * @example
   * // Get logs from the last hour containing "user"
   * const recentUserLogs = logger.getLogs({
   *   startTime: new Date(Date.now() - 3600000),
   *   searchText: 'user'
   * });
   *
   * @see {@link Logger.clearLogs} - To remove all stored logs
   * @memberof Logger
   */
  getLogs(filter?: LogFilter): LogEntry[] {
    if (!filter) return [...this.logs];

    return this.logs.filter((log) => {
      if (filter.minLevel !== undefined && log.level < filter.minLevel)
        return false;
      if (filter.maxLevel !== undefined && log.level > filter.maxLevel)
        return false;
      if (filter.context && log.context !== filter.context) return false;
      if (filter.startTime && log.timestamp < filter.startTime) return false;
      if (filter.endTime && log.timestamp > filter.endTime) return false;
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const inMessage = log.message.toLowerCase().includes(searchLower);
        const inContext = log.context?.toLowerCase().includes(searchLower);
        const inData = JSON.stringify(log.data)
          .toLowerCase()
          .includes(searchLower);
        return inMessage || inContext || inData;
      }
      return true;
    });
  }

  /**
   * Removes all stored log entries from memory.
   *
   * This method clears the internal log buffer. It does not affect logs
   * that have already been sent to transports (console, remote, etc.).
   * Useful for testing or when you want to free memory.
   *
   * @returns {void}
   * @example
   * // Clear logs after processing
   * const logs = logger.getLogs();
   * await processLogs(logs);
   * logger.clearLogs();
   *
   * @see {@link Logger.getLogs} - To retrieve stored logs
   * @memberof Logger
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Starts a timer with the specified label.
   *
   * Creates a named timer that can be used to measure the duration of operations.
   * The timer continues until {@link Logger.timeEnd} is called with the same label.
   * Multiple timers can run concurrently with different labels.
   *
   * @param {string} label - Unique identifier for this timer.
   * @returns {void}
   * @example
   * logger.time('apiCall');
   * const result = await fetchDataFromAPI();
   * logger.timeEnd('apiCall'); // Logs: "apiCall: 234.56ms"
   *
   * @example
   * // Nested timers for detailed performance analysis
   * logger.time('fullProcess');
   * logger.time('step1');
   * await processStep1();
   * logger.timeEnd('step1');
   * logger.time('step2');
   * await processStep2();
   * logger.timeEnd('step2');
   * logger.timeEnd('fullProcess');
   *
   * @see {@link Logger.timeEnd} - To stop the timer and log duration
   * @memberof Logger
   */
  time(label: string): void {
    this.timers.set(label, performance.now());
  }

  /**
   * Stops a timer and logs the elapsed time.
   *
   * Stops the timer identified by the label and logs the duration at DEBUG level.
   * If the timer doesn't exist, a warning is logged instead. The timer is
   * automatically removed after logging.
   *
   * @param {string} label - The identifier of the timer to stop.
   * @returns {void}
   * @example
   * logger.time('databaseQuery');
   * const users = await db.query('SELECT * FROM users');
   * logger.timeEnd('databaseQuery'); // Logs: "databaseQuery: 45.23ms"
   *
   * @example
   * // Handling non-existent timer
   * logger.timeEnd('nonExistentTimer'); // Logs warning: "Timer 'nonExistentTimer' does not exist"
   *
   * @see {@link Logger.time} - To start a timer
   * @memberof Logger
   */
  timeEnd(label: string): void {
    const start = this.timers.get(label);
    if (start === undefined) {
      this.warn(`Timer '${label}' does not exist`);
      return;
    }

    const duration = performance.now() - start;
    this.timers.delete(label);

    this.debug(`${label}: ${duration.toFixed(2)}ms`, { duration });
  }

  /**
   * Creates a new logger instance with additional persistent fields.
   *
   * The returned logger will automatically include the specified fields in
   * every log entry. This is useful for adding consistent metadata like
   * request IDs, user IDs, or session information. Fields are merged with
   * any fields provided directly to log methods.
   *
   * @param {Record<string, any>} fields - Key-value pairs to include in all logs
   *   from the returned logger instance.
   * @returns {ILogger} A new logger instance with the additional fields.
   * @example
   * // Add request ID to all logs for a request handler
   * app.use((req, res, next) => {
   *   req.logger = logger.withFields({ requestId: req.id });
   *   next();
   * });
   *
   * @example
   * // Chain with setContext for rich logging
   * const userLogger = logger
   *   .setContext('UserService')
   *   .withFields({ userId: user.id, sessionId: session.id });
   * userLogger.info('User action performed'); // Includes context and fields
   *
   * @see {@link Logger.setContext} - To add a context identifier
   * @memberof Logger
   */
  withFields(fields: Record<string, any>): ILogger {
    const fieldLogger = new Logger({
      ...this.config,
      transports: this.transports,
    });
    fieldLogger.context = this.context;
    fieldLogger.logs = this.logs;
    fieldLogger.fields = { ...this.fields, ...fields };
    return fieldLogger;
  }

  /**
   * Flushes all pending logs from all transports.
   *
   * This asynchronous method ensures that any buffered logs are written to their
   * destinations. It's crucial to call this before application shutdown to prevent
   * log loss. The method waits for all transports to complete their flush operations.
   *
   * @returns {Promise<void>} A promise that resolves when all transports have
   *   successfully flushed their buffers.
   * @throws {Error} If any transport fails to flush. The error from the first
   *   failing transport is thrown.
   * @example
   * // Graceful shutdown
   * process.on('SIGTERM', async () => {
   *   logger.info('Shutting down gracefully');
   *   await logger.flush();
   *   process.exit(0);
   * });
   *
   * @example
   * // Ensure logs are flushed after batch operation
   * await processBatchJob();
   * await logger.flush(); // Make sure all logs are persisted
   *
   * @async
   * @memberof Logger
   */
  async flush(): Promise<void> {
    await Promise.all(this.transports.map((t) => t.flush()));
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

/**
 * Retrieves the global singleton logger instance.
 *
 * This function returns the application's shared logger instance, creating it
 * on first call. The logger is automatically configured with platform detection
 * fields. This is the recommended way to access logging functionality throughout
 * the application.
 *
 * @returns {ILogger} The global logger instance.
 * @example
 * // Basic usage
 * import { getLogger } from '@shared/services/logging/Logger';
 * const logger = getLogger();
 * logger.info('Application started');
 *
 * @example
 * // With context for module-specific logging
 * const logger = getLogger().setContext('AuthModule');
 * logger.debug('Processing authentication request');
 *
 * @see {@link createLogger} - To create a custom logger instance
 * @see {@link resetLogger} - To reset the global instance (testing)
 * @since 1.0.0
 */
export function getLogger(): ILogger {
  if (!loggerInstance) {
    loggerInstance = new Logger();

    // Add platform info to all logs
    const platform = getPlatformDetection();
    loggerInstance = loggerInstance.withFields({
      platform: {
        isWeb: platform.isWeb(),
        isMobile: platform.isMobile(),
        isAndroid: platform.isAndroid(),
        isIOS: platform.isIOS(),
      },
    }) as Logger;
  }
  return loggerInstance;
}

/**
 * Creates a new logger instance with custom configuration.
 *
 * Use this function when you need a logger with specific settings that differ
 * from the global logger. Each created logger is independent and maintains
 * its own configuration and log storage.
 *
 * @param {Partial<LoggerConfig>} [config] - Custom configuration options.
 * @param {LogLevel} [config.minLevel] - Minimum level for logs to be processed.
 * @param {boolean} [config.enableConsole] - Whether to output logs to console.
 * @param {boolean} [config.enableRemote] - Whether to send logs to remote endpoint.
 * @param {string} [config.remoteEndpoint] - URL for remote log collection.
 * @param {number} [config.maxLogSize=1000] - Maximum number of logs to store in memory.
 * @param {ILogTransport[]} [config.transports] - Custom transports (for testing/extensions).
 * @returns {ILogger} A new logger instance with the specified configuration.
 * @example
 * // Create a logger for testing with only console output
 * const testLogger = createLogger({
 *   minLevel: LogLevel.DEBUG,
 *   enableConsole: true,
 *   enableRemote: false
 * });
 *
 * @example
 * // Create a production logger with remote logging
 * const prodLogger = createLogger({
 *   minLevel: LogLevel.INFO,
 *   enableRemote: true,
 *   remoteEndpoint: 'https://logs.myapp.com/ingest',
 *   maxLogSize: 5000
 * });
 *
 * @see {@link getLogger} - For the global singleton logger
 * @since 1.0.0
 */
export function createLogger(config?: Partial<LoggerConfig>): ILogger {
  return new Logger(config);
}

/**
 * Resets the global logger instance.
 *
 * This function clears the singleton logger instance, forcing a new instance
 * to be created on the next call to {@link getLogger}. This is primarily
 * useful for testing scenarios where you need a fresh logger state between tests.
 *
 * @returns {void}
 * @example
 * // In test setup
 * beforeEach(() => {
 *   resetLogger();
 * });
 *
 * @example
 * // Reset logger after changing environment variables
 * process.env.NODE_ENV = 'test';
 * resetLogger(); // Next getLogger() call will use test configuration
 *
 * @see {@link getLogger} - To get the global logger instance
 * @since 1.0.0
 */
export function resetLogger(): void {
  loggerInstance = null;
}

// Export for testing purposes
export { RemoteTransport };
