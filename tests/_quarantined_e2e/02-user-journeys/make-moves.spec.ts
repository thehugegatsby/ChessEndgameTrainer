/**
 * @fileoverview Critical E2E Test: Move Evaluation
 * @description Tests the interactive move evaluation feature
 * 
 * User Story: "Als Nutzer sehe ich sofort, ob mein Zug optimal/sicher/fehler war."
 */

import { test, expect } from '../test-fixtures';
import { ModernDriver } from '../components/ModernDriver';

test.describe('Critical: Move Evaluation', () => {
  // TODO: Feature not yet implemented - these tests document expected behavior
  // User story: "Als Nutzer sehe ich sofort, ob mein Zug optimal/sicher/fehler war."
  // Required UI elements: move-evaluation display, eval-score indicator
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

  test.skip('Shows move quality feedback after each move', async () => {
    // Configure Test Bridge to return evaluation
    const bridge = driver.bridge;
    if (bridge) {
      await bridge.setEvaluation(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        50 // Slightly better for white = optimal move
      );
    }
    
    // Make a move
    await driver.makeMove('e2', 'e4');
    
    // Wait for evaluation to appear
    await driver.page.waitForSelector('[data-testid="move-evaluation"]', {
      timeout: 5000
    });
    
    // Check move quality
    const moveQuality = await driver.page.textContent('[data-testid="move-evaluation"]');
    expect(moveQuality).toMatch(/optimal|sicher|gut/); // One of the positive evaluations
    
    // Verify evaluation score is displayed
    const evalScore = await driver.page.textContent('[data-testid="eval-score"]');
    expect(evalScore).toBeTruthy();
    expect(evalScore).toContain('+'); // Positive evaluation
  });

  test.skip('Shows error feedback for bad moves', async () => {
    const bridge = driver.bridge;
    if (bridge) {
      // Configure bad evaluation for blunder
      await bridge.setEvaluation(
        'rnbqkbnr/pppppppp/8/8/8/5P2/PPPPP1PP/RNBQKBNR b KQkq - 0 1',
        -300 // Bad for white = fehler
      );
    }
    
    // Make a bad move (f2-f3 weakens king)
    await driver.makeMove('f2', 'f3');
    
    // Check for error feedback
    const moveQuality = await driver.page.textContent('[data-testid="move-evaluation"]');
    expect(moveQuality).toMatch(/fehler|schlecht|weak/); // Error indication
    
    // Verify negative evaluation
    const evalScore = await driver.page.textContent('[data-testid="eval-score"]');
    expect(evalScore).toContain('-'); // Negative evaluation
  });
});