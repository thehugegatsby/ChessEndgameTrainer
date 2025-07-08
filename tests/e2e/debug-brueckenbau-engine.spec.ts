import { test, expect } from '@playwright/test';

test.describe('Debug Brückenbau Engine Issue', () => {
  test('engine response after 1.Kd7', async ({ page }) => {
    // Enable console output capture
    page.on('console', msg => {
      if (msg.text().includes('[ENGINE]')) {
        console.log('BROWSER:', msg.text());
      }
    });

    // Navigate to Brückenbau trainer
    await page.goto('http://localhost:3002/train/12');
    
    // Wait for board to be ready
    await page.waitForSelector('[data-piece]', { timeout: 10000 });
    
    // Wait a bit for engine initialization
    await page.waitForTimeout(2000);
    
    // Make the move 1.Kd7 (Kc8-d7)
    console.log('Making move Kc8-d7...');
    await page.locator('[data-square="c8"]').click();
    await page.locator('[data-square="d7"]').click();
    
    // Wait for engine response with longer timeout
    console.log('Waiting for engine response...');
    await page.waitForTimeout(15000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'brueckenbau-after-kd7.png' });
    
    console.log('Test completed - check console output above for [ENGINE] logs');
  });
});