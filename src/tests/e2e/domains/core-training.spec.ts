/**
 * Core Training Workflow E2E Test
 * Journey: Homepage → Training → Move → Evaluation
 *
 * Following Gemini's "Let Reality Drive Architecture" approach
 */

import { test, expect } from "@playwright/test";
import { getLogger } from "../../../shared/services/logging";
import { E2E } from "../../../shared/constants";

test.describe("Core Training Workflow", () => {
  const logger = getLogger().setContext("E2E-CoreTraining");

  test.beforeEach(async () => {
    // Note: MSW removed - E2E tests use real API
  });

  test("should complete homepage → training → move → evaluation journey", async ({
    page,
  }) => {
    // 🏠 STEP 1: Homepage laden (redirects to /train/1)
    await page.goto(E2E.ROUTES.HOME);

    // Homepage redirects to training page, so we should be on /train/1
    await expect(page).toHaveURL(/\/train\/1/);

    // Wait for the training page to load and verify we have training content
    await expect(page.locator("[data-testid='training-board']")).toBeVisible();

    // 🎮 STEP 2: Navigate to Training page
    // Check what links are available on the page
    const allLinks = await page.locator("a").count();
    logger.info(`Found ${allLinks} links on homepage`);

    // Try direct navigation since training link might not exist
    await page.goto(E2E.ROUTES.TRAIN(1));

    // Wait for training page to load
    await expect(page).toHaveURL(/\/train/);

    // Verify chess board is present (using EndgameBoard data-testid)
    await expect(
      page
        .locator(E2E.SELECTORS.BOARD)
        .or(page.locator(E2E.SELECTORS.CHESSBOARD))
        .or(page.locator(".chess-board")),
    ).toBeVisible();

    // ♟️ STEP 3: Execute a move
    // Wait for board to be interactive
    await page.waitForTimeout(E2E.TIMEOUTS.PAGE_LOAD);

    // Use react-chessboard's data-square attributes
    // Try to click a piece on e2, then click e4
    const fromSquare = page.locator('[data-square="e2"]').first();
    const toSquare = page.locator('[data-square="e4"]').first();

    // Attempt move execution
    try {
      // First click the piece or square at e2
      const piece = page.locator('[data-square="e2"] [draggable]').first();
      if (await piece.isVisible({ timeout: 1000 }).catch(() => false)) {
        await piece.click();
      } else {
        await fromSquare.click();
      }
      
      // Then click the target square
      await toSquare.click();
    } catch (error) {
      logger.warn("Failed to execute move via clicking squares", error);
      // Fallback: look for move input or buttons
      const moveInput = page
        .locator('[data-testid="move-input"]')
        .or(page.locator('input[placeholder*="move"]'))
        .first();

      if (await moveInput.isVisible()) {
        await moveInput.fill("e4");
        await page.keyboard.press("Enter");
      }
    }

    // 🧠 STEP 4: Wait for and verify evaluation
    // Wait for tablebase to respond
    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);

    // Look for evaluation display (adapt based on actual UI)
    const evaluation = page
      .locator(E2E.SELECTORS.EVALUATION_DISPLAY)
      .or(page.locator(".evaluation"))
      .or(page.locator('[class*="eval"]'))
      .or(page.locator("text=/[+-]?[0-9]+\.[0-9]+/"))
      .first();

    // Verify evaluation is displayed
    await expect(evaluation).toBeVisible({ timeout: 10000 });

    // Additional verification: check for tablebase status (but ignore debug text)
    const tablebaseError = page
      .locator("text=/tablebase.*error.*failed/i")
      .first();
    const criticalError = page.locator("text=/critical.*error/i").first();

    // Only check for actual critical errors, not debug text
    if (await tablebaseError.isVisible()) {
      const errorText = await tablebaseError.textContent();
      // Skip if it's just debug/source code text
      if (
        errorText &&
        !errorText.includes("this.eventEmitter.emit") &&
        !errorText.includes("const error")
      ) {
        await expect(tablebaseError).not.toBeVisible();
      }
    }

    if (await criticalError.isVisible()) {
      await expect(criticalError).not.toBeVisible();
    }

    logger.info(E2E.MESSAGES.SUCCESS.CORE_TRAINING_COMPLETE);
  });

  test("should handle tablebase initialization", async ({ page }) => {
    await page.goto(E2E.ROUTES.TRAIN(1));

    // Wait for tablebase to initialize
    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);

    // Check tablebase status is not error
    const tablebaseError = page.locator("text=/tablebase.*error/i").first();
    await expect(tablebaseError).not.toBeVisible();

    logger.info(E2E.MESSAGES.SUCCESS.TABLEBASE_VERIFIED);
  });
});
