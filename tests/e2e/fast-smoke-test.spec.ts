import { test, expect } from '@playwright/test';
import { installMockWorker } from './fixtures/mockWorker';

test.describe('@smoke Fast Smoke Tests with Mock Worker', () => {
  test.beforeEach(async ({ page }) => {
    // Install mock worker for instant responses
    await installMockWorker(page);
    
    // Navigate to training page
    await page.goto('/train/1');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="chessboard"]', { timeout: 5000 });
  });

  test('should complete a move sequence instantly', async ({ page }) => {
    const startTime = Date.now();
    
    // Make a move using test hooks
    await page.evaluate(() => {
      return (window as any).makeTestMove?.('e6-d6');
    });
    
    // Wait for engine response (should be instant with mock)
    await page.waitForSelector('[data-testid="move-list"] .move-item', { 
      timeout: 1000 // Only 1 second timeout since mock is instant
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`Move sequence completed in ${elapsed}ms`);
    
    // Verify move was made
    const moves = await page.locator('[data-testid="move-list"] .move-item').count();
    expect(moves).toBeGreaterThan(0);
    
    // Verify it was fast (should be under 500ms with mock)
    expect(elapsed).toBeLessThan(500);
  });

  test('should show instant evaluation', async ({ page }) => {
    // Enable analysis mode
    const analysisToggle = page.locator('[data-testid="analysis-toggle"]');
    if (await analysisToggle.isVisible()) {
      await analysisToggle.click();
    }
    
    // Make a move
    await page.evaluate(() => {
      return (window as any).makeTestMove?.('Kd6');
    });
    
    // Evaluation should appear instantly
    await expect(page.locator('[data-testid="evaluation-score"]')).toBeVisible({ 
      timeout: 1000 
    });
    
    // Verify evaluation is shown
    const evaluation = await page.locator('[data-testid="evaluation-score"]').textContent();
    expect(evaluation).toMatch(/[+-]?\d+\.\d+/); // Format: +0.80
  });

  test('should handle multiple rapid moves', async ({ page }) => {
    const moves = ['Kd6', 'Kd8', 'Ke6', 'Ke8'];
    const startTime = Date.now();
    
    for (const move of moves) {
      await page.evaluate((m) => {
        return (window as any).makeTestMove?.(m);
      }, move);
      
      // Small delay to let UI update
      await page.waitForTimeout(50);
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`${moves.length} moves completed in ${elapsed}ms`);
    
    // All moves should complete in under 1 second with mock
    expect(elapsed).toBeLessThan(1000);
    
    // Verify all moves were made
    const moveCount = await page.locator('[data-testid="move-list"] .move-item').count();
    expect(moveCount).toBeGreaterThanOrEqual(moves.length);
  });

  test('should reset game instantly', async ({ page }) => {
    // Make some moves first
    await page.evaluate(() => {
      return (window as any).makeTestMove?.('Kd6');
    });
    
    await page.waitForTimeout(100);
    
    // Reset game
    const resetButton = page.locator('[data-testid="reset-button"]');
    await resetButton.click();
    
    // Verify reset was instant
    const moves = await page.locator('[data-testid="move-list"] .move-item').count();
    expect(moves).toBe(0);
  });

  test('should navigate between positions quickly', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to position 2
    await page.goto('/train/2');
    await page.waitForSelector('[data-testid="chessboard"]', { timeout: 1000 });
    
    // Navigate to position 3
    await page.goto('/train/3');
    await page.waitForSelector('[data-testid="chessboard"]', { timeout: 1000 });
    
    const elapsed = Date.now() - startTime;
    console.log(`Navigation completed in ${elapsed}ms`);
    
    // Navigation should be fast with mock engine
    expect(elapsed).toBeLessThan(2000);
  });
});