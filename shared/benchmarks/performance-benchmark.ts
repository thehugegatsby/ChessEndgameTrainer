/**
 * Performance Benchmark Suite for Evaluation System Migration
 * Compares Legacy vs Unified Evaluation System
 */

export interface BenchmarkMetrics {
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  concurrency: {
    successRate: number;
    avgResponseTime: number;
    maxConcurrent: number;
  };
}

export interface BenchmarkConfig {
  iterations: number;
  warmupIterations: number;
  concurrentRequests: number;
  testPositions: TestPosition[];
  featureFlag: boolean;
}

export interface TestPosition {
  fen: string;
  type: 'simple' | 'complex' | 'tablebase';
  description: string;
}

// Standard test positions for consistent benchmarking
export const BENCHMARK_POSITIONS: TestPosition[] = [
  // Simple positions
  {
    fen: '8/8/8/8/8/8/1k6/K7 w - - 0 1',
    type: 'simple',
    description: 'King vs King - Draw'
  },
  {
    fen: '8/8/8/8/8/2K5/2P5/2k5 w - - 0 1',
    type: 'simple',
    description: 'King + Pawn vs King - Simple win'
  },
  
  // Complex positions
  {
    fen: '8/p7/8/1P6/8/8/8/k6K w - - 0 1',
    type: 'complex',
    description: 'Pawn race - Complex evaluation'
  },
  {
    fen: '8/8/3k4/8/3K4/8/8/3R4 w - - 0 1',
    type: 'complex',
    description: 'Rook endgame - Mate in many'
  },
  
  // Tablebase positions
  {
    fen: '8/8/8/8/8/2k5/8/2KR4 w - - 0 1',
    type: 'tablebase',
    description: 'KR vs K - Tablebase win'
  },
  {
    fen: '8/8/8/3k4/8/8/3PK3/8 w - - 0 1',
    type: 'tablebase',
    description: 'KP vs K - Tablebase position'
  }
];

export class PerformanceBenchmark {
  private metrics: Map<string, number[]> = new Map();
  
  constructor(private config: BenchmarkConfig) {}
  
  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  }
  
  /**
   * Measure the time between two marks
   */
  measure(name: string, startMark: string, endMark: string): number {
    if (typeof window !== 'undefined' && window.performance) {
      const measure = window.performance.measure(name, startMark, endMark);
      const duration = measure.duration;
      
      // Store measurement
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(duration);
      
      // Clean up marks
      window.performance.clearMarks(startMark);
      window.performance.clearMarks(endMark);
      window.performance.clearMeasures(name);
      
      return duration;
    }
    return 0;
  }
  
  /**
   * Calculate statistics for a set of measurements
   */
  private calculateStats(measurements: number[]): BenchmarkMetrics['responseTime'] {
    const sorted = measurements.slice().sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    
    return {
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  /**
   * Get memory usage snapshot
   */
  private getMemoryUsage(): BenchmarkMetrics['memory'] {
    if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
      const memory = (window.performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.jsHeapSizeLimit
      };
    }
    
    // Fallback for environments without performance.memory
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    };
  }
  
  /**
   * Run concurrent evaluation tests
   */
  async runConcurrencyTest(
    evaluationFn: (fen: string) => Promise<any>,
    positions: TestPosition[]
  ): Promise<BenchmarkMetrics['concurrency']> {
    const startTime = typeof window !== 'undefined' && window.performance 
      ? window.performance.now() 
      : Date.now();
    const promises: Promise<any>[] = [];
    let successCount = 0;
    
    // Create concurrent requests
    for (let i = 0; i < this.config.concurrentRequests; i++) {
      const position = positions[i % positions.length];
      const promise = evaluationFn(position.fen)
        .then(() => successCount++)
        .catch(() => {}); // Count failures
      promises.push(promise);
    }
    
    await Promise.all(promises);
    const endTime = typeof window !== 'undefined' && window.performance 
      ? window.performance.now() 
      : Date.now();
    
    return {
      successRate: successCount / this.config.concurrentRequests,
      avgResponseTime: (endTime - startTime) / this.config.concurrentRequests,
      maxConcurrent: this.config.concurrentRequests
    };
  }
  
  /**
   * Generate final benchmark report
   */
  generateReport(cacheStats: { hits: number; misses: number; size: number }): BenchmarkMetrics {
    const responseTimes = this.metrics.get('evaluation') || [];
    
    return {
      responseTime: this.calculateStats(responseTimes),
      memory: this.getMemoryUsage(),
      cache: {
        ...cacheStats,
        hitRate: cacheStats.hits / (cacheStats.hits + cacheStats.misses)
      },
      concurrency: {
        successRate: 0,
        avgResponseTime: 0,
        maxConcurrent: 0
      }
    };
  }
  
  /**
   * Clear all collected metrics
   */
  reset(): void {
    this.metrics.clear();
  }
}

/**
 * Compare benchmarks between two systems
 */
export function compareBenchmarks(
  legacy: BenchmarkMetrics,
  unified: BenchmarkMetrics
): {
  responseTimeImprovement: number;
  memoryImprovement: number;
  cacheHitImprovement: number;
  concurrencyImprovement: number;
  overallScore: number;
} {
  const responseTimeImprovement = 
    (legacy.responseTime.avg - unified.responseTime.avg) / legacy.responseTime.avg * 100;
  
  const memoryImprovement = 
    (legacy.memory.heapUsed - unified.memory.heapUsed) / legacy.memory.heapUsed * 100;
  
  const cacheHitImprovement = 
    (unified.cache.hitRate - legacy.cache.hitRate) * 100;
  
  const concurrencyImprovement = 
    (unified.concurrency.successRate - legacy.concurrency.successRate) * 100;
  
  // Weighted overall score
  const overallScore = (
    responseTimeImprovement * 0.4 +
    memoryImprovement * 0.2 +
    cacheHitImprovement * 0.2 +
    concurrencyImprovement * 0.2
  );
  
  return {
    responseTimeImprovement,
    memoryImprovement,
    cacheHitImprovement,
    concurrencyImprovement,
    overallScore
  };
}