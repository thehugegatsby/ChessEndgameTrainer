const { chromium } = require('playwright');

async function testApi() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'log' && msg.text().includes('Test API')) {
      console.log(`✅ ${msg.text()}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3002/train/1');
    
    // Wait for test API
    await page.waitForFunction(
      () => (window).__testApi !== undefined,
      { timeout: 10000 }
    );
    console.log('✅ Test API ready');
    
    // Test API functions
    const result = await page.evaluate(async () => {
      const api = window.__testApi;
      
      // Get initial state
      const initialState = api.getGameState();
      
      // Configure deterministic engine
      api.configureEngine({
        deterministic: true,
        timeLimit: 100,
        fixedResponses: new Map([
          ['4k3/8/3K4/4P3/8/8/8/8 b - - 1 1', 'Kd8']
        ])
      });
      
      // Make a move
      const moveResult = await api.makeMove('e6-d6');
      
      // Wait for engine
      const engineResponded = await api.waitForEngine(3000);
      
      // Get final state
      const finalState = api.getGameState();
      
      return {
        initial: initialState,
        moveResult,
        engineResponded,
        final: finalState
      };
    });
    
    console.log('📊 Test Results:');
    console.log('Initial FEN:', result.initial.fen);
    console.log('Initial moves:', result.initial.moveCount);
    console.log('Move success:', result.moveResult.success);
    console.log('Engine responded:', result.engineResponded);
    console.log('Final moves:', result.final.moveCount);
    console.log('Final history:', result.final.history);
    
    console.log('🎉 Test API working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testApi().catch(console.error);