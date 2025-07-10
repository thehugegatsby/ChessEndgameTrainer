import { test, expect } from '@playwright/test';
import { makeMove, getGameState, waitForEngineResponse, navigateToTraining } from './helpers';

/**
 * Tests for Opposition positions with correct moves
 */

test.describe('@smoke Opposition Positions', () => {
  
  test('Position 1: Basic Opposition - correct moves Kd6/Kf6', async ({ page }) => {
    await page.goto('/train/1');
    
    // Wait for board
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Initial position: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1
    const initialState = await getGameState(page);
    expect(initialState.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    
    // Correct move: Kd6 (maintains opposition)
    const correctMoveResult = await makeMove(page, 'e6-d6');
    expect(correctMoveResult.success).toBe(true);
    
    const stateAfterCorrect = await getGameState(page);
    expect(stateAfterCorrect.moveCount).toBeGreaterThan(0);
    console.log('After Kd6:', stateAfterCorrect.fen);
  });
  
  test('Position 1: Basic Opposition - wrong moves Kd5/Kf5 lose', async ({ page }) => {
    await page.goto('/train/1');
    
    // Wait for board
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Wrong move: Kd5 (loses opposition)
    const wrongMoveResult = await makeMove(page, 'e6-d5');
    expect(wrongMoveResult.success).toBe(true); // Legal but losing
    
    // Wait for black response
    await page.waitForTimeout(1000);
    
    const finalState = await getGameState(page);
    console.log('After Kd5 (losing):', finalState.fen);
    
    // TODO: When evaluation is implemented, check for "draw" evaluation
  });
  
  test('Position 2: Advanced Opposition - only Ke3 wins', async ({ page }) => {
    await page.goto('/train/2');
    
    // Wait for board
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Initial position: 8/8/8/4k3/8/8/4PK2/8 w - - 0 1
    const initialState = await getGameState(page);
    expect(initialState.fen).toBe('8/8/8/4k3/8/8/4PK2/8 w - - 0 1');
    
    // Only winning move: Ke3!
    const winningMoveResult = await makeMove(page, 'f2-e3');
    expect(winningMoveResult.success).toBe(true);
    
    const stateAfterKe3 = await getGameState(page);
    expect(stateAfterKe3.moveCount).toBeGreaterThanOrEqual(1);
    console.log('After Ke3!:', stateAfterKe3.fen);
  });
  
  test('Position 2: Advanced Opposition - e4 throws away the win', async ({ page }) => {
    await page.goto('/train/2');
    
    // Wait for board
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Wrong move: e4 (throws away the win)
    const wrongMoveResult = await makeMove(page, 'e2-e4');
    expect(wrongMoveResult.success).toBe(true); // Legal but only draws
    
    await page.waitForTimeout(1000);
    
    const finalState = await getGameState(page);
    console.log('After e4 (only draws):', finalState.fen);
    
    // TODO: When evaluation is implemented, check for "draw" evaluation
  });
  
  test('Position 2: Advanced Opposition - Kf1 also throws away the win', async ({ page }) => {
    await page.goto('/train/2');
    
    // Wait for board
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Wrong move: Kf1 (throws away the win)
    const wrongMoveResult = await makeMove(page, 'f2-f1');
    expect(wrongMoveResult.success).toBe(true); // Legal but only draws
    
    await page.waitForTimeout(1000);
    
    const finalState = await getGameState(page);
    console.log('After Kf1 (only draws):', finalState.fen);
    
    // TODO: When evaluation is implemented, check for "draw" evaluation
  });
});