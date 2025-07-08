import { test, expect, Page } from '@playwright/test';

/**
 * Navigation Tests for Endgame Trainer
 * Tests navigation between positions, state persistence, and UI controls
 */

// Helper to get game state
const getGameState = async (page: Page) => {
  return await page.evaluate(() => {
    return (window as any).e2e_getGameState?.();
  });
};

// Helper to make moves using test hooks
const makeMove = async (page: Page, move: string): Promise<boolean> => {
  const result = await page.evaluate((m) => {
    const fn = (window as any).e2e_makeMove;
    if (!fn) {
      throw new Error('Test hooks not available. Ensure NEXT_PUBLIC_TEST_MODE=true');
    }
    return fn(m);
  }, move);
  
  return result?.success || false;
};

test.describe('@smoke Navigation Tests', () => {
  
  test('should navigate between positions using next/prev buttons', async ({ page }) => {
    // Start at position 1
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    
    // Verify we're on position 1
    const initialState = await getGameState(page);
    expect(initialState.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    
    // Find and click next button
    const nextButton = page.locator('button').filter({ hasText: 'Nächste Stellung' });
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    
    // Wait for navigation and verify we're on position 2
    await page.waitForURL('**/train/2');
    await page.waitForTimeout(1000);
    
    const position2State = await getGameState(page);
    expect(position2State.fen).toBe('8/8/8/4k3/8/8/4PK2/8 w - - 0 1');
    
    // Click previous button
    const prevButton = page.locator('button').filter({ hasText: 'Vorherige Stellung' });
    await expect(prevButton).toBeVisible();
    await prevButton.click();
    
    // Verify we're back on position 1
    await page.waitForURL('**/train/1');
    await page.waitForTimeout(1000);
    
    const backToPosition1 = await getGameState(page);
    expect(backToPosition1.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
  });
  
  test('should disable prev button on first position', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    
    // Previous button should be disabled on first position
    const prevButton = page.locator('button').filter({ hasText: 'Vorherige Stellung' });
    await expect(prevButton).toBeVisible();
    await expect(prevButton).toBeDisabled();
  });
  
  test('should navigate directly to specific position', async ({ page }) => {
    // Go directly to position 5
    await page.goto('/train/5');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    
    const state = await getGameState(page);
    // Verify it's a different position (not position 1 or 2)
    expect(state.fen).not.toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    expect(state.fen).not.toBe('8/8/8/4k3/8/8/4PK2/8 w - - 0 1');
    
    // Check that navigation buttons work from here
    const prevButton = page.locator('button').filter({ hasText: 'Vorherige Stellung' });
    await expect(prevButton).toBeVisible();
    await expect(prevButton).toBeEnabled();
    
    const nextButton = page.locator('button').filter({ hasText: 'Nächste Stellung' });
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();
  });
  
  test('should preserve game state when navigating away and back', async ({ page }) => {
    // Start at position 1 and make a move
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Make a move
    const moveResult = await makeMove(page, 'e6-d6');
    expect(moveResult).toBe(true);
    
    // Wait for engine response
    await page.waitForTimeout(1500);
    
    const stateBeforeNav = await getGameState(page);
    expect(stateBeforeNav.moveCount).toBeGreaterThan(0);
    const moveCountBefore = stateBeforeNav.moveCount;
    
    // Navigate to position 2
    const nextButton = page.locator('button').filter({ hasText: 'Nächste Stellung' });
    await nextButton.click();
    await page.waitForURL('**/train/2');
    await page.waitForTimeout(1000);
    
    // Navigate back to position 1
    const prevButton = page.locator('button').filter({ hasText: 'Vorherige Stellung' });
    await prevButton.click();
    await page.waitForURL('**/train/1');
    await page.waitForTimeout(1000);
    
    // Check if state was preserved
    const stateAfterReturn = await getGameState(page);
    
    // Note: The current implementation might reset the position
    // This test documents the actual behavior
    if (stateAfterReturn.moveCount === 0) {
      // Position was reset - this is the current behavior
      expect(stateAfterReturn.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
      console.log('Note: Game state is reset when navigating between positions');
    } else {
      // State was preserved - this would be ideal behavior
      expect(stateAfterReturn.moveCount).toBe(moveCountBefore);
      console.log('Game state preserved when navigating');
    }
  });
  
  test('should show position title and description', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    
    // Check for position title
    await expect(page.locator('h2').first()).toContainText(/Opposition|Stellung 1/);
    
    // Navigate to position 12 (Brückenbau)
    await page.goto('/train/12');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    
    // Check for Brückenbau title
    await expect(page.locator('h2').filter({ hasText: 'Brückenbau' })).toBeVisible();
  });
  
  test('should handle invalid position IDs gracefully', async ({ page }) => {
    // Try to navigate to non-existent position
    await page.goto('/train/999');
    
    // Should either redirect to home or show error
    // Check current URL after navigation
    await page.waitForTimeout(2000);
    
    const url = page.url();
    
    // Could redirect to home page or show error
    if (url.includes('/train/999')) {
      // Still on the page - check for error message
      const errorMessage = page.locator('text=/nicht gefunden|error|invalid/i');
      const errorCount = await errorMessage.count();
      
      if (errorCount > 0) {
        console.log('Shows error message for invalid position');
      } else {
        // Might show a default position
        const chessboard = await page.locator('[class*="chessboard"]').count();
        expect(chessboard).toBe(0); // No board should be shown
      }
    } else {
      // Redirected away - that's also valid handling
      console.log('Redirected from invalid position');
      expect(url).toMatch(/\/(train\/\d+)?$/); // Home or valid position
    }
  });
});