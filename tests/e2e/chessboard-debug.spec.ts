import { test, expect } from '@playwright/test';

test.describe('Chessboard Debug', () => {
  test('debug chessboard rendering', async ({ page }) => {
    // Navigate to training page
    await page.goto('/train/1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'chessboard-debug.png', fullPage: true });
    
    // Get page content
    const pageContent = await page.content();
    console.log('Page URL:', page.url());
    
    // Check for any error messages
    const errorMessages = await page.locator('text=/error|Error|failed|Failed/i').all();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages.length);
      for (const error of errorMessages) {
        console.log('Error:', await error.textContent());
      }
    }
    
    // Look for the main training board component
    const trainingBoard = await page.locator('[class*="TrainingBoard"], [data-testid*="training"]').count();
    console.log('Training board elements:', trainingBoard);
    
    // Look for any div with chessboard in class
    const chessboardDivs = await page.locator('div').evaluateAll(elements => 
      elements.filter(el => el.className.includes('chess') || el.className.includes('board'))
        .map(el => ({ 
          className: el.className,
          id: el.id,
          innerHTML: el.innerHTML.substring(0, 100)
        }))
    );
    console.log('Chessboard-related divs:', chessboardDivs);
    
    // Check if react-chessboard is loaded
    const hasReactChessboard = await page.evaluate(() => {
      return window.hasOwnProperty('ReactChessboard') || 
             document.querySelector('[class*="react-chessboard"]') !== null;
    });
    console.log('React chessboard loaded:', hasReactChessboard);
    
    // Check for SVG elements (chessboard pieces are often SVG)
    const svgCount = await page.locator('svg').count();
    console.log('SVG elements on page:', svgCount);
    
    // Get all data-testid attributes
    const testIds = await page.locator('[data-testid]').evaluateAll(elements =>
      elements.map(el => el.getAttribute('data-testid'))
    );
    console.log('Test IDs found:', testIds);
    
    // Print the main content structure
    const mainContent = await page.locator('main, #__next, body > div').first().innerHTML();
    console.log('Main content (first 500 chars):', mainContent.substring(0, 500));
  });
});