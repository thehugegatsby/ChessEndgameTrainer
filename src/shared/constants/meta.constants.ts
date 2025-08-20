/**
 * @fileoverview Application metadata and configuration constants
 * @module constants/meta
 *
 * @description
 * Contains application-wide metadata such as version numbers, URLs,
 * user agent strings, and other configuration that identifies the application.
 * Designed for optimal LLM readability with comprehensive documentation.
 */

/**
 * Application metadata
 *
 * @description
 * Core application information used for identification, versioning,
 * and external service communication.
 */
export const APP_META = {
  /**
   * Application name used in user agents and logging
   */
  NAME: 'ChessEndgameTrainer',

  /**
   * Current application version
   * Follow semantic versioning: MAJOR.MINOR.PATCH
   */
  VERSION: '1.0.0',

  /**
   * Application description for metadata
   */
  DESCRIPTION: 'Interactive chess endgame training application',

  /**
   * GitHub repository URL
   */
  REPOSITORY_URL: 'https://github.com/thehugegatsby/ChessEndgameTrainer',

  /**
   * User agent string for HTTP requests
   * Format: AppName/Version (URL)
   */
  USER_AGENT: 'ChessEndgameTrainer/1.0.0 (https://github.com/thehugegatsby/ChessEndgameTrainer)',
} as const;

/**
 * External API endpoints and URLs
 *
 * @description
 * Centralized configuration for all external service endpoints.
 */
export const EXTERNAL_APIS = {
  /**
   * Lichess tablebase API configuration
   */
  LICHESS_TABLEBASE: {
    BASE_URL: 'https://tablebase.lichess.ovh/standard',
    DOCS_URL: 'https://lichess.org/blog/W3WeMyQAACQAdfAL/7-piece-syzygy-tablebases-are-complete',
  },

  /**
   * Lichess main API (for future features)
   */
  LICHESS_API: {
    BASE_URL: 'https://lichess.org/api',
    DOCS_URL: 'https://lichess.org/api',
  },
} as const;

/**
 * Application environment configuration
 *
 * @description
 * Environment-specific constants and feature flags.
 */
export const ENVIRONMENT = {
  /**
   * Development environment identifier
   */
  DEVELOPMENT: 'development',

  /**
   * Production environment identifier
   */
  PRODUCTION: 'production',

  /**
   * Test environment identifier
   */
  TEST: 'test',

  /**
   * E2E testing environment identifier
   */
  E2E: 'e2e',

  /**
   * Check if running in browser
   */
  IS_BROWSER: typeof window !== 'undefined',

  /**
   * Check if running in Node.js
   */
  IS_NODE: typeof process !== 'undefined' && process.versions?.node,
} as const;

/**
 * Application routes and navigation
 *
 * @description
 * Centralized route definitions for consistent navigation.
 */
export const ROUTES = {
  /**
   * Home page route
   */
  HOME: '/',

  /**
   * Training page route - unified training experience
   * All positions are handled internally by the training page
   */
  TRAINING: '/training',

  /**
   * Analysis page route (future feature)
   */
  ANALYSIS: '/analysis',

  /**
   * Settings page route (future feature)
   */
  SETTINGS: '/settings',

  /**
   * Default redirect route
   */
  DEFAULT_REDIRECT: '/training',
} as const;

/**
 * LocalStorage keys
 *
 * @description
 * Centralized storage key definitions to prevent typos and conflicts.
 */
export const STORAGE_KEYS = {
  /**
   * Prefix for all app storage keys
   */
  PREFIX: 'chess_trainer_',

  /**
   * User preferences storage key
   */
  USER_PREFERENCES: 'chess_trainer_preferences',

  /**
   * Game state storage key
   */
  GAME_STATE: 'chess_trainer_game_state',

  /**
   * Progress tracking storage key
   */
  PROGRESS: 'chess_trainer_progress',

  /**
   * Cache data storage key
   */
  CACHE: 'chess_trainer_cache',
} as const;

/**
 * Application feature flags
 *
 * @description
 * Runtime feature toggles for gradual rollout and A/B testing.
 */
export const FEATURES = {
  /**
   * Enable tablebase integration
   */
  TABLEBASE_ENABLED: true,

  /**
   * Enable move hints
   */
  HINTS_ENABLED: true,

  /**
   * Enable solution reveal
   */
  SOLUTION_ENABLED: true,

  /**
   * Enable progress tracking
   */
  PROGRESS_TRACKING_ENABLED: true,

  /**
   * Enable performance monitoring
   */
  PERFORMANCE_MONITORING: false,

  /**
   * Enable debug mode
   */
  DEBUG_MODE: process.env.NODE_ENV === 'development',
} as const;

/**
 * Type exports for strict typing
 */
export type AppMetaConstants = typeof APP_META;
export type ExternalApiConstants = typeof EXTERNAL_APIS;
export type EnvironmentConstants = typeof ENVIRONMENT;
export type RouteConstants = typeof ROUTES;
export type StorageKeyConstants = typeof STORAGE_KEYS;
export type FeatureConstants = typeof FEATURES;
