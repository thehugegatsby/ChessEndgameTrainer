/**
 * E2E Test to PROVE the Weiterspielen Bug
 *
 * This test demonstrates that after clicking "Weiterspielen" in the error dialog,
 * the opponent (Black) does NOT make a move, proving the bug exists.
 *
 * Expected behavior: Opponent should make a move after "Weiterspielen"
 * Actual behavior: Opponent does NOT move (this test documents the bug)
 */

import { test, expect } from "@playwright/test";
import { getLogger } from "../../../shared/services/logging";
import { E2E } from "../../../shared/constants";
import { TrainingBoardPage } from "../helpers/pageObjects/TrainingBoardPage";

test.describe("Weiterspielen Bug Proof", () => {
  const logger = getLogger().setContext("E2E-WeiterSpielenBugProof");

  test.beforeEach(async ({ page }) => {
    await page.goto(E2E.ROUTES.TRAIN(1));
    await page.waitForTimeout(E2E.TIMEOUTS.PAGE_LOAD);
    await expect(page).toHaveURL(/\/train/);
    await expect(page.locator("[data-testid='training-board']")).toBeVisible();
    logger.info("Training page loaded for bug proof test");
  });

  test("PROVES: Opponent does NOT move after Weiterspielen", async ({
    page,
  }) => {
    logger.info("🐛 TESTING: Proving that Weiterspielen bug exists");

    const boardPage = new TrainingBoardPage(page);
    await boardPage.waitForBoardReady();
    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);

    // Train/1 starts with: 4k3/8/4K3/4P3/8/8/8/8 w - - 0 1
    // King on e6, optimal move is Kd6, suboptimal is Kf5 (Kd5 is illegal - blocked by pawn)
    logger.info("Using Train/1 default position for bug demonstration");

    // STEP 1: Make suboptimal move to trigger error dialog
    logger.info("Making suboptimal move Kf5 to trigger error dialog");
    const moveSuccessful = await boardPage.makeMoveWithValidation("e6", "f5");
    
    expect(moveSuccessful).toBe(true);
    logger.info("✅ Suboptimal move executed");

    // STEP 2: Verify error dialog is visible with "Weiterspielen" button
    const errorDialog = page.locator('[data-testid="move-error-dialog"]');
    await expect(errorDialog).toBeVisible({ timeout: 3000 });

    const weiterSpielenButton = errorDialog.locator(
      'button:has-text("Weiterspielen")',
    );
    await expect(weiterSpielenButton).toBeVisible({ timeout: 2000 });

    logger.info("✅ Error dialog and Weiterspielen button are visible");

    // STEP 3: Record game state BEFORE clicking Weiterspielen
    const gameStateBeforeWeiterspielenClick = await boardPage.getGameState();

    logger.info("📊 Game state BEFORE Weiterspielen click:", {
      fen: gameStateBeforeWeiterspielenClick.fen,
      moveCount: gameStateBeforeWeiterspielenClick.moveCount,
      turn: gameStateBeforeWeiterspielenClick.turn,
    });

    // STEP 4: Click "Weiterspielen" button
    logger.info("🖱️  Clicking Weiterspielen button...");
    await weiterSpielenButton.click();

    // STEP 5: Verify dialog disappears
    await expect(errorDialog).not.toBeVisible({ timeout: 3000 });
    logger.info("✅ Error dialog dismissed successfully");

    // STEP 6: Wait 5 seconds for opponent to potentially make a move
    logger.info("⏳ Waiting 5 seconds for opponent to move...");
    await page.waitForTimeout(5000);

    // STEP 7: Check game state AFTER waiting
    const gameStateAfterWaiting = await boardPage.getGameState();

    logger.info("📊 Game state AFTER waiting 5 seconds:", {
      fen: gameStateAfterWaiting.fen,
      moveCount: gameStateAfterWaiting.moveCount,
      turn: gameStateAfterWaiting.turn,
    });

    // STEP 8: PROVE THE BUG - Opponent did NOT move
    const opponentMadeMove =
      gameStateAfterWaiting.moveCount >
      gameStateBeforeWeiterspielenClick.moveCount;

    if (opponentMadeMove) {
      logger.info(
        "✅ UNEXPECTED: Opponent DID make a move! Bug might be fixed!",
      );
      logger.info(
        `Move count changed: ${gameStateBeforeWeiterspielenClick.moveCount} → ${gameStateAfterWaiting.moveCount}`,
      );
    } else {
      logger.info("🐛 BUG CONFIRMED: Opponent did NOT make a move!");
      logger.info("Evidence:");
      logger.info(
        `- Move count unchanged: ${gameStateBeforeWeiterspielenClick.moveCount} === ${gameStateAfterWaiting.moveCount}`,
      );
      logger.info(
        `- FEN unchanged: ${
          gameStateBeforeWeiterspielenClick.fen ===
          gameStateAfterWaiting.fen
        }`,
      );
      logger.info(
        `- Turn unchanged: ${gameStateBeforeWeiterspielenClick.turn} === ${gameStateAfterWaiting.turn}`,
      );
    }

    // Document the bug exists (test passes when bug is present)
    // When bug is fixed, this assertion will fail
    expect(gameStateAfterWaiting.moveCount).toBe(
      gameStateBeforeWeiterspielenClick.moveCount,
    );
    expect(gameStateAfterWaiting.fen).toBe(
      gameStateBeforeWeiterspielenClick.fen,
    );

    logger.info(
      "🐛 TEST COMPLETE: Bug documented - opponent does NOT move after Weiterspielen",
    );
  });

  test("CONTROL: Verify that Zurücknehmen works correctly", async ({
    page,
  }) => {
    logger.info("🔬 CONTROL TEST: Verifying Zurücknehmen functionality");

    const boardPage = new TrainingBoardPage(page);
    await boardPage.waitForBoardReady();
    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);

    // Get initial state
    const initialState = await boardPage.getGameState();
    logger.info("Initial state:", {
      fen: initialState.fen,
      moveCount: initialState.moveCount,
    });

    // Make suboptimal move
    logger.info("Making suboptimal move Kf5 to trigger error dialog");
    const moveSuccessful = await boardPage.makeMoveWithValidation("e6", "f5");
    expect(moveSuccessful).toBe(true);

    // Verify error dialog appears
    const errorDialog = page.locator('[data-testid="move-error-dialog"]');
    await expect(errorDialog).toBeVisible({ timeout: 3000 });

    // Click "Zurücknehmen" (Undo) button
    const zurücknehmenButton = errorDialog.locator(
      'button:has-text("Zurücknehmen")',
    );
    await expect(zurücknehmenButton).toBeVisible({ timeout: 2000 });

    logger.info("🖱️  Clicking Zurücknehmen button...");
    await zurücknehmenButton.click();

    // Verify dialog disappears
    await expect(errorDialog).not.toBeVisible({ timeout: 3000 });
    logger.info("✅ Error dialog dismissed");

    // Wait for state to update
    await page.waitForTimeout(1000);

    // Check if move was undone
    const stateAfterUndo = await boardPage.getGameState();
    logger.info("State after undo:", {
      fen: stateAfterUndo.fen,
      moveCount: stateAfterUndo.moveCount,
    });

    // Verify position was reset
    expect(stateAfterUndo.fen).toBe(initialState.fen);
    expect(stateAfterUndo.moveCount).toBe(initialState.moveCount);

    logger.info(
      "✅ CONTROL TEST PASSED: Zurücknehmen correctly undoes the move",
    );
  });
});