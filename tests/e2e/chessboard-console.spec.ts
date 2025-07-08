import { test, expect } from '@playwright/test';

test.describe('Chessboard Console Errors', () => {
  test('check for console errors when loading chessboard', async ({ page }) => {
    // Collect console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Collect page errors
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    
    // Navigate to training page
    await page.goto('/train/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Print all console messages
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Print all page errors
    console.log('\n=== Page Errors ===');
    pageErrors.forEach(err => console.log(err));
    
    // Check for React errors
    const reactErrors = consoleMessages.filter(msg => 
      msg.includes('Error') || 
      msg.includes('Warning') ||
      msg.includes('Failed') ||
      msg.includes('Cannot read') ||
      msg.includes('undefined')
    );
    
    if (reactErrors.length > 0) {
      console.log('\n=== React Errors ===');
      reactErrors.forEach(err => console.log(err));
    }
    
    // Check if TrainingBoardZustand component is rendered
    const hasTrainingBoard = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="TrainingBoard"]');
      return elements.length > 0;
    });
    console.log('\nTrainingBoard component found:', hasTrainingBoard);
    
    // Check if Chessboard component is rendered
    const hasChessboard = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="chessboard"], [data-testid="chessboard"]');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        className: el.className,
        children: el.children.length
      }));
    });
    console.log('\nChessboard elements:', hasChessboard);
    
    // Take screenshot
    await page.screenshot({ path: 'chessboard-console-debug.png', fullPage: true });
  });
});