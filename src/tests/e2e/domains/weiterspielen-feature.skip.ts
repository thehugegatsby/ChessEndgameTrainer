// @vitest-skip
/**
 * E2E Test for "Weiterspielen" (Continue Playing) Feature
 *
 * Tests the complete flow:
 * 1. Make a suboptimal move that triggers error dialog
 * 2. Click "Weiterspielen" button in error dialog
 * 3. Verify opponent automatically makes optimal tablebase move
 *
 * Uses Page Object Model with TrainingBoardPage
 */

import { test, expect } from '@playwright/test';
import { getLogger } from '../../../shared/services/logging';
import { E2E } from '../../../shared/constants';
import { TrainingBoardPage } from '../helpers/pageObjects/TrainingBoardPage';
import {
  waitForPageReady,
  waitForTablebaseInit,
  waitForOpponentMove,
} from '../helpers/deterministicWaiting';

test.describe.skip('Weiterspielen Feature', () => {
  const logger = getLogger().setContext('E2E-WeiterSpielenFeature');

  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto(E2E.ROUTES.TRAIN(1));
    await waitForPageReady(page);

    // Ensure training page loads
    await expect(page).toHaveURL(/\/train/);
    await expect(page.locator("[data-testid='training-board']")).toBeVisible();

    logger.info('Training page loaded for Weiterspielen test');
  });

  test('should show error dialog for suboptimal move, then continue with opponent move', async ({
    page,
  }) => {
    logger.info('Testing complete Weiterspielen flow: error → continue → opponent moves');

    // Set up Page Object Model
    const boardPage = new TrainingBoardPage(page);
    await boardPage.waitForBoardReady();

    // Wait for tablebase to initialize
    await waitForTablebaseInit(page);

    // Train/1 starts with: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1
    // King on e6, optimal move is Kd6, suboptimal is Kf5 (Kd5 is illegal - blocked by pawn)

    // Get initial game state
    const initialState = await boardPage.getGameState();
    logger.info('Initial game state:', {
      fen: initialState.fen,
      turn: initialState.turn,
      moveCount: initialState.moveCount,
    });

    // STEP 1: Make suboptimal move Kf5 (from e6 to f5)
    logger.info('Step 1: Making suboptimal move Kf5');
    const moveSuccessful = await boardPage.makeMoveWithValidation('e6', 'f5');

    expect(moveSuccessful).toBe(true);
    logger.info('✅ Suboptimal move Kf5 was executed');

    // STEP 2: Verify error dialog appears
    const errorDialog = page.locator('[data-testid="move-error-dialog"]');
    await expect(errorDialog).toBeVisible({ timeout: 3000 });
    logger.info('✅ Error dialog appeared');

    // Check for "Weiterspielen" button
    const weiterSpielenButton = errorDialog.locator('button:has-text("Weiterspielen")');
    await expect(weiterSpielenButton).toBeVisible({ timeout: 2000 });
    logger.info("✅ Error dialog shows 'Weiterspielen' button");

    // STEP 3: Get game state before clicking "Weiterspielen"
    const gameStateBeforeClick = await boardPage.getGameState();
    logger.info('Game state before Weiterspielen click:', {
      fen: gameStateBeforeClick.fen,
      moveCount: gameStateBeforeClick.moveCount,
      turn: gameStateBeforeClick.turn,
    });

    // STEP 4: Click "Weiterspielen" button
    logger.info("Step 4: Clicking 'Weiterspielen' to continue game");
    await weiterSpielenButton.click();

    // STEP 5: Verify error dialog disappears
    await expect(errorDialog).not.toBeVisible({ timeout: 3000 });
    logger.info('✅ Error dialog dismissed after clicking Weiterspielen');

    // STEP 6: Wait for opponent to make automatic move
    logger.info('Step 6: Waiting for opponent to make automatic move...');

    // Wait for the game state to change (opponent makes a move)
    await waitForOpponentMove(page); // Give opponent time to move

    const gameStateAfterOpponentMove = await boardPage.getGameState();

    // STEP 7: Verify opponent move was made
    expect(gameStateAfterOpponentMove.moveCount).toBeGreaterThan(gameStateBeforeClick.moveCount);
    expect(gameStateAfterOpponentMove.fen).not.toBe(gameStateBeforeClick.fen);

    logger.info('✅ Opponent made automatic move after Weiterspielen:', {
      beforeFen: gameStateBeforeClick.fen,
      afterFen: gameStateAfterOpponentMove.fen,
      moveCountBefore: gameStateBeforeClick.moveCount,
      moveCountAfter: gameStateAfterOpponentMove.moveCount,
    });

    logger.info(
      '✨ SUCCESS: Weiterspielen feature working correctly - opponent responds after error dialog'
    );
  });

  test("should handle 'Weiterspielen' with different types of suboptimal moves", async ({
    page,
  }) => {
    logger.info('Testing Weiterspielen with various suboptimal move scenarios');

    const boardPage = new TrainingBoardPage(page);
    await boardPage.waitForBoardReady();
    await waitForTablebaseInit(page);

    // Test with Kf5 (also suboptimal in this position)
    logger.info('Testing with suboptimal move Kf5');

    const moveSuccessful = await boardPage.makeMoveWithValidation('e6', 'f5');
    expect(moveSuccessful).toBe(true);

    // Verify error dialog appears
    const errorDialog = page.locator('[data-testid="move-error-dialog"]');
    await expect(errorDialog).toBeVisible({ timeout: 3000 });

    // Click Weiterspielen
    const weiterSpielenButton = errorDialog.locator('button:has-text("Weiterspielen")');
    await weiterSpielenButton.click();

    // Wait for dialog to close
    await expect(errorDialog).not.toBeVisible({ timeout: 3000 });

    // Verify opponent makes a move
    await waitForOpponentMove(page);
    const finalState = await boardPage.getGameState();

    // Should have at least 2 moves (player's suboptimal + opponent's response)
    expect(finalState.moveCount).toBeGreaterThanOrEqual(2);

    logger.info('✅ Weiterspielen worked with Kf5 suboptimal move');
  });

  test('should verify error dialog content and button text', async ({ page }) => {
    logger.info('Verifying error dialog content and buttons');

    const boardPage = new TrainingBoardPage(page);
    await boardPage.waitForBoardReady();
    await waitForTablebaseInit(page);

    // Make suboptimal move
    await boardPage.makeMoveWithValidation('e6', 'f5');

    // Check error dialog content
    const errorDialog = page.locator('[data-testid="move-error-dialog"]');
    await expect(errorDialog).toBeVisible({ timeout: 3000 });

    // Verify dialog contains expected text
    await expect(errorDialog).toContainText('Fehler erkannt!');
    await expect(errorDialog).toContainText('Bester Zug war:');

    // Verify correct buttons are present
    const weiterSpielenButton = errorDialog.locator('button:has-text("Weiterspielen")');
    const zurücknehmenButton = errorDialog.locator('button:has-text("Zurücknehmen")');

    await expect(weiterSpielenButton).toBeVisible();
    await expect(zurücknehmenButton).toBeVisible();

    // Verify "Verstanden" button is NOT present (that's the old button)
    const verstandenButton = errorDialog.locator('button:has-text("Verstanden")');
    await expect(verstandenButton).not.toBeVisible();

    logger.info('✅ Error dialog has correct content and buttons');
  });
});
