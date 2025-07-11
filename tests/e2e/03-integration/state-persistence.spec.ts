/**
 * @fileoverview Critical E2E Test: Session Persistence
 * @description Tests that training progress is saved and restored
 * 
 * User Story: "Als Nutzer kann ich das Training unterbrechen und später fortsetzen."
 */

import { test, expect } from '../test-fixtures';
import { ModernDriver } from '../components/ModernDriver';

test.describe('Critical: Session Persistence', () => {
  let driver: ModernDriver;

  test.beforeEach(async ({ page }) => {
    driver = new ModernDriver(page, {
      useTestBridge: true,
      defaultTimeout: 30000
    });
  });

  test.afterEach(async () => {
    await driver?.dispose();
  });

  test('Saves and restores game state on page reload', async ({ page }) => {
    // Step 1: Start a training session
    await driver.visit('/train/1');
    
    // Step 2: Make some moves
    await driver.makeMove('e2', 'e4');
    await driver.makeMove('g1', 'f3');
    
    // Step 3: Get current state
    const beforeReload = await driver.getGameState();
    expect(beforeReload.moveCount).toBe(4); // 2 player + 2 engine moves
    
    // Get the current position
    const positionBefore = await driver.board.getPosition();
    
    // Step 4: Reload the page
    await page.reload();
    
    // Step 5: Wait for page to be ready again
    await driver.waitUntilReady();
    
    // Step 6: Verify state was restored
    const afterReload = await driver.getGameState();
    expect(afterReload.moveCount).toBe(beforeReload.moveCount);
    
    const positionAfter = await driver.board.getPosition();
    expect(positionAfter).toBe(positionBefore);
    
    // Step 7: Verify we can continue playing
    await driver.makeMove('f1', 'c4');
    const continuedState = await driver.getGameState();
    expect(continuedState.moveCount).toBe(6); // Continued from saved state
  });

  test('Clears state when starting new scenario', async () => {
    // Step 1: Play scenario 1
    await driver.visit('/train/1');
    await driver.makeMove('e2', 'e4');
    
    // Step 2: Switch to scenario 2
    await driver.visit('/train/2');
    
    // Step 3: Verify clean state
    const newScenarioState = await driver.getGameState();
    expect(newScenarioState.moveCount).toBe(0);
    
    // Step 4: Go back to scenario 1
    await driver.visit('/train/1');
    
    // Step 5: Verify scenario 1 state was preserved
    const scenario1State = await driver.getGameState();
    expect(scenario1State.moveCount).toBe(2); // Previous progress
  });

  test('Handles browser back/forward navigation', async ({ page }) => {
    // Step 1: Visit scenario list
    await driver.visit('/train');
    
    // Step 2: Go to scenario 1
    await driver.page.click('[data-testid="scenario-1"]');
    await driver.makeMove('e2', 'e4');
    
    // Step 3: Use browser back
    await page.goBack();
    await expect(page).toHaveURL(/\/train$/);
    
    // Step 4: Use browser forward
    await page.goForward();
    await expect(page).toHaveURL(/\/train\/1$/);
    
    // Step 5: Verify state preserved
    const state = await driver.getGameState();
    expect(state.moveCount).toBe(2); // Move was preserved
  });
});