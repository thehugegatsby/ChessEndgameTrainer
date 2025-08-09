/**
 * Core Logger implementation
 * @see docs/services/Logger.md for complete documentation
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

/** Default log formatter - formats entries as: timestamp level [context] message {data} */
class DefaultLogFormatter implements ILogFormatter {
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : "";

    let message = `${timestamp} ${level} ${context} ${entry.message}`;

    if (entry.data) {
      try {
        message += ` ${JSON.stringify(entry.data, null, 2)}`;
      } catch {
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

/** Console transport - outputs to browser/Node.js console */
class ConsoleTransport implements ILogTransport {
  private formatter: ILogFormatter;

  constructor(formatter?: ILogFormatter) {
    this.formatter = formatter || new DefaultLogFormatter();
  }

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

  async flush(): Promise<void> {
    // Console doesn't need flushing
  }
}

/** Remote transport - batches and sends logs to remote endpoint */
class RemoteTransport implements ILogTransport {
  private buffer: LogEntry[] = [];
  private batchSize = 50;
  private endpoint: string;
  private isFlushing = false;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flush().catch(console.error);
    }
  }

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
 * @see docs/services/Logger.md for usage examples and complete documentation
 */
export class Logger implements ILogger {
  private config: LoggerConfig;
  private context?: string;
  private logs: LogEntry[] = [];
  private transports: ILogTransport[] = [];
  private timers: Map<string, number> = new Map();
  private fields: Record<string, unknown> = {};

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Use injected transports if provided, otherwise setup default transports
    if (config?.transports && config.transports.length > 0) {
      this.transports = config.transports;
    } else {
      this.setupTransports();
    }
  }

  private setupTransports(): void {
    this.transports = [];

    if (this.config.enableConsole) {
      this.transports.push(new ConsoleTransport());
    }

    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.transports.push(new RemoteTransport(this.config.remoteEndpoint));
    }
  }

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

  private log(
    level: LogLevel,
    message: string,
    error?: Error | unknown,
    data?: unknown,
  ): void {
    if (!this.shouldLog(level, this.context)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      data: { ...this.fields, ...(data as Record<string, unknown>) },
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

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, undefined, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, undefined, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, undefined, data);
  }

  error(message: string, error?: Error | unknown, data?: unknown): void {
    this.log(LogLevel.ERROR, message, error, data);
  }

  fatal(message: string, error?: Error | unknown, data?: unknown): void {
    this.log(LogLevel.FATAL, message, error, data);
  }

  /** Creates a new logger instance with the specified context */
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

  clearContext(): void {
    this.context = undefined;
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // Only setup transports if no custom transports were provided
    if (!config.transports) {
      this.setupTransports();
    } else {
      this.transports = config.transports;
    }
  }

  /** Retrieves stored log entries, optionally filtered by criteria */
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

  clearLogs(): void {
    this.logs = [];
  }

  time(label: string): void {
    this.timers.set(label, performance.now());
  }

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

  /** Creates a new logger instance with additional persistent fields */
  withFields(fields: Record<string, unknown>): ILogger {
    const fieldLogger = new Logger({
      ...this.config,
      transports: this.transports,
    });
    fieldLogger.context = this.context;
    fieldLogger.logs = this.logs;
    fieldLogger.fields = { ...this.fields, ...fields };
    return fieldLogger;
  }

  /** Flushes all pending logs from all transports */
  async flush(): Promise<void> {
    await Promise.all(this.transports.map((t) => t.flush()));
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

/** Retrieves the global singleton logger instance */
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

/** Creates a new logger instance with custom configuration */
export function createLogger(config?: Partial<LoggerConfig>): ILogger {
  return new Logger(config);
}

/** Resets the global logger instance (primarily for testing) */
export function resetLogger(): void {
  loggerInstance = null;
}

// Export for testing purposes
export { RemoteTransport };
