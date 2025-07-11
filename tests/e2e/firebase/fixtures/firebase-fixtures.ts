/**
 * Firebase Test Fixtures for Playwright
 * 
 * This file defines test-scoped fixtures that run for each individual test.
 * It builds upon the worker-scoped fixtures defined in firebase-worker-fixtures.ts
 * 
 * Architecture Pattern: Layer-based fixture separation
 * - Worker Layer: Infrastructure setup (firebase-worker-fixtures.ts)
 * - Test Layer: Test-specific setup (this file)
 * 
 * This separation ensures:
 * - TypeScript type safety (no scope conflicts)
 * - Performance optimization (emulators start once per worker)
 * - Clean test isolation (each test gets fresh data)
 */

import { workerTest as base } from './firebase-worker-fixtures';
import { TestApiClient } from '../../../api/TestApiClient';
import { 
  clearFirestore, 
  seedAllTestData,
  createTestUser,
} from '../_setup/firebase.setup';

/**
 * Test-scoped fixtures interface
 * These fixtures run for each test, providing isolated test context
 */
export interface FirebaseTestFixtures {
  /**
   * Test API client for Firebase-specific endpoints
   */
  testApiClient: TestApiClient;
  
  /**
   * Unique test user created for each test
   */
  testUser: { uid: string; email: string; password: string };
}

/**
 * Extended test with test-scoped Firebase fixtures
 * 
 * Note: We extend from workerTest which already includes the worker-scoped
 * firebaseEnv fixture. This fixture is available internally but not exposed
 * in the FirebaseTestFixtures interface to maintain clean separation.
 */
export const test = base.extend<FirebaseTestFixtures>({
  // Test API client with Firebase endpoints
  testApiClient: async ({ request }, use) => {
    const client = new TestApiClient(request);
    
    // Wait for test API to be ready
    await client.waitForReady();
    
    await use(client);
  },

  // Test user fixture - creates a unique user per test
  testUser: async ({}, use) => {
    // Clear Firestore before each test for isolation
    // Note: These functions internally use the worker-scoped Firebase instance
    await clearFirestore();
    
    // Seed basic test data
    await seedAllTestData();
    
    // Create unique test user
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'testPassword123!';
    
    const user = await createTestUser(email, password);
    
    await use({ 
      uid: user.uid, 
      email: user.email!, 
      password 
    });
    
    // Cleanup is handled by clearFirestore in next test
  }
});

// Export expect for convenience
export { expect } from '@playwright/test';

// Helper to create authenticated context
export async function createAuthenticatedContext(
  page: any,
  email: string,
  password: string
): Promise<void> {
  // This would typically involve:
  // 1. Navigating to login page
  // 2. Filling in credentials
  // 3. Submitting form
  // 4. Waiting for authentication
  
  // For now, we'll use the test API to set auth state
  await page.evaluate(({ email, password }: { email: string; password: string }) => {
    // Set auth state in browser (implementation depends on your auth system)
    localStorage.setItem('test-auth', JSON.stringify({ email, password }));
  }, { email, password });
}