/**
 * Compatibility layer for Logger to support getInstance() method
 * Used by the unified evaluation services
 */

import { getLogger } from './Logger';

export const Logger = {
  getInstance: getLogger
};