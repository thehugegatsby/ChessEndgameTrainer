/**
 * @fileoverview Mock logging service
 */

// Type for log data - matches actual usage in codebase
type LogData = 
  | string 
  | number 
  | boolean 
  | Error
  | Record<string, string | number | boolean | null | undefined>
  | Array<string | number | boolean>;

export interface Logger {
  setContext(context: string): Logger;
  debug(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  error(message: string, error?: Error | LogData, data?: LogData): void;
}

const mockLogger: Logger = {
  setContext: () => mockLogger,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

export const getLogger = (): Logger => mockLogger;
