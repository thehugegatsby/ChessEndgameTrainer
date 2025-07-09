const { chromium } = require('playwright');

async function simpleValidation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Log console messages
  page.on('console', msg => {
    console.log(`Browser: ${msg.text()}`);
  });
  
  try {
    await page.goto('http://localhost:3002/train/1');
    console.log('✅ Page loaded');
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any chess-related elements
    const hasChessElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="chess"], [class*="board"], [data-square]');
      return elements.length;
    });
    console.log('Chess elements found:', hasChessElements);
    
    // Wait a bit for any dynamic loading
    await page.waitForTimeout(3000);
    
    // Check for test API
    const testApiStatus = await page.evaluate(() => {
      return {
        testApi: typeof (window).__testApi,
        windowKeys: Object.keys(window).filter(k => k.includes('test') || k.includes('e2e'))
      };
    });
    console.log('Test API status:', testApiStatus);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

simpleValidation().catch(console.error);