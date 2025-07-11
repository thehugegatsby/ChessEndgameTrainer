/**
 * Playwright Test Fixtures
 * Reusable test setup and utilities
 */

import { test as base } from '@playwright/test';
import { TestApiClient } from '../api/TestApiClient';
import { TrainingPage } from '../pages/TrainingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PositionFactory } from '../factories/position.factory';
import { testAdmin } from '../utils/firebase-admin-helpers';

export interface TestUser {
  id: string;
  email: string;
  displayName: string;
}

export interface TestFixtures {
  testApi: TestApiClient;
  testUser: TestUser;
  authenticatedPage: TrainingPage;
  dashboardPage: DashboardPage;
  positionFactory: typeof PositionFactory;
}

export interface WorkerFixtures {
  _testEnvironment: void;
}

/**
 * Custom test with fixtures
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker-scoped fixture for environment setup
  _testEnvironment: [
    async ({}, use) => {
      console.log('🔧 Setting up test environment...');
      
      // Initialize admin SDK
      await testAdmin.initialize();
      
      // Clear and seed basic data
      await testAdmin.clearAllData();
      await testAdmin.createTestScenario('basic');
      
      await use();
      
      // Cleanup is handled by global teardown
      console.log('🧹 Test environment cleanup complete');
    },
    { scope: 'worker', auto: true }
  ],

  // Test API client
  testApi: async ({ request }, use) => {
    const client = new TestApiClient(request);
    
    // Wait for API to be ready
    await client.waitForReady();
    
    await use(client);
  },

  // Test user fixture
  testUser: async ({ testApi }, use) => {
    // Create a unique test user for each test
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const user: TestUser = {
      id: userId,
      email: `${userId}@test.com`,
      displayName: `Test User ${userId}`
    };
    
    await testApi.createTestUser({
      userId: user.id,
      email: user.email,
      displayName: user.displayName
    });
    
    await use(user);
    
    // Cleanup would happen here if needed
  },

  // Authenticated page fixture
  authenticatedPage: async ({ page, testUser }, use) => {
    // Set authentication cookie or local storage
    await page.context().addCookies([{
      name: 'test-auth-token',
      value: `test-token-${testUser.id}`,
      domain: 'localhost',
      path: '/',
    }]);
    
    // Or use localStorage
    await page.goto('/');
    await page.evaluate((userId) => {
      localStorage.setItem('test-user-id', userId);
      localStorage.setItem('test-auth', 'true');
    }, testUser.id);
    
    const trainingPage = new TrainingPage(page);
    await use(trainingPage);
  },

  // Dashboard page fixture
  dashboardPage: async ({ page, testUser }, use) => {
    // Ensure authenticated
    await page.context().addCookies([{
      name: 'test-auth-token',
      value: `test-token-${testUser.id}`,
      domain: 'localhost',
      path: '/',
    }]);
    
    const dashboard = new DashboardPage(page);
    await dashboard.navigate();
    
    await use(dashboard);
  },

  // Position factory fixture
  positionFactory: async ({}, use) => {
    // Reset factory state for each test
    PositionFactory.resetIdCounter();
    await use(PositionFactory);
  }
});

/**
 * Test with specific scenarios
 */
export const scenarioTest = test.extend<{
  advancedScenario: void;
  emptyScenario: void;
}>({
  advancedScenario: async ({ testApi }, use) => {
    await testApi.clearAll();
    await testApi.seedScenario('advanced');
    await use();
  },

  emptyScenario: async ({ testApi }, use) => {
    await testApi.clearAll();
    await testApi.seedScenario('empty');
    await use();
  }
});

/**
 * Test with custom user progress
 */
export const progressTest = test.extend<{
  userWithProgress: TestUser & { completedPositions: number[] };
}>({
  userWithProgress: async ({ testApi }, use) => {
    const userId = `progress-user-${Date.now()}`;
    const user = {
      id: userId,
      email: `${userId}@test.com`,
      displayName: `User with Progress`,
      completedPositions: [1, 2, 3]
    };
    
    // Create user with progress
    await testApi.createTestUser({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      progress: {
        1: { completed: true, bestScore: 100, attempts: 1 },
        2: { completed: true, bestScore: 90, attempts: 2 },
        3: { completed: true, bestScore: 80, attempts: 3 }
      }
    });
    
    await use(user);
  }
});

// Re-export expect for convenience
export { expect } from '@playwright/test';