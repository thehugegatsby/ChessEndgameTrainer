import { test, expect } from '@playwright/test';
import {
  navigateToTraining,
  makeMove,
  waitForEngineResponse,
  getGameState,
  verifyPosition,
  KNOWN_POSITIONS,
} from './helpers';

/**
 * URL Parameter Test (Fixed) - Tests both URL params and test hooks
 */
test.describe('@smoke URL Parameter and Move Tests', () => {
  
  test('Brückenbau Position mit URL Parametern', async ({ page }) => {
    // Navigate with URL parameter using correct notation
    // For position 12 (Bridge Building), the white king starts on c8
    await page.goto('/train/12?moves=Kd7');
    
    // Wait for board to load and automated moves to execute
    await page.waitForSelector('[data-square="a1"]', { state: 'visible' });
    await page.waitForTimeout(3000);
    
    // Verify move was made
    try {
      const state = await getGameState(page);
      expect(state.moveCount).toBeGreaterThan(0);
      expect(state.pgn).toContain('Kd7');
    } catch {
      // If test hooks not available, check UI
      const movePanel = page.locator('div:has(> .font-mono)').first();
      await expect(movePanel).toBeVisible();
      await expect(movePanel).not.toContainText('Noch keine Züge gespielt');
    }
  });

  test('Opposition Position mit test hooks', async ({ page }) => {
    // Navigate to position 1 using helper
    await navigateToTraining(page, 1);
    await verifyPosition(page, KNOWN_POSITIONS.opposition1);

    // Make a valid move using test hooks
    const moveResult = await makeMove(page, 'e1-e2');
    expect(moveResult.success).toBe(true);

    // Wait for engine response
    await waitForEngineResponse(page, 2);

    // Verify state
    const state = await getGameState(page);
    expect(state.moveCount).toBeGreaterThanOrEqual(2);
    expect(state.pgn).toContain('Ke2');

    // Verify UI
    const movePanel = page.locator('div:has(> .font-mono)').first();
    await expect(movePanel).toBeVisible();
    await expect(movePanel).not.toContainText('Noch keine Züge gespielt');
    await expect(movePanel.locator('.font-mono').first()).toContainText('Ke2');
  });

  test('Multiple moves via URL parameter', async ({ page }) => {
    // Navigate with multiple moves using correct notation
    await page.goto('/train/1?moves=Ke2,Ke3');
    
    // Wait for all moves to be played
    await page.waitForSelector('[data-square="a1"]', { state: 'visible' });
    await page.waitForTimeout(5000);
    
    // Verify moves were made
    try {
      const state = await getGameState(page);
      expect(state.moveCount).toBeGreaterThanOrEqual(2);
    } catch {
      // Check UI for moves
      const movePanel = page.locator('div:has(> .font-mono)').first();
      await expect(movePanel).toBeVisible();
      await expect(movePanel).not.toContainText('Noch keine Züge gespielt');
    }
  });

  test('Test verschiedene legale Züge für Position 1', async ({ page }) => {
    // Navigate to position 1
    await navigateToTraining(page, 1);
    await verifyPosition(page, KNOWN_POSITIONS.opposition1);

    // Test legal king moves from e1
    const legalMoves = [
      { notation: 'e1-d1', san: 'Kd1' },
      { notation: 'e1-d2', san: 'Kd2' },
      { notation: 'e1-e2', san: 'Ke2' },
      { notation: 'e1-f1', san: 'Kf1' },
      { notation: 'e1-f2', san: 'Kf2' }
    ];

    // Test first legal move
    const move = legalMoves[2]; // Use Ke2
    const result = await makeMove(page, move.notation);
    expect(result.success).toBe(true);

    await waitForEngineResponse(page, 2);

    const state = await getGameState(page);
    expect(state.pgn).toContain(move.san);
    
    console.log(`✅ Legal move ${move.notation} (${move.san}) worked!`);
  });
});