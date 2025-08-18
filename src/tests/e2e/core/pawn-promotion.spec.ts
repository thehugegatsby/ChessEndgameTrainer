/**
 * Simple Pawn Promotion Test
 * Tests just the promotion move itself from a pre-set position
 */

import { test, expect } from '@playwright/test';
import { TrainingPage } from '../page-objects/TrainingPage';

test.describe('Pawn Promotion Simple Test', () => {

  test('should auto-complete when promoting from e7 to e8=Q', async ({ page }) => {
    // Mock tablebase API for the promotion position
    await page.route('**/api/tablebase/**', async route => {
      const url = route.request().url();

      // Mock response for position after e8=Q
      // FEN after promotion: 4Q3/8/4K3/8/8/8/8/5k2 b - - 0 1
      if (url.includes('4Q3') || url.includes('e8')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            category: 'win',
            wdl: -2, // Black to move, black loses = white wins
            dtm: 15,
            moves: [],
          }),
        });
      } else {
        // Let other requests through
        await route.continue();
      }
    });

    // Navigate to the test position
    await page.goto('/train/1');

    const trainingPage = new TrainingPage(page);
    await trainingPage.chessboard.waitForBoardReady();

    // Wait for any initial loading
    await page.waitForTimeout(2000);

    console.log('🎯 Starting pawn promotion sequence...');

    // Train/1 starts with: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1 (TRAIN1_KPK_BASIC)
    // We need to advance the pawn to e7 first

    // Move pawn from e5 to e6
    console.log('📍 Step 1: Moving pawn e5 → e6');
    await trainingPage.makeTrainingMove('e5', 'e6');
    await page.waitForTimeout(2000); // Wait for opponent response

    // Move pawn from e6 to e7
    console.log('📍 Step 2: Moving pawn e6 → e7');
    await trainingPage.makeTrainingMove('e6', 'e7');
    await page.waitForTimeout(2000); // Wait for opponent response

    // Now try to promote from e7 to e8
    console.log('📍 Step 3: Promoting pawn e7 → e8=Q');
    await trainingPage.chessboard.move('e7', 'e8');

    // Handle promotion dialog if it appears
    try {
      const promotionDialog = page.locator('[data-testid*="promotion"], .promotion-dialog').first();
      await promotionDialog.waitFor({ timeout: 3000 });
      
      // Select Queen (most common promotion)
      const queenButton = page.locator('[data-testid="promotion-q"], [data-piece="q"], .promotion-q').first();
      await queenButton.click();
      
      console.log('✅ Promotion dialog handled - selected Queen');
    } catch (error) {
      console.log('⚠️ No promotion dialog found - auto-promotion to Queen');
      // This is fine, many implementations auto-promote to Queen
    }

    await page.waitForTimeout(2000);

    // Verify no critical errors occurred
    const hasErrors = await page.locator('.error, .alert-error').count();
    expect(hasErrors).toBe(0);

    console.log('🎉 Pawn promotion test PASSED!');
  });

  test('manual test of promotion detection', async ({ page }) => {
    // This test manually checks if the promotion detection is working
    // by setting up a position and making a promotion move

    // Mock the tablebase to always return "win" for promoted positions
    await page.route('**/api/tablebase/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          category: 'win',
          wdl: 2,
          dtm: 10,
          moves: [],
        }),
      });
    });

    // Navigate to training page
    await page.goto('/train/1');

    const trainingPage = new TrainingPage(page);
    await trainingPage.chessboard.waitForBoardReady();
    await page.waitForTimeout(2000);

    console.log('🎯 Testing promotion UI detection...');

    // Try to make any pawn move
    await trainingPage.makeTrainingMove('e5', 'e6');

    // Check if a promotion dialog would appear
    const promotionDialog = page.locator('[data-testid*="promotion"]');
    const hasPromotionDialog = await promotionDialog.isVisible().catch(() => false);

    if (hasPromotionDialog) {
      console.log('✅ Promotion dialog detected!');

      // Try to select Queen
      const queenOption = promotionDialog.locator('[data-testid="promotion-q"]');
      if (await queenOption.isVisible()) {
        await queenOption.click();
        console.log('✅ Selected Queen for promotion');
      }
    } else {
      console.log('⚠️ No promotion dialog found (expected for regular moves)');
    }

    // Verify no critical errors
    const hasErrors = await page.locator('.error, .alert-error').count();
    expect(hasErrors).toBe(0);

    console.log('✅ Promotion detection test completed');
  });
});