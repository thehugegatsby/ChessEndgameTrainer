/**
 * Central port configuration for all environments
 * This file defines all ports used across the application
 * to ensure consistency and easy configuration changes
 */

const PORTS = {
  // Development server port
  DEV: 3002,
  
  // E2E test server port
  E2E: 3009,
  
  // Production server port (can be overridden by PORT env var)
  PRODUCTION: process.env.PORT || 3000,
  
  // Firebase emulator ports (if needed)
  FIREBASE_AUTH: 9099,
  FIREBASE_FIRESTORE: 8080,
  FIREBASE_STORAGE: 9199,
};

// Export for Node.js environments (CommonJS)
module.exports = { PORTS };