/**
 * Global Setup for Firebase E2E Tests
 * Manages Firebase Emulator lifecycle for all tests
 */

import { ChildProcess, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const sleep = promisify(setTimeout);

let emulatorProcess: ChildProcess | null = null;
const PID_FILE = path.join(__dirname, '.emulator.pid');

/**
 * Wait for emulators to be ready by checking the Firestore port directly
 */
async function waitForEmulators(maxAttempts = 30): Promise<void> {
  console.log('Waiting for Firebase Emulators to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Check Firestore emulator directly
      const response = await fetch('http://localhost:8080');
      // Firestore returns 200 OK on root path when ready
      console.log('Firebase Firestore Emulator is ready!');
      return;
    } catch (error) {
      // Expected to fail until emulators are up
      if (i % 5 === 0) {
        console.log(`Still waiting for emulators... (${i}/${maxAttempts})`);
      }
    }
    await sleep(1000);
  }
  
  throw new Error('Firebase Emulators failed to start within timeout');
}

/**
 * Start Firebase Emulators
 */
async function startEmulators(): Promise<void> {
  console.log('Starting Firebase Emulators...');
  
  // Check if emulators are already running
  try {
    const response = await fetch('http://localhost:8080');
    console.log('Firebase Emulators already running, reusing existing instance');
    return;
  } catch {
    // Not running, proceed to start
  }
  
  // Start emulators in detached mode
  emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'firestore', '--project', 'endgame-trainer-test'], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      FIRESTORE_EMULATOR_HOST: 'localhost:8080'
    }
  });
  
  // Save PID for cleanup
  if (emulatorProcess.pid) {
    fs.writeFileSync(PID_FILE, emulatorProcess.pid.toString());
  }
  
  // Wait for emulators to be ready
  await waitForEmulators();
}

/**
 * Playwright global setup function
 */
async function globalSetup(): Promise<() => Promise<void>> {
  await startEmulators();
  
  // Return teardown function
  return async () => {
    console.log('Stopping Firebase Emulators...');
    
    // Try to read PID from file
    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
      try {
        process.kill(pid, 'SIGTERM');
        console.log(`Killed emulator process with PID ${pid}`);
      } catch (error) {
        console.error('Failed to kill emulator process:', error);
      }
      fs.unlinkSync(PID_FILE);
    }
    
    // Also try to kill the process we started
    if (emulatorProcess && emulatorProcess.pid) {
      try {
        process.kill(-emulatorProcess.pid, 'SIGTERM'); // Kill process group
      } catch (error) {
        console.error('Failed to kill emulator process group:', error);
      }
    }
  };
}

export default globalSetup;