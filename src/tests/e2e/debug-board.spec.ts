import { test } from "@playwright/test";
import { waitForPageReady } from "./helpers/deterministicWaiting";

test.describe("Debug react-chessboard v5 structure", () => {
  test("examine board structure", async ({ page }) => {
    await page.goto("/train/1");

    // Wait for board to load
    await waitForPageReady(page);

    // Try to find elements with data-square
    const dataSquares = await page.locator("[data-square]").count();
    console.log(`Found ${dataSquares} elements with data-square attribute`);

    // Try to find the board container
    const boardContainers = await page
      .locator('[data-testid="chessboard"]')
      .count();
    console.log(
      `Found ${boardContainers} elements with data-testid="chessboard"`,
    );

    // Look for SVG pieces
    const svgPieces = await page.locator("svg").count();
    console.log(`Found ${svgPieces} SVG elements`);

    // Look for divs with piece images
    const pieceImages = await page.locator('div[role="img"]').count();
    console.log(`Found ${pieceImages} divs with role="img"`);

    // Get the board HTML structure
    const boardElement = page.locator('[data-testid="chessboard"]').first();
    if (await boardElement.isVisible()) {
      const innerHTML = await boardElement.innerHTML();
      console.log("Board HTML structure (first 500 chars):");
      console.log(innerHTML.substring(0, 500));
    }

    // Take a screenshot for visual inspection
    await page.screenshot({ path: "board-structure.png" });
  });
});
