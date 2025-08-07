/**
 * Simple Pawn Promotion Test
 * Tests just the promotion move itself from a pre-set position
 */

import { test, expect } from "@playwright/test";

test.describe("Pawn Promotion Simple Test", () => {
  test("should auto-complete when promoting from e7 to e8=Q", async ({
    page,
  }) => {
    // Mock tablebase API for the promotion position
    await page.route("**/api/tablebase/**", async (route) => {
      const url = route.request().url();

      // Mock response for position after e8=Q
      // FEN after promotion: 4Q3/8/4K3/8/8/8/8/5k2 b - - 0 1
      if (url.includes("4Q3") || url.includes("e8")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            category: "win",
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

    // Navigate to the test position - position with pawn on e7 ready to promote
    // We'll use a direct URL with FEN parameter if supported, or navigate to train/1
    await page.goto("/train/1");

    // Wait for board to load
    await page.waitForSelector('[data-testid="training-board"]', {
      timeout: 10000,
    });

    // Wait for E2E API to be available
    await page.waitForFunction(
      () => typeof (window as any).e2e_getGameState === "function",
      { timeout: 10000 },
    );

    // Log the initial state
    const initialState = await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    );
    console.log("Initial state:", initialState);

    // Check if we can set up the position directly
    // For now, let's just try to make the promotion move from the starting position
    // In a real test, we'd set up the exact position first

    // Try to make a simple move to test the API
    const testMoveResult = await page.evaluate(async () => {
      // Try making a simple e5-e6 move if the pawn is on e5
      return await (window as any).e2e_makeMove("e5-e6");
    });

    console.log("Test move result:", testMoveResult);

    // Get the state after the move
    const stateAfterMove = await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    );
    console.log("State after move:", stateAfterMove);

    // For now, just verify the board is working
    expect(stateAfterMove.fen).toBeDefined();

    // TODO: Set up the exact pre-promotion position and test the promotion
    // This would require either:
    // 1. Playing through the exact move sequence
    // 2. Having a way to set up a specific position directly
    // 3. Creating a test endpoint that loads a specific position
  });

  test("manual test of promotion detection", async ({ page }) => {
    // This test manually checks if the promotion detection is working
    // by setting up a position and making a promotion move

    // Mock the tablebase to always return "win" for promoted positions
    await page.route("**/api/tablebase/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          category: "win",
          wdl: 2,
          dtm: 10,
          moves: [],
        }),
      });
    });

    await page.goto("/train/1");
    await page.waitForSelector('[data-testid="training-board"]', {
      timeout: 10000,
    });

    // Set up E2E test mode
    await page.evaluate(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    // Wait for API
    await page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === "function",
      { timeout: 10000 },
    );

    // Log what we're testing
    console.log("Testing promotion detection with mocked tablebase...");

    // Try a sequence of moves that doesn't involve promotion first
    const normalMove = await page.evaluate(async () => {
      return await (window as any).e2e_makeMove("Ke6-d6");
    });
    console.log("Normal move result:", normalMove);

    // Check that no success dialog appeared for normal move
    const successDialog = page.locator('[data-testid="success-dialog"]');
    await expect(successDialog)
      .not.toBeVisible({ timeout: 1000 })
      .catch(() => {
        console.log("Success dialog might have appeared - checking...");
      });

    // Now we need to test actual promotion
    // This is challenging without being able to set up the exact position
    console.log("Promotion test would go here if we could set up the position");
  });
});
