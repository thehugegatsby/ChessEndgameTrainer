const { chromium } = require('playwright');
const path = require('path');

async function takeFinalScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });
  
  try {
    const htmlPath = path.resolve('final-comparison.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'final-promotion-dialog.png' });
    console.log('Final promotion dialog screenshot saved');
    
  } catch (error) {
    console.error('Failed to take final screenshot:', error);
  }
  
  await browser.close();
}

takeFinalScreenshot();