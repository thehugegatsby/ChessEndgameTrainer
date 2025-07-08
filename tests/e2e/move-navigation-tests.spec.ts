import { test, expect, Page } from '@playwright/test';

/**
 * Move Navigation Tests for Endgame Trainer
 * Tests navigation within a game's move history using the Lichess-style controls
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

test.describe('@smoke Move Navigation Tests', () => {
  
  test('should navigate through moves using navigation controls', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Make some moves first
    await makeMove(page, 'e6-d6');
    await page.waitForTimeout(1500); // Wait for engine
    
    await makeMove(page, 'd6-c6');
    await page.waitForTimeout(1500); // Wait for engine
    
    const stateAfterMoves = await getGameState(page);
    expect(stateAfterMoves.moveCount).toBeGreaterThanOrEqual(4); // At least 4 moves made
    
    // Find navigation controls
    const navControls = page.locator('.navigation-controls');
    await expect(navControls).toBeVisible();
    
    // Go to start button
    const goToStartBtn = navControls.locator('button').first();
    await goToStartBtn.click();
    await page.waitForTimeout(500);
    
    const stateAtStart = await getGameState(page);
    expect(stateAtStart.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'); // Initial position
    
    // Go forward one move
    const goNextBtn = navControls.locator('button').nth(2);
    await goNextBtn.click();
    await page.waitForTimeout(500);
    
    const stateAfterFirst = await getGameState(page);
    expect(stateAfterFirst.fen).not.toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    
    // Go to end
    const goToEndBtn = navControls.locator('button').last();
    await goToEndBtn.click();
    await page.waitForTimeout(500);
    
    const stateAtEnd = await getGameState(page);
    expect(stateAtEnd.fen).toBe(stateAfterMoves.fen); // Should be back at the last position
  });
  
  test('should disable navigation buttons appropriately', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const navControls = page.locator('.navigation-controls');
    await expect(navControls).toBeVisible();
    
    // At start, back buttons should be disabled
    const goToStartBtn = navControls.locator('button').first();
    const goPrevBtn = navControls.locator('button').nth(1);
    const goNextBtn = navControls.locator('button').nth(2);
    const goToEndBtn = navControls.locator('button').last();
    
    await expect(goToStartBtn).toBeDisabled();
    await expect(goPrevBtn).toBeDisabled();
    await expect(goNextBtn).toBeDisabled(); // No moves yet
    await expect(goToEndBtn).toBeDisabled(); // No moves yet
    
    // Make a move
    await makeMove(page, 'e6-d6');
    await page.waitForTimeout(1500);
    
    // Now forward buttons should be enabled
    await expect(goToStartBtn).toBeEnabled();
    await expect(goPrevBtn).toBeEnabled();
    await expect(goNextBtn).toBeDisabled(); // Already at end
    await expect(goToEndBtn).toBeDisabled(); // Already at end
  });
  
  test('should highlight current move in move list', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Make some moves
    await makeMove(page, 'e6-d6');
    await page.waitForTimeout(1500);
    await makeMove(page, 'd6-c6');
    await page.waitForTimeout(1500);
    
    // Navigate back to first move
    const navControls = page.locator('.navigation-controls');
    const goToStartBtn = navControls.locator('button').first();
    await goToStartBtn.click();
    await page.waitForTimeout(500);
    
    const goNextBtn = navControls.locator('button').nth(2);
    await goNextBtn.click();
    await page.waitForTimeout(500);
    
    // Check if first move is highlighted
    const moveList = page.locator('.font-mono');
    const firstMove = moveList.first();
    
    // The highlighted move should have specific styling
    const bgColor = await firstMove.evaluate(el => {
      const parent = el.closest('button');
      return parent ? window.getComputedStyle(parent).backgroundColor : null;
    });
    
    // Should have some highlight color (not transparent)
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });
  
  test('should handle making new moves while in history', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Make some moves
    await makeMove(page, 'e6-d6');
    await page.waitForTimeout(1500);
    await makeMove(page, 'd6-c6');
    await page.waitForTimeout(1500);
    
    const initialState = await getGameState(page);
    const initialMoveCount = initialState.moveCount;
    
    // Navigate back to start
    const navControls = page.locator('.navigation-controls');
    const goToStartBtn = navControls.locator('button').first();
    await goToStartBtn.click();
    await page.waitForTimeout(500);
    
    // Make a different move (this should truncate history)
    await makeMove(page, 'e6-f6');
    await page.waitForTimeout(1500);
    
    const newState = await getGameState(page);
    
    // Move count should be less than before (history was truncated)
    expect(newState.moveCount).toBeLessThan(initialMoveCount);
    
    // We should be at the end of the new history
    const goNextBtn = navControls.locator('button').nth(2);
    const goToEndBtn = navControls.locator('button').last();
    await expect(goNextBtn).toBeDisabled();
    await expect(goToEndBtn).toBeDisabled();
  });
  
  test('should allow clicking on moves in move list to navigate', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Make several moves
    await makeMove(page, 'e6-d6');
    await page.waitForTimeout(1500);
    await makeMove(page, 'd6-c6');
    await page.waitForTimeout(1500);
    
    // Click on the first move in the list
    const moveList = page.locator('.font-mono');
    const firstMoveButton = moveList.first();
    
    await firstMoveButton.click();
    await page.waitForTimeout(500);
    
    // Check that we navigated to that position
    const state = await getGameState(page);
    
    // Should not be at the initial position or the final position
    expect(state.fen).not.toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'); // Not initial
    
    // Navigation buttons should reflect the position
    const navControls = page.locator('.navigation-controls');
    const goPrevBtn = navControls.locator('button').nth(1);
    const goNextBtn = navControls.locator('button').nth(2);
    
    await expect(goPrevBtn).toBeEnabled(); // Can go back
    await expect(goNextBtn).toBeEnabled(); // Can go forward
  });
});