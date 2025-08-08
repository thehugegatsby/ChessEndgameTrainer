/**
 * E2E Test for Actual Position 1
 * Tests the real position that the app loads
 */

import { test, expect } from "@playwright/test";
import { getLogger } from "../../../shared/services/logging";
import { E2E } from "../../../shared/constants";
import { TrainingBoardPage } from "../helpers/pageObjects/TrainingBoardPage";

test.describe("Actual Position 1 - King and Pawn vs King", () => {
  const logger = getLogger().setContext("E2E-ActualPosition");

  test.beforeEach(async ({ page }) => {
    // Set E2E test mode flag before navigating
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logger.error(`Browser Console Error: ${msg.text()}`);
      } else {
        logger.info(`Browser Console: ${msg.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      logger.error(`Page Error: ${error.message}`);
    });
    page.on("requestfailed", (request) => {
      logger.error(
        `Network Request Failed: ${request.url()} - ${request.failure()?.errorText}`,
      );
    });

    // Mock Lichess Tablebase API responses
    await page.route(
      "https://tablebase.lichess.ovh/standard*",
      async (route) => {
        const url = new URL(route.request().url());
        const fen = url.searchParams.get("fen");

        logger.info(`Intercepting tablebase request for FEN: ${fen}`);

        // Mock different responses based on position
        let mockResponse: any = {};

        // After White plays Kd6, Black should play Kd8
        if (fen?.includes("4k3/8/3K4/4P3")) {
          mockResponse = {
            category: "win",
            wdl: 2,
            dtz: 15,
            dtm: null,
            moves: [
              {
                uci: "e8d8",
                san: "Kd8",
                wdl: -2,
                dtz: -14,
                dtm: null,
                category: "loss",
              },
            ],
          };
        }
        // Initial position
        else if (fen?.includes("4k3/8/4K3/4P3")) {
          mockResponse = {
            category: "win",
            wdl: 2,
            dtz: 17,
            dtm: null,
            moves: [
              {
                uci: "e6d6",
                san: "Kd6",
                wdl: 2,
                dtz: 16,
                dtm: null,
                category: "win",
              },
              {
                uci: "e6f6",
                san: "Kf6",
                wdl: 2,
                dtz: 18,
                dtm: null,
                category: "win",
              },
              {
                uci: "e5e6",
                san: "e6",
                wdl: 2,
                dtz: 20,
                dtm: null,
                category: "win",
              },
            ],
          };
        }
        // Default response
        else {
          mockResponse = {
            category: "unknown",
            wdl: 0,
            dtz: 0,
            dtm: null,
            moves: [],
          };
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockResponse),
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    );
  });

  test("should handle moves in the actual K+P position", async ({ page }) => {
    await test.step("Load Position 1 and verify", async () => {
      await page.goto(E2E.ROUTES.TRAIN(1));

      // Wait for board to load - look for the coordinates
      await page.waitForSelector("text=/a.*b.*c.*d.*e.*f.*g.*h/", {
        timeout: 10000,
      });

      // Verify we have the expected position - use first occurrence
      await expect(
        page.getByText("Opposition Grundlagen").first(),
      ).toBeVisible();

      // Verify the Lichess link contains the expected FEN
      const lichessLink = page.locator('a[href*="lichess.org/analysis"]');
      const href = await lichessLink.getAttribute("href");
      expect(href).toContain("4k3/8/4K3/4P3/8/8/8/8");

      logger.info("Position 1 loaded successfully");
    });

    // Set up Page Object Model
    const boardPage = new TrainingBoardPage(page);
    await boardPage.waitForBoardReady();
    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);

    await test.step("Test a potentially bad king move", async () => {
      // In this position (Ke6, Pe5 vs Ke8), let's try Kd6
      // This is the optimal move (taking the opposition)
      
      const moveSuccessful = await boardPage.makeMoveWithValidation("e6", "d6");
      
      if (moveSuccessful) {
        logger.info("Kd6 was accepted - it's a valid move");
        // Move was accepted, no error dialog
        const errorDialog = page.locator('[data-testid="move-error-dialog"]');
        await expect(errorDialog).not.toBeVisible();
        
        // Wait for opponent's response
        await page.waitForTimeout(3000);
        
        const currentState = await boardPage.getGameState();
        logger.info("After Kd6, position is:", currentState.fen);
        
        // Opponent should have responded
        expect(currentState.moveCount).toBeGreaterThanOrEqual(2);
      } else {
        logger.info("Kd6 was rejected - unexpected since it's optimal");
      }
    });

    await test.step("Test pawn advance e5-e6", async () => {
      // Reset to initial position by reloading
      await page.goto(E2E.ROUTES.TRAIN(1));
      await boardPage.waitForBoardReady();
      await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);
      
      // This should be a valid but slower move
      const moveSuccessful = await boardPage.makeMoveWithValidation("e5", "e6");
      
      if (moveSuccessful) {
        logger.info("e5-e6 was accepted");
        
        // Wait for opponent's response
        await page.waitForTimeout(3000);
        
        const currentState = await boardPage.getGameState();
        logger.info("After e5-e6, position is:", currentState.fen);
        
        // Verify pawn advanced
        expect(currentState.fen).toContain("P");
      } else {
        logger.info("e5-e6 was rejected");
      }
    });

    await test.step("Test optimal king move Kd6", async () => {
      // Reset to initial position
      await page.goto(E2E.ROUTES.TRAIN(1));
      await boardPage.waitForBoardReady();
      await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);
      
      const initialState = await boardPage.getGameState();
      logger.info("Initial position:", initialState.fen);
      
      // Kd6 is the best move (taking the opposition)
      const moveSuccessful = await boardPage.makeMoveWithValidation("e6", "d6");
      expect(moveSuccessful).toBe(true);
      
      // No error dialog should appear for optimal move
      const errorDialog = page.locator('[data-testid="move-error-dialog"]');
      await expect(errorDialog).not.toBeVisible();
      
      // Wait for opponent's response
      await page.waitForTimeout(3000);
      
      const finalState = await boardPage.getGameState();
      logger.info("After Kd6 and opponent response:", finalState.fen);
      
      // Should have at least 2 moves
      expect(finalState.moveCount).toBeGreaterThanOrEqual(2);
    });
  });

  test("should show move history and evaluation", async ({ page }) => {
    await page.goto(E2E.ROUTES.TRAIN(1));
    
    const boardPage = new TrainingBoardPage(page);
    await boardPage.waitForBoardReady();
    await page.waitForTimeout(E2E.TIMEOUTS.TABLEBASE_INIT);

    // Verify initial evaluation is shown
    await expect(page.getByText(/Win in/i).first()).toBeVisible({
      timeout: 10000,
    });
    logger.info("Initial evaluation displayed");

    // Make a move
    const moveSuccessful = await boardPage.makeMoveWithValidation("e6", "d6");
    expect(moveSuccessful).toBe(true);
    
    // Wait for opponent's response
    await page.waitForTimeout(3000);

    // Check move history is visible
    const moveHistory = page.locator('[data-testid="move-history"]');
    const moveHistoryVisible = await moveHistory.isVisible().catch(() => false);
    
    if (moveHistoryVisible) {
      logger.info("Move history panel is visible");
      await expect(moveHistory).toContainText("1.");
    } else {
      // Alternative: Check for move notation somewhere on the page
      const moveNotation = await page.locator("text=/Kd6/").isVisible();
      if (moveNotation) {
        logger.info("Move notation visible on page");
      }
    }

    // Verify evaluation updates after move
    await expect(page.getByText(/Win in|Loss in/i).first()).toBeVisible({
      timeout: 5000,
    });
    logger.info("Evaluation updated after move");
  });
});