/**
 * @fileoverview Mock logging service
 */

export interface ILogger {
  setContext(context: string): ILogger;
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

const mockLogger: ILogger = {
  setContext: () => mockLogger,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

export const getLogger = () => mockLogger;