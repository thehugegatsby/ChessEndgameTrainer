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

export interface ILogger {
  setContext(context: string): ILogger;
  debug(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  error(message: string, error?: Error | LogData, data?: LogData): void;
}

const mockLogger: ILogger = {
  setContext: () => mockLogger,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

export const getLogger = () => mockLogger;
