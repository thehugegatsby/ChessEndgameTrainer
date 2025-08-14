/**
 * API Constants - HTTP Status Codes and Timeouts
 * Centralized configuration for API-related magic numbers
 */

/**
 * HTTP Status Codes
 * Standard status codes used throughout the application
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * API Timeouts and Retry Configuration
 * From LichessApiClient.ts and related services
 */
export const API_TIMEOUTS_MS = {
  LICHESS_DEFAULT: 5000,        // Default Lichess API timeout
  LICHESS_TABLEBASE: 10000,     // Longer timeout for tablebase queries
  RETRY_DELAY_BASE: 250,        // Base retry delay
  RETRY_DELAY_MAX: 1000,        // Maximum retry delay
} as const;

/**
 * API Limits and Constraints
 * From usePositionAnalysis.ts, useProgressSync.ts, etc.
 */
export const API_LIMITS = {
  ANALYSIS_MAX_DEPTH: 20,       // Maximum analysis depth
  PROGRESS_SYNC_MAX_RETRIES: 10, // Maximum retry attempts
  LOG_ENTRY_LIMIT: 50,          // Log entry limit
} as const;