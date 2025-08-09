const { chromium } = require('playwright');

async function takePromotionScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    await page.goto('http://localhost:3002/train/1');
    await page.waitForTimeout(2000);
    
    // Try to set up a promotion scenario by manipulating the position
    // We'll use JavaScript to modify the board state to have a pawn ready for promotion
    await page.evaluate(() => {
      // This is a hack to trigger promotion - we'll try to programmatically create a promotion scenario
      // Set up a position where we can promote a pawn
      const chessboard = document.querySelector('[data-testid="training-board"]');
      if (chessboard) {
        // Try to trigger a promotion by simulating a pawn move to the 8th rank
        // We'll need to look for the actual board elements
        console.log('Found chessboard element');
      }
    });
    
    // Alternative: Take screenshot of current state and then try to manually trigger promotion
    await page.screenshot({ path: 'promotion-before.png' });
    console.log('Screenshot before promotion saved');
    
    // Try to find and click on a pawn that can promote
    // Look for pieces on the board
    const squares = await page.locator('[data-square]').all();
    console.log(`Found ${squares.length} squares`);
    
    // Try to manually create promotion scenario by setting FEN with promotion opportunity
    await page.evaluate(() => {
      // Set a FEN with a pawn ready to promote
      const promotionFen = '4k3/4P3/4K3/8/8/8/8/8 w - - 0 1';
      // Try to find and update the board with this position
      window.location.href = 'http://localhost:3002/train/1';
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'promotion-setup.png' });
    
  } catch (error) {
    console.error('Failed to take promotion screenshot:', error);
  }
  
  await browser.close();
}

takePromotionScreenshot();