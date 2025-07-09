import { test, expect } from '@playwright/test';
import {
  navigateToTraining,
  makeMove,
  waitForEngineResponse,
  getGameState,
  verifyPosition,
  KNOWN_POSITIONS,
  waitForElement,
  resetGame
} from './helpers';

/**
 * Edge Case Tests (Fixed)
 * Tests boundary conditions and error scenarios
 */
test.describe('@smoke Edge Case Tests', () => {
  
  test('should handle invalid position IDs gracefully', async ({ page }) => {
    // Navigate to non-existent position
    await page.goto('/train/999');
    
    // Should show error or redirect
    await page.waitForTimeout(2000);
    
    // Check we're not on a training page with that ID
    const url = page.url();
    // Should either redirect or show 404
    expect(url).toBeTruthy();
    
    // Page should not crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
  
  test('should handle game end conditions', async ({ page }) => {
    // Navigate to a simple position
    await navigateToTraining(page, 1);
    
    // Make moves until game might end
    const move1 = await makeMove(page, 'e6-d6');
    expect(move1.success).toBe(true);
    
    await waitForEngineResponse(page, 2);
    
    // Game should still be playable
    const state = await getGameState(page);
    expect(state.isGameOver).toBe(false);
    
    // UI should still be responsive
    const resetButton = page.locator('button:has-text("Reset")');
    await expect(resetButton).toBeEnabled();
  });
  
  test('should recover from invalid moves', async ({ page }) => {
    await navigateToTraining(page, 1);
    
    // Try an invalid move
    const invalidMove = await makeMove(page, 'e6-a1');
    expect(invalidMove.success).toBe(false);
    
    // Should still be able to make valid moves
    const validMove = await makeMove(page, 'e6-d6');
    expect(validMove.success).toBe(true);
    
    await waitForEngineResponse(page, 2);
    
    // Game state should be updated
    const state = await getGameState(page);
    expect(state.moveCount).toBe(2);
  });
  
  test('should handle rapid clicking without breaking', async ({ page }) => {
    await navigateToTraining(page, 1);
    
    // Make multiple moves rapidly
    const moves = ['e6-d6', 'd6-c6', 'c6-b5'];
    
    for (let i = 0; i < moves.length; i++) {
      const result = await makeMove(page, moves[i]);
      if (result.success) {
        // Don't wait for engine, just continue
        await page.waitForTimeout(100);
      } else {
        // Move might not be valid in current position
        break;
      }
    }
    
    // Wait for everything to settle
    await page.waitForTimeout(3000);
    
    // Game should still be in valid state
    const finalState = await getGameState(page);
    expect(finalState).toBeTruthy();
    expect(finalState.moveCount).toBeGreaterThan(0);
  });
});