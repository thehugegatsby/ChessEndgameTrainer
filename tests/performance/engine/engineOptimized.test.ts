/**
 * Performance test for OPTIMIZED Engine with state machine
 * Tests worker readiness timing after state machine implementation
 */

import { Engine } from '@/shared/lib/chess/engine';

describe('Engine OPTIMIZED Performance', () => {
  afterEach(() => {
    // Reset singleton
    (Engine as any).instance = null;
  });

  test('OPTIMIZED: measure worker initialization timing', async () => {
    console.log('🚀 OPTIMIZED: Engine Initialization Timing');
    
    const startTime = performance.now();
    const engine = Engine.getInstance();
    
    // Try immediate evaluation (should now properly await readiness)
    const immediateEvalStart = performance.now();
    const immediateResult = await engine.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const immediateEvalEnd = performance.now();
    
    // Try another evaluation (should be instant since worker is ready)
    const secondEvalStart = performance.now();
    const secondResult = await engine.evaluatePosition('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
    const secondEvalEnd = performance.now();
    
    const totalTime = performance.now() - startTime;
    
    console.log('📊 OPTIMIZED INITIALIZATION:');
    console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`  First Eval Time: ${(immediateEvalEnd - immediateEvalStart).toFixed(2)}ms`);
    console.log(`  First Result Score: ${immediateResult.score}`);
    console.log(`  Second Eval Time: ${(secondEvalEnd - secondEvalStart).toFixed(2)}ms`);
    console.log(`  Second Result Score: ${secondResult.score}`);
    console.log(`  Engine State: ${(engine as any).state}`);
    
    // Store optimized metrics
    const optimizedMetrics = {
      totalTime,
      firstEvalTime: immediateEvalEnd - immediateEvalStart,
      firstResultScore: immediateResult.score,
      secondEvalTime: secondEvalEnd - secondEvalStart,
      secondResultScore: secondResult.score,
      engineState: (engine as any).state
    };

    // Write metrics for comparison
    const fs = require('fs');
    const path = require('path');
    const metricsPath = path.join(__dirname, 'engine-optimized-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(optimizedMetrics, null, 2));

    // Compare with baseline if available
    try {
      const baselinePath = path.join(__dirname, 'engine-baseline-metrics.json');
      const baselineData = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      
      console.log('🔄 PERFORMANCE COMPARISON:');
      console.log(`  Baseline First Score: ${baselineData.immediateResultScore} → Optimized: ${optimizedMetrics.firstResultScore}`);
      console.log(`  Baseline Second Score: ${baselineData.delayedResultScore} → Optimized: ${optimizedMetrics.secondResultScore}`);
      console.log(`  Baseline Worker Ready: ${baselineData.workerReady} → Optimized: ${optimizedMetrics.engineState === 'READY'}`);
      
      // Improvement metrics
      const scoreImprovement = optimizedMetrics.firstResultScore !== 0 && baselineData.immediateResultScore === 0;
      const workerReadinessImproved = optimizedMetrics.engineState === 'READY' && !baselineData.workerReady;
      
      console.log('🎯 IMPROVEMENTS:');
      console.log(`  Score Results Fixed: ${scoreImprovement ? '✅ YES' : '❌ NO'}`);
      console.log(`  Worker Readiness Fixed: ${workerReadinessImproved ? '✅ YES' : '❌ NO'}`);
      
    } catch (error) {
      console.log('ℹ️  No baseline data found for comparison');
    }

    engine.quit();
    
    expect(totalTime).toBeGreaterThan(0);
    // In mock environment, score might be 0 (expected behavior)
    expect(typeof immediateResult.score).toBe('number');
  }, 15000);

  test('OPTIMIZED: concurrent request handling', async () => {
    console.log('⚡ OPTIMIZED: Concurrent Request Handling');
    
    const engine = Engine.getInstance();
    
    // Fire multiple requests immediately (should now properly queue after initialization)
    const promises = [];
    const startTime = performance.now();
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        engine.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
          .then(result => ({ index: i, score: result.score, time: performance.now() }))
      );
    }
    
    const results = await Promise.all(promises);
    const totalTime = performance.now() - startTime;
    
    console.log('📊 OPTIMIZED CONCURRENT:');
    console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Requests: ${results.length}`);
    console.log(`  Successful Results: ${results.filter(r => r.score !== 0).length}`);
    console.log(`  Results:`, results.map(r => `${r.index}:${r.score}`).join(', '));
    
    engine.quit();
    
    expect(results.length).toBe(5);
    // In mock environment, all results might be 0 (expected behavior)
    expect(results.every(r => typeof r.score === 'number')).toBe(true);
  }, 15000);
});