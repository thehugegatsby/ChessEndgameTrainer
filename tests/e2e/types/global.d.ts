/**
 * Global type declarations for E2E test constants
 * These constants are injected at build time via webpack DefinePlugin
 */

import type { 
  SELECTORS,
  TIMEOUTS,
  TEST_BRIDGE,
  NAVIGATION_CONFIG,
  ERROR_MESSAGES,
  LOG_CONTEXTS,
  RETRY_CONFIG,
  PERFORMANCE,
  VALIDATION,
  FEATURES,
  ANIMATION,
  ACTIVE_MOVE_INDICATORS,
  HIGHLIGHT_INDICATORS,
  TEST_DATA
} from '../config/constants';

declare global {
  interface Window {
    __E2E_TEST_CONSTANTS__: {
      SELECTORS: typeof SELECTORS;
      TIMEOUTS: typeof TIMEOUTS;
      TEST_BRIDGE: typeof TEST_BRIDGE;
      NAVIGATION_CONFIG: typeof NAVIGATION_CONFIG;
      ERROR_MESSAGES: typeof ERROR_MESSAGES;
      LOG_CONTEXTS: typeof LOG_CONTEXTS;
      RETRY_CONFIG: typeof RETRY_CONFIG;
      PERFORMANCE: typeof PERFORMANCE;
      VALIDATION: typeof VALIDATION;
      FEATURES: typeof FEATURES;
      ANIMATION: typeof ANIMATION;
      ACTIVE_MOVE_INDICATORS: typeof ACTIVE_MOVE_INDICATORS;
      HIGHLIGHT_INDICATORS: typeof HIGHLIGHT_INDICATORS;
      TEST_DATA: typeof TEST_DATA;
    };
    
    // Also declare the Test Bridge interface
    __E2E_TEST_BRIDGE__: {
      engine: {
        isReady: () => boolean;
        [key: string]: any;
      };
      diagnostic: {
        getCurrentMoveIndex: () => number;
        getTotalMoves: () => number;
        isAtStart: () => boolean;
        isAtEnd: () => boolean;
        [key: string]: any;
      };
    };
  }
}

export {};