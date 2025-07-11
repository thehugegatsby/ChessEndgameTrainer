/**
 * @fileoverview Critical E2E Test: Error Handling with Undo
 * @description Tests error recovery and undo functionality
 * 
 * User Story: "Als Nutzer kann ich Fehler machen, daraus lernen und den Zug zurücknehmen."
 */

import { test, expect } from '../test-fixtures';
import { ModernDriver } from '../components/ModernDriver';

test.describe('Critical: Error Handling and Undo', () => {
  // TODO: Undo button feature not yet implemented
  // User story: "Als Nutzer kann ich Fehler machen, daraus lernen und den Zug zurücknehmen."
  // Required UI elements: undo-button, move-evaluation display
  let driver: ModernDriver;

  test.beforeEach(async ({ page }) => {
    driver = new ModernDriver(page, {
      useTestBridge: true,
      defaultTimeout: 30000
    });
    await driver.visit('/train/1');
  });

  test.afterEach(async () => {
    await driver?.dispose();
  });

  test.skip('Can undo a bad move and try again', async () => {
    // Step 1: Make a good move first
    await driver.makeMove('e2', 'e4');
    
    const bridge = driver.bridge;
    if (bridge) {
      // Configure bad evaluation for next move
      await bridge.setEvaluation(
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/5P2/PPPP2PP/RNBQKBNR w KQkq - 0 2',
        -200 // Bad position
      );
    }
    
    // Step 2: Make a bad move
    await driver.makeMove('f2', 'f3'); // Weakening move
    
    // Step 3: Verify error feedback
    const moveQuality = await driver.page.textContent('[data-testid="move-evaluation"]');
    expect(moveQuality).toMatch(/fehler|schlecht|weak/);
    
    // Step 4: Click undo button
    await driver.page.click('[data-testid="undo-button"]');
    
    // Step 5: Verify position restored
    await driver.page.waitForTimeout(500); // Wait for animation
    const gameState = await driver.getGameState();
    expect(gameState.moveCount).toBe(2); // Back to after first move
    
    // Step 6: Make a better move
    await driver.makeMove('g1', 'f3'); // Better development
    
    // Step 7: Verify positive feedback
    if (bridge) {
      await bridge.setEvaluation(
        'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
        30 // Good position
      );
    }
    
    const newQuality = await driver.page.textContent('[data-testid="move-evaluation"]');
    expect(newQuality).toMatch(/optimal|sicher|gut/);
  });

  test.skip('Undo is disabled at start position', async () => {
    // At start, undo should be disabled
    const undoButton = await driver.page.locator('[data-testid="undo-button"]');
    await expect(undoButton).toBeDisabled();
    
    // After a move, it should be enabled
    await driver.makeMove('e2', 'e4');
    await expect(undoButton).toBeEnabled();
  });
});