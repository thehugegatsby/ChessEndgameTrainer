const { chromium } = require('playwright');

async function debugStoreSimple() {
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
    
    console.log('🔍 Debugging Test API Structure...');
    
    // Check what's available on the test API
    const apiStructure = await page.evaluate(() => {
      const api = window.__testApi;
      
      return {
        apiKeys: Object.keys(api),
        storeAccessExists: !!api.storeAccess,
        storeAccessKeys: api.storeAccess ? Object.keys(api.storeAccess) : null,
        hasGetState: api.storeAccess ? typeof api.storeAccess.getState === 'function' : false
      };
    });
    
    console.log('📊 API Structure:', JSON.stringify(apiStructure, null, 2));
    
    // If getState is available, try to call it
    if (apiStructure.hasGetState) {
      const storeData = await page.evaluate(() => {
        try {
          const state = window.__testApi.storeAccess.getState();
          return {
            success: true,
            keys: Object.keys(state),
            hasTraining: !!state.training,
            hasGame: !!state.game,
            hasFen: !!state.fen,
            hasHistory: !!state.history,
            trainingKeys: state.training ? Object.keys(state.training) : null,
            gameKeys: state.game ? Object.keys(state.game) : null
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });
      
      console.log('📊 Store Data:', JSON.stringify(storeData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugStoreSimple().catch(console.error);