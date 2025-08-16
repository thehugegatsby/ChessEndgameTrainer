// Debug test activated to examine react-chessboard DOM structure
import { test } from '@playwright/test';
import { waitForPageReady } from './helpers/deterministicWaiting';

test.describe('Debug react-chessboard v5 structure', () => {
  test.skip('examine board structure', async ({ page }) => {
    // SKIPPED: Debug test - not needed for merge
    // Will be reactivated for chessground migration debugging
    await page.goto('/train/1');

    // Wait for board to load
    await waitForPageReady(page);

    // Try to find elements with data-square
    const dataSquares = await page.locator('[data-square]').count();
    console.log(`Found ${dataSquares} elements with data-square attribute`);

    // Try to find the board container
    const boardContainers = await page.locator('[data-testid="chessboard"]').count();
    console.log(`Found ${boardContainers} elements with data-testid="chessboard"`);

    // Look for SVG pieces
    const svgPieces = await page.locator('svg').count();
    console.log(`Found ${svgPieces} SVG elements`);

    // Look for divs with piece images
    const pieceImages = await page.locator('div[role="img"]').count();
    console.log(`Found ${pieceImages} divs with role="img"`);

    // Get the board HTML structure - try training-board instead
    const boardElement = page.locator('[data-testid="training-board"]').first();
    if (await boardElement.isVisible()) {
      const innerHTML = await boardElement.innerHTML();
      console.log('Training Board HTML structure (first 1000 chars):');
      console.log(innerHTML.substring(0, 1000));

      // Also check if react-chessboard creates any clickable elements
      const clickableElements = await page.locator('[data-testid="training-board"] *').all();
      console.log(`Total child elements: ${clickableElements.length}`);

      // Look for divs that might represent squares
      const divElements = await page.locator('[data-testid="training-board"] div').count();
      console.log(`Div elements in board: ${divElements}`);

      // Look for any elements with class names that might indicate squares
      const elementsWithClass = await page.evaluate(() => {
        const board = document.querySelector('[data-testid="training-board"]');
        if (!board) return [];

        const allElements = board.querySelectorAll('*');
        const classNames = new Set();
        allElements.forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(cls => {
              if (cls.trim()) classNames.add(cls.trim());
            });
          }
        });
        return Array.from(classNames);
      });
      console.log('All CSS classes found:', elementsWithClass);
    }

    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'board-structure.png' });
  });
});
