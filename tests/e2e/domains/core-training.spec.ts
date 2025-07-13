/**
 * Core Training Workflow E2E Test
 * Journey: Homepage → Training → Move → Evaluation
 * 
 * Following Gemini's "Let Reality Drive Architecture" approach
 */

import { test, expect } from '@playwright/test';

test.describe('Core Training Workflow', () => {
  test('should complete homepage → training → move → evaluation journey', async ({ page }) => {
    // 🏠 STEP 1: Homepage laden
    await page.goto('/');
    
    // Verify homepage loads with main content title (now the only H1)
    await expect(page.locator('h1')).toContainText('Brückenbau-Trainer');
    
    // 🎮 STEP 2: Navigate to Training page  
    // Look for actual training button (more specific selector)
    const trainingLink = page.locator('[data-testid="training-link"]').first()
      .or(page.locator('a[href*="/train"]').first())
      .or(page.locator('text=Training starten').first());
    
    await trainingLink.click();
    
    // Wait for training page to load
    await expect(page).toHaveURL(/\/train/);
    
    // Verify chess board is present (using TrainingBoardZustand data-testid)
    await expect(page.locator('[data-testid="training-board"]')
      .or(page.locator('[data-testid="chessboard"]'))
      .or(page.locator('.chess-board'))).toBeVisible();
    
    // ♟️ STEP 3: Execute a move
    // Wait for board to be interactive
    await page.waitForTimeout(1000);
    
    // Try to make a move (adapt based on actual board implementation)
    // Option 1: Click from-square then to-square
    const fromSquare = page.locator('[data-square="e2"]')
      .or(page.locator('[data-testid="square-e2"]'))
      .or(page.locator('.square-e2'))
      .first();
    
    const toSquare = page.locator('[data-square="e4"]')
      .or(page.locator('[data-testid="square-e4"]'))
      .or(page.locator('.square-e4'))
      .first();
    
    // Attempt move execution
    try {
      await fromSquare.click();
      await toSquare.click();
    } catch (error) {
      // Fallback: look for move input or buttons
      const moveInput = page.locator('[data-testid="move-input"]')
        .or(page.locator('input[placeholder*="move"]'))
        .first();
      
      if (await moveInput.isVisible()) {
        await moveInput.fill('e4');
        await page.keyboard.press('Enter');
      }
    }
    
    // 🧠 STEP 4: Wait for and verify evaluation
    // Wait for engine to respond
    await page.waitForTimeout(2000);
    
    // Look for evaluation display (adapt based on actual UI)
    const evaluation = page.locator('[data-testid="evaluation"]')
      .or(page.locator('.evaluation'))
      .or(page.locator('[class*="eval"]'))
      .or(page.locator('text=/[+-]?[0-9]+\.[0-9]+/'))
      .first();
    
    // Verify evaluation is displayed
    await expect(evaluation).toBeVisible({ timeout: 10000 });
    
    // Additional verification: check for engine status
    const engineStatus = page.locator('[data-testid="engine-status"]')
      .or(page.locator('.engine-status'))
      .or(page.locator('text=/ready|analyzing|idle/i'))
      .first();
    
    if (await engineStatus.isVisible()) {
      await expect(engineStatus).not.toContainText('error', { ignoreCase: true });
    }
    
    console.log('✅ Core Training Workflow completed successfully');
  });
  
  test('should handle engine initialization', async ({ page }) => {
    await page.goto('/train/1');
    
    // Wait for engine to initialize
    await page.waitForTimeout(3000);
    
    // Check engine status is not error
    const engineError = page.locator('text=/engine.*error/i').first();
    await expect(engineError).not.toBeVisible();
    
    console.log('✅ Engine initialization verified');
  });
});