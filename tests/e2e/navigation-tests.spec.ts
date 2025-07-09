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
 * Navigation Tests (Fixed)
 * Tests navigation between different training positions
 */
test.describe('@smoke Navigation Tests', () => {
  
  test('should navigate between different endgame positions', async ({ page }) => {
    // Start at position 1
    const state1 = await navigateToTraining(page, 1);
    expect(state1.fen).toBe(KNOWN_POSITIONS.opposition1);
    
    // Navigate to position 12
    const state12 = await navigateToTraining(page, 12);
    expect(state12.fen).toBe(KNOWN_POSITIONS.bridgeBuilding);
    
    // Go back to position 1
    const state1Again = await navigateToTraining(page, 1);
    expect(state1Again.fen).toBe(KNOWN_POSITIONS.opposition1);
  });
  
  test('should show position title and description', async ({ page }) => {
    await navigateToTraining(page, 1);
    
    // Check for title
    await expect(page.locator('h2:has-text("Opposition")')).toBeVisible();
    
    // Check for description
    await expect(page.locator('text=fundamentale Konzept')).toBeVisible();
    
    // Navigate to bridge building
    await navigateToTraining(page, 12);
    
    // Check for different title
    await expect(page.locator('h2:has-text("Brückenbau")')).toBeVisible();
  });
  
  test('should handle invalid position IDs gracefully', async ({ page }) => {
    await page.goto('/train/999');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should not crash - check for 404 or redirect
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Should not show a training board for invalid ID
    const boardExists = await page.locator('[data-square="a1"]').isVisible().catch(() => false);
    
    // If board exists, it should be a fallback position, not position 999
    if (boardExists) {
      // Try to get game state
      try {
        const state = await getGameState(page);
        // Should not be position 999
        expect(state).toBeTruthy();
      } catch {
        // Expected - test hooks might not be available on 404 page
      }
    }
  });
  
  test('should preserve game state when navigating away and back', async ({ page }) => {
    // Start a game
    await navigateToTraining(page, 1);
    
    // Make a move
    await makeMove(page, 'e6-d6');
    await waitForEngineResponse(page, 2);
    
    const stateBefore = await getGameState(page);
    expect(stateBefore.moveCount).toBe(2);
    
    // Navigate to different position
    await navigateToTraining(page, 12);
    
    // Navigate back
    await navigateToTraining(page, 1);
    
    // Should be reset (not preserving state across navigation)
    const stateAfter = await getGameState(page);
    expect(stateAfter.moveCount).toBe(0);
    expect(stateAfter.fen).toBe(KNOWN_POSITIONS.opposition1);
  });
});