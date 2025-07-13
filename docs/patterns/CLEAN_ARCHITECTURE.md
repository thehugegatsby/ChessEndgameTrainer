# Clean Architecture Patterns

**Target**: LLM comprehension for clean architecture implementation
**Environment**: WSL + VS Code + Windows
**Updated**: 2025-01-13

## 🏗️ Layer Separation

### Service → Adapter → Provider Pattern

```typescript
// Service Layer (Business Logic)
interface ITablebaseService {
  lookupPosition(fen: string): Promise<TablebaseLookupResult | null>;
  isTablebasePosition(fen: string): boolean;
  getMaxPieces(): number;
  getConfig(): TablebaseServiceConfig;
}

// Adapter Layer (Protocol Translation)
class TablebaseServiceAdapter {
  constructor(private service: ITablebaseService) {}
  
  async getEvaluation(
    fen: string, 
    playerToMove: 'w' | 'b'
  ): Promise<TablebaseResult | null> {
    // Translate service result to provider format
  }
}

// Provider Layer (Infrastructure Abstraction)
class TablebaseProviderAdapter implements ITablebaseProvider {
  private readonly serviceAdapter: TablebaseServiceAdapter;
  
  constructor() {
    const service = createTablebaseService('mock', config);
    this.serviceAdapter = new TablebaseServiceAdapter(service);
  }
}
```

## 📁 Directory Structure by Layer

```
/shared/
├── services/              # Service Layer
│   ├── tablebase/
│   │   ├── ITablebaseService.ts      # Service interface
│   │   ├── MockTablebaseService.ts   # Service implementation
│   │   └── index.ts                  # Service factory
│   └── database/
├── lib/chess/evaluation/  # Adapter + Provider Layers
│   ├── providers.ts       # Provider interfaces
│   ├── providerAdapters.ts # Provider implementations
│   └── unifiedService.ts  # Service orchestration
└── types/                 # Shared contracts
    └── evaluation.ts      # Data transfer objects
```

## 🎯 Dependency Injection Pattern

### Factory Pattern Implementation

**File**: `/shared/services/tablebase/index.ts`
```typescript
export function createTablebaseService(
  type: 'mock' | 'syzygy' | 'gaviota',
  config: TablebaseServiceConfig
): ITablebaseService {
  switch (type) {
    case 'mock':
      return new MockTablebaseService(config);
    case 'syzygy':
      return new SyzygyTablebaseService(config);
    default:
      throw new Error(`Unknown tablebase service type: ${type}`);
  }
}
```

### Service Registration

**File**: `/shared/lib/chess/evaluation/providerAdapters.ts:60-71`
```typescript
constructor() {
  // Dependency injection through factory
  const tablebaseService = createTablebaseService('mock', {
    maxPieces: 7,
    enableCaching: true,
    cacheTtl: 3600,
    timeout: 2000
  });
  
  this.serviceAdapter = new TablebaseServiceAdapter(tablebaseService);
}
```

## 🔧 Interface Segregation

### Service Interfaces (Business Contracts)

```typescript
// Core service interface
interface ITablebaseService {
  lookupPosition(fen: string): Promise<TablebaseLookupResult | null>;
  isTablebasePosition(fen: string): boolean;
}

// Extended interface for advanced features
interface ITablebaseServiceAdvanced extends ITablebaseService {
  clearCache(): Promise<void>;
  getStats(): TablebaseStats;
  isHealthy(): Promise<boolean>;
}
```

### Provider Interfaces (Infrastructure Contracts)

```typescript
// Provider interface (simplified for consumers)
interface ITablebaseProvider {
  getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<TablebaseResult | null>;
}

// Engine provider interface
interface IEngineProvider {
  getEvaluation(fen: string, playerToMove: 'w' | 'b'): Promise<EngineEvaluation | null>;
}
```

## 📊 Data Transfer Objects

### Service Layer DTOs

```typescript
// Service layer result (rich data)
interface TablebaseLookupResult {
  position: string;
  wdl: number;
  dtz: number | null;
  dtm: number | null;
  category: TablebaseCategory;
  precise: boolean;
  metadata: {
    source: string;
    cached: boolean;
    timestamp: number;
  };
}
```

### Provider Layer DTOs

```typescript
// Provider layer result (simplified)
interface TablebaseResult {
  wdl: number;
  dtz: number | null;
  dtm: number | null;
  category: TablebaseCategory;
  precise: boolean;
}
```

### Unified Layer DTOs

```typescript
// Unified evaluation data (consumer-friendly)
interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
  tablebase?: TablebaseData;
  pv?: string[];
  depth?: number;
  // ... other unified fields
}
```

## 🎨 Implementation Patterns

### 1. Service Implementation Pattern

**File**: `/shared/services/tablebase/MockTablebaseService.ts:25-45`
```typescript
class MockTablebaseService implements ITablebaseService {
  private cache = new Map<string, TablebaseLookupResult>();
  
  constructor(private config: TablebaseServiceConfig) {}
  
  async lookupPosition(fen: string): Promise<TablebaseLookupResult | null> {
    // Check cache first
    if (this.config.enableCaching && this.cache.has(fen)) {
      return this.cache.get(fen)!;
    }
    
    // Business logic
    const result = this.performLookup(fen);
    
    // Cache result
    if (this.config.enableCaching && result) {
      this.cache.set(fen, result);
    }
    
    return result;
  }
  
  private performLookup(fen: string): TablebaseLookupResult | null {
    // Core business logic
  }
}
```

### 2. Adapter Implementation Pattern

**File**: `/shared/services/tablebase/TablebaseServiceAdapter.ts:15-35`
```typescript
class TablebaseServiceAdapter {
  constructor(private tablebaseService: ITablebaseService) {}
  
  async getEvaluation(
    fen: string, 
    playerToMove: 'w' | 'b'
  ): Promise<TablebaseResult | null> {
    try {
      // Delegate to service layer
      const serviceResult = await this.tablebaseService.lookupPosition(fen);
      
      if (!serviceResult) {
        return null;
      }
      
      // Transform service DTO to provider DTO
      return {
        wdl: serviceResult.wdl,
        dtz: serviceResult.dtz,
        dtm: serviceResult.dtm,
        category: serviceResult.category,
        precise: serviceResult.precise
        // Note: metadata stripped for provider layer
      };
    } catch (error) {
      // Error handling at adapter boundary
      console.warn('TablebaseServiceAdapter error:', error);
      return null;
    }
  }
}
```

### 3. Provider Implementation Pattern

**File**: `/shared/lib/chess/evaluation/providerAdapters.ts:57-91`
```typescript
class TablebaseProviderAdapter implements ITablebaseProvider {
  private readonly serviceAdapter: TablebaseServiceAdapter;
  
  constructor() {
    // Factory injection
    const tablebaseService = createTablebaseService('mock', {
      maxPieces: 7,
      enableCaching: true,
      cacheTtl: 3600,
      timeout: 2000
    });
    
    this.serviceAdapter = new TablebaseServiceAdapter(tablebaseService);
  }
  
  async getEvaluation(
    fen: string, 
    playerToMove: 'w' | 'b'
  ): Promise<TablebaseResult | null> {
    try {
      // Delegate to adapter layer
      return await this.serviceAdapter.getEvaluation(fen, playerToMove);
    } catch (error) {
      // Provider-level error handling
      console.warn('TablebaseProviderAdapter: Failed to get evaluation', error);
      return null;
    }
  }
  
  // Advanced features access
  getTablebaseService(): ITablebaseService {
    return this.serviceAdapter.getTablebaseService();
  }
}
```

## 🔄 Orchestration Pattern

### Unified Service Orchestration

**File**: `/shared/lib/chess/evaluation/unifiedService.ts:20-50`
```typescript
class UnifiedEvaluationService {
  constructor(
    private engineProvider: IEngineProvider,
    private tablebaseProvider: ITablebaseProvider,
    private cache: ICacheProvider
  ) {}
  
  async getFormattedEvaluation(
    fen: string, 
    perspective: 'w' | 'b'
  ): Promise<FormattedEvaluation> {
    // Cache check
    const cacheKey = `${fen}:${perspective}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Parallel provider calls
    const [engineResult, tablebaseResult] = await Promise.allSettled([
      this.engineProvider.getEvaluation(fen, perspective),
      this.tablebaseProvider.getEvaluation(fen, perspective)
    ]);
    
    // Result aggregation
    const evaluation = this.aggregateResults(engineResult, tablebaseResult);
    
    // Cache result
    this.cache.set(cacheKey, evaluation);
    
    return evaluation;
  }
}
```

## 🧪 Testing Patterns

### Service Layer Testing

```typescript
describe('MockTablebaseService', () => {
  let service: ITablebaseService;
  
  beforeEach(() => {
    service = new MockTablebaseService({
      maxPieces: 7,
      enableCaching: true
    });
  });
  
  it('should return win for KQvK endgame', async () => {
    const result = await service.lookupPosition(KQ_VS_K_FEN);
    
    expect(result).not.toBeNull();
    expect(result!.wdl).toBe(2);
    expect(result!.category).toBe('win');
  });
});
```

### Adapter Layer Testing

```typescript
describe('TablebaseServiceAdapter', () => {
  let adapter: TablebaseServiceAdapter;
  let mockService: jest.Mocked<ITablebaseService>;
  
  beforeEach(() => {
    mockService = {
      lookupPosition: jest.fn(),
      isTablebasePosition: jest.fn(),
    } as jest.Mocked<ITablebaseService>;
    
    adapter = new TablebaseServiceAdapter(mockService);
  });
  
  it('should transform service result to provider format', async () => {
    const serviceResult = { /* service DTO */ };
    mockService.lookupPosition.mockResolvedValue(serviceResult);
    
    const result = await adapter.getEvaluation(TEST_FEN, 'w');
    
    expect(result).toEqual({ /* provider DTO */ });
  });
});
```

## 🎯 Benefits of This Pattern

### 1. Testability
- Each layer can be tested in isolation
- Easy mocking at interface boundaries
- Clear test boundaries

### 2. Maintainability
- Clear separation of concerns
- Interface-driven development
- Easy to replace implementations

### 3. Extensibility
- New tablebase providers without changing consumers
- New service implementations without adapter changes
- Clean plugin architecture

### 4. Error Handling
- Error boundaries at each layer
- Graceful degradation
- Context preservation

---

**Next**: Review [EVALUATION_PIPELINE.md](./EVALUATION_PIPELINE.md) for pipeline-specific patterns.