# Evaluation Pipeline Patterns

**Target**: LLM comprehension for evaluation system implementation
**Environment**: WSL + VS Code + Windows
**Updated**: 2025-07-13

## 🔄 Pipeline Architecture

### Unified Evaluation Flow

```
Position (FEN) → [Cache Check] → [Provider Parallel Execution] → [Result Aggregation] → [Format & Cache] → UI Display
                      ↓                          ↓                        ↓
                 Cache Hit ←→ [Engine Provider] + [Tablebase Provider] → [Unified Result]
                              ↓                    ↓
                         UCI Parser          Service Adapter
                              ↓                    ↓
                        Stockfish WASM      Mock/Real Tablebase
```

## 📊 Data Flow Stages

### Stage 1: Request Initiation

**File**: `/shared/hooks/useEvaluation.ts:137-150`
```typescript
const evaluatePosition = useCallback(async (fen: string) => {
  setIsEvaluating(true);
  setError(null);
  
  try {
    const playerToMove = getPlayerToMoveFromFen(fen);
    
    // Stage 1: Initiate evaluation pipeline
    const formattedEval = await service.getFormattedEvaluation(fen, playerToMove);
    const rawEngineEval = await service.getRawEngineEvaluation(fen, playerToMove);
    
    // Continue to Stage 2...
  } catch (error) {
    handleEvaluationError(error);
  }
}, [service]);
```

### Stage 2: Cache Layer

**File**: `/shared/lib/chess/evaluation/unifiedService.ts:45-55`
```typescript
async getFormattedEvaluation(
  fen: string, 
  perspective: 'w' | 'b'
): Promise<FormattedEvaluation> {
  // Stage 2: Cache check
  const cacheKey = `${fen}:${perspective}`;
  const cached = this.cache?.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Continue to Stage 3...
}
```

### Stage 3: Provider Parallel Execution

**File**: `/shared/lib/chess/evaluation/unifiedService.ts:60-75`
```typescript
// Stage 3: Parallel provider execution
const [engineResult, tablebaseResult] = await Promise.allSettled([
  this.engineProvider.getEvaluation(fen, playerToMove),
  this.tablebaseProvider.getEvaluation(fen, playerToMove)
]);

// Extract results from Promise.allSettled
const engineEval = engineResult.status === 'fulfilled' ? engineResult.value : null;
const tablebaseEval = tablebaseResult.status === 'fulfilled' ? tablebaseResult.value : null;
```

### Stage 4: Result Aggregation

**File**: `/shared/lib/chess/evaluation/unifiedService.ts:80-100`
```typescript
// Stage 4: Priority-based result aggregation
let primaryEvaluation: number;
let formattedText: string;
let metadata: EvaluationMetadata;

if (tablebaseEval) {
  // Tablebase has highest priority (perfect information)
  primaryEvaluation = this.convertWdlToEvaluation(tablebaseEval.wdl);
  formattedText = this.formatTablebaseResult(tablebaseEval);
  metadata = { isTablebase: true, isMate: false, isDrawn: tablebaseEval.wdl === 0 };
} else if (engineEval) {
  // Engine evaluation as fallback
  primaryEvaluation = engineEval.score;
  formattedText = engineEval.evaluation;
  metadata = { isTablebase: false, isMate: !!engineEval.mate, isDrawn: false };
} else {
  // No evaluation available
  return this.getDefaultEvaluation();
}
```

### Stage 5: Format & Cache

**File**: `/shared/lib/chess/evaluation/unifiedService.ts:105-120`
```typescript
// Stage 5: Format result and cache
const formattedEvaluation: FormattedEvaluation = {
  mainText: formattedText,
  className: this.getEvaluationClassName(primaryEvaluation, metadata),
  metadata
};

// Cache the result
if (this.cache) {
  this.cache.set(cacheKey, formattedEvaluation);
}

return formattedEvaluation;
```

## 🎯 Provider Implementation Patterns

### Engine Provider Pattern

**File**: `/shared/lib/chess/evaluation/providerAdapters.ts:15-51`
```typescript
export class EngineProviderAdapter implements IEngineProvider {
  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null> {
    try {
      // Provider pattern: Delegate to infrastructure
      const enhancedEvaluation = await engine.evaluatePositionEnhanced(fen, false);
      
      if (!enhancedEvaluation) {
        return null;
      }

      // Provider pattern: Transform infrastructure data to provider format
      const result: EngineEvaluation = {
        score: enhancedEvaluation.score,
        mate: enhancedEvaluation.mate,
        evaluation: enhancedEvaluation.mate 
          ? `#${Math.abs(enhancedEvaluation.mate)}` 
          : `${(enhancedEvaluation.score / 100).toFixed(2)}`,
        depth: enhancedEvaluation.depth || 15,
        nodes: enhancedEvaluation.nodes || 0,
        time: enhancedEvaluation.time || 0,
        // Enhanced UCI data
        pv: enhancedEvaluation.pv,
        pvString: enhancedEvaluation.pvString,
        nps: enhancedEvaluation.nps,
        hashfull: enhancedEvaluation.hashfull,
        // ... other enhanced fields
      };

      return result;
    } catch (error) {
      // Provider pattern: Graceful error handling
      return null;
    }
  }
}
```

### Tablebase Provider Pattern

**File**: `/shared/lib/chess/evaluation/providerAdapters.ts:57-91`
```typescript
export class TablebaseProviderAdapter implements ITablebaseProvider {
  private readonly serviceAdapter: TablebaseServiceAdapter;

  constructor() {
    // Provider pattern: Service composition through factory
    const tablebaseService = createTablebaseService('mock', {
      maxPieces: 7,
      enableCaching: true,
      cacheTtl: 3600,
      timeout: 2000
    });
    
    this.serviceAdapter = new TablebaseServiceAdapter(tablebaseService);
  }

  async getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<TablebaseResult | null> {
    try {
      // Provider pattern: Delegate to service adapter
      return await this.serviceAdapter.getEvaluation(fen, playerToMove);
    } catch (error) {
      // Provider pattern: Error boundary with logging
      console.warn('TablebaseProviderAdapter: Failed to get tablebase evaluation', error);
      return null;
    }
  }
}
```

## 🔧 Caching Patterns

### Multi-Level Caching Strategy

**File**: `/shared/lib/chess/evaluation/unifiedService.ts:30-45`
```typescript
constructor(
  private engineProvider: IEngineProvider,
  private tablebaseProvider: ITablebaseProvider,
  private cache?: ICacheProvider
) {
  // Caching pattern: Optional cache injection
}

// Caching pattern: Key generation strategy
private getCacheKey(fen: string, perspective: 'w' | 'b'): string {
  return `${fen}:${perspective}`;
}

// Caching pattern: Cache-first strategy
async getFormattedEvaluation(fen: string, perspective: 'w' | 'b'): Promise<FormattedEvaluation> {
  const cacheKey = this.getCacheKey(fen, perspective);
  
  // Check cache first
  const cached = this.cache?.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Compute result
  const result = await this.computeEvaluation(fen, perspective);
  
  // Cache result
  this.cache?.set(cacheKey, result);
  
  return result;
}
```

### Chess-Aware Caching

**File**: `/shared/lib/chess/evaluation/ChessAwareCache.ts:25-45`
```typescript
class ChessAwareCache implements ICacheProvider {
  private cache = new Map<string, CacheEntry>();
  
  set(key: string, value: FormattedEvaluation): void {
    // Chess-aware pattern: Position normalization
    const normalizedKey = this.normalizePosition(key);
    
    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      hits: 0
    };
    
    // Chess-aware pattern: Transposition handling
    this.cache.set(normalizedKey, entry);
    
    // LRU eviction
    this.enforceCapacity();
  }
  
  private normalizePosition(key: string): string {
    // Extract FEN from cache key
    const [fen, perspective] = key.split(':');
    
    // Chess-aware pattern: Transposition normalization
    // (e.g., handle castling rights, en passant consistency)
    const normalizedFen = this.normalizeFen(fen);
    
    return `${normalizedFen}:${perspective}`;
  }
}
```

## 🔄 Debouncing Pattern

### Input Debouncing

**File**: `/shared/hooks/useEvaluation.ts:105-120`
```typescript
// Debouncing pattern: Prevent excessive evaluations
useEffect(() => {
  if (!fen || !isEnabled) {
    return;
  }

  // Debouncing pattern: Cancel previous timeout
  if (debounceTimeoutRef.current) {
    clearTimeout(debounceTimeoutRef.current);
  }

  // Debouncing pattern: Set new timeout
  debounceTimeoutRef.current = setTimeout(() => {
    evaluatePosition(fen);
  }, DEBOUNCE_DELAY); // 300ms

  // Cleanup function
  return () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };
}, [fen, isEnabled, evaluatePosition]);
```

### AbortController Pattern

**File**: `/shared/hooks/useEvaluation.ts:125-140`
```typescript
const evaluatePosition = useCallback(async (fen: string) => {
  // AbortController pattern: Cancel previous requests
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  // AbortController pattern: Create new controller
  abortControllerRef.current = new AbortController();
  const signal = abortControllerRef.current.signal;
  
  try {
    // Pass abort signal through evaluation chain
    const result = await service.getFormattedEvaluation(fen, playerToMove, { signal });
    
    // AbortController pattern: Check if aborted
    if (signal.aborted) {
      return;
    }
    
    updateState(result);
  } catch (error) {
    // AbortController pattern: Ignore abort errors
    if (error.name === 'AbortError') {
      return;
    }
    
    handleError(error);
  }
}, [service]);
```

## 🎨 Error Handling Patterns

### Graceful Degradation Pattern

**File**: `/shared/lib/chess/evaluation/unifiedService.ts:85-105`
```typescript
// Graceful degradation pattern: Handle provider failures
const [engineResult, tablebaseResult] = await Promise.allSettled([
  this.engineProvider.getEvaluation(fen, playerToMove),
  this.tablebaseProvider.getEvaluation(fen, playerToMove)
]);

// Extract results with error handling
const engineEval = engineResult.status === 'fulfilled' ? engineResult.value : null;
const tablebaseEval = tablebaseResult.status === 'fulfilled' ? tablebaseResult.value : null;

// Graceful degradation: Prioritize available results
if (tablebaseEval) {
  // Perfect tablebase information available
  return this.formatTablebaseEvaluation(tablebaseEval);
} else if (engineEval) {
  // Engine evaluation as fallback
  return this.formatEngineEvaluation(engineEval);
} else {
  // Graceful degradation: Provide default when both fail
  return this.getDefaultEvaluation();
}
```

### Error Boundary Pattern

**File**: `/shared/hooks/useEvaluation.ts:195-210`
```typescript
const handleEvaluationError = useCallback((error: Error) => {
  // Error boundary pattern: Classification
  if (error.name === 'AbortError') {
    // Ignore intentional cancellations
    return;
  }
  
  // Error boundary pattern: Logging with context
  console.error('Evaluation error:', {
    error: error.message,
    fen,
    timestamp: new Date().toISOString()
  });
  
  // Error boundary pattern: User-friendly error state
  setError(error.message);
  setIsEvaluating(false);
}, [fen]);
```

## 🚀 Performance Patterns

### Parallel Execution Pattern

**File**: `/shared/lib/chess/evaluation/unifiedService.ts:60-75`
```typescript
// Performance pattern: Parallel provider execution
const evaluationPromises = [
  this.engineProvider.getEvaluation(fen, playerToMove),
  this.tablebaseProvider.getEvaluation(fen, playerToMove)
];

// Performance pattern: Non-blocking parallel execution
const results = await Promise.allSettled(evaluationPromises);

// Performance pattern: Fast-fail on errors, continue with available results
const [engineResult, tablebaseResult] = results;
```

### Lazy Initialization Pattern

**File**: `/shared/lib/chess/engine/singleton.ts:15-30`
```typescript
class EngineSingleton {
  private static instance: Engine | null = null;
  
  // Performance pattern: Lazy initialization
  static async getInstance(): Promise<Engine> {
    if (!this.instance) {
      // Performance pattern: Expensive initialization only when needed
      this.instance = await this.createEngine();
    }
    
    return this.instance;
  }
  
  // Performance pattern: Cleanup for memory management
  static async dispose(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
    }
  }
}
```

## 🧪 Testing Patterns

### Pipeline Testing Strategy

```typescript
describe('Evaluation Pipeline', () => {
  let mockEngineProvider: jest.Mocked<IEngineProvider>;
  let mockTablebaseProvider: jest.Mocked<ITablebaseProvider>;
  let mockCache: jest.Mocked<ICacheProvider>;
  let service: UnifiedEvaluationService;
  
  beforeEach(() => {
    // Testing pattern: Mock all dependencies
    mockEngineProvider = {
      getEvaluation: jest.fn()
    } as jest.Mocked<IEngineProvider>;
    
    mockTablebaseProvider = {
      getEvaluation: jest.fn()
    } as jest.Mocked<ITablebaseProvider>;
    
    mockCache = {
      get: jest.fn(),
      set: jest.fn()
    } as jest.Mocked<ICacheProvider>;
    
    service = new UnifiedEvaluationService(
      mockEngineProvider,
      mockTablebaseProvider,
      mockCache
    );
  });
  
  it('should prioritize tablebase over engine evaluation', async () => {
    // Testing pattern: Setup multiple provider responses
    const tablebaseResult = { wdl: 2, category: 'win' };
    const engineResult = { score: 150, evaluation: '1.50' };
    
    mockTablebaseProvider.getEvaluation.mockResolvedValue(tablebaseResult);
    mockEngineProvider.getEvaluation.mockResolvedValue(engineResult);
    
    const result = await service.getFormattedEvaluation(TEST_FEN, 'w');
    
    // Testing pattern: Verify priority behavior
    expect(result.metadata.isTablebase).toBe(true);
    expect(result.mainText).toContain('Win');
  });
});
```

---

**Next**: Review [REACT_PATTERNS.md](./REACT_PATTERNS.md) for React-specific implementation patterns.