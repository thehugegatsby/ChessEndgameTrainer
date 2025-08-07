# TablebaseService Refactoring Plan

## Current Issues

### 1. Single Responsibility Principle Violations
The 646-line TablebaseService class handles:
- HTTP communication with Lichess API
- Caching logic (LRU cache implementation)
- Request deduplication
- Data transformation (API response → internal format)
- Move sorting algorithms
- Metrics collection
- FEN validation and normalization
- Error handling and retry logic
- Evaluation text generation (German)

### 2. Technical Debt

#### Magic Numbers
```typescript
// Current (scattered throughout):
private readonly maxPieces = 7;
private readonly cacheTtl = 300000; // 5 minutes
setTimeout(() => controller.abort(), 5000);
if (this.cache.size > 200) { ... }
const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
```

#### Hardcoded German Text
```typescript
case "win":
  return dtz ? `Gewinn in ${Math.abs(dtz)} Zügen` : "Theoretisch gewonnen";
```

#### Missing Abstractions
- No interface definitions (ITablebaseService, ICache, IHttpClient)
- Direct HTTP calls without abstraction
- Inline metrics implementation
- No dependency injection

## Proposed Architecture

### 1. Interface Definitions

```typescript
// shared/services/tablebase/interfaces.ts

export interface ITablebaseService {
  getEvaluation(fen: string): Promise<TablebaseEvaluation>;
  getTopMoves(fen: string, limit?: number): Promise<TablebaseMovesResult>;
}

export interface ITablebaseCache {
  get(key: string): TablebaseCacheEntry | undefined;
  set(key: string, value: TablebaseCacheEntry): void;
  clear(): void;
  size: number;
}

export interface ITablebaseApiClient {
  fetchPosition(fen: string): Promise<LichessTablebaseResponse | null>;
}

export interface ITablebaseTransformer {
  transform(apiResponse: LichessTablebaseResponse, fen: string): TablebaseEntry;
}

export interface IMoveSorter {
  sortMoves(moves: TablebaseMoveInternal[]): TablebaseMoveInternal[];
  getBestMoves(moves: TablebaseMoveInternal[], limit: number): TablebaseMoveInternal[];
}

export interface ITablebaseMetrics {
  recordCacheHit(): void;
  recordCacheMiss(): void;
  recordApiCall(): void;
  recordApiError(status: number): void;
  recordDeduplication(): void;
  getMetrics(): MetricsSnapshot;
}
```

### 2. Configuration Object

```typescript
// shared/config/tablebaseConfig.ts

export const TABLEBASE_CONFIG = {
  api: {
    baseUrl: process.env.TABLEBASE_API_URL || 'https://tablebase.lichess.ovh',
    timeout: 5000,
    maxRetries: 3,
    retryDelays: {
      base: 1000,
      maxDelay: 10000,
      jitter: 1000,
    },
    movesLimit: 20,
  },
  cache: {
    maxSize: 200,
    ttl: 300000, // 5 minutes
    maxPieces: 7,
  },
  localization: {
    defaultLanguage: 'de',
    evaluationTexts: {
      de: {
        win: (dtz?: number) => dtz ? `Gewinn in ${Math.abs(dtz)} Zügen` : "Theoretisch gewonnen",
        // ... other texts
      },
      en: {
        win: (dtz?: number) => dtz ? `Win in ${Math.abs(dtz)} moves` : "Theoretical win",
        // ... other texts
      }
    }
  }
} as const;
```

### 3. Separate Classes

#### TablebaseApiClient
```typescript
// shared/services/tablebase/TablebaseApiClient.ts

export class TablebaseApiClient implements ITablebaseApiClient {
  constructor(
    private config: typeof TABLEBASE_CONFIG.api,
    private logger: ILogger,
    private metrics: ITablebaseMetrics
  ) {}

  async fetchPosition(fen: string): Promise<LichessTablebaseResponse | null> {
    // HTTP logic with retries
    // Rate limiting handling
    // Timeout management
    // Response validation with Zod
  }

  private async fetchWithRetry(...) { ... }
  private handleRateLimit(...) { ... }
}
```

#### TablebaseCache
```typescript
// shared/services/tablebase/TablebaseCache.ts

export class TablebaseCache implements ITablebaseCache {
  private cache = new Map<string, TablebaseCacheEntry>();

  constructor(
    private config: typeof TABLEBASE_CONFIG.cache,
    private metrics: ITablebaseMetrics
  ) {}

  get(key: string): TablebaseCacheEntry | undefined {
    const normalizedKey = this.normalizeKey(key);
    const entry = this.cache.get(normalizedKey);
    
    if (entry && !this.isExpired(entry)) {
      this.metrics.recordCacheHit();
      return entry;
    }
    
    this.metrics.recordCacheMiss();
    return undefined;
  }

  set(key: string, value: TablebaseCacheEntry): void {
    const normalizedKey = this.normalizeKey(key);
    this.cache.set(normalizedKey, value);
    this.evictIfNeeded();
  }

  private normalizeKey(fen: string): string {
    // FEN normalization logic
  }

  private evictIfNeeded(): void {
    // LRU eviction logic
  }
}
```

#### TablebaseTransformer
```typescript
// shared/services/tablebase/TablebaseTransformer.ts

export class TablebaseTransformer implements ITablebaseTransformer {
  constructor(
    private localization: typeof TABLEBASE_CONFIG.localization
  ) {}

  transform(api: LichessTablebaseResponse, fen: string): TablebaseEntry {
    // Pure transformation logic
    // Category to WDL conversion
    // Perspective handling
  }

  private categoryToWdl(category: string): number { ... }
  private invertCategory(category: string): string { ... }
  private getEvaluationText(category: string, dtz?: number): string { ... }
}
```

#### MoveSorter
```typescript
// shared/services/tablebase/MoveSorter.ts

export class MoveSorter implements IMoveSorter {
  sortMoves(moves: TablebaseMoveInternal[]): TablebaseMoveInternal[] {
    return [...moves].sort((a, b) => {
      // Sorting logic with proper DTM handling
      if (a.wdl !== b.wdl) return b.wdl - a.wdl;
      
      if (a.wdl > 0) {
        const aDtx = a.dtm ?? a.dtz ?? 0;
        const bDtx = b.dtm ?? b.dtz ?? 0;
        return Math.abs(aDtx) - Math.abs(bDtx);
      }
      // ... rest of sorting logic
    });
  }

  getBestMoves(moves: TablebaseMoveInternal[], limit: number): TablebaseMoveInternal[] {
    const sorted = this.sortMoves(moves);
    const bestWdl = sorted[0]?.wdl ?? 0;
    return sorted.filter(m => m.wdl === bestWdl).slice(0, limit);
  }
}
```

#### Refactored TablebaseService
```typescript
// shared/services/tablebase/TablebaseService.ts

export class TablebaseService implements ITablebaseService {
  private pendingRequests = new Map<string, Promise<TablebaseEntry | null>>();

  constructor(
    private apiClient: ITablebaseApiClient,
    private cache: ITablebaseCache,
    private transformer: ITablebaseTransformer,
    private moveSorter: IMoveSorter,
    private validator: IFenValidator,
    private logger: ILogger
  ) {}

  async getEvaluation(fen: string): Promise<TablebaseEvaluation> {
    try {
      const entry = await this.getOrFetchEntry(fen);
      if (!entry) return { isAvailable: false };
      
      return {
        isAvailable: true,
        result: this.extractEvaluation(entry),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTopMoves(fen: string, limit = 3): Promise<TablebaseMovesResult> {
    try {
      const entry = await this.getOrFetchEntry(fen);
      if (!entry || !entry.moves.length) {
        return { isAvailable: false, error: "No moves available" };
      }
      
      const topMoves = this.moveSorter.getBestMoves(entry.moves, limit);
      return {
        isAvailable: true,
        moves: this.toExternalFormat(topMoves),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async getOrFetchEntry(fen: string): Promise<TablebaseEntry | null> {
    // Validation
    const validation = this.validator.validate(fen);
    if (!validation.isValid) throw new Error(validation.errors.join(", "));
    
    // Check cache
    const cached = this.cache.get(validation.sanitized);
    if (cached) return cached.entry;
    
    // Check pending requests (deduplication)
    const pending = this.pendingRequests.get(validation.sanitized);
    if (pending) return pending;
    
    // Fetch new
    const request = this.fetchAndCache(validation.sanitized);
    this.pendingRequests.set(validation.sanitized, request);
    
    return request.finally(() => {
      this.pendingRequests.delete(validation.sanitized);
    });
  }
}
```

### 4. Dependency Injection Setup

```typescript
// shared/services/tablebase/index.ts

import { TablebaseService } from './TablebaseService';
import { TablebaseApiClient } from './TablebaseApiClient';
import { TablebaseCache } from './TablebaseCache';
import { TablebaseTransformer } from './TablebaseTransformer';
import { MoveSorter } from './MoveSorter';
import { TablebaseMetrics } from './TablebaseMetrics';
import { FenValidator } from '../validators/FenValidator';
import { getLogger } from '../logging';
import { TABLEBASE_CONFIG } from '../../config/tablebaseConfig';

// Factory function for creating configured service
export function createTablebaseService(): ITablebaseService {
  const logger = getLogger().setContext('TablebaseService');
  const metrics = new TablebaseMetrics();
  
  const apiClient = new TablebaseApiClient(
    TABLEBASE_CONFIG.api,
    logger,
    metrics
  );
  
  const cache = new TablebaseCache(
    TABLEBASE_CONFIG.cache,
    metrics
  );
  
  const transformer = new TablebaseTransformer(
    TABLEBASE_CONFIG.localization
  );
  
  const moveSorter = new MoveSorter();
  const validator = new FenValidator();
  
  return new TablebaseService(
    apiClient,
    cache,
    transformer,
    moveSorter,
    validator,
    logger
  );
}

// Singleton for backward compatibility
export const tablebaseService = createTablebaseService();
```

## Migration Strategy

### Phase 1: Extract Configuration (Quick Win - 30 min)
1. Create `tablebaseConfig.ts` with all magic numbers
2. Replace hardcoded values with config references
3. Run tests to ensure no regression

### Phase 2: Define Interfaces (1 hour)
1. Create interface definitions
2. Make current TablebaseService implement ITablebaseService
3. Update imports in consuming code

### Phase 3: Extract Classes (4 hours)
1. Extract TablebaseCache class
2. Extract TablebaseApiClient class
3. Extract TablebaseTransformer class
4. Extract MoveSorter class
5. Update TablebaseService to use extracted classes

### Phase 4: Add Dependency Injection (2 hours)
1. Create factory function
2. Update singleton instantiation
3. Add configuration for different environments

### Phase 5: Testing (2 hours)
1. Unit test each extracted class in isolation
2. Integration test the composed service
3. Ensure backward compatibility

## Benefits

### Immediate Benefits
- **Testability**: Each class can be tested in isolation
- **Maintainability**: Clear separation of concerns
- **Configurability**: All magic numbers in one place
- **Extensibility**: Easy to add new features to specific classes

### Future Benefits
- **Internationalization**: Easy to add more languages
- **Alternative Implementations**: Can swap cache or API client implementations
- **Performance Monitoring**: Dedicated metrics class for detailed tracking
- **Error Recovery**: Specialized error handling per component

## Testing Strategy

### Unit Tests
```typescript
// TablebaseCache.test.ts
describe('TablebaseCache', () => {
  it('should normalize FEN keys', () => {
    const cache = new TablebaseCache(config, mockMetrics);
    cache.set('fen1 w - - 0 1', entry);
    expect(cache.get('fen1 w - - 15 42')).toBe(entry); // Same position
  });
});

// MoveSorter.test.ts
describe('MoveSorter', () => {
  it('should handle negative DTM values correctly', () => {
    const sorter = new MoveSorter();
    const moves = [/* Issue #59 test case */];
    const sorted = sorter.sortMoves(moves);
    expect(sorted[0].san).toBe('e7'); // Best move first
  });
});
```

## Risks and Mitigation

### Risks
1. **Breaking Changes**: Existing code depends on current implementation
2. **Performance**: Additional abstraction layers might add overhead
3. **Complexity**: More files and classes to maintain

### Mitigation
1. **Backward Compatibility**: Keep existing API, use factory pattern
2. **Performance Testing**: Benchmark before and after refactoring
3. **Documentation**: Clear documentation for each component

## Conclusion

This refactoring addresses all identified issues:
- ✅ Single Responsibility Principle
- ✅ Dependency Injection
- ✅ Configuration Management
- ✅ Testability
- ✅ Extensibility
- ✅ Internationalization Ready

The phased approach allows incremental improvement with minimal risk.