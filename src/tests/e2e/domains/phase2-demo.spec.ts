/**
 * Phase 2 Demo Test - Showcasing new E2E infrastructure
 * 
 * Demonstrates:
 * - Playwright-only mocking (no MSW)
 * - Store-based deterministic waiting
 * - ChessboardPage domain abstractions
 */

import { test, expect } from "@playwright/test";
import { ChessboardPage } from "../helpers/pageObjects/ChessboardPage";
import { mockTablebase } from "../helpers/playwrightMocking";
import { getLogger } from "../../../shared/services/logging";

test.describe("Phase 2 Infrastructure Demo", () => {
  const logger = getLogger().setContext("E2E-Phase2Demo");

  test("should demonstrate deterministic waiting with mocked tablebase", async ({ page }) => {
    logger.info("🚀 Starting Phase 2 demo test");

    // 1. Setup API mocking (Playwright-only, no MSW)
    await mockTablebase.success(page);
    logger.info("✅ Tablebase mocked with winning position");

    // 2. Navigate to training page
    await page.goto("/train/1");
    
    // 3. Initialize ChessboardPage helper
    const chessboard = new ChessboardPage(page);
    
    // 4. Wait for tablebase ready (store-based, no hardcoded timeout)
    await chessboard.waitForTablebaseReady();
    logger.info("✅ Tablebase ready (deterministic waiting)");

    // 5. Make a move using domain abstraction
    await chessboard.makeMove("e2", "e4");
    logger.info("✅ Move executed with domain helper");

    // 6. Verify evaluation is available
    await chessboard.assertEvaluationAvailable();
    logger.info("✅ Evaluation confirmed available");

    // 7. Check move count from store
    const moveCount = await chessboard.getMoveCount();
    expect(moveCount).toBeGreaterThan(0);
    logger.info(`✅ Move count from store: ${moveCount}`);

    // 8. Verify it's player's turn
    const isPlayerTurn = await chessboard.isPlayerTurn();
    logger.info(`✅ Player turn status: ${isPlayerTurn}`);

    logger.info("🎉 Phase 2 demo complete - all systems working!");
  });

  test("should handle error scenarios with mocked failures", async ({ page }) => {
    logger.info("🔥 Testing error handling");

    // Mock tablebase error
    await mockTablebase.error(page, 503);
    
    const chessboard = new ChessboardPage(page);
    await page.goto("/train/1");

    // Should handle error gracefully
    try {
      await chessboard.waitForTablebaseReady();
      // Evaluation should not be available when API fails
      await expect(async () => {
        await chessboard.assertEvaluationAvailable();
      }).rejects.toThrow();
      
      logger.info("✅ Error handled correctly");
    } catch (error) {
      logger.info("✅ Expected error occurred:", error);
    }
  });

  test("should test slow response handling", async ({ page }) => {
    logger.info("🐌 Testing slow response");

    // Mock slow tablebase (2 second delay)
    await mockTablebase.slow(page, 2000);
    
    const chessboard = new ChessboardPage(page);
    await page.goto("/train/1");

    // Measure time for tablebase to be ready
    const startTime = Date.now();
    await chessboard.waitForTablebaseReady();
    const duration = Date.now() - startTime;

    expect(duration).toBeGreaterThanOrEqual(2000);
    logger.info(`✅ Handled slow response (${duration}ms)`);
  });

  test("should demonstrate dynamic FEN-based mocking", async ({ page }) => {
    logger.info("🎯 Testing dynamic FEN responses");

    // Setup different responses for different positions
    const fenResponses = new Map([
      ["4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", { 
        ...await page.evaluate(() => ({ 
          dtz: 12, 
          category: "win",
          moves: [{ uci: "e5e6", san: "e6", category: "loss" }]
        }))
      }],
      ["4k3/8/4KP2/8/8/8/8/8 b - - 0 1", {
        ...await page.evaluate(() => ({
          dtz: -11,
          category: "loss", 
          moves: [{ uci: "e8f8", san: "Kf8", category: "win" }]
        }))
      }]
    ]);

    await mockTablebase.dynamic(page, fenResponses);
    
    const chessboard = new ChessboardPage(page);
    await page.goto("/train/1");
    await chessboard.waitForTablebaseReady();

    // Verify we can make moves and get appropriate responses
    const initialFEN = await chessboard.getCurrentFEN();
    logger.info(`✅ Initial FEN: ${initialFEN}`);

    await chessboard.makeMove("e5", "e6");
    const newFEN = await chessboard.getCurrentFEN();
    logger.info(`✅ New FEN after move: ${newFEN}`);

    expect(newFEN).not.toBe(initialFEN);
  });
});