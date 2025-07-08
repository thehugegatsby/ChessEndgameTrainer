import { test, expect } from '@playwright/test';

test('test simple chessboard page', async ({ page }) => {
  // Collect console messages
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Navigate to test page
  await page.goto('/test-chessboard');
  await page.waitForLoadState('networkidle');
  
  // Print console messages
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));
  
  // Check page content
  const pageContent = await page.content();
  console.log('\n=== Chessboard div content ===');
  const chessboardDiv = await page.locator('div[style*="width"]').innerHTML();
  console.log(chessboardDiv);
  
  // Take screenshot
  await page.screenshot({ path: 'test-simple-chessboard.png' });
});