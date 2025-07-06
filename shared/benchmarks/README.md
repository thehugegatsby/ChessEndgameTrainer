# Performance Benchmarks for Evaluation System Migration

## Overview

This benchmark suite compares the performance of the Legacy Evaluation System with the new Unified Evaluation System. It measures key metrics to ensure the migration maintains or improves performance.

## Metrics Measured

1. **Response Time**
   - Average, min, max, p95, and p99 percentiles
   - Measured in milliseconds

2. **Memory Usage**
   - Heap size and utilization
   - Measured after each batch of evaluations

3. **Cache Performance**
   - Hit rate, hits, and misses
   - Effectiveness of LRU cache

4. **Concurrent Request Handling**
   - Success rate under load
   - Average response time for parallel requests

## Usage

### Run from Code

```typescript
import { BenchmarkRunner } from './shared/benchmarks/run-benchmarks';

const runner = new BenchmarkRunner({
  iterations: 100,
  warmupIterations: 10,
  concurrentRequests: 10
});

const results = await runner.runBenchmarks();
```

### Run from Browser

Navigate to `/dev/benchmark` to access the interactive benchmark UI.

### Run with Playwright

```bash
npx playwright test tests/e2e/performance-benchmark.spec.ts
```

## Test Positions

The benchmark uses 6 standard positions covering:
- Simple endgames (K vs K, KP vs K)
- Complex evaluations (pawn races, rook endgames)
- Tablebase positions (KR vs K, KP vs K)

## Interpreting Results

### Overall Score
- **Positive %**: Unified system is faster/better
- **Negative %**: Legacy system is faster/better

### Weighted Scoring
- Response Time: 40%
- Memory Usage: 20%
- Cache Hit Rate: 20%
- Concurrency: 20%

### Success Criteria
- Response time improvement ≥ 0%
- Memory usage improvement ≥ 0%
- No regression in cache performance
- Concurrent handling at least as good as legacy

## Best Practices

1. **Controlled Environment**
   - Close unnecessary applications
   - Use consistent hardware
   - Run in incognito/private mode

2. **Multiple Runs**
   - Run benchmarks 3+ times
   - Take average of results
   - Note any outliers

3. **Warmup Phase**
   - Always include warmup iterations
   - Helps stabilize JIT compilation
   - Ensures caches are primed

## Troubleshooting

### High Variance in Results
- Increase iteration count
- Check for background processes
- Ensure stable network (for tablebase calls)

### Memory Measurements Unavailable
- Some browsers restrict performance.memory
- Use Chrome with --enable-precise-memory-info flag

### Cache Stats Missing
- Ensure LRU cache instance is accessible
- Check that getStats() method is implemented

## Future Enhancements

- [ ] Real evaluation function integration
- [ ] Network latency simulation
- [ ] Mobile device benchmarking
- [ ] CI/CD integration
- [ ] Historical trend tracking