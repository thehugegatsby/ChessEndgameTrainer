// Simple debug script to test store integration
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });
  
  await page.goto('http://localhost:3002/train/1');
  await page.waitForSelector('[class*="chessboard"]', { timeout: 10000 });
  await page.waitForTimeout(3000); // Let everything initialize
  
  // Check store state
  const storeState = await page.evaluate(() => {
    return {
      training: window?.zustandStore?.getState?.()?.training || 'Store not available',
      gameState: (window as any).e2e_getGameState?.() || 'Game state not available'
    };
  });
  
  console.log('Store state:', JSON.stringify(storeState, null, 2));
  
  // Try making a test move
  console.log('Attempting test move...');
  const moveResult = await page.evaluate(() => {
    return (window as any).e2e_makeMove?.('e6-d6');
  });
  
  console.log('Move result:', moveResult);
  
  await page.waitForTimeout(5000);
  await browser.close();
})();