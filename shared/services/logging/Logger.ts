/**
 * Core Logger implementation
 * Provides structured, multi-level logging with different transports
 */

import {
  ILogger,
  LogLevel,
  LogEntry,
  LoggerConfig,
  LogFilter,
  ILogTransport,
  ILogFormatter
} from './types';
import { getPlatformDetection } from '../platform';

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: false,
  enableFileLogging: false,
  maxLogSize: 1000
};

// Log formatter implementation
class DefaultLogFormatter implements ILogFormatter {
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    
    let message = `${timestamp} ${level} ${context} ${entry.message}`;
    
    if (entry.data) {
      message += ` ${JSON.stringify(entry.data)}`;
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

// Console transport implementation
class ConsoleTransport implements ILogTransport {
  private formatter: ILogFormatter;
  
  constructor(formatter?: ILogFormatter) {
    this.formatter = formatter || new DefaultLogFormatter();
  }
  
  log(entry: LogEntry): void {
    const formatted = this.formatter.format(entry);
    
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
  
  async flush(): Promise<void> {
    // Console doesn't need flushing
  }
}

// Remote transport implementation (stub)
class RemoteTransport implements ILogTransport {
  private buffer: LogEntry[] = [];
  private endpoint: string;
  private batchSize = 50;
  
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
    if (this.buffer.length === 0) return;
    
    const entries = [...this.buffer];
    this.buffer = [];
    
    try {
      // TODO: Implement actual remote logging
      // await fetch(this.endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ logs: entries })
      // });
    } catch (error) {
      console.error('Failed to send logs to remote:', error);
      // Re-add to buffer if failed
      this.buffer.unshift(...entries);
    }
  }
}

// Main Logger implementation
export class Logger implements ILogger {
  private config: LoggerConfig;
  private context?: string;
  private logs: LogEntry[] = [];
  private transports: ILogTransport[] = [];
  private timers: Map<string, number> = new Map();
  private fields: Record<string, any> = {};
  
  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupTransports();
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
  
  private log(level: LogLevel, message: string, error?: Error | any, data?: any): void {
    if (!this.shouldLog(level, this.context)) return;
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      data: { ...this.fields, ...data }
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
    this.transports.forEach(transport => transport.log(entry));
  }
  
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, undefined, data);
  }
  
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, undefined, data);
  }
  
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, undefined, data);
  }
  
  error(message: string, error?: Error | any, data?: any): void {
    this.log(LogLevel.ERROR, message, error, data);
  }
  
  fatal(message: string, error?: Error | any, data?: any): void {
    this.log(LogLevel.FATAL, message, error, data);
  }
  
  setContext(context: string): ILogger {
    const contextLogger = new Logger(this.config);
    contextLogger.context = context;
    contextLogger.logs = this.logs; // Share log storage
    contextLogger.transports = this.transports; // Share transports
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
    this.setupTransports();
  }
  
  getLogs(filter?: LogFilter): LogEntry[] {
    if (!filter) return [...this.logs];
    
    return this.logs.filter(log => {
      if (filter.minLevel !== undefined && log.level < filter.minLevel) return false;
      if (filter.maxLevel !== undefined && log.level > filter.maxLevel) return false;
      if (filter.context && log.context !== filter.context) return false;
      if (filter.startTime && log.timestamp < filter.startTime) return false;
      if (filter.endTime && log.timestamp > filter.endTime) return false;
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const inMessage = log.message.toLowerCase().includes(searchLower);
        const inContext = log.context?.toLowerCase().includes(searchLower);
        const inData = JSON.stringify(log.data).toLowerCase().includes(searchLower);
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
  
  withFields(fields: Record<string, any>): ILogger {
    const fieldLogger = new Logger(this.config);
    fieldLogger.context = this.context;
    fieldLogger.logs = this.logs;
    fieldLogger.transports = this.transports;
    fieldLogger.fields = { ...this.fields, ...fields };
    return fieldLogger;
  }
  
  async flush(): Promise<void> {
    await Promise.all(this.transports.map(t => t.flush()));
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

/**
 * Get the global logger instance
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
        isIOS: platform.isIOS()
      }
    }) as Logger;
  }
  return loggerInstance;
}

/**
 * Create a new logger instance with custom config
 */
export function createLogger(config?: Partial<LoggerConfig>): ILogger {
  return new Logger(config);
}

/**
 * Reset the global logger (useful for testing)
 */
export function resetLogger(): void {
  loggerInstance = null;
}