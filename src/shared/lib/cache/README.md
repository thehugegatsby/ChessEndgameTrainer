# Cache Manager

A generic, high-performance caching library with support for LRU eviction and TTL expiration.

## Overview

The `CacheManager<K, V>` interface provides a type-safe, generic caching contract that can be implemented with different backends (in-memory, Redis, etc.). The default `LRUCacheManager` implementation offers:

- **O(1) operations** for get/set/delete
- **LRU eviction** when capacity is reached
- **TTL support** with automatic cleanup
- **Memory leak prevention** through proper garbage collection
- **Statistics tracking** for monitoring and optimization

## Quick Start

```typescript
import { LRUCacheManager } from "@shared/lib/cache";

// Create cache: 200 max items, 5-minute default TTL
const cache = new LRUCacheManager<string, TablebaseEntry>(200, 300000);

// Store data
cache.set("position1", tablebaseData);

// Store with custom TTL (10 seconds)
cache.set("tempData", tempValue, 10000);

// Retrieve data (handles expiration automatically)
const data = cache.get("position1");

// Check statistics
const stats = cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
```

## Dependency Injection Pattern

Services should receive cache instances via constructor injection for better testability and flexibility:

```typescript
class MyService {
  private readonly cache: CacheManager<string, MyData>;

  constructor(cacheManager?: CacheManager<string, MyData>) {
    this.cache = cacheManager || new LRUCacheManager(100, 60000);
  }

  async getData(key: string): Promise<MyData> {
    // See Integration Patterns for robust implementation
    return this.getDataWithStampedeProtection(key);
  }
}

// Usage
const service = new MyService(); // Uses default cache
const testService = new MyService(mockCache); // Uses mock for testing
```

## Constructor Options

### LRUCacheManager

```typescript
new LRUCacheManager<K, V>(maxSize?, defaultTtlMs?)
```

**Parameters:**

- `maxSize` (number, default: 100): Maximum number of entries to store
- `defaultTtlMs` (number, default: 300000): Default TTL in milliseconds (5 minutes)

**Factory method:**

```typescript
const cache = LRUCacheManager.fromOptions<K, V>({
  maxSize: 500,
  defaultTtlMs: 600000, // 10 minutes
});
```

## API Reference

### CacheManager Interface

```typescript
interface CacheManager<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttlMs?: number): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  readonly size: number;
}
```

### Statistics (LRUCacheManager)

```typescript
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
  evictions: number;
  expirations: number;
}
```

## Custom Cache Implementation

To use a different backend (e.g., Redis), implement the `CacheManager` interface:

```typescript
import type { CacheManager } from "@shared/lib/cache";

class RedisCacheManager<K, V> implements CacheManager<K, V> {
  constructor(private redisClient: RedisClient) {}

  get(key: K): V | undefined {
    // Implement Redis get operation
  }

  set(key: K, value: V, ttlMs?: number): void {
    // Implement Redis set with expiration
  }

  // ... implement other methods
}

// Use in services
const service = new TablebaseService(apiClient, new RedisCacheManager(redis));
```

## Performance Characteristics

Based on comprehensive benchmarks:

| Operation    | Performance | Notes                     |
| ------------ | ----------- | ------------------------- |
| **get()**    | ~0.001ms    | O(1) complexity           |
| **set()**    | ~0.001ms    | O(1) complexity           |
| **Eviction** | ~0.001ms    | Efficient LRU removal     |
| **Memory**   | Stable      | No leaks with TTL cleanup |
| **Hit Rate** | 25-40%      | Depends on access pattern |

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed benchmarks.

## Integration Patterns

For robust async usage patterns that prevent race conditions, see [INTEGRATION.md](./INTEGRATION.md).

## Testing

The library includes comprehensive test coverage:

- **31 unit tests** for `LRUCacheManager`
- **9 performance tests** for benchmarking
- **Integration tests** with `TablebaseService`

Run tests:

```bash
npm test src/tests/unit/lib/cache/
npm test src/tests/performance/
```
