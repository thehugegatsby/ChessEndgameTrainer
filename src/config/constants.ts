/**
 * Central configuration constants for the application
 */

export const APP_CONFIG = {
  // Development server configuration
  DEV_PORT: 3002,
  DEV_HOST: "127.0.0.1",
  get DEV_URL() {
    return `http://${this.DEV_HOST}:${this.DEV_PORT}`;
  },

  // Production configuration can be added here
  PROD_URL: process.env.NEXT_PUBLIC_APP_URL || "https://endgametrainer.com",

  // API endpoints
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "/api",
  TABLEBASE_API_URL:
    process.env.NEXT_PUBLIC_TABLEBASE_API_URL ||
    "https://tablebase.lichess.ovh",

  // Feature flags
  FEATURES: {
    FIREBASE_ENABLED: process.env.NEXT_PUBLIC_FIREBASE_ENABLED === "true",
    ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  },
} as const;

// Environment helpers
export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";
export const isTest = process.env.NODE_ENV === "test";

// Get the appropriate URL based on environment
export const getAppUrl = () => {
  if (isDevelopment || isTest) {
    return APP_CONFIG.DEV_URL;
  }
  return APP_CONFIG.PROD_URL;
};
