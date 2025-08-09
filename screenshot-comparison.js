const { chromium } = require('playwright');
const path = require('path');

async function comparePromotionDialogs() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });
  
  try {
    const htmlPath = path.resolve('promotion-test.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'promotion-dialog-comparison.png' });
    console.log('Promotion dialog comparison screenshot saved');
    
  } catch (error) {
    console.error('Failed to take comparison screenshot:', error);
  }
  
  await browser.close();
}

comparePromotionDialogs();