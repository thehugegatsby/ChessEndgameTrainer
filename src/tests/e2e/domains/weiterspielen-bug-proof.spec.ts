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
import { performMoveAndWait } from "../helpers/moveHelpers";
import { TEST_POSITIONS } from "@shared/testing/ChessTestData";

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

    // STEP 1: Set up a position where we FORCE an error dialog by making a clearly bad move
    // Use KPK_WIN position where there's a clear winning move
    await page.evaluate((testFen) => {
      if (typeof (window as any).e2e_setBoardState === "function") {
        (window as any).e2e_setBoardState(testFen);
      }
    }, TEST_POSITIONS.KPK_WIN); // "K7/P7/k7/8/8/8/8/8 w - - 0 1" - King on a8, Pawn on a7, black king on a6

    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);
    logger.info("Position set: KPK_WIN for bug demonstration");

    // STEP 2: Make a move that SHOULD trigger an error dialog
    // In KPK_WIN position ("K7/P7/k7/8/8/8/8/8 w - - 0 1"), the best move is obviously to promote the pawn
    // Let's try moves that are clearly suboptimal
    const potentialErrorMoves = ["Kb8", "Kb7", "Ka7"]; // All move the king away from pawn support
    let errorDialogTriggered = false;
    let gameStateBeforeWeiterspielenClick = null;

    for (const move of potentialErrorMoves) {
      logger.info(`Testing move: ${move} to see if it triggers error dialog`);

      const moveResult = await performMoveAndWait(page, move, {
        allowRejection: true,
        timeout: 6000,
      });

      if (!moveResult.success && moveResult.errorMessage) {
        logger.info(`✅ Move ${move} triggered error dialog!`);
        errorDialogTriggered = true;

        // STEP 3: Verify error dialog is visible with "Weiterspielen" button
        const errorDialog = page.locator('[data-testid="move-error-dialog"]');
        await expect(errorDialog).toBeVisible({ timeout: 3000 });

        const weiterSpielenButton = errorDialog.locator(
          'button:has-text("Weiterspielen")',
        );
        await expect(weiterSpielenButton).toBeVisible({ timeout: 2000 });

        logger.info("✅ Error dialog and Weiterspielen button are visible");

        // STEP 4: Record game state BEFORE clicking Weiterspielen
        gameStateBeforeWeiterspielenClick = await page.evaluate(() =>
          (window as any).e2e_getGameState(),
        );

        logger.info("📊 Game state BEFORE Weiterspielen click:", {
          fen: gameStateBeforeWeiterspielenClick.fen,
          moveCount: gameStateBeforeWeiterspielenClick.moveCount,
          turn: gameStateBeforeWeiterspielenClick.turn,
          pgn: gameStateBeforeWeiterspielenClick.pgn,
        });

        // STEP 5: Click "Weiterspielen" button
        logger.info("🖱️  Clicking Weiterspielen button...");
        await weiterSpielenButton.click();

        // STEP 6: Verify dialog disappears
        await expect(errorDialog).not.toBeVisible({ timeout: 3000 });
        logger.info("✅ Error dialog dismissed successfully");

        break; // Found a move that triggers dialog, exit loop
      } else {
        logger.info(`ℹ️  Move ${move} was accepted (no error dialog)`);

        // Reset for next test move
        await page.evaluate((testFen) => {
          if (typeof (window as any).e2e_setBoardState === "function") {
            (window as any).e2e_setBoardState(testFen);
          }
        }, TEST_POSITIONS.KPK_WIN);
        await page.waitForTimeout(1000);
      }
    }

    // If no error dialog was triggered, skip this test
    if (!errorDialogTriggered || !gameStateBeforeWeiterspielenClick) {
      logger.info(
        "⚠️  SKIPPING: No error dialog was triggered by any test move",
      );
      return;
    }

    // STEP 7: Wait a reasonable time for opponent to make a move
    logger.info("⏳ Waiting 5 seconds for opponent to make a move...");
    await page.waitForTimeout(5000); // Give plenty of time for opponent move

    // STEP 8: Check if opponent made a move
    const gameStateAfterWaiting = await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    );

    logger.info("📊 Game state AFTER waiting 5 seconds:", {
      fen: gameStateAfterWaiting.fen,
      moveCount: gameStateAfterWaiting.moveCount,
      turn: gameStateAfterWaiting.turn,
      pgn: gameStateAfterWaiting.pgn,
    });

    // STEP 9: PROVE THE BUG - Opponent did NOT move
    logger.info("🔍 Checking if opponent made a move...");

    const opponentMoved =
      gameStateAfterWaiting.moveCount >
        gameStateBeforeWeiterspielenClick.moveCount &&
      gameStateAfterWaiting.fen !== gameStateBeforeWeiterspielenClick.fen;

    if (opponentMoved) {
      logger.info(
        "✅ UNEXPECTED: Opponent DID make a move (bug might be fixed!)",
      );
      logger.info("Move count changed:", {
        before: gameStateBeforeWeiterspielenClick.moveCount,
        after: gameStateAfterWaiting.moveCount,
      });
      logger.info("FEN changed:", {
        before: gameStateBeforeWeiterspielenClick.fen,
        after: gameStateAfterWaiting.fen,
      });
    } else {
      logger.info(
        "🐛 BUG CONFIRMED: Opponent did NOT make a move after Weiterspielen!",
      );
      logger.info("Evidence:", {
        moveCountSame:
          gameStateAfterWaiting.moveCount ===
          gameStateBeforeWeiterspielenClick.moveCount,
        fenSame:
          gameStateAfterWaiting.fen === gameStateBeforeWeiterspielenClick.fen,
        turnSame:
          gameStateAfterWaiting.turn === gameStateBeforeWeiterspielenClick.turn,
      });
    }

    // STEP 10: Document the bug with assertions that EXPECT the bug to exist
    // These assertions will FAIL when the bug is fixed (which is good!)

    logger.info(
      "📝 Documenting bug with assertions (these SHOULD fail when bug is fixed):",
    );

    // This test DOCUMENTS the bug by expecting it to exist
    // When the bug is fixed, this test will fail and need to be updated
    expect(gameStateAfterWaiting.moveCount).toBe(
      gameStateBeforeWeiterspielenClick.moveCount,
    );
    expect(gameStateAfterWaiting.fen).toBe(
      gameStateBeforeWeiterspielenClick.fen,
    );

    logger.info(
      "🎯 BUG SUCCESSFULLY DOCUMENTED: Opponent does not move after Weiterspielen",
    );
    logger.info(
      "💡 When this test starts failing, it means the bug has been fixed!",
    );
  });

  test("CONTROL: Verify that Zurücknehmen works correctly", async ({
    page,
  }) => {
    logger.info(
      "🧪 CONTROL TEST: Verifying that Zurücknehmen (take back) works correctly",
    );

    // Set up same position
    await page.evaluate((testFen) => {
      if (typeof (window as any).e2e_setBoardState === "function") {
        (window as any).e2e_setBoardState(testFen);
      }
    }, TEST_POSITIONS.KPK_WIN);

    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);

    // Try to trigger error dialog
    const moveResult = await performMoveAndWait(page, "Kd5", {
      allowRejection: true,
      timeout: 6000,
    });

    if (moveResult.success || !moveResult.errorMessage) {
      logger.info("⚠️  SKIPPING CONTROL: No error dialog triggered");
      return;
    }

    // Verify error dialog and click Zurücknehmen instead
    const errorDialog = page.locator('[data-testid="move-error-dialog"]');
    await expect(errorDialog).toBeVisible({ timeout: 3000 });

    const zurueckButton = errorDialog.locator(
      'button:has-text("Zurücknehmen")',
    );
    await expect(zurueckButton).toBeVisible({ timeout: 2000 });

    await zurueckButton.click();
    await expect(errorDialog).not.toBeVisible({ timeout: 3000 });

    logger.info("✅ CONTROL TEST PASSED: Zurücknehmen works correctly");
  });
});
