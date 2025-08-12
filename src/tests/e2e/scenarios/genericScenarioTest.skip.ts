// @vitest-skip
/**
 * @file Generic E2E Test for Chess Move Scenarios
 *
 * This test suite demonstrates the use of the SequenceRunner framework
 * to test various chess scenarios with different expectations like
 * toast messages, evaluations, modal states, and store changes.
 *
 * @example
 * Run these tests with:
 * ```bash
 * npm run test:e2e -- tests/e2e/scenarios/genericScenarioTest.spec.ts
 * ```
 *
 * @author Claude Code
 * @version 1.0.0
 */

import { test } from "@playwright/test";
import { SequenceRunner } from "../helpers/sequenceRunner";
import { promotionScenarios } from "./promotionScenarios";

test.describe("Chess Move Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/train/1");
    await page.waitForSelector('[data-testid="training-board"]', {
      timeout: 10000,
    });

    // Wait for E2E API to be ready
    await page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === "function",
    );
  });

  test.skip("Promotion to Win - Auto-completion should trigger", async ({
    page,
  }) => {
    const runner = new SequenceRunner(page);
    await runner.executeSequence(promotionScenarios.promotionToWin);
  });

  test.skip("Promotion to Draw - Should NOT auto-complete", async ({
    page,
  }) => {
    const runner = new SequenceRunner(page);
    await runner.executeSequence(promotionScenarios.promotionToDraw);
  });

  test.skip("Promotion to Queen - Correct German message", async ({ page }) => {
    const runner = new SequenceRunner(page);
    await runner.executeSequence(promotionScenarios.promotionToQueen);
  });

  test.skip("Promotion to Rook - Correct German message", async ({ page }) => {
    const runner = new SequenceRunner(page);
    await runner.executeSequence(promotionScenarios.promotionToRook);
  });

  test.skip("Debug: Show current state after failed sequence", async ({
    page,
  }) => {
    const runner = new SequenceRunner(page);

    try {
      await runner.executeSequence(promotionScenarios.promotionToWin);
    } catch (error) {
      // Debug output
      console.log("🐛 Sequence failed, debugging:");

      const storeState = await runner.getStoreState();
      if (storeState) {
        console.log(
          "Store state:",
          JSON.stringify(storeState.ui?.toasts, null, 2),
        );
        console.log(
          "Training state:",
          JSON.stringify(storeState.training, null, 2),
        );
      } else {
        console.log("Could not get store state");
      }

      const gameState = await runner.getGameState();
      console.log("Game state:", JSON.stringify(gameState, null, 2));

      // Re-throw error to fail test
      throw error;
    }
  });
});
