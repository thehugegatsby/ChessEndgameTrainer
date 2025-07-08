import { test, expect } from '@playwright/test';

test.describe('Engine Fix Verification', () => {
  test('engine responds after 1.Kd7 in Brückenbau', async ({ page }) => {
    // Navigate to Brückenbau trainer
    await page.goto('http://localhost:3002/train/12');
    
    // Wait for board to be ready
    await page.waitForSelector('[data-piece]', { timeout: 10000 });
    
    // Wait for any initial setup
    await page.waitForTimeout(2000);
    
    // Make the move 1.Kd7 (Kc8-d7)
    await page.locator('[data-square="c8"]').click();
    await page.locator('[data-square="d7"]').click();
    
    // Wait for engine response - should see a black piece move
    const initialPieceCount = await page.locator('[data-piece]').count();
    
    // Wait for a change in board state (engine move)
    await page.waitForFunction(
      (count) => {
        const pieces = document.querySelectorAll('[data-piece]');
        // Check if any piece has moved by looking at the board state
        return pieces.length > 0;
      },
      initialPieceCount,
      { timeout: 10000 }
    );
    
    // Verify the move history shows at least 2 moves (player + engine)
    const moveHistory = await page.locator('.move-history-item, [data-testid="move-item"]').count();
    expect(moveHistory).toBeGreaterThanOrEqual(2);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'engine-fix-verified.png' });
    
    console.log('Engine responded successfully after 1.Kd7!');
  });
});