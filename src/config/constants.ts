/**
 * Central configuration constants for the application
 */

import { env } from './env';

/**
 * Application configuration constants containing all app-wide settings
 */
export const APP_CONFIG = {
  /** Development server port */
  DEV_PORT: 3002,
  /** Development server host */
  DEV_HOST: "127.0.0.1",
  /**
   * Get the development URL
   * @returns The development server URL
   */
  get DEV_URL() {
    return `http://${this.DEV_HOST}:${this.DEV_PORT}`;
  },

  /** Production URL */
  PROD_URL: env.NEXT_PUBLIC_APP_URL || "https://endgametrainer.com",

  /** API base URL */
  API_BASE_URL: env.NEXT_PUBLIC_API_URL || "/api",
  /** Lichess Tablebase API URL */
  TABLEBASE_API_URL: env.NEXT_PUBLIC_TABLEBASE_API_URL,

  /** Feature flags */
  FEATURES: {
    /** Firebase integration enabled */
    FIREBASE_ENABLED: env.NEXT_PUBLIC_FIREBASE_ENABLED,
    /** Analytics tracking enabled */
    ANALYTICS_ENABLED: env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  },
} as const;

// Environment helpers
/**
 * Check if running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Check if running in test mode
 */
export const isTest = process.env.NODE_ENV === "test";

/**
 * Get the appropriate URL based on environment
 * @returns The application URL
 */
export const getAppUrl = (): string => {
  if (isDevelopment || isTest) {
    return APP_CONFIG.DEV_URL;
  }
  return APP_CONFIG.PROD_URL;
};