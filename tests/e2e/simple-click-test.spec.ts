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
 * Simple Move Test (Fixed) - Uses test hooks instead of DOM clicks
 */
test.describe('@smoke Simple Move Tests', () => {
  
  test('sollte einfache Züge mit test hooks ausführen können', async ({ page }) => {
    // Navigate to position 1 (Opposition)
    await navigateToTraining(page, 1);
    await verifyPosition(page, KNOWN_POSITIONS.opposition1);

    // Verify initial state
    const initialState = await getGameState(page);
    expect(initialState.moveCount).toBe(0);
    expect(initialState.pgn).toBe('');

    // Make a valid move for position 1 (King from e1 to e2)
    const moveResult = await makeMove(page, 'e1-e2');
    expect(moveResult.success, 'Move e1-e2 should be successful').toBe(true);

    // Wait for engine response (should have 2 moves now)
    await waitForEngineResponse(page, 2);

    // Verify state after move
    const afterMoveState = await getGameState(page);
    expect(afterMoveState.moveCount).toBeGreaterThanOrEqual(2);
    expect(afterMoveState.pgn).toContain('Ke2');

    // Verify move list UI is updated
    const movePanel = page.locator('div:has(> .font-mono)').first();
    await expect(movePanel).toBeVisible();
    await expect(movePanel).not.toContainText('Noch keine Züge gespielt');
    await expect(movePanel.locator('.font-mono').first()).toContainText('Ke2');

    console.log('✓ Simple move test with test hooks successful');
  });

  test('sollte ungültige Züge ablehnen', async ({ page }) => {
    // Navigate to position 1
    await navigateToTraining(page, 1);
    await verifyPosition(page, KNOWN_POSITIONS.opposition1);

    // Try an invalid move (King to impossible position)
    const moveResult = await makeMove(page, 'e1-a8');
    expect(moveResult.success, 'Invalid move should fail').toBe(false);

    // State should remain unchanged
    const state = await getGameState(page);
    expect(state.moveCount).toBe(0);
    expect(state.pgn).toBe('');

    // UI should still show initial state
    const movePanel = page.locator('div:has(> .font-mono)').first();
    await expect(movePanel).toContainText('Noch keine Züge gespielt');
  });

  test('sollte Zugfolge korrekt verarbeiten', async ({ page }) => {
    // Navigate to position 1
    await navigateToTraining(page, 1);
    await verifyPosition(page, KNOWN_POSITIONS.opposition1);

    // Make first move
    const move1 = await makeMove(page, 'e1-e2');
    expect(move1.success).toBe(true);
    await waitForEngineResponse(page, 2);

    // Make second move (after engine response)
    // Note: We need to figure out what the engine played
    const stateAfterEngine = await getGameState(page);
    
    // Make another white move based on position
    const move2 = await makeMove(page, 'e2-e3');
    if (move2.success) {
      await waitForEngineResponse(page, 4);

      // Verify final state
      const finalState = await getGameState(page);
      expect(finalState.moveCount).toBeGreaterThanOrEqual(4);
      expect(finalState.pgn).toContain('Ke2');
      expect(finalState.pgn).toContain('Ke3');
    }
  });
});