/**
 * Performance test for Engine initialization optimization
 * Tests worker readiness timing before and after state machine implementation
 */

import { Engine } from '../../lib/chess/engine';

describe('Engine Initialization Performance', () => {
  afterEach(() => {
    // Reset singleton
    (Engine as any).instance = null;
  });

  test('BASELINE: measure worker initialization timing', async () => {
    console.log('🔍 BASELINE: Engine Initialization Timing');
    
    const startTime = performance.now();
    const engine = Engine.getInstance();
    
    // Try immediate evaluation (current behavior - should fail/fallback)
    const immediateEvalStart = performance.now();
    const immediateResult = await engine.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const immediateEvalEnd = performance.now();
    
    // Wait a bit for worker to potentially initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try evaluation after delay
    const delayedEvalStart = performance.now();
    const delayedResult = await engine.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const delayedEvalEnd = performance.now();
    
    const totalTime = performance.now() - startTime;
    
    console.log('📊 BASELINE INITIALIZATION:');
    console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Immediate Eval Time: ${(immediateEvalEnd - immediateEvalStart).toFixed(2)}ms`);
    console.log(`  Immediate Result Score: ${immediateResult.score}`);
    console.log(`  Delayed Eval Time: ${(delayedEvalEnd - delayedEvalStart).toFixed(2)}ms`);
    console.log(`  Delayed Result Score: ${delayedResult.score}`);
    console.log(`  Worker Ready: ${(engine as any).isReady}`);
    
    // Store baseline metrics
    const baselineMetrics = {
      totalTime,
      immediateEvalTime: immediateEvalEnd - immediateEvalStart,
      immediateResultScore: immediateResult.score,
      delayedEvalTime: delayedEvalEnd - delayedEvalStart,
      delayedResultScore: delayedResult.score,
      workerReady: (engine as any).isReady
    };

    // Write metrics for comparison
    const fs = require('fs');
    const path = require('path');
    const metricsPath = path.join(__dirname, 'engine-baseline-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(baselineMetrics, null, 2));

    engine.quit();
    
    expect(totalTime).toBeGreaterThan(0);
  }, 10000);

  test('should measure concurrent request timing', async () => {
    console.log('⚡ BASELINE: Concurrent Request Handling');
    
    const engine = Engine.getInstance();
    
    // Fire multiple requests immediately (current behavior)
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
    
    console.log('📊 CONCURRENT BASELINE:');
    console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Requests: ${results.length}`);
    console.log(`  Successful Results: ${results.filter(r => r.score !== 0).length}`);
    console.log(`  Results:`, results.map(r => `${r.index}:${r.score}`).join(', '));
    
    engine.quit();
    
    expect(results.length).toBe(5);
  }, 10000);
});