const { chromium } = require('playwright');
const path = require('path');

async function takeLichessStyleScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 800 });
  
  try {
    const htmlPath = path.resolve('lichess-style-final.html');
    await page.goto(`file://${htmlPath}`);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'lichess-style-promotion.png' });
    console.log('Lichess-style promotion dialog screenshot saved');
    
  } catch (error) {
    console.error('Failed to take Lichess-style screenshot:', error);
  }
  
  await browser.close();
}

takeLichessStyleScreenshot();