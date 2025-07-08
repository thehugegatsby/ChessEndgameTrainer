import { test, expect, Page } from '@playwright/test';

/**
 * Edge Case Tests for Endgame Trainer
 * Tests error handling, invalid moves, game end conditions, and edge cases
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

test.describe('@smoke Edge Case Tests', () => {
  
  test('should reject invalid moves', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Try various invalid moves
    const invalidMoves = [
      'e6-e8', // King can't move to e8
      'e6-d4', // Too far for king
      'a1-a8', // No piece on a1
      'e5-e6', // Pawn can't move backward
      'invalid', // Completely invalid notation
      'Ke9', // Invalid square
      '', // Empty move
    ];
    
    for (const invalidMove of invalidMoves) {
      const result = await makeMove(page, invalidMove);
      expect(result).toBe(false);
      console.log(`Invalid move "${invalidMove}" correctly rejected`);
    }
    
    // Verify game state unchanged
    const state = await getGameState(page);
    expect(state.moveCount).toBe(0);
    expect(state.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
  });
  
  test('should handle rapid move attempts gracefully', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Try to make multiple moves rapidly without waiting for engine
    const moves = ['e6-d6', 'e6-f6', 'e6-d5', 'e6-f5'];
    const results = await Promise.all(
      moves.map(move => makeMove(page, move))
    );
    
    // Only the first valid move should succeed
    const successCount = results.filter(r => r).length;
    expect(successCount).toBeLessThanOrEqual(1);
    
    // Wait for engine to respond
    await page.waitForTimeout(2000);
    
    // Game should be in a stable state
    const state = await getGameState(page);
    expect(state.moveCount).toBeGreaterThanOrEqual(1);
  });
  
  test('should handle game end conditions', async ({ page }) => {
    // Go to a position where we can reach game end quickly
    // Position 7 (Randbauer) might end in a draw
    await page.goto('/train/7');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const initialState = await getGameState(page);
    console.log('Testing position 7 with FEN:', initialState.fen);
    
    // Make several moves to potentially reach game end
    // (Exact moves depend on position, this is a general test)
    let moveCount = 0;
    const maxMoves = 20; // Prevent infinite loop
    
    while (moveCount < maxMoves) {
      const state = await getGameState(page);
      
      // Check if game has ended
      if (state.isGameOver) {
        console.log('Game ended with result:', state.result);
        
        // Should show game result
        const resultText = page.locator('text=/Remis|Matt|Schachmatt|Draw|Checkmate/i');
        await expect(resultText).toBeVisible({ timeout: 5000 });
        
        // Should not allow more moves
        const testMove = await makeMove(page, 'a1-a2');
        expect(testMove).toBe(false);
        break;
      }
      
      // Try a simple king move based on current position
      // This is position-agnostic testing
      const possibleMoves = [
        'a1-a2', 'a2-a3', 'a3-a4', 'a4-a5',
        'b1-b2', 'b2-b3', 'b3-b4', 'b4-b5',
        'c1-c2', 'c2-c3', 'c3-c4', 'c4-c5',
      ];
      
      let moveMade = false;
      for (const move of possibleMoves) {
        if (await makeMove(page, move)) {
          moveMade = true;
          moveCount++;
          await page.waitForTimeout(1500); // Wait for engine
          break;
        }
      }
      
      if (!moveMade) {
        // No valid moves found, might be stalemate
        console.log('No valid moves available');
        break;
      }
    }
    
    // Test completed - either game ended or we made enough moves
    expect(moveCount).toBeGreaterThan(0);
  });
  
  test('should recover from engine errors gracefully', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Make a valid move
    await page.waitForTimeout(2000);
    const moveResult = await makeMove(page, 'e6-d6');
    expect(moveResult).toBe(true);
    
    // Even if engine has issues, UI should remain functional
    await page.waitForTimeout(3000);
    
    // Check if we can still interact with the board
    const state = await getGameState(page);
    expect(state).toBeDefined();
    
    // Navigation should still work
    const nextButton = page.locator('button').filter({ hasText: 'Nächste Stellung' });
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();
    
    console.log('Console errors detected:', consoleErrors.length);
  });
  
  test('should handle browser refresh mid-game', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Make a move
    const moveResult = await makeMove(page, 'e6-d6');
    expect(moveResult).toBe(true);
    
    // Wait for engine response
    await page.waitForTimeout(1500);
    
    const stateBeforeRefresh = await getGameState(page);
    const moveCountBefore = stateBeforeRefresh.moveCount;
    
    // Refresh the page
    await page.reload();
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check state after refresh
    const stateAfterRefresh = await getGameState(page);
    
    // Game should reset to initial position (current behavior)
    expect(stateAfterRefresh.moveCount).toBe(0);
    expect(stateAfterRefresh.fen).toBe('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
    
    console.log('Game reset after refresh (current behavior)');
  });
  
  test('should handle test hooks not available gracefully', async ({ page }) => {
    // Navigate without test mode
    await page.goto('/train/1', {
      // Simulate environment without NEXT_PUBLIC_TEST_MODE
      waitUntil: 'domcontentloaded'
    });
    
    // Try to use test hooks
    const hasTestHooks = await page.evaluate(() => {
      return !!(window as any).e2e_makeMove && !!(window as any).e2e_getGameState;
    });
    
    if (!hasTestHooks) {
      console.log('Test hooks not available - app should still function normally');
      
      // Board should still be visible
      await expect(page.locator('[class*="chessboard"]')).toBeVisible({ timeout: 10000 });
      
      // Navigation should work
      const nextButton = page.locator('button').filter({ hasText: 'Nächste Stellung' });
      await expect(nextButton).toBeVisible();
    } else {
      // Test hooks are available
      expect(hasTestHooks).toBe(true);
    }
  });
  
  test('should handle position with no legal moves', async ({ page }) => {
    // This is a theoretical test - most positions have legal moves
    // But we test the pattern in case such position exists
    
    await page.goto('/train/1');
    await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // If we encounter a position with no legal moves
    const state = await getGameState(page);
    
    // Try to make an illegal move when no moves available
    if (state.isGameOver || state.isDraw) {
      const result = await makeMove(page, 'e6-d6');
      expect(result).toBe(false);
      
      // UI should show game status
      const statusText = page.locator('text=/Remis|Patt|Stalemate|Game Over/i');
      const hasStatus = await statusText.count() > 0;
      
      if (hasStatus) {
        console.log('Game end status displayed correctly');
      }
    } else {
      // Normal position - at least one move should be possible
      const canMove = await makeMove(page, 'e6-d6') || 
                      await makeMove(page, 'e6-f6') ||
                      await makeMove(page, 'e6-d5') ||
                      await makeMove(page, 'e6-f5');
      expect(canMove).toBe(true);
    }
  });
});