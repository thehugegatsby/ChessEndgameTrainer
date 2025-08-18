# Cache Integration Patterns

## Overview

This guide covers best practices for integrating `CacheManager` into your services, with special attention to avoiding common pitfalls in async environments.

## The Cache Stampede Problem

### What is a Cache Stampede?

A cache stampede occurs when multiple concurrent requests for the same uncached key result in redundant expensive operations (e.g., multiple API calls for the same data).

### The Problem Pattern

```typescript
// ❌ AVOID THIS PATTERN - Vulnerable to cache stampede
async function getData(key: string): Promise<Data> {
  const cached = this.cache.get(key);
  if (cached) {
    return cached;
  }

  // If two requests arrive here for the same key,
  // both will perform the expensive fetch operation
  const data = await this.expensiveFetch(key); // <-- PROBLEM!
  this.cache.set(key, data);
  return data;
}
```

**Why it's problematic:**

1. Request A checks cache → miss
2. Request B checks cache → miss (before A completes)
3. Both requests call `expensiveFetch()`
4. Redundant work and potential API rate limiting

## Robust Integration Patterns

### Pattern 1: Cache the Promise (Recommended)

Cache the Promise itself, not just the result. This ensures all concurrent requests await the same operation.

```typescript
class TablebaseService {
  private readonly dataCache: CacheManager<string, TablebaseEntry>;
  private readonly promiseCache: CacheManager<string, Promise<TablebaseEntry>>;

  constructor(apiClient?: LichessApiClient, cacheManager?: CacheManager<string, TablebaseEntry>) {
    this.dataCache = cacheManager || new LRUCacheManager(200, 300000);
    // Shorter TTL for promises - they're temporary
    this.promiseCache = new LRUCacheManager(100, 10000);
  }

  async getEvaluation(fen: string): Promise<TablebaseEntry> {
    // Check data cache first
    const cachedData = this.dataCache.get(fen);
    if (cachedData) {
      return cachedData;
    }

    // Check for in-flight promise
    let promise = this.promiseCache.get(fen);

    if (!promise) {
      // No in-flight request - create one
      promise = this.fetchFromAPI(fen)
        .then(data => {
          // Cache the successful result
          this.dataCache.set(fen, data);
          // Remove promise from cache (no longer needed)
          this.promiseCache.delete(fen);
          return data;
        })
        .catch(error => {
          // Remove failed promise so next request can retry
          this.promiseCache.delete(fen);
          throw error;
        });

      // Cache the promise immediately
      this.promiseCache.set(fen, promise);
    }

    return promise;
  }
}
```

### Pattern 2: Request Deduplication with Map

For simpler cases, use a Map to track in-flight requests:

```typescript
class AnalysisService {
  private readonly cache: CacheManager<string, Analysis>;
  private readonly pendingRequests = new Map<string, Promise<Analysis>>();

  async getAnalysis(position: string): Promise<Analysis> {
    // Check cache
    const cached = this.cache.get(position);
    if (cached) return cached;

    // Check pending requests
    const pending = this.pendingRequests.get(position);
    if (pending) return pending;

    // Create new request
    const request = this.performAnalysis(position)
      .then(result => {
        this.cache.set(position, result);
        return result;
      })
      .finally(() => {
        // Always cleanup pending request
        this.pendingRequests.delete(position);
      });

    this.pendingRequests.set(position, request);
    return request;
  }
}
```

## Testing Integration

### Unit Testing with Mock Cache

```typescript
describe('TablebaseService', () => {
  it('should use cache manager correctly', async () => {
    const mockCache = {
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
      has: vi.fn().mockReturnValue(false),
      delete: vi.fn(),
      clear: vi.fn(),
      size: 0,
    };

    const service = new TablebaseService(undefined, mockCache);

    await service.getEvaluation('test-fen');

    expect(mockCache.get).toHaveBeenCalledWith('test-fen');
    expect(mockCache.set).toHaveBeenCalled();
  });
});
```

### Testing Cache Stampede Prevention

```typescript
it('should prevent cache stampede', async () => {
  const service = new TablebaseService();
  let apiCallCount = 0;

  // Mock API to count calls
  service.fetchFromAPI = vi.fn().mockImplementation(() => {
    apiCallCount++;
    return new Promise(resolve => setTimeout(() => resolve(testData), 100));
  });

  // Launch multiple concurrent requests for same key
  const promises = Array(10)
    .fill(null)
    .map(() => service.getEvaluation('same-fen'));

  const results = await Promise.all(promises);

  // Should only make ONE API call despite 10 requests
  expect(apiCallCount).toBe(1);
  // All results should be identical
  expect(new Set(results).size).toBe(1);
});
```

## Common Patterns by Use Case

### 1. API Response Caching

```typescript
class APIService {
  private cache = new LRUCacheManager<string, APIResponse>(
    100, // max 100 endpoints cached
    60000 // 1 minute TTL
  );

  async fetch(endpoint: string): Promise<APIResponse> {
    // Use promise caching pattern
    return this.fetchWithStampedeProtection(endpoint);
  }
}
```

### 2. Computed Value Caching

```typescript
class CalculationService {
  private cache = new LRUCacheManager<string, Result>(
    500, // max 500 calculations cached
    3600000 // 1 hour TTL
  );

  async calculate(input: string): Promise<Result> {
    const cached = this.cache.get(input);
    if (cached) return cached;

    const result = await this.expensiveCalculation(input);
    this.cache.set(input, result);
    return result;
  }
}
```

### 3. Session/User Data Caching

```typescript
class UserService {
  private cache = new LRUCacheManager<string, UserData>(
    1000, // max 1000 users cached
    900000 // 15 minute TTL
  );

  async getUser(id: string): Promise<UserData> {
    // Shorter TTL for user data freshness
    return this.fetchWithCache(id);
  }
}
```

## Performance Monitoring

Track cache effectiveness in production:

```typescript
class MonitoredService {
  private cache: CacheManager<string, Data>;
  private lastStatsLog = Date.now();

  async getData(key: string): Promise<Data> {
    const result = await this.getDataWithCache(key);

    // Log stats every minute
    if (Date.now() - this.lastStatsLog > 60000) {
      const stats = this.cache.getStats();
      logger.info('Cache performance', {
        service: 'MonitoredService',
        hitRate: stats.hitRate,
        size: stats.size,
        evictions: stats.evictions,
      });
      this.lastStatsLog = Date.now();
    }

    return result;
  }
}
```

## Troubleshooting

### Low Hit Rate

If hit rate is below expectations:

1. Check if TTL is too short
2. Verify cache size is adequate
3. Analyze access patterns - random keys won't cache well
4. Consider pre-warming cache for known hot keys

### Memory Growth

If memory usage grows unexpectedly:

1. Verify TTL cleanup is working
2. Check cache size limits are enforced
3. Look for memory leaks in cached objects
4. Use heap snapshots to identify retained objects

### Performance Degradation

If cache operations become slow:

1. Check cache size - very large caches may impact performance
2. Verify no synchronous heavy operations in cache callbacks
3. Monitor GC pressure from frequent evictions
4. Consider splitting into multiple smaller caches
