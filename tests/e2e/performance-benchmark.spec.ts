/**
 * Playwright E2E Performance Benchmark Tests
 * Automated performance comparison between Legacy and Unified Evaluation Systems
 */

import { test, expect, Page } from '@playwright/test';
import { BENCHMARK_POSITIONS } from '../../shared/benchmarks/performance-benchmark';

// Test configuration
const BENCHMARK_CONFIG = {
  iterations: 50,
  warmupIterations: 5,
  positions: BENCHMARK_POSITIONS,
  timeout: 300000 // 5 minutes
};

interface PerformanceMetrics {
  responseTime: number[];
  memorySnapshots: number[];
  cacheHits: number;
  cacheMisses: number;
}

test.describe('Evaluation System Performance Benchmarks', () => {
  test.setTimeout(BENCHMARK_CONFIG.timeout);
  
  let legacyMetrics: PerformanceMetrics;
  let unifiedMetrics: PerformanceMetrics;
  
  test.beforeAll(() => {
    legacyMetrics = {
      responseTime: [],
      memorySnapshots: [],
      cacheHits: 0,
      cacheMisses: 0
    };
    
    unifiedMetrics = {
      responseTime: [],
      memorySnapshots: [],
      cacheHits: 0,
      cacheMisses: 0
    };
  });
  
  /**
   * Helper to measure evaluation performance
   */
  async function measureEvaluation(
    page: Page,
    fen: string,
    useUnified: boolean
  ): Promise<number> {
    // Set feature flag via localStorage
    await page.evaluate((flag: boolean) => {
      localStorage.setItem('USE_UNIFIED_EVALUATION_SYSTEM', flag ? 'true' : 'false');
    }, useUnified);
    
    // Measure evaluation time
    const duration = await page.evaluate(async (position: string) => {
      const startTime = performance.now();
      
      // Trigger evaluation (assuming global function exists)
      // In real implementation, this would call the actual evaluation hook
      await (window as any).evaluatePosition(position);
      
      return performance.now() - startTime;
    }, fen);
    
    return duration;
  }
  
  /**
   * Helper to get memory usage
   */
  async function getMemoryUsage(page: Page): Promise<number> {
    return await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
  }
  
  /**
   * Helper to get cache statistics
   */
  async function getCacheStats(page: Page): Promise<{ hits: number; misses: number }> {
    return await page.evaluate(() => {
      // Access cache stats from global cache instance
      const cache = (window as any).evaluationCache;
      if (cache && cache.getStats) {
        const stats = cache.getStats();
        return { hits: stats.hits, misses: stats.misses };
      }
      return { hits: 0, misses: 0 };
    });
  }
  
  test('Warmup phase', async ({ page }) => {
    await page.goto('/train/1'); // Navigate to training page
    
    console.log('Running warmup iterations...');
    
    for (let i = 0; i < BENCHMARK_CONFIG.warmupIterations; i++) {
      for (const position of BENCHMARK_CONFIG.positions) {
        await measureEvaluation(page, position.fen, false);
        await measureEvaluation(page, position.fen, true);
      }
    }
    
    // Reset cache statistics after warmup
    await page.evaluate(() => {
      const cache = (window as any).evaluationCache;
      if (cache && cache.clear) {
        cache.clear();
      }
    });
  });
  
  test('Legacy System Performance', async ({ page }) => {
    await page.goto('/train/1');
    
    console.log('Testing Legacy System...');
    
    // Response time measurements
    for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
      const position = BENCHMARK_CONFIG.positions[i % BENCHMARK_CONFIG.positions.length];
      const duration = await measureEvaluation(page, position.fen, false);
      legacyMetrics.responseTime.push(duration);
      
      // Periodic memory snapshot
      if (i % 10 === 0) {
        const memory = await getMemoryUsage(page);
        legacyMetrics.memorySnapshots.push(memory);
      }
    }
    
    // Final cache stats
    const cacheStats = await getCacheStats(page);
    legacyMetrics.cacheHits = cacheStats.hits;
    legacyMetrics.cacheMisses = cacheStats.misses;
    
    // Log summary
    const avgResponseTime = legacyMetrics.responseTime.reduce((a, b) => a + b, 0) / legacyMetrics.responseTime.length;
    console.log(`Legacy - Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Legacy - Cache Hit Rate: ${(cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1)}%`);
  });
  
  test('Unified System Performance', async ({ page }) => {
    await page.goto('/train/1');
    
    console.log('Testing Unified System...');
    
    // Clear cache for fair comparison
    await page.evaluate(() => {
      const cache = (window as any).evaluationCache;
      if (cache && cache.clear) {
        cache.clear();
      }
    });
    
    // Response time measurements
    for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
      const position = BENCHMARK_CONFIG.positions[i % BENCHMARK_CONFIG.positions.length];
      const duration = await measureEvaluation(page, position.fen, true);
      unifiedMetrics.responseTime.push(duration);
      
      // Periodic memory snapshot
      if (i % 10 === 0) {
        const memory = await getMemoryUsage(page);
        unifiedMetrics.memorySnapshots.push(memory);
      }
    }
    
    // Final cache stats
    const cacheStats = await getCacheStats(page);
    unifiedMetrics.cacheHits = cacheStats.hits;
    unifiedMetrics.cacheMisses = cacheStats.misses;
    
    // Log summary
    const avgResponseTime = unifiedMetrics.responseTime.reduce((a, b) => a + b, 0) / unifiedMetrics.responseTime.length;
    console.log(`Unified - Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Unified - Cache Hit Rate: ${(cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1)}%`);
  });
  
  test('Concurrent Request Handling', async ({ page }) => {
    await page.goto('/train/1');
    
    console.log('Testing concurrent requests...');
    
    // Test legacy system
    const legacyConcurrentTime = await page.evaluate(async (positions: typeof BENCHMARK_CONFIG.positions) => {
      const startTime = performance.now();
      const promises = positions.map((pos) => 
        (window as any).evaluatePosition(pos.fen)
      );
      await Promise.all(promises);
      return performance.now() - startTime;
    }, BENCHMARK_CONFIG.positions);
    
    // Test unified system
    await page.evaluate(() => {
      localStorage.setItem('USE_UNIFIED_EVALUATION_SYSTEM', 'true');
    });
    
    const unifiedConcurrentTime = await page.evaluate(async (positions: typeof BENCHMARK_CONFIG.positions) => {
      const startTime = performance.now();
      const promises = positions.map((pos) => 
        (window as any).evaluatePosition(pos.fen)
      );
      await Promise.all(promises);
      return performance.now() - startTime;
    }, BENCHMARK_CONFIG.positions);
    
    console.log(`Legacy - Concurrent Time: ${legacyConcurrentTime.toFixed(2)}ms`);
    console.log(`Unified - Concurrent Time: ${unifiedConcurrentTime.toFixed(2)}ms`);
  });
  
  test.afterAll(() => {
    // Calculate final metrics
    const legacyAvgResponse = legacyMetrics.responseTime.reduce((a, b) => a + b, 0) / legacyMetrics.responseTime.length;
    const unifiedAvgResponse = unifiedMetrics.responseTime.reduce((a, b) => a + b, 0) / unifiedMetrics.responseTime.length;
    
    const legacyAvgMemory = legacyMetrics.memorySnapshots.reduce((a, b) => a + b, 0) / legacyMetrics.memorySnapshots.length;
    const unifiedAvgMemory = unifiedMetrics.memorySnapshots.reduce((a, b) => a + b, 0) / unifiedMetrics.memorySnapshots.length;
    
    const responseTimeImprovement = ((legacyAvgResponse - unifiedAvgResponse) / legacyAvgResponse * 100);
    const memoryImprovement = ((legacyAvgMemory - unifiedAvgMemory) / legacyAvgMemory * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE BENCHMARK RESULTS');
    console.log('='.repeat(60));
    console.log(`Response Time Improvement: ${responseTimeImprovement.toFixed(1)}%`);
    console.log(`Memory Usage Improvement: ${memoryImprovement.toFixed(1)}%`);
    console.log(`Overall: ${responseTimeImprovement > 0 ? '✅ Unified system is faster!' : '❌ Legacy system is faster!'}`);
    console.log('='.repeat(60));
  });
});

/**
 * Visual regression test for performance
 */
test.describe('Performance Visual Tests', () => {
  test('Capture performance metrics visualization', async ({ page }) => {
    await page.goto('/train/1');
    
    // Enable performance visualization (if implemented)
    await page.evaluate(() => {
      (window as any).showPerformanceMetrics = true;
    });
    
    // Capture screenshots of performance metrics
    await page.screenshot({ 
      path: 'benchmark-results/legacy-metrics.png',
      fullPage: true 
    });
    
    // Switch to unified system
    await page.evaluate(() => {
      localStorage.setItem('USE_UNIFIED_EVALUATION_SYSTEM', 'true');
    });
    
    await page.reload();
    
    await page.screenshot({ 
      path: 'benchmark-results/unified-metrics.png',
      fullPage: true 
    });
  });
});