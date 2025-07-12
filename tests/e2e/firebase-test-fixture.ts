/**
 * Firebase Test Fixture
 * Extended Playwright test fixture with Firebase emulator integration and auth support
 */

import { test as base, expect, APIRequestContext } from '@playwright/test';
import { TestApiClient } from '../api/TestApiClient';
import { FIREBASE_TEST_CONFIG, TEST_TIMEOUTS } from './firebase/firebase.constants';
import { 
  generateTestUserEmail, 
  generateTestId,
  type TestUserTemplateKey 
} from './firebase';
import { isEmulatorRunning, waitForEmulator } from '../utils/firebase-emulator-api';
import { APP_CONFIG } from '../../config/constants';

// Firebase-specific test context
export interface FirebaseTestContext {
  apiClient: TestApiClient;
  firebaseAuth: FirebaseAuthHelper;
  firebaseData: FirebaseDataHelper;
  cleanup: () => Promise<void>;
}

// Auth helper for Firebase authentication operations
export class FirebaseAuthHelper {
  constructor(
    private apiClient: TestApiClient,
    private request: APIRequestContext
  ) {}

  /**
   * Create authenticated test user with specified template
   */
  async createUser(options: {
    template?: TestUserTemplateKey;
    customClaims?: Record<string, any>;
    autoLogin?: boolean;
  } = {}): Promise<{
    user: any;
    token: string | null;
    progressEntries: number;
  }> {
    const { template = 'BEGINNER', customClaims = {}, autoLogin = false } = options;
    
    // Create user via Firebase test service
    const userResult = await this.apiClient.createFirebaseUser({
      template,
      overrides: {
        email: generateTestUserEmail(template.toLowerCase()),
        customClaims
      }
    });

    let token: string | null = null;
    
    if (autoLogin) {
      // Simulate auth token for emulator
      token = await this.generateTestToken(userResult.user.uid, customClaims);
    }

    return {
      user: userResult.user,
      token,
      progressEntries: userResult.progressEntries
    };
  }

  /**
   * Generate test auth token for emulator
   */
  async generateTestToken(uid: string, customClaims: Record<string, any> = {}): Promise<string> {
    // In emulator mode, we can use the emulator's test token endpoint
    const response = await this.request.post(
      `http://${FIREBASE_TEST_CONFIG.EMULATOR_HOST}:${FIREBASE_TEST_CONFIG.AUTH_PORT}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken`,
      {
        data: {
          token: this.createEmulatorTestToken(uid, customClaims),
          returnSecureToken: true
        }
      }
    );

    if (!response.ok()) {
      throw new Error(`Failed to generate test token: ${await response.text()}`);
    }

    const data = await response.json();
    return data.idToken;
  }

  /**
   * Create emulator-compatible test token
   */
  private createEmulatorTestToken(uid: string, customClaims: Record<string, any>): string {
    // Firebase emulator accepts basic JWT structure for testing
    const header = { alg: 'none', typ: 'JWT' };
    const payload = {
      iss: `https://securetoken.google.com/${FIREBASE_TEST_CONFIG.PROJECT_ID}`,
      aud: FIREBASE_TEST_CONFIG.PROJECT_ID,
      auth_time: Math.floor(Date.now() / 1000),
      user_id: uid,
      sub: uid,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      firebase: {
        identities: {},
        sign_in_provider: 'custom'
      },
      ...customClaims
    };

    // Simple JWT encoding for emulator (no signature verification)
    return [
      Buffer.from(JSON.stringify(header)).toString('base64url'),
      Buffer.from(JSON.stringify(payload)).toString('base64url'),
      '' // No signature for emulator
    ].join('.');
  }

  /**
   * Set custom claims for existing user
   */
  async setCustomClaims(uid: string, claims: Record<string, any>): Promise<void> {
    // Use Firebase Admin SDK via test API
    const response = await this.request.post(
      `http://${FIREBASE_TEST_CONFIG.EMULATOR_HOST}:${FIREBASE_TEST_CONFIG.AUTH_PORT}/identitytoolkit.googleapis.com/v1/accounts:update`,
      {
        data: {
          localId: uid,
          customAttributes: JSON.stringify(claims)
        }
      }
    );

    if (!response.ok()) {
      throw new Error(`Failed to set custom claims: ${await response.text()}`);
    }
  }

  /**
   * Clear all auth users (emulator only)
   */
  async clearAllUsers(): Promise<void> {
    const response = await this.request.delete(
      `http://${FIREBASE_TEST_CONFIG.EMULATOR_HOST}:${FIREBASE_TEST_CONFIG.AUTH_PORT}/emulator/v1/projects/${FIREBASE_TEST_CONFIG.PROJECT_ID}/accounts`
    );

    if (!response.ok()) {
      throw new Error(`Failed to clear auth users: ${await response.text()}`);
    }
  }
}

// Data helper for Firebase data operations
export class FirebaseDataHelper {
  constructor(private apiClient: TestApiClient) {}

  /**
   * Seed scenario data with validation
   */
  async seedScenario(
    scenario: 'empty' | 'basic' | 'advanced' | 'edge-cases',
    options?: { userCount?: number; includeProgress?: boolean }
  ): Promise<{
    scenario: string;
    seeded: Record<string, number>;
    users: any[];
  }> {
    return await this.apiClient.seedFirebaseScenario(scenario, options);
  }

  /**
   * Batch seed custom data with validation
   */
  async seedBatch(data: {
    positions?: any[];
    categories?: any[];
    chapters?: any[];
    users?: any[];
  }): Promise<{ results: Record<string, number> }> {
    return await this.apiClient.seedFirebaseBatch(data);
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(): Promise<{
    integrity: 'good' | 'issues_found';
    counts: Record<string, number>;
    issues: string[];
  }> {
    return await this.apiClient.verifyFirebaseIntegrity();
  }

  /**
   * Get emulator status
   */
  async getStatus(): Promise<{
    status: string;
    collections: Record<string, number>;
  }> {
    return await this.apiClient.getFirebaseStatus();
  }

  /**
   * Clear all Firestore data
   */
  async clearAll(): Promise<void> {
    await this.apiClient.clearFirestore();
  }
}

// Extended test fixture
export const firebaseTest = base.extend<FirebaseTestContext>({
  apiClient: async ({ request }, use) => {
    // Verify Firebase emulator is running
    if (!(await isEmulatorRunning())) {
      throw new Error(
        'Firebase emulator is not running. Please ensure global setup has started the emulator.'
      );
    }

    // Wait for emulator to be fully ready
    await waitForEmulator(10, 500); // Quick check since it should already be running

    // Create API client with correct dev server URL
    const client = new TestApiClient(request, APP_CONFIG.DEV_URL);
    
    // Verify client can connect
    await client.getFirebaseStatus();
    
    await use(client);
  },

  firebaseAuth: async ({ apiClient, request }, use) => {
    const authHelper = new FirebaseAuthHelper(apiClient, request);
    await use(authHelper);
  },

  firebaseData: async ({ apiClient }, use) => {
    const dataHelper = new FirebaseDataHelper(apiClient);
    await use(dataHelper);
  },

  cleanup: async ({ firebaseAuth, firebaseData }, use) => {
    // Provide cleanup function
    const cleanupFn = async () => {
      try {
        // Clear auth users
        await firebaseAuth.clearAllUsers();
        
        // Clear Firestore data
        await firebaseData.clearAll();
        
        // Verify cleanup
        const integrity = await firebaseData.verifyIntegrity();
        if (integrity.integrity !== 'good') {
          console.warn(`Cleanup verification found issues: ${integrity.issues.join(', ')}`);
        }
      } catch (error) {
        console.error('Cleanup failed:', error);
        throw error;
      }
    };

    await use(cleanupFn);
  }
});

// Enhanced test with automatic cleanup
export const test = firebaseTest.extend({
  // Auto-cleanup after each test
  page: async ({ page, cleanup }, use) => {
    await use(page);
    
    // Cleanup after test completes
    await cleanup();
  }
});

// Re-export expect for convenience
export { expect } from '@playwright/test';

// Export type aliases for external use
export type FirebaseTestFixtureContext = FirebaseTestContext;
export type { TestUserTemplateKey };

// Classes are already exported above