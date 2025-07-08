import { test, expect } from '@playwright/test';

test.describe('Chessboard Display', () => {
  test('should display chessboard on training page', async ({ page }) => {
    // Navigate to a training position
    await page.goto('/train/1');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if chessboard container exists
    const chessboardContainer = page.locator('[data-testid="chessboard"], .chessboard-container, [class*="chessboard"]');
    await expect(chessboardContainer).toBeVisible({ timeout: 10000 });
    
    // Check for chess squares (should have 64 squares)
    const squares = page.locator('[data-square], [class*="square"]');
    const squareCount = await squares.count();
    expect(squareCount).toBeGreaterThanOrEqual(64);
    
    // Check if pieces are visible
    const pieces = page.locator('[data-piece], [class*="piece"], svg[class*="piece"]');
    const pieceCount = await pieces.count();
    expect(pieceCount).toBeGreaterThan(0);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/e2e/screenshots/chessboard-display.png' });
  });
  
  test('should have interactive chessboard', async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForLoadState('networkidle');
    
    // Try to find a draggable piece
    const draggablePiece = page.locator('[draggable="true"], [class*="piece"][draggable], svg[class*="piece"]').first();
    
    // Check if at least one piece exists and is visible
    await expect(draggablePiece).toBeVisible({ timeout: 10000 });
    
    // Verify the board has proper dimensions
    const board = page.locator('[class*="chessboard"], [data-testid="chessboard"]').first();
    const boundingBox = await board.boundingBox();
    
    // Board should be square and have reasonable size
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(200);
      expect(boundingBox.height).toBeGreaterThan(200);
      // Allow some tolerance for aspect ratio
      expect(Math.abs(boundingBox.width - boundingBox.height)).toBeLessThan(10);
    }
  });
});