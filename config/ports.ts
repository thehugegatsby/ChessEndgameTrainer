/**
 * Central port configuration for all environments (TypeScript version)
 * This file defines all ports used across the application
 * to ensure consistency and easy configuration changes
 */

// Import env config for typed process.env access
import { env } from '../src/config/env';

export const PORTS = {
  // Development server port
  DEV: 3002,
  
  // E2E test server port
  E2E: 3009,
  
  // Production server port (can be overridden by PORT env var)
  PRODUCTION: env.PORT || 3000,
  
  // Firebase emulator ports (if needed)
  FIREBASE_AUTH: 9099,
  FIREBASE_FIRESTORE: 8080,
  FIREBASE_STORAGE: 9199,
} as const;

export type PortName = keyof typeof PORTS;

export default PORTS;