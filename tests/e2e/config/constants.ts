/**
 * E2E Test Constants - TypeScript Re-export
 * Re-exports JavaScript constants with full type inference
 * This allows TypeScript files to import from constants.ts while
 * the actual implementation lives in constants.js for Next.js compatibility
 */

// Import all constants from JavaScript file
import * as constants from './constants.js';

// Re-export all constants with TypeScript's type inference
export const TIMEOUT_PROFILES = constants.TIMEOUT_PROFILES;
export const TIMEOUTS = constants.TIMEOUTS;
export const SELECTORS = constants.SELECTORS;
export const ACTIVE_MOVE_INDICATORS = constants.ACTIVE_MOVE_INDICATORS;
export const HIGHLIGHT_INDICATORS = constants.HIGHLIGHT_INDICATORS;
export const RETRY_CONFIG = constants.RETRY_CONFIG;
export const PERFORMANCE = constants.PERFORMANCE;
export const TEST_DATA = constants.TEST_DATA;
export const ERROR_MESSAGES = constants.ERROR_MESSAGES;
export const LOG_CONTEXTS = constants.LOG_CONTEXTS;
export const TEST_BRIDGE = constants.TEST_BRIDGE;
export const ANIMATION = constants.ANIMATION;
export const VALIDATION = constants.VALIDATION;
export const FEATURES = constants.FEATURES;
export const NAVIGATION_CONFIG = constants.NAVIGATION_CONFIG;

// Type definitions for better IDE support
export type TimeoutProfile = typeof TIMEOUT_PROFILES[keyof typeof TIMEOUT_PROFILES];
export type Timeouts = typeof TIMEOUTS;
export type Selectors = typeof SELECTORS;
export type NavigationButtonType = typeof NAVIGATION_CONFIG.BUTTONS[number];