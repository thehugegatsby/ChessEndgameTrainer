/**
 * @file Main constants barrel export for the Chess Endgame Trainer application
 * @module constants/index
 *
 * @description
 * Central barrel export that re-exports all domain-specific constants.
 * This provides a single import point for all constants while maintaining
 * domain organization and tree-shaking compatibility.
 *
 * @remarks
 * This follows the Hybrid approach recommended by Gemini:
 * - Shared constants are centrally organized by domain
 * - Domain-specific constants remain co-located with their code
 * - All constants use `as const` assertion for type safety
 * - Modern bundlers (Vite/Rollup) handle tree-shaking efficiently
 *
 * @example
 * ```typescript
 * // Import from main barrel
 * import { HTTP_STATUS, BOARD_SIZE, TIME_UNITS } from '@shared/constants';
 * 
 * // Import from specific domain (when using many constants from one domain)
 * import { HTTP_CONFIG, HTTP_RETRY } from '@shared/constants/http';
 * ```
 */

// ===== DOMAIN BARREL EXPORTS =====

/**
 * HTTP communication constants
 * Includes status codes, headers, timeouts, retry logic
 */
export * from './http';

// Import and re-export HTTP_STATUS explicitly
import { HTTP_STATUS } from './http/http.constants';
export { HTTP_STATUS };

/**
 * Chess game logic constants  
 * Includes board dimensions, FEN handling, piece limits, evaluation thresholds
 */
export * from './chess';

/**
 * Time and duration constants
 * Includes base units, common durations, timeouts, intervals
 */
export * from './time';

/**
 * UI and display constants
 * Includes animations, breakpoints, layouts, typography
 */
export * from './ui';

// Explicit re-exports for problematic constants
// Import and re-export manually due to barrel export issues
import { ANIMATIONS, UI_LAYOUT } from './ui/ui.constants';
import { 
  PIECE_ANIMATION,
  UI_TRANSITIONS, 
  EASING_FUNCTIONS,
  ANIMATION_DELAYS 
} from './animation.constants';

export const ANIMATION = {
  ...ANIMATIONS,
  PIECE: PIECE_ANIMATION,
  TRANSITIONS: UI_TRANSITIONS,
  EASING: EASING_FUNCTIONS,
  DELAYS: ANIMATION_DELAYS,
  ERROR_TOAST_DURATION: 3000,
  SUCCESS_TOAST_DURATION: 2000,
  MOVE_PLAY_DELAY_NORMAL: 800,
  MOVE_PLAY_DELAY_FAST: 300,
  MOVE_PLAY_DELAY_SLOW: 1200,
} as const;

export const DIMENSIONS = {
  ...UI_LAYOUT.DIMENSIONS,
  ANALYSIS_PANEL_HEIGHT: 200,
  MOVE_NUMBER_MIN_WIDTH: 40,
  TRAINING_BOARD_SIZE: 500,
};

export const UI = {
  LAYOUT: UI_LAYOUT,
  ANIMATIONS: ANIMATIONS,
  TOAST_DURATION: 3000,
  TOAST_FADE_DURATION: 300,
  EVALUATION_COLORS: {
    EXCELLENT: { text: '#10b981', background: '#065f46' },
    GOOD: { text: '#3b82f6', background: '#1e40af' },
    NEUTRAL: { text: '#f59e0b', background: '#92400e' },
    INACCURATE: { text: '#f59e0b', background: '#92400e' },
    MISTAKE: { text: '#fb923c', background: '#c2410c' },
    BLUNDER: { text: '#ef4444', background: '#991b1b' },
  },
  COLORS: {
    SEMANTIC: {
      PRIMARY: 'primary',
      SECONDARY: 'secondary', 
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error',
      INFO: 'info',
    },
  },
} as const;

/**
 * Cache configuration constants
 * Includes sizes, TTL values, buffer configurations
 */
export * from './cache';

// Explicit re-export for CACHE  
import {
  CACHE_SIZES,
  CACHE_TTL,
  CACHE_STRATEGIES,
} from './cache';

export const CACHE = {
  SIZES: CACHE_SIZES,
  TTL: CACHE_TTL,
  STRATEGIES: CACHE_STRATEGIES,
  POSITION_CACHE_SIZE: 1000,
  ANALYSIS_CACHE_TTL: 300000, // 5 minutes
} as const;

// LRU Cache configuration
export const LRU_CACHE_CONFIG = {
  DEFAULT_MAX_SIZE: 100,
  MAX_AGE_MS: 3600000, // 1 hour
  UPDATE_AGE_ON_GET: true,
  STALE_WHILE_REVALIDATE: true,
  REVALIDATION_WINDOW_MS: 5000, // 5 seconds
  ESTIMATED_ENTRY_SIZE_BYTES: 1024, // 1KB estimated per entry
  DUE_CARDS_SIZE: 50,
  DUE_CARDS_MAX_AGE_MS: 1800000, // 30 minutes
} as const;

/**
 * Validation constants
 * Includes schema validation, input constraints
 */
export * from './validation';

/**
 * Utility and mathematical constants
 * Includes percentages, encoding bases, string operations
 */
export * from './utility';

/**
 * Evaluation constants
 * Includes score thresholds, move quality, analysis configuration
 */
export * from './evaluation';

/**
 * Platform constants
 * Includes storage, system, and rating constants
 */
export * from './platform';

// Additional missing constants
export const TEXT_LENGTHS = {
  MAX_TITLE_LENGTH: 50,
  TITLE_MAX_LENGTH: 50, // Alias for compatibility
  MAX_DESCRIPTION_LENGTH: 200,
  SUBTITLE_MAX_LENGTH: 30,
  MIN_SEARCH_QUERY: 2,
} as const;

export const DISPLAY_DEFAULTS = {
  SCREEN_FALLBACK_WIDTH_PX: 1920,
  SCREEN_FALLBACK_HEIGHT_PX: 1080,
} as const;

export const DEVICE_THRESHOLDS = {
  TABLET_MIN_SHORT_EDGE_PX: 768,
} as const;

// Explicit re-export for EVALUATION
import {
  SCORE_THRESHOLDS,
  MOVE_QUALITY,
  EVALUATION_CONFIG,
  CENTIPAWN_CONVERSION,
} from './evaluation.constants';

export const EVALUATION = {
  SCORE_THRESHOLDS,
  MOVE_QUALITY,
  CONFIG: EVALUATION_CONFIG,
  CENTIPAWN_CONVERSION,
  COLOR_THRESHOLDS: {
    DOMINATING: 5,
    EXCELLENT: 2,
    GOOD: 0.5,
    WIN_SCORE: 4,
    SLIGHT_ADVANTAGE: 1,
    DRAW_SCORE: 0.5,
    NEUTRAL_LOWER: -0.5,
    INACCURATE: -2,
    MISTAKE: -5,
  },
} as const;

// ===== LEGACY EXPORTS (for backward compatibility) =====

/**
 * Legacy multiplier constants
 * TODO: Move to appropriate domain folders in future refactoring
 */
export * from './multipliers';

/**
 * Legacy meta constants  
 * TODO: Evaluate if these belong in config/ instead
 */
export * from './meta.constants';

/**
 * Legacy testing constants
 * TODO: Consider consolidating with /tests/constants/
 */
export * from './testing.constants';

// ===== DOMAIN-SPECIFIC CONSTANTS (remain co-located) =====
// These are NOT re-exported here as they belong with their domains:
// - src/domains/evaluation/constants/tablebase.constants.ts
// - src/tests/constants/test.constants.ts  
// - src/config/constants.ts