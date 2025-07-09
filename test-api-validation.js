/**
 * Quick validation script for the new Test API
 */

const { chromium } = require('playwright');

async function validateTestApi() {
  console.log('🧪 Validating Test API...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:3002/train/1');
    
    // Wait for the page to load
    await page.waitForSelector('[data-square="a1"]', { timeout: 10000 });
    console.log('✅ Board loaded');
    
    // Wait for test API to be available
    await page.waitForFunction(
      () => (window).__testApi !== undefined,
      { timeout: 10000 }
    );
    console.log('✅ Test API available');
    
    // Test getGameState
    const state = await page.evaluate(() => {
      return window.__testApi.getGameState();
    });
    console.log('✅ Game state:', {
      fen: state.fen,
      moveCount: state.moveCount,
      turn: state.turn
    });
    
    // Test configureEngine
    await page.evaluate(() => {
      return window.__testApi.configureEngine({
        deterministic: true,
        timeLimit: 100,
        fixedResponses: new Map([
          ['4k3/8/3K4/4P3/8/8/8/8 b - - 1 1', 'Kd8']
        ])
      });
    });
    console.log('✅ Engine configured for deterministic mode');
    
    // Test makeMove
    const moveResult = await page.evaluate(() => {
      return window.__testApi.makeMove('e6-d6');
    });
    console.log('✅ Move result:', moveResult);
    
    // Test waitForEngine
    const engineResponded = await page.evaluate(() => {
      return window.__testApi.waitForEngine(3000);
    });
    console.log('✅ Engine responded:', engineResponded);
    
    // Get final state
    const finalState = await page.evaluate(() => {
      return window.__testApi.getGameState();
    });
    console.log('✅ Final state:', {
      fen: finalState.fen,
      moveCount: finalState.moveCount,
      history: finalState.history
    });
    
    console.log('🎉 Test API validation successful!');
    
  } catch (error) {
    console.error('❌ Test API validation failed:', error);
  } finally {
    await browser.close();
  }
}

validateTestApi().catch(console.error);