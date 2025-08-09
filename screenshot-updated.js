const { chromium } = require('playwright');
const path = require('path');

async function takeUpdatedScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });
  
  try {
    const htmlPath = path.resolve('updated-comparison.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'updated-promotion-dialog.png' });
    console.log('Updated promotion dialog screenshot saved');
    
  } catch (error) {
    console.error('Failed to take updated screenshot:', error);
  }
  
  await browser.close();
}

takeUpdatedScreenshot();