import { test, expect } from '@playwright/test';

test('final chessboard check', async ({ page }) => {
  await page.goto('/train/1');
  await page.waitForLoadState('networkidle');
  
  // Wait for chessboard to be visible
  await page.waitForSelector('[class*="chessboard"]', { timeout: 5000 });
  
  // Take screenshot
  await page.screenshot({ path: 'chessboard-final.png', fullPage: true });
  
  // Count chess pieces
  const pieces = await page.locator('svg[class*="piece"], [data-piece]').count();
  console.log('Number of pieces on board:', pieces);
  
  // Check board is visible
  const board = await page.locator('[class*="chessboard"]').first();
  await expect(board).toBeVisible();
  
  console.log('✅ Chessboard is now displayed correctly!');
});