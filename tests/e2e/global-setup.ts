/**
 * Playwright Global Setup
 * Proper E2E infrastructure with Firebase emulator lifecycle management
 */

import { FullConfig } from '@playwright/test';
import { execSync, spawn, ChildProcess } from 'child_process';
import { FIREBASE_TEST_CONFIG, TEST_TIMEOUTS } from './firebase/firebase.constants';
import { waitForEmulator, isEmulatorRunning } from '../utils/firebase-emulator-api';

// Global process reference for cleanup
let firebaseEmulatorProcess: ChildProcess | null = null;

async function globalSetup(config: FullConfig) {
  console.log('🔧 E2E Global Setup: Initializing test environment...');
  
  // Environment variables are now set in playwright.config.ts webServer.env
  // This ensures they are available when Next.js initializes
  
  // Verify Next.js build is available for production tests
  const isCI = process.env.CI === 'true';
  if (isCI) {
    try {
      // Check if .next directory exists
      execSync('test -d .next', { stdio: 'ignore' });
      console.log('✅ Next.js build verified');
    } catch (error) {
      console.warn('⚠️ No Next.js build found - will use dev server');
    }
  }
  
  // Verify test constants are available
  try {
    const testConstants = require('./config/constants');
    if (testConstants.SELECTORS && testConstants.TIMEOUTS) {
      console.log('✅ E2E test constants loaded');
    } else {
      throw new Error('Invalid test constants structure');
    }
  } catch (error) {
    console.error('❌ Failed to load E2E test constants:', error);
    throw error;
  }
  
  // Set up Firebase emulator environment variables
  const firestoreHost = `${FIREBASE_TEST_CONFIG.EMULATOR_HOST}:${FIREBASE_TEST_CONFIG.FIRESTORE_PORT}`;
  const authHost = `${FIREBASE_TEST_CONFIG.EMULATOR_HOST}:${FIREBASE_TEST_CONFIG.AUTH_PORT}`;
  
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.GCLOUD_PROJECT = FIREBASE_TEST_CONFIG.PROJECT_ID;
  
  // Initialize Firebase emulator only if not in CI or running Firebase-specific tests
  const isFirebaseTest = process.env.PLAYWRIGHT_PROJECT === 'firebase';
  
  if (!isCI || isFirebaseTest) {
    await initializeFirebaseEmulator();
  } else {
    console.log('⚠️ Skipping Firebase emulator in CI for non-Firebase tests');
  }
  
  console.log('🚀 E2E Global Setup: Environment ready');
  
  return Promise.resolve();
}

/**
 * Initialize Firebase emulator with proper lifecycle management
 */
async function initializeFirebaseEmulator(): Promise<void> {
  console.log('🔥 Starting Firebase emulator...');
  
  // Check if emulator is already running
  if (await isEmulatorRunning()) {
    console.log('✅ Firebase emulator already running');
    return;
  }
  
  // Check if firebase CLI is available
  try {
    execSync('firebase --version', { stdio: 'ignore' });
  } catch (error) {
    throw new Error('Firebase CLI not found. Please install with: npm install -g firebase-tools');
  }
  
  // Start Firebase emulator
  const emulatorCommand = [
    'firebase', 'emulators:start',
    '--only', 'firestore,auth',
    '--project', FIREBASE_TEST_CONFIG.PROJECT_ID,
    '--export-on-exit=./tests/e2e/firebase-export',
    '--import=./tests/e2e/firebase-export'
  ];
  
  firebaseEmulatorProcess = spawn(emulatorCommand[0], emulatorCommand.slice(1), {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false, // Keep attached so it dies with parent process
    env: {
      ...process.env,
      FIRESTORE_EMULATOR_HOST: `${FIREBASE_TEST_CONFIG.EMULATOR_HOST}:${FIREBASE_TEST_CONFIG.FIRESTORE_PORT}`,
      FIREBASE_AUTH_EMULATOR_HOST: `${FIREBASE_TEST_CONFIG.EMULATOR_HOST}:${FIREBASE_TEST_CONFIG.AUTH_PORT}`,
    }
  });
  
  // Handle emulator output for debugging
  if (firebaseEmulatorProcess.stdout) {
    firebaseEmulatorProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('All emulators ready')) {
        console.log('✅ Firebase emulator ready');
      }
      // Suppress verbose emulator logs in normal operation
      if (process.env.DEBUG_FIREBASE) {
        console.log(`[Firebase Emulator]: ${output.trim()}`);
      }
    });
  }
  
  if (firebaseEmulatorProcess.stderr) {
    firebaseEmulatorProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('Warning:') && !error.includes('Note:')) {
        console.error(`[Firebase Emulator Error]: ${error.trim()}`);
      }
    });
  }
  
  // Handle emulator process exit
  firebaseEmulatorProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.warn(`⚠️ Firebase emulator exited with code ${code}`);
    }
    firebaseEmulatorProcess = null;
  });
  
  // Wait for emulator to be ready
  try {
    await waitForEmulator(30, 1000); // 30 attempts, 1 second intervals
    console.log('✅ Firebase emulator started and ready');
  } catch (error) {
    // Clean up failed process
    if (firebaseEmulatorProcess) {
      firebaseEmulatorProcess.kill();
      firebaseEmulatorProcess = null;
    }
    throw new Error(`Failed to start Firebase emulator: ${error}`);
  }
}

/**
 * Global teardown function to clean up Firebase emulator
 */
export async function globalTeardown(): Promise<void> {
  console.log('🧹 E2E Global Teardown: Cleaning up...');
  
  if (firebaseEmulatorProcess) {
    console.log('🔥 Stopping Firebase emulator...');
    
    // Send SIGTERM for graceful shutdown
    firebaseEmulatorProcess.kill('SIGTERM');
    
    // Wait for graceful shutdown
    const shutdownPromise = new Promise<void>((resolve) => {
      if (firebaseEmulatorProcess) {
        firebaseEmulatorProcess.on('exit', () => {
          console.log('✅ Firebase emulator stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
    
    // Force kill after timeout
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        if (firebaseEmulatorProcess) {
          console.log('⚠️ Force killing Firebase emulator...');
          firebaseEmulatorProcess.kill('SIGKILL');
        }
        resolve();
      }, 10000); // 10 second timeout
    });
    
    await Promise.race([shutdownPromise, timeoutPromise]);
    firebaseEmulatorProcess = null;
  }
  
  console.log('✅ E2E Global Teardown: Complete');
}

export default globalSetup;