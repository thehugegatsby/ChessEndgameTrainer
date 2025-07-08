/**
 * Environment configuration for Next.js
 * This file exports environment-specific settings
 */

const { APP_CONFIG } = require('./config/constants');

module.exports = {
  env: {
    // Make the dev URL available to the client
    NEXT_PUBLIC_DEV_URL: APP_CONFIG.DEV_URL,
    NEXT_PUBLIC_DEV_PORT: APP_CONFIG.DEV_PORT.toString(),
  },
  
  // Server runtime configuration (server-side only)
  serverRuntimeConfig: {
    port: APP_CONFIG.DEV_PORT,
    host: APP_CONFIG.DEV_HOST,
  },
  
  // Public runtime configuration (available on client and server)
  publicRuntimeConfig: {
    devUrl: APP_CONFIG.DEV_URL,
    apiUrl: `${APP_CONFIG.DEV_URL}/api`,
  },
};