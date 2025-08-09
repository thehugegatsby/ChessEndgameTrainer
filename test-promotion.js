const { chromium } = require('playwright');

async function testPromotion() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    console.log('Loading page...');
    await page.goto('http://localhost:3002/train/1');
    await page.waitForTimeout(3000);
    
    // First, modify the position to have a pawn ready for promotion
    console.log('Setting up promotion position...');
    await page.evaluate(() => {
      // Try to access the store and modify the position
      if (window && window.store) {
        const promotionFen = '8/5P2/8/8/k7/8/K7/8 w - - 0 1'; // White pawn on f7
        console.log('Setting promotion FEN:', promotionFen);
        // Try to update the game state directly if possible
      }
    });
    
    // Alternative approach: Try to manipulate the URL or use developer tools
    const promotionFen = '8/5P2/8/8/k7/8/K7/8 w - - 0 1';
    const encodedFen = encodeURIComponent(promotionFen);
    console.log('Trying to navigate with promotion FEN...');
    
    // Try to access the board and make a promotion move
    await page.evaluate((fen) => {
      console.log('Attempting to set position:', fen);
      
      // Try different ways to access the chess state
      if (window.chessEngine) {
        console.log('Found chess engine');
        window.chessEngine.load(fen);
      }
      
      // Look for the store
      if (window.__NEXT_DATA__) {
        console.log('Found Next.js data');
      }
      
      // Try to find React fiber nodes
      const chessboard = document.querySelector('[data-testid="training-board"]');
      if (chessboard) {
        console.log('Found training board');
        // Try to access React props
      }
    }, promotionFen);
    
    await page.waitForTimeout(1000);
    
    // Try to find the f7 square and drag to f8
    console.log('Looking for chess squares...');
    const f7Square = page.locator('[data-square="f7"]').first();
    const f8Square = page.locator('[data-square="f8"]').first();
    
    const f7Exists = await f7Square.count() > 0;
    const f8Exists = await f8Square.count() > 0;
    
    console.log(`f7 square exists: ${f7Exists}`);
    console.log(`f8 square exists: ${f8Exists}`);
    
    if (f7Exists && f8Exists) {
      console.log('Attempting to drag from f7 to f8...');
      await f7Square.dragTo(f8Square);
      await page.waitForTimeout(1000);
      
      // Look for promotion dialog
      const promotionDialog = page.locator('[data-testid="promotion-dialog"], .promotion-dialog');
      const dialogVisible = await promotionDialog.isVisible().catch(() => false);
      
      if (dialogVisible) {
        console.log('Promotion dialog is visible!');
        await page.screenshot({ path: 'promotion-dialog.png', fullPage: false });
        console.log('Screenshot taken: promotion-dialog.png');
      } else {
        console.log('No promotion dialog found');
        await page.screenshot({ path: 'no-promotion-dialog.png' });
      }
    } else {
      console.log('Could not find required squares');
      await page.screenshot({ path: 'current-board.png' });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  await browser.close();
}

testPromotion();