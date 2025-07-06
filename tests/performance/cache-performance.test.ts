/**
 * @fileoverview Cache Performance Test - Phase 3 Optimization
 * @version 1.0.0
 * @description Measures performance improvements from LRU caching layer
 * 
 * SAFE TESTING APPROACH:
 * - Tests new caching layer without modifying existing Engine
 * - Preserves all existing behavior and error handling
 * - Measures before/after performance with identical test scenarios
 */

import { Engine } from '@/shared/lib/chess/engine';
import { EvaluationCache } from '@/shared/lib/cache/EvaluationCache';

// Test positions for realistic workload
const TEST_POSITIONS = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', // King's pawn opening
  '8/k7/3p4/p2P1p2/P2P1P2/8/8/K7 w - - 0 1', // King and pawn endgame
  '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', // Simple endgame
  'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4', // Italian Game
];

describe('Cache Performance Tests - Phase 3', () => {
  let engine: Engine;
  let cache: EvaluationCache;

  beforeAll(async () => {
    console.log('🚀 PHASE 3: Cache Performance Testing');
    console.log('=====================================');
  });

  beforeEach(() => {
    // Reset engine singleton
    (Engine as any).instance = null;
    engine = Engine.getInstance();
    cache = new EvaluationCache(500, 250); // Smaller cache for testing
  });

  afterEach(() => {
    engine.quit();
    cache.clear();
    (Engine as any).instance = null;
  });

  test('BASELINE: Measure current Engine performance without cache', async () => {
    console.log('📊 BASELINE: Engine Performance (No Cache)');
    
    const metrics = {
      totalTime: 0,
      evaluationTimes: [] as number[],
      averageTime: 0,
      totalEvaluations: 0,
      successfulEvaluations: 0
    };

    const startTime = performance.now();

    // Test multiple evaluations of same positions (simulates real usage)
    for (let round = 0; round < 3; round++) {
      for (const fen of TEST_POSITIONS) {
        const evalStart = performance.now();
        
        try {
          const result = await engine.evaluatePosition(fen);
          const evalEnd = performance.now();
          
          const evalTime = evalEnd - evalStart;
          metrics.evaluationTimes.push(evalTime);
          metrics.totalEvaluations++;
          
          if (result.score !== 0 || result.mate !== null) {
            metrics.successfulEvaluations++;
          }
          
          console.log(`  Round ${round + 1}, Position ${TEST_POSITIONS.indexOf(fen) + 1}: ${evalTime.toFixed(2)}ms, Score: ${result.score}`);
        } catch (error) {
          console.warn(`  Evaluation failed for ${fen}:`, error);
        }
      }
    }

    metrics.totalTime = performance.now() - startTime;
    metrics.averageTime = metrics.evaluationTimes.reduce((a, b) => a + b, 0) / metrics.evaluationTimes.length;

    console.log('📈 BASELINE METRICS:');
    console.log(`  Total Time: ${metrics.totalTime.toFixed(2)}ms`);
    console.log(`  Total Evaluations: ${metrics.totalEvaluations}`);
    console.log(`  Successful Evaluations: ${metrics.successfulEvaluations}`);
    console.log(`  Average Evaluation Time: ${metrics.averageTime.toFixed(2)}ms`);
    console.log(`  Success Rate: ${((metrics.successfulEvaluations / metrics.totalEvaluations) * 100).toFixed(1)}%`);

    // Store baseline for comparison
    const fs = require('fs');
    const path = require('path');
    const baselineFile = path.join(__dirname, 'cache-baseline-metrics.json');
    fs.writeFileSync(baselineFile, JSON.stringify(metrics, null, 2));

    expect(metrics.totalEvaluations).toBeGreaterThan(0);
    expect(metrics.totalTime).toBeGreaterThan(0);
  }, 30000);

  test('OPTIMIZED: Measure Engine performance WITH cache', async () => {
    console.log('🚀 OPTIMIZED: Engine Performance (With Cache)');
    
    const metrics = {
      totalTime: 0,
      evaluationTimes: [] as number[],
      averageTime: 0,
      totalEvaluations: 0,
      successfulEvaluations: 0,
      cacheStats: null as any
    };

    const startTime = performance.now();

    // Test multiple evaluations of same positions (should benefit from cache)
    for (let round = 0; round < 3; round++) {
      for (const fen of TEST_POSITIONS) {
        const evalStart = performance.now();
        
        try {
          // Use cached evaluation method
          const result = await cache.evaluatePositionCached(engine, fen);
          const evalEnd = performance.now();
          
          const evalTime = evalEnd - evalStart;
          metrics.evaluationTimes.push(evalTime);
          metrics.totalEvaluations++;
          
          if (result.score !== 0 || result.mate !== null) {
            metrics.successfulEvaluations++;
          }
          
          console.log(`  Round ${round + 1}, Position ${TEST_POSITIONS.indexOf(fen) + 1}: ${evalTime.toFixed(2)}ms, Score: ${result.score}`);
        } catch (error) {
          console.warn(`  Evaluation failed for ${fen}:`, error);
        }
      }
    }

    metrics.totalTime = performance.now() - startTime;
    metrics.averageTime = metrics.evaluationTimes.reduce((a, b) => a + b, 0) / metrics.evaluationTimes.length;
    metrics.cacheStats = cache.getStats();

    console.log('🎯 OPTIMIZED METRICS:');
    console.log(`  Total Time: ${metrics.totalTime.toFixed(2)}ms`);
    console.log(`  Total Evaluations: ${metrics.totalEvaluations}`);
    console.log(`  Successful Evaluations: ${metrics.successfulEvaluations}`);
    console.log(`  Average Evaluation Time: ${metrics.averageTime.toFixed(2)}ms`);
    console.log(`  Success Rate: ${((metrics.successfulEvaluations / metrics.totalEvaluations) * 100).toFixed(1)}%`);
    console.log('📊 CACHE STATISTICS:');
    console.log(`  Cache Hit Rate: ${(metrics.cacheStats.hitRate * 100).toFixed(1)}%`);
    console.log(`  Cache Hits: ${metrics.cacheStats.hits}`);
    console.log(`  Cache Misses: ${metrics.cacheStats.misses}`);
    console.log(`  Deduplication Hits: ${metrics.cacheStats.deduplicationHits}`);
    console.log(`  Memory Usage: ${(metrics.cacheStats.memoryUsageBytes / 1024).toFixed(1)}KB`);

    // Store optimized metrics
    const fs = require('fs');
    const path = require('path');
    const optimizedFile = path.join(__dirname, 'cache-optimized-metrics.json');
    fs.writeFileSync(optimizedFile, JSON.stringify(metrics, null, 2));

    // Compare with baseline if available
    try {
      const baselineFile = path.join(__dirname, 'cache-baseline-metrics.json');
      const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      
      const timeImprovement = ((baseline.averageTime - metrics.averageTime) / baseline.averageTime) * 100;
      const totalTimeImprovement = ((baseline.totalTime - metrics.totalTime) / baseline.totalTime) * 100;
      
      console.log('🔄 PERFORMANCE COMPARISON:');
      console.log(`  Baseline Avg Time: ${baseline.averageTime.toFixed(2)}ms → Optimized: ${metrics.averageTime.toFixed(2)}ms`);
      console.log(`  Average Time Improvement: ${timeImprovement.toFixed(1)}%`);
      console.log(`  Total Time Improvement: ${totalTimeImprovement.toFixed(1)}%`);
      
      if (timeImprovement > 0) {
        console.log('✅ PERFORMANCE IMPROVED!');
      } else {
        console.log('❌ Performance regression detected');
      }
      
    } catch (error) {
      console.log('ℹ️  No baseline data found for comparison');
    }

    expect(metrics.totalEvaluations).toBeGreaterThan(0);
    expect(metrics.cacheStats.hitRate).toBeGreaterThan(0); // Should have some cache hits
  }, 30000);

  test('CACHE BEHAVIOR: Test cache hit patterns', async () => {
    console.log('🔍 CACHE BEHAVIOR: Testing hit patterns');
    
    const fen = TEST_POSITIONS[0];
    
    // First call - should be cache miss
    const start1 = performance.now();
    const result1 = await cache.evaluatePositionCached(engine, fen);
    const time1 = performance.now() - start1;
    
    // Second call - should be cache hit (much faster)
    const start2 = performance.now();
    const result2 = await cache.evaluatePositionCached(engine, fen);
    const time2 = performance.now() - start2;
    
    // Third call - should also be cache hit
    const start3 = performance.now();
    const result3 = await cache.evaluatePositionCached(engine, fen);
    const time3 = performance.now() - start3;
    
    const stats = cache.getStats();
    
    console.log('📊 CACHE HIT PATTERN:');
    console.log(`  First call (miss): ${time1.toFixed(2)}ms`);
    console.log(`  Second call (hit): ${time2.toFixed(2)}ms`);
    console.log(`  Third call (hit): ${time3.toFixed(2)}ms`);
    console.log(`  Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    console.log(`  Results identical: ${JSON.stringify(result1) === JSON.stringify(result2)}`);
    
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
    expect(time2).toBeLessThan(time1); // Cache hit should be faster
    expect(stats.hits).toBeGreaterThan(0);
  }, 15000);

  test('DEDUPLICATION: Test concurrent request handling', async () => {
    console.log('⚡ DEDUPLICATION: Testing concurrent requests');
    
    const fen = TEST_POSITIONS[1];
    const startTime = performance.now();
    
    // Fire multiple concurrent requests for same position
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        cache.evaluatePositionCached(engine, fen)
          .then(result => ({ index: i, result, time: performance.now() }))
      );
    }
    
    const results = await Promise.all(promises);
    const totalTime = performance.now() - startTime;
    const stats = cache.getStats();
    
    console.log('📊 DEDUPLICATION RESULTS:');
    console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Concurrent Requests: ${results.length}`);
    console.log(`  Deduplication Hits: ${stats.deduplicationHits}`);
    console.log(`  All Results Identical: ${results.every(r => 
      JSON.stringify(r.result) === JSON.stringify(results[0].result)
    )}`);
    
    // All results should be identical
    expect(results.length).toBe(5);
    expect(stats.deduplicationHits).toBeGreaterThan(0);
    
    // Verify all results are the same
    const firstResult = results[0].result;
    results.forEach(({ result }, index) => {
      expect(result).toEqual(firstResult);
    });
  }, 15000);
});