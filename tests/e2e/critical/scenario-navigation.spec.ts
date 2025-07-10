/**
 * @fileoverview Critical E2E Test: Scenario Navigation
 * @description Tests navigation between training scenarios
 * 
 * User Story: "Als Nutzer navigiere ich zwischen Trainings-Szenarien und sehe meinen Fortschritt."
 */

import { test, expect } from '@playwright/test';
import { ModernDriver } from '../components/ModernDriver';

test.describe('Critical: Scenario Navigation', () => {
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

  test('Can navigate between different training scenarios', async () => {
    // Step 1: Start at scenario list
    await driver.visit('/train');
    
    // Step 2: Verify scenario list is displayed
    await driver.page.waitForSelector('[data-testid="scenario-list"]');
    const scenarios = await driver.page.$$('[data-testid="scenario-item"]');
    expect(scenarios.length).toBeGreaterThan(0);
    
    // Step 3: Click on first scenario
    await driver.page.click('[data-testid="scenario-1"]');
    
    // Step 4: Verify we're in scenario 1
    await driver.page.waitForURL('**/train/1');
    const gameState = await driver.getGameState();
    expect(gameState.status).toBe('playing');
    
    // Step 5: Navigate back to list
    await driver.page.click('[data-testid="back-to-list"]');
    await driver.page.waitForURL('**/train');
    
    // Step 6: Select different scenario
    await driver.page.click('[data-testid="scenario-2"]');
    await driver.page.waitForURL('**/train/2');
    
    // Step 7: Verify different scenario loaded
    const newState = await driver.getGameState();
    expect(newState.status).toBe('playing');
    // Position should be different from scenario 1
  });

  test('Shows progress indicators for completed scenarios', async () => {
    // Navigate to scenario list
    await driver.visit('/train');
    
    // Check initial status
    const scenario1Status = await driver.page.getAttribute(
      '[data-testid="scenario-1-status"]',
      'data-completed'
    );
    expect(scenario1Status).toBe('false');
    
    // Complete a scenario (simplified - just make one move)
    await driver.page.click('[data-testid="scenario-1"]');
    await driver.makeMove('e2', 'e4');
    
    // Mark as completed (in real app, this would happen after winning)
    // For testing, we'll simulate completion
    await driver.page.evaluate(() => {
      localStorage.setItem('scenario-1-completed', 'true');
    });
    
    // Go back to list
    await driver.page.click('[data-testid="back-to-list"]');
    
    // Verify completion status
    const updatedStatus = await driver.page.getAttribute(
      '[data-testid="scenario-1-status"]',
      'data-completed'
    );
    expect(updatedStatus).toBe('true');
    
    // Should show checkmark or completion indicator
    const checkmark = await driver.page.locator('[data-testid="scenario-1-checkmark"]');
    await expect(checkmark).toBeVisible();
  });
});