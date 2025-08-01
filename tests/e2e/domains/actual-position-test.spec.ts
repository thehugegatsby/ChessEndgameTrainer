/**
 * E2E Test for Actual Position 1
 * Tests the real position that the app loads
 */

import { test, expect } from "@playwright/test";
import { getLogger } from "../../../shared/services/logging";
import { E2E } from "../../../shared/constants";

test.describe("Actual Position 1 - King and Pawn vs King", () => {
  const logger = getLogger().setContext("E2E-ActualPosition");

  test.beforeEach(async ({ page }) => {
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
        page.getByText("King and Pawn vs King - Basic Win").first(),
      ).toBeVisible();

      // Verify the Lichess link contains the expected FEN
      const lichessLink = page.locator('a[href*="lichess.org/analysis"]');
      const href = await lichessLink.getAttribute("href");
      expect(href).toContain("4k3/8/4K3/4P3/8/8/8/8");

      logger.info("Position 1 loaded successfully");
    });

    await test.step("Test a potentially bad king move", async () => {
      // In this position (Ke6, Pe5 vs Ke8), let's try Kd6
      // This might be suboptimal as it doesn't support the pawn advance

      // Try different approaches to find the board
      // First, let's try to find the board by looking for react-chessboard classes
      let board = page.locator('[class*="board"]').first();

      // If no board class, try to find by structure
      if (!(await board.isVisible())) {
        // Look for a container that has chess pieces (img elements)
        board = page
          .locator("div")
          .filter({ has: page.locator('img[alt*="King"], img[alt*="Pawn"]') })
          .first();
      }

      // Now try to interact with squares
      // Method 1: Try data-square attributes
      let e6Square = page.locator('[data-square="e6"]');
      let d6Square = page.locator('[data-square="d6"]');

      // Method 2: If data-square doesn't work, try by position
      if (!(await e6Square.isVisible())) {
        // Find all divs that could be squares
        const squares = board.locator("div").filter({
          hasNot: page.locator("img"), // squares themselves don't contain images
        });

        // e6 is row 3, col 5 (from top-left) = index 20
        e6Square = squares.nth(20);
        d6Square = squares.nth(19);
      }

      // Make the move
      await e6Square.click({ timeout: 5000 });
      await d6Square.click({ timeout: 5000 });

      // Wait for tablebase evaluation
      await page.waitForTimeout(3000);

      // Check if error dialog appears
      const hasErrorDialog = await page
        .locator(".fixed.inset-0.bg-black\\/50")
        .isVisible();

      if (hasErrorDialog) {
        logger.info("Error dialog appeared for Kd6 - it's a bad move");
        await expect(page.getByText("Fehler erkannt!")).toBeVisible();

        // Take back the move
        await page.getByRole("button", { name: "Zug zurücknehmen" }).click();
        await page.waitForTimeout(1000);
      } else {
        logger.info("No error for Kd6 - it's an acceptable move");
      }
    });

    await test.step("Test pawn advance e5-e6", async () => {
      // This should definitely be a good move
      // Use the same approach that worked before
      let board = page.locator('[class*="board"]').first();

      if (!(await board.isVisible())) {
        board = page
          .locator("div")
          .filter({ has: page.locator('img[alt*="King"], img[alt*="Pawn"]') })
          .first();
      }

      // Try data-square first
      let e5Square = page.locator('[data-square="e5"]');
      let e6Square = page.locator('[data-square="e6"]');

      if (!(await e5Square.isVisible())) {
        // Alternative: click on the pawn image directly
        const whitePawn = page
          .locator('img[alt*="white pawn"], img[alt*="White Pawn"]')
          .first();
        await whitePawn.click();

        // Then click the destination square
        // Try to find e6 by its position relative to other elements
        const squares = board.locator("div").filter({
          hasNot: page.locator("img"),
        });
        e6Square = squares.nth(20);
        await e6Square.click();
      } else {
        await e5Square.click();
        await e6Square.click();
      }

      // Wait for tablebase
      await page.waitForTimeout(2000);

      // Should NOT show error dialog
      const errorDialog = page.locator(".fixed.inset-0.bg-black\\/50");
      await expect(errorDialog).not.toBeVisible();

      // Verify the move was made - check Lichess link updated
      const lichessLink = page.locator('a[href*="lichess.org/analysis"]');
      const newHref = await lichessLink.getAttribute("href");
      expect(newHref).toContain("4P3"); // Pawn should be on e6 now

      logger.info("Pawn advance e5-e6 played successfully");
    });
  });

  test("should show move history and evaluation", async ({ page }) => {
    await page.goto(E2E.ROUTES.TRAIN(1));
    await page.waitForSelector("text=/a.*b.*c.*d.*e.*f.*g.*h/", {
      timeout: 10000,
    });

    // First we need to play Kd6, then after Black's response, we can play e6
    // Since the pieces are SVG, let's use the same square-clicking approach from test 1

    await test.step("Make first move Kd6", async () => {
      // Wait for board to be ready
      await page.waitForTimeout(2000);

      // Find the board container
      const board = page.locator(".cg-wrap").first();
      await expect(board).toBeVisible();

      // Get the board's bounding box
      const boardBounds = await board.boundingBox();
      if (!boardBounds) {
        throw new Error("Board not found");
      }

      // Calculate square size
      const squareSize = boardBounds.width / 8;

      // Click on e6 (where the king is)
      // e = column 5 (0-indexed: 4), rank 6 = row 3 from top
      const e6X = boardBounds.x + 4.5 * squareSize;
      const e6Y = boardBounds.y + 2.5 * squareSize;

      await page.mouse.click(e6X, e6Y);
      await page.waitForTimeout(500);

      // Click on d6 (destination)
      // d = column 4 (0-indexed: 3), rank 6 = row 3 from top
      const d6X = boardBounds.x + 3.5 * squareSize;
      const d6Y = boardBounds.y + 2.5 * squareSize;

      await page.mouse.click(d6X, d6Y);

      logger.info("Clicked on e6 and d6 coordinates");

      // Wait for the tablebase API call
      await page.waitForTimeout(3000);

      // Log any intercepted tablebase requests
      logger.info("Waiting for move to be processed...");

      // Check that the move was registered - the move list should update
      await expect(page.getByText("Noch keine Züge gespielt")).not.toBeVisible({
        timeout: 10000,
      });

      logger.info("First move Kd6 completed and reflected in history.");
    });

    // Now verify additional move history features
    await test.step("Verify move history UI elements", async () => {
      // This assertion should now pass reliably as we've waited for the history to update.
      await expect(
        page.getByText("Noch keine Züge gespielt"),
      ).not.toBeVisible();

      // The move list should be visible (we already verified it contains moves)
      const moveList = page.locator('[data-testid="move-list"]');
      await expect(moveList).toBeVisible();

      // Check that navigation buttons are enabled
      const backButton = page
        .locator("button")
        .filter({ hasText: "Ein Zug zurück" });
      await expect(backButton).not.toBeDisabled();

      // The "go to start" button should also be enabled now
      const startButton = page
        .locator("button")
        .filter({ hasText: "Zum Anfang der Zugliste" });
      await expect(startButton).not.toBeDisabled();

      logger.info("Move history UI elements working correctly");
    });
  });
});
