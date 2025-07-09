/**
 * Quick test to verify MockEngineService works
 */

const { MockEngineService } = require('./shared/services/engine/MockEngineService.ts');

async function testMockEngine() {
  console.log('🧪 Testing MockEngineService...');
  
  try {
    // Create mock engine instance
    const mockEngine = new MockEngineService();
    console.log('✅ MockEngineService created');
    
    // Initialize
    const startInit = Date.now();
    await mockEngine.initialize();
    const initTime = Date.now() - startInit;
    console.log(`✅ Initialize took ${initTime}ms`);
    
    // Test position analysis
    const testFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
    const startAnalysis = Date.now();
    const analysis = await mockEngine.analyzePosition(testFen);
    const analysisTime = Date.now() - startAnalysis;
    
    console.log(`✅ Analysis took ${analysisTime}ms`);
    console.log('📊 Analysis result:', analysis);
    
    // Test status
    console.log('📊 Status:', mockEngine.getStatus());
    
    // Test custom response
    mockEngine.addCustomResponse('test-fen', {
      evaluation: 100,
      bestMove: 'Ke6',
      depth: 20,
      timeMs: 5
    });
    
    const customResult = await mockEngine.analyzePosition('test-fen');
    console.log('✅ Custom response:', customResult);
    
    // Cleanup
    await mockEngine.shutdown();
    console.log('✅ MockEngineService shutdown');
    
    console.log('\n🎉 MockEngineService test PASSED!');
    console.log(`⚡ Total time: ${initTime + analysisTime}ms (should be <100ms)`);
    
  } catch (error) {
    console.error('❌ MockEngineService test FAILED:', error);
    process.exit(1);
  }
}

testMockEngine();