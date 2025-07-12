/**
 * Firebase Worker-Scoped Fixtures
 * 
 * This file defines worker-scoped fixtures that are initialized once per worker process
 * for performance optimization. Firebase emulators are expensive to start/stop, so we
 * initialize them once per worker and reuse across all tests in that worker.
 * 
 * Architecture Pattern: Layer-based fixture separation
 * - Worker Layer: Infrastructure setup (this file)
 * - Test Layer: Test-specific setup (firebase-fixtures.ts)
 */

import { test as base } from '@playwright/test';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { setupFirebase } from '../_setup/firebase.setup';

/**
 * Worker-scoped fixtures interface
 * These fixtures are initialized once per worker and shared across tests
 */
export interface FirebaseWorkerFixtures {
  /**
   * Firebase environment containing Firestore and Auth instances
   * Connected to local emulators for test isolation
   */
  firebaseEnv: { db: Firestore; auth: Auth };
}

/**
 * Extended test with worker-scoped Firebase fixtures
 * 
 * Note the type signature: base.extend<{}, FirebaseWorkerFixtures>
 * - First parameter {} = empty test-scoped fixtures
 * - Second parameter = worker-scoped fixtures
 * This is critical for TypeScript to correctly infer fixture scopes
 */
export const workerTest = base.extend<{}, FirebaseWorkerFixtures>({
  firebaseEnv: [async ({}, use) => {
    console.log('[Worker Setup] Initializing Firebase environment...');
    
    // Setup Firebase connection to emulators
    // This expensive operation happens only once per worker
    const env = await setupFirebase();
    
    console.log('[Worker Setup] Firebase environment ready');
    
    // Provide the environment to all tests in this worker
    await use(env);
    
    // Cleanup happens automatically when worker shuts down
    console.log('[Worker Teardown] Firebase environment cleanup');
  }, { scope: 'worker' }], // Critical: This fixture is worker-scoped
});