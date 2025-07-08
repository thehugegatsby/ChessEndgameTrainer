import { test, expect, Page } from '@playwright/test';

/**
 * Migrated Playwright E2E Test for Basic Training Flow
 * Uses test hooks instead of DOM clicks
 */

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

// Helper to get game state
const getGameState = async (page: Page) => {
  return await page.evaluate(() => {
    return (window as any).e2e_getGameState?.();
  });
};

test.describe('@smoke Basic Training Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable console logs for debugging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser ${msg.type()}:`, msg.text());
      }
    });
  });
  
  test('should complete basic training sequence', async ({ page }) => {
    // Navigate to training page
    await page.goto('/train/1');
    
    // Wait for board to be ready
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Give engine time to initialize
    
    // Get initial state
    const initialState = await getGameState(page);
    expect(initialState).toBeTruthy();
    console.log('Initial position:', initialState.fen);
    
    // Make first move - correct move for position 1 is Kd6 or Kf6
    const move1 = await makeMove(page, 'e6-d6');
    expect(move1).toBe(true);
    
    // Check state after move
    const stateAfterMove1 = await getGameState(page);
    expect(stateAfterMove1.moveCount).toBeGreaterThan(initialState.moveCount);
    
    // Wait for engine response
    await page.waitForTimeout(1000);
    
    // Check final state
    const finalState = await getGameState(page);
    console.log('Final state:', {
      moveCount: finalState.moveCount,
      turn: finalState.turn,
      pgn: finalState.pgn
    });
    
    // Verify at least 2 moves were made (player + engine)
    expect(finalState.moveCount).toBeGreaterThanOrEqual(2);
  });
  
  test('should handle losing moves correctly', async ({ page }) => {
    await page.goto('/train/1');
    
    // Wait for board
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Try a losing move - Kd5 loses opposition
    const losingMove = await makeMove(page, 'e6-d5'); // Bad move - loses opposition
    expect(losingMove).toBe(true); // Move is legal
    
    // Wait for engine response
    await page.waitForTimeout(1000);
    
    // Game state should show both moves (player + engine response)
    const state = await getGameState(page);
    expect(state.moveCount).toBeGreaterThanOrEqual(2); // Player move + engine response
    
    // Verify the move was made by checking PGN contains Kd5
    expect(state.pgn).toContain('Kd5');
    
    // TODO: Check for evaluation showing this is a mistake when feature is implemented
  });
  
  test('should display move history', async ({ page }) => {
    await page.goto('/train/1');
    
    // Wait for board
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Make a move
    await makeMove(page, 'e2-e4');
    await page.waitForTimeout(1500); // Wait for engine
    
    // Check move panel exists
    const movePanel = page.locator('.space-y-1');
    await expect(movePanel).toBeVisible();
    
    // Check that moves are displayed
    const moves = movePanel.locator('.font-mono');
    const moveCount = await moves.count();
    expect(moveCount).toBeGreaterThan(0);
  });
});