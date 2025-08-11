/**
 * Central Port Configuration - SINGLE SOURCE OF TRUTH (TypeScript)
 * 
 * 🤖 AI-NOTE: This is the MASTER file for all port configurations
 * 🤖 AI-RULE: ONLY edit this file, never edit config/ports.js
 * 🤖 AI-RULE: After editing, regenerate config/ports.js via build script
 * 
 * PURPOSE: Centralized port definitions for consistency across:
 * - Development server (DEV)
 * - E2E testing (E2E) 
 * - Production deployment (PRODUCTION)
 * - Firebase emulators (FIREBASE_*)
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