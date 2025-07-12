/**
 * Playwright Global Setup
 * Clean architecture for E2E test environment preparation
 */

import { spawn, ChildProcess } from 'child_process';
import { clearAllFirestoreData, waitForEmulator } from '../utils/firebase-emulator-api';
import { testAdmin } from '../utils/firebase-admin-helpers';

let emulatorProcess: ChildProcess | null = null;

async function startFirebaseEmulator(): Promise<void> {
  console.log('🔥 Starting Firebase Emulator...');
  
  // Check if emulator is already running
  try {
    await waitForEmulator(1, 100); // Quick check
    console.log('✅ Firebase Emulator already running');
    return;
  } catch {
    // Emulator not running, start it
  }

  return new Promise((resolve, reject) => {
    emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'firestore'], {
      stdio: 'pipe',
      shell: true,
    });

    let started = false;

    emulatorProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(`📤 Emulator: ${output}`);
      
      if (output.includes('All emulators ready') && !started) {
        started = true;
        console.log('✅ Firebase Emulator started successfully');
        resolve();
      }
    });

    emulatorProcess.stderr?.on('data', (data) => {
      console.error(`❌ Emulator Error: ${data}`);
    });

    emulatorProcess.on('error', (error) => {
      reject(new Error(`Failed to start emulator: ${error.message}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        reject(new Error('Firebase Emulator failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

async function globalSetup() {
  console.log('🚀 Starting Playwright Global Setup');
  
  try {
    // 1. Set environment variables
    process.env.NEXT_PUBLIC_IS_E2E_TEST = 'true';
    process.env.NEXT_PUBLIC_E2E_SIGNALS = 'true';
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    
    // 2. Start Firebase Emulator if not running
    await startFirebaseEmulator();
    
    // 3. Wait for emulator to be fully ready
    await waitForEmulator();
    
    // 4. Initialize Admin SDK
    await testAdmin.initialize();
    
    // 5. Clear all data and seed initial test data
    await clearAllFirestoreData();
    await testAdmin.createTestScenario('advanced');
    
    console.log('✅ Global setup completed successfully');
    
    // Return a teardown function
    return async () => {
      console.log('🧹 Running global teardown...');
      
      // Cleanup Admin SDK
      await testAdmin.cleanup();
      
      // Stop emulator if we started it
      if (emulatorProcess) {
        console.log('🛑 Stopping Firebase Emulator...');
        emulatorProcess.kill('SIGTERM');
        
        // Wait for process to exit
        await new Promise<void>((resolve) => {
          if (emulatorProcess) {
            emulatorProcess.on('exit', () => {
              console.log('✅ Firebase Emulator stopped');
              resolve();
            });
            
            // Force kill after 5 seconds
            setTimeout(() => {
              if (emulatorProcess) {
                emulatorProcess.kill('SIGKILL');
              }
              resolve();
            }, 5000);
          } else {
            resolve();
          }
        });
      }
      
      console.log('✅ Global teardown completed');
    };
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;