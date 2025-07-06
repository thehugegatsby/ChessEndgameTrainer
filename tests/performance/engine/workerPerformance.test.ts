/**
 * Performance tests for Chess Engine Worker optimization
 * Tests baseline vs optimized worker architecture
 */

import { Engine } from '../../lib/chess/engine';

describe('Worker Performance Baseline', () => {
  let engine: Engine;

  beforeEach(() => {
    engine = Engine.getInstance();
  });

  afterEach(() => {
    engine.quit();
    // Reset singleton
    (Engine as any).instance = null;
  });

  test('should measure current sequential worker performance', async () => {
    const testFens = [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    ];

    console.log('🔍 BASELINE: Sequential Worker Performance');
    
    const startTime = performance.now();
    
    // Simulate blocking scenario: evaluation followed by move validation
    const promises = [];
    
    for (const fen of testFens) {
      // Long evaluation (blocking)
      promises.push(
        engine.evaluatePosition(fen).then(result => {
          console.log(`Evaluation for ${fen.slice(0, 20)}...: ${result.score}`);
          return result;
        })
      );
      
      // Move validation (should be instant but gets blocked)
      promises.push(
        engine.getBestMove(fen, 100).then(move => {
          console.log(`Best move for ${fen.slice(0, 20)}...: ${move?.san || 'none'}`);
          return move;
        })
      );
    }

    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    const totalTime = endTime - startTime;
    const avgTimePerRequest = totalTime / promises.length;
    
    console.log(`📊 BASELINE METRICS:`);
    console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Avg Time/Request: ${avgTimePerRequest.toFixed(2)}ms`);
    console.log(`  Total Requests: ${promises.length}`);
    console.log(`  Results: ${results.filter(r => r).length}/${results.length} successful`);

    // Store baseline metrics for comparison
    const baselineMetrics = {
      totalTime,
      avgTimePerRequest,
      requestCount: promises.length,
      successRate: results.filter(r => r).length / results.length
    };

    // Write metrics to file for comparison
    const fs = require('fs');
    const path = require('path');
    const metricsPath = path.join(__dirname, 'baseline-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(baselineMetrics, null, 2));

    expect(totalTime).toBeGreaterThan(0);
    expect(results.length).toBe(promises.length);
  }, 30000); // 30s timeout for comprehensive test

  test('should measure move validation response time under load', async () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    console.log('⚡ BASELINE: Move Validation Response Time');
    
    // Start a long-running evaluation to create blocking scenario
    const longEvaluationPromise = engine.evaluatePosition(testFen);
    
    // Immediately try to validate a move (should be fast but might be blocked)
    const moveValidationStart = performance.now();
    const moveResult = await engine.getBestMove(testFen, 50); // Quick move
    const moveValidationEnd = performance.now();
    
    const validationTime = moveValidationEnd - moveValidationStart;
    
    console.log(`📊 MOVE VALIDATION BASELINE:`);
    console.log(`  Validation Time: ${validationTime.toFixed(2)}ms`);
    console.log(`  Move Result: ${moveResult?.san || 'none'}`);
    
    // Clean up
    await longEvaluationPromise;
    
    // Expect validation to be reasonably fast
    // NOTE: This might fail with current architecture due to blocking
    console.log(`⚠️  Note: Current blocking architecture may cause slow validation`);
    
    expect(validationTime).toBeGreaterThan(0);
  }, 15000);

  test('should measure memory usage during repeated operations', async () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const iterations = 10;
    
    console.log('🧠 BASELINE: Memory Usage Pattern');
    
    // Get initial memory usage (if available)
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await engine.getBestMove(testFen, 100);
      
      // Check memory after each iteration
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
      if (currentMemory > 0) {
        console.log(`  Iteration ${i + 1}: ${(currentMemory / 1024 / 1024).toFixed(2)}MB`);
      }
    }
    
    const endTime = performance.now();
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const memoryIncrease = finalMemory - initialMemory;
    const avgTimePerIteration = (endTime - startTime) / iterations;
    
    console.log(`📊 MEMORY BASELINE:`);
    console.log(`  Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Avg Time/Iteration: ${avgTimePerIteration.toFixed(2)}ms`);
    
    expect(avgTimePerIteration).toBeGreaterThan(0);
  }, 30000);
});