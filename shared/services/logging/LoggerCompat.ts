/**
 * Compatibility layer for Logger to support getInstance() method
 * Used by the unified evaluation services
 */

import { getLogger } from './index';
import type { ILogger } from './types';

class LoggerWrapper {
  static getInstance(): ILogger {
    return getLogger();
  }
}

export const Logger = LoggerWrapper;