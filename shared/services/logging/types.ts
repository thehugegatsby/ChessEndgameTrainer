/**
 * Logging service types and interfaces
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  error?: Error;
  stack?: string;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableFileLogging: boolean;
  maxLogSize: number; // Maximum log entries to keep in memory
  remoteEndpoint?: string;
  contextWhitelist?: string[]; // Only log from these contexts
  contextBlacklist?: string[]; // Don't log from these contexts
}

export interface ILogger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error | any, data?: any): void;
  fatal(message: string, error?: Error | any, data?: any): void;
  
  setContext(context: string): ILogger;
  clearContext(): void;
  
  getConfig(): LoggerConfig;
  updateConfig(config: Partial<LoggerConfig>): void;
  
  getLogs(filter?: LogFilter): LogEntry[];
  clearLogs(): void;
  
  // Performance logging
  time(label: string): void;
  timeEnd(label: string): void;
  
  // Structured logging
  withFields(fields: Record<string, any>): ILogger;
}

export interface LogFilter {
  minLevel?: LogLevel;
  maxLevel?: LogLevel;
  context?: string;
  startTime?: Date;
  endTime?: Date;
  searchText?: string;
}

export interface ILogTransport {
  log(entry: LogEntry): void;
  flush(): Promise<void>;
}

export interface ILogFormatter {
  format(entry: LogEntry): string;
}