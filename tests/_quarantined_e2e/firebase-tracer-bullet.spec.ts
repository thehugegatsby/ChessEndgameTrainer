/**
 * Firebase Tracer Bullet E2E Test
 * This test proves that Playwright, the app, and Firebase Emulator can all communicate
 */

import { test, expect } from '@playwright/test';
import {
  initializeTestFirebase,
  clearFirestoreData,
  seedTestPositions,
  seedTestCategories,
  TEST_POSITIONS,
  TEST_CATEGORIES,
  waitForFirestore
} from '../utils/firebase-test-helpers';

test.describe('Firebase Tracer Bullet - Basic E2E Flow', () => {
  // Set up Firebase emulator before all tests
  test.beforeAll(async () => {
    await waitForFirestore();
  });

  test.beforeEach(async () => {
    // Clear all data before each test
    await clearFirestoreData();
    
    // Seed test data
    await seedTestPositions(TEST_POSITIONS);
    await seedTestCategories(TEST_CATEGORIES);
  });

  test('User can navigate to a position and make a move', async ({ page }) => {
    // 1. Navigate to the first position
    await page.goto('/train/1');
    
    // 2. Wait for the page to be ready
    await page.waitForSelector('[data-testid="training-board"]');
    
    // 3. Verify the position loaded correctly
    const boardFen = await page.getAttribute('[data-testid="training-board"]', 'data-fen');
    expect(boardFen).toBe(TEST_POSITIONS[0].fen);
    
    // 4. Verify position title is displayed
    await expect(page.locator('h1')).toContainText('Opposition Basics');
    
    // 5. Make a move using the test hook
    const moveResult = await page.evaluate(async () => {
      // Use the e2e test hook we set up in TrainingBoardZustand
      if (typeof (window as any).e2e_makeMove === 'function') {
        return await (window as any).e2e_makeMove('e6-e7');
      }
      throw new Error('e2e_makeMove not available');
    });
    
    expect(moveResult.success).toBe(true);
    
    // 6. Verify the board state changed
    await page.waitForTimeout(1000); // Wait for move animation
    const newBoardFen = await page.getAttribute('[data-testid="training-board"]', 'data-fen');
    expect(newBoardFen).not.toBe(TEST_POSITIONS[0].fen);
    
    // 7. Check that we can get the game state
    const gameState = await page.evaluate(() => {
      if (typeof (window as any).e2e_getGameState === 'function') {
        return (window as any).e2e_getGameState();
      }
      throw new Error('e2e_getGameState not available');
    });
    
    expect(gameState.moveCount).toBeGreaterThan(0);
    expect(gameState.turn).toBe('b'); // Black's turn after white moves
  });

  test('Dashboard shows categories from Firebase', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for categories to load
    await page.waitForSelector('[data-testid="category-card"]');
    
    // Verify both test categories are displayed
    await expect(page.locator('[data-testid="category-card"]')).toHaveCount(2);
    
    // Verify category names
    await expect(page.locator('text=King and Pawn')).toBeVisible();
    await expect(page.locator('text=Rook and Pawn')).toBeVisible();
  });

  test('Navigation between positions works', async ({ page }) => {
    // Start at position 1
    await page.goto('/train/1');
    await page.waitForSelector('[data-testid="training-board"]');
    
    // Click next position button
    await page.click('[data-testid="next-position-button"]');
    
    // Wait for navigation
    await page.waitForURL(/\/train\/2/);
    
    // Verify we're at position 2
    await expect(page.locator('h1')).toContainText('Advanced Opposition');
    
    // Verify the FEN changed
    const boardFen = await page.getAttribute('[data-testid="training-board"]', 'data-fen');
    expect(boardFen).toBe(TEST_POSITIONS[1].fen);
  });
});

// Playwright configuration helper for running with Firebase emulator
export const firefbaseEmulatorConfig = {
  use: {
    // Set environment variable for E2E test mode
    launchOptions: {
      env: {
        ...process.env,
        NEXT_PUBLIC_IS_E2E_TEST: 'true',
        NEXT_PUBLIC_E2E_SIGNALS: 'true'
      }
    }
  },
  
  // Global setup to ensure emulator is running
  globalSetup: async () => {
    console.log('🔥 Ensuring Firebase Emulator is running...');
    // Note: In CI, you'd start the emulator here
    // For local dev, we assume it's already running
  }
};