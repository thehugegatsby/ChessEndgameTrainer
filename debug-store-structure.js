const { chromium } = require('playwright');

async function debugStoreStructure() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`Browser: ${msg.text()}`);
  });
  
  try {
    await page.goto('http://localhost:3002/train/1');
    
    // Wait for test API
    await page.waitForFunction(
      () => (window).__testApi !== undefined,
      { timeout: 10000 }
    );
    
    console.log('🔍 Debugging Store Structure...');
    
    // Get complete store state
    const storeStructure = await page.evaluate(() => {
      const api = window.__testApi;
      const state = api.storeAccess.getState();
      
      // Get all keys at root level
      const rootKeys = Object.keys(state);
      
      // Create a simplified structure overview
      const structure = {};
      rootKeys.forEach(key => {
        if (state[key] && typeof state[key] === 'object') {
          structure[key] = Object.keys(state[key]);
        } else {
          structure[key] = typeof state[key];
        }
      });
      
      return {
        rootKeys,
        structure,
        fullState: state // WARNING: This might be very large
      };
    });
    
    console.log('📊 Store Root Keys:', storeStructure.rootKeys);
    console.log('📊 Store Structure Overview:', JSON.stringify(storeStructure.structure, null, 2));
    
    // Look specifically for game-related data
    const gameData = await page.evaluate(() => {
      const state = window.__testApi.storeAccess.getState();
      
      // Check common game-related paths
      const paths = {
        'state.fen': state.fen,
        'state.history': state.history,
        'state.game': state.game,
        'state.training': state.training,
        'state.game?.fen': state.game?.fen,
        'state.game?.history': state.game?.history,
        'state.training?.fen': state.training?.fen,
        'state.training?.history': state.training?.history,
      };
      
      return paths;
    });
    
    console.log('🎯 Game Data Paths:', JSON.stringify(gameData, null, 2));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugStoreStructure().catch(console.error);