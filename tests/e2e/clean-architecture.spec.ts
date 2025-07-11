/**
 * Clean Architecture E2E Test
 * Demonstrates best practices with Page Objects and Test API
 */

import { test, expect } from '@playwright/test';
import { ChessBoardPage } from '../page-objects/ChessBoardPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { testApiServer } from '../utils/test-api-server';
import { clearAllFirestoreData } from '../utils/firebase-emulator-api';
import { testAdmin } from '../utils/firebase-admin-helpers';

test.describe('Chess Endgame Trainer - Clean Architecture Tests', () => {
  let chessBoardPage: ChessBoardPage;
  let dashboardPage: DashboardPage;

  test.beforeAll(async () => {
    // Ensure test API is running
    if (process.env.CI) {
      await testApiServer.start();
    }
  });

  test.afterAll(async () => {
    if (process.env.CI) {
      await testApiServer.stop();
    }
  });

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    chessBoardPage = new ChessBoardPage(page);
    dashboardPage = new DashboardPage(page);

    // Clear and seed test data
    await clearAllFirestoreData();
    await testAdmin.createTestScenario('basic');
  });

  test('User journey: Browse categories and solve a position', async ({ page, request }) => {
    // 1. Navigate to dashboard
    await dashboardPage.navigateToDashboard();
    
    // 2. Verify categories loaded
    await dashboardPage.assertCategoriesLoaded(1); // 'basic' scenario has 1 category
    await dashboardPage.assertCategoryExists('King and Pawn');
    
    // 3. Select King and Pawn category
    const category = await dashboardPage.getCategoryByName('King and Pawn');
    expect(category).toBeTruthy();
    await dashboardPage.selectFirstPositionInCategory(category!.id);
    
    // 4. Wait for chess board to load
    await chessBoardPage.waitForPageReady();
    await chessBoardPage.assertPositionLoaded(
      'Opposition Basics',
      '4k3/8/4K3/8/8/8/8/8 w - - 0 1'
    );
    
    // 5. Make the winning move
    await chessBoardPage.makeMove({ from: 'e6', to: 'e7' });
    
    // 6. Verify move was successful
    const boardState = await chessBoardPage.getBoardState();
    expect(boardState.turn).toBe('b'); // Black's turn after white moves
    expect(boardState.moveCount).toBeGreaterThan(0);
    
    // 7. Wait for engine response
    await chessBoardPage.waitForEngineMove();
    
    // 8. Verify we can navigate to next position
    await chessBoardPage.goToNextPosition();
    await chessBoardPage.assertPositionLoaded(
      'Advanced Opposition',
      '8/8/4k3/8/8/4K3/8/8 w - - 0 1'
    );
  });

  test('Visual regression: Dashboard categories', async ({ page }) => {
    await dashboardPage.navigateToDashboard();
    await dashboardPage.assertNoErrors();
    
    // Take screenshot for visual comparison
    const screenshot = await dashboardPage.takeDashboardScreenshot('dashboard-categories');
    expect(screenshot).toMatchSnapshot('dashboard-categories.png');
  });

  test('Visual regression: Chess board initial state', async ({ page }) => {
    await chessBoardPage.navigateToPosition(1);
    
    // Take board screenshot
    const screenshot = await chessBoardPage.takeBoardScreenshot('opposition-basics-initial');
    expect(screenshot).toMatchSnapshot('opposition-basics-initial.png');
  });

  test('Test API: Create user with progress', async ({ page, request }) => {
    // Create test user with some progress
    const response = await request.post(`${testApiServer.getUrl()}/e2e/create-test-user`, {
      data: {
        userId: 'advanced-user',
        progress: {
          '1': { completed: true, bestScore: 100, attempts: 1 },
          '2': { completed: false, bestScore: 50, attempts: 3 }
        }
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    // Navigate to dashboard and verify progress is reflected
    await dashboardPage.navigateToDashboard();
    
    const progress = await dashboardPage.getUserProgress();
    expect(progress.completed).toBe(1); // One position completed
  });

  test('Error handling: Invalid position ID', async ({ page }) => {
    // Navigate to non-existent position
    await page.goto('/train/9999');
    
    // Should show error or redirect
    await expect(page.locator('text=Position not found')).toBeVisible({ timeout: 10000 });
  });

  test('Hint and solution functionality', async ({ page }) => {
    await chessBoardPage.navigateToPosition(1);
    
    // Request hint
    const hint = await chessBoardPage.requestHint();
    expect(hint).toContain('Opposition is key');
    
    // Show solution
    const solution = await chessBoardPage.showSolution();
    expect(solution).toContain('Ke6-e7');
  });

  test('Data integrity check', async ({ request }) => {
    // Verify test data integrity
    const response = await request.get(`${testApiServer.getUrl()}/e2e/verify-integrity`);
    const integrity = await response.json();
    
    expect(integrity.issues).toHaveLength(0);
    expect(integrity.positionsCount).toBeGreaterThan(0);
    expect(integrity.categoriesCount).toBeGreaterThan(0);
  });

  test('Performance: Page load times', async ({ page }) => {
    // Measure dashboard load time
    const dashboardStart = Date.now();
    await dashboardPage.navigateToDashboard();
    const dashboardLoadTime = Date.now() - dashboardStart;
    
    expect(dashboardLoadTime).toBeLessThan(3000); // Should load in under 3 seconds
    
    // Measure position load time
    const positionStart = Date.now();
    await chessBoardPage.navigateToPosition(1);
    const positionLoadTime = Date.now() - positionStart;
    
    expect(positionLoadTime).toBeLessThan(2000); // Should load in under 2 seconds
  });
});

// Test configuration for parallel execution
test.describe.configure({ mode: 'parallel' });