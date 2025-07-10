/**
 * @fileoverview Critical E2E Test: Move Navigation
 * @description Tests the core functionality of navigating through moves in a training session
 * 
 * This test validates:
 * - Navigation buttons work correctly
 * - Clicking moves in the move list updates the board
 * - Board state syncs with selected move
 * - Active move highlighting
 * - Keyboard navigation (if implemented)
 */

import { test, expect } from '@playwright/test';
import { AppDriver } from '../components/AppDriver';

test.describe('Critical User Journey: Navigate Through Moves', () => {
  let appDriver: AppDriver;

  test.beforeEach(async ({ page }) => {
    // Initialize E2E test mode before navigation
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    // Load Queen vs Rook position for testing navigation
    await page.goto('/train/5');
    
    // Initialize AppDriver after page load
    appDriver = new AppDriver(page);
    
    // Wait for board to be ready
    await appDriver.waitForReady();
  });

  test('should navigate through moves using move list clicks', async ({ page }) => {
    // Step 1: Make several moves to create a move history
    // Using test hooks for speed
    await page.evaluate(async () => {
      await (window as any).e2e_makeMove('d5-c5'); // Queen move
    });
    
    await appDriver.waitForMoveCount(2); // User + engine
    
    await page.evaluate(async () => {
      await (window as any).e2e_makeMove('c5-c4'); // Continue
    });
    
    await appDriver.waitForMoveCount(4);
    
    await page.evaluate(async () => {
      await (window as any).e2e_makeMove('c4-b4'); // Another move
    });
    
    await appDriver.waitForMoveCount(6);
    
    // Step 2: Navigate back to move 1 via move list click
    const moves = await appDriver.moveList.getMoves();
    expect(moves.length).toBeGreaterThanOrEqual(6);
    
    // Click on first move
    await appDriver.moveList.clickMove(1);
    
    // Verify board position matches move 1
    const afterMove1 = await appDriver.getGameState();
    expect(afterMove1.moveCount).toBe(1);
    
    // Verify active move highlighting
    const activeMove = await appDriver.moveList.getActiveMove();
    expect(activeMove?.moveNumber).toBe(1);
    expect(activeMove?.san).toBe(moves[0].san);
    
    // Step 3: Navigate to move 3 via click
    await appDriver.moveList.clickMove(3);
    
    const afterMove3 = await appDriver.getGameState();
    expect(afterMove3.moveCount).toBe(3);
    
    // Step 4: Navigate to last move
    await appDriver.moveList.goToLastMove();
    
    const atLastMove = await appDriver.getGameState();
    expect(atLastMove.moveCount).toBe(6);
    
    // Step 5: Test navigation buttons
    // Navigate back using button
    const navButtons = await page.locator('[data-testid="move-navigation"]');
    const prevButton = navButtons.locator('button[aria-label*="zurück"], button[aria-label*="previous"], button:has-text("◀"), button:has([data-testid="prev-icon"])').first();
    
    await prevButton.click();
    
    const afterPrevButton = await appDriver.getGameState();
    expect(afterPrevButton.moveCount).toBe(5);
    
    // Navigate forward using button
    const nextButton = navButtons.locator('button[aria-label*="vor"], button[aria-label*="next"], button:has-text("▶"), button:has([data-testid="next-icon"])').first();
    
    await nextButton.click();
    
    const afterNextButton = await appDriver.getGameState();
    expect(afterNextButton.moveCount).toBe(6);
    
    // Step 6: Test edge cases
    // Try to go past the last move (should stay at last move)
    await nextButton.click();
    const stillAtLastMove = await appDriver.getGameState();
    expect(stillAtLastMove.moveCount).toBe(6);
    
    // Go to first move
    await appDriver.moveList.goToFirstMove();
    
    // Try to go before first move (should stay at move 0)
    await prevButton.click();
    const atStartPosition = await appDriver.getGameState();
    expect(atStartPosition.moveCount).toBe(0);
    
    // Step 7: Verify board state consistency
    // Navigate to a middle move and verify piece positions
    await appDriver.moveList.clickMove(4);
    
    const middleState = await appDriver.getGameState();
    expect(middleState.fen).toContain('Q'); // Queen should be on board
    expect(middleState.turn).toBe('w'); // White to move after Black's 4th move
    
    // Log success
    console.log('✅ Move navigation test completed successfully');
  });

  test('should maintain navigation state after making new moves', async ({ page }) => {
    // Step 1: Create initial move history
    await page.evaluate(async () => {
      await (window as any).e2e_makeMove('d5-c5');
    });
    await appDriver.waitForMoveCount(2);
    
    await page.evaluate(async () => {
      await (window as any).e2e_makeMove('c5-c4');
    });
    await appDriver.waitForMoveCount(4);
    
    // Step 2: Navigate back to move 2
    await appDriver.moveList.clickMove(2);
    
    const beforeNewMove = await appDriver.getGameState();
    expect(beforeNewMove.moveCount).toBe(2);
    
    // Step 3: Make a new move from this position (variation)
    await page.evaluate(async () => {
      await (window as any).e2e_makeMove('c5-b5'); // Different move
    });
    
    // Wait for move list to update
    await appDriver.waitForMoveCount(4); // Should truncate and add new moves
    
    // Step 4: Verify move history was updated correctly
    const afterVariation = await appDriver.getGameState();
    expect(afterVariation.moveCount).toBe(4); // 2 original + 2 new
    
    // Verify we can still navigate
    await appDriver.moveList.clickMove(1);
    const backToMove1 = await appDriver.getGameState();
    expect(backToMove1.moveCount).toBe(1);
    
    // Navigate to the new variation move
    await appDriver.moveList.clickMove(3);
    const atVariationMove = await appDriver.getGameState();
    expect(atVariationMove.moveCount).toBe(3);
    
    // The move should be the variation we played
    const moves = await appDriver.moveList.getMoves();
    expect(moves[2].san).toContain('b5'); // Our variation move
    
    console.log('✅ Navigation state maintained correctly after variations');
  });

  test('should handle rapid navigation clicks gracefully', async ({ page }) => {
    // Create a longer move sequence for stress testing
    for (let i = 0; i < 5; i++) {
      await page.evaluate(async () => {
        await (window as any).e2e_makeMove('auto');
      });
      await page.waitForTimeout(100); // Small delay between moves
    }
    
    const finalMoveCount = await appDriver.moveList.getMoveCount();
    expect(finalMoveCount).toBeGreaterThanOrEqual(10); // 5 moves * 2 (user + engine)
    
    // Rapidly click different moves without waiting
    const clickPromises = [
      appDriver.moveList.clickMove(1),
      appDriver.moveList.clickMove(5),
      appDriver.moveList.clickMove(3),
      appDriver.moveList.clickMove(7),
      appDriver.moveList.clickMove(2)
    ];
    
    // Wait for all clicks to process
    await Promise.all(clickPromises);
    
    // Give the UI time to settle
    await page.waitForTimeout(500);
    
    // Verify the board is in a valid state
    const finalState = await appDriver.getGameState();
    expect(finalState.moveCount).toBeGreaterThanOrEqual(0);
    expect(finalState.moveCount).toBeLessThanOrEqual(finalMoveCount);
    
    // Verify we can still navigate normally
    await appDriver.moveList.goToLastMove();
    const atEnd = await appDriver.getGameState();
    expect(atEnd.moveCount).toBe(finalMoveCount);
    
    console.log('✅ Rapid navigation handled gracefully');
  });

  test.afterEach(async () => {
    // Cleanup if needed
    await appDriver.cleanup();
  });
});