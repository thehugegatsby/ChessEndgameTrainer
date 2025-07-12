/**
 * E2E Smoke Tests
 * Basic application verification - real quality gates
 */

import { test, expect } from '@playwright/test';

test.describe('Application Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Verify page loads
    await expect(page).toHaveTitle(/ChessEndgameTrainer|Chess/i);
    
    // Verify essential elements are present
    await expect(page.locator('body')).toBeVisible();
    
    // Check for any JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Verify no critical JavaScript errors occurred
    expect(errors).toHaveLength(0);
  });

  test('can navigate to training page', async ({ page }) => {
    // Go to homepage first
    await page.goto('/');
    
    // Try to navigate to training page
    await page.goto('/train/bridge-building');
    
    // Verify we can load a training page
    await expect(page).toHaveURL(/\/train\//);
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Basic verification that the page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('chess board renders without errors', async ({ page }) => {
    // Navigate to training page
    await page.goto('/train/bridge-building');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for chess board using multiple possible selectors
    const boardSelectors = [
      '[data-testid="training-board"]',
      '.react-chessboard',
      '#chessboard',
      '[class*="chessboard"]'
    ];
    
    let boardFound = false;
    for (const selector of boardSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        boardFound = true;
        break;
      } catch {
        // Try next selector
      }
    }
    
    // At least one board selector should work
    expect(boardFound).toBe(true);
  });

  test('test constants are available', async ({ page }) => {
    // Navigate to any page to load the app
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // Check if test constants were injected by webpack
    const hasTestConstants = await page.evaluate(() => {
      return typeof (window as any).__E2E_TEST_CONSTANTS__ !== 'undefined';
    });
    
    expect(hasTestConstants).toBe(true);
    
    // Verify essential constants are present
    const constants = await page.evaluate(() => {
      return (window as any).__E2E_TEST_CONSTANTS__;
    });
    
    expect(constants).toHaveProperty('SELECTORS');
    expect(constants).toHaveProperty('TIMEOUTS');
    expect(constants).toHaveProperty('TEST_BRIDGE');
  });
});