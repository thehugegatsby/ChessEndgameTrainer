const { chromium } = require('playwright');

async function takeScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    await page.goto('http://localhost:3002/train/1');
    await page.waitForTimeout(3000); // Wait for page to load
    await page.screenshot({ path: 'current-layout.png' });
    console.log('Screenshot saved as current-layout.png');
  } catch (error) {
    console.error('Failed to take screenshot:', error);
  }
  
  await browser.close();
}

takeScreenshot();