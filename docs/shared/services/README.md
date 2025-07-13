# Services Layer Documentation

**Target**: LLM comprehension for service layer patterns
**Environment**: WSL + VS Code + Windows
**Updated**: 2025-01-13

## 🎯 Service Layer Architecture

The service layer implements clean architecture principles with clear separation between business logic and infrastructure concerns.

```
Service Layer Architecture:
┌─────────────────────────────────────────────────────────┐
│                   SERVICE INTERFACES                     │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │ ITablebaseService│  │ IPositionService │             │
│  └─────────────────┘  └─────────────────┘             │
├─────────────────────────────────────────────────────────┤
│                SERVICE IMPLEMENTATIONS                   │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │MockTablebaseServ│  │ PositionService │             │
│  └─────────────────┘  └─────────────────┘             │
├─────────────────────────────────────────────────────────┤
│                  SERVICE ADAPTERS                       │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │TablebaseService │  │ EngineService   │             │
│  │    Adapter      │  │  (Singleton)    │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

## 📁 Service Directory Structure

```
services/
├── tablebase/              # Tablebase evaluation services
│   ├── ITablebaseService.ts        # Service interface
│   ├── MockTablebaseService.ts     # Mock implementation
│   ├── TablebaseServiceAdapter.ts  # Adapter implementation
│   └── index.ts                    # Factory and exports
├── database/               # Database services
│   ├── IPositionService.ts         # Position data interface
│   ├── PositionService.ts          # Position data service
│   └── index.ts
├── chess/                  # Chess-specific services
│   └── EngineService.ts            # Engine service wrapper
├── platform/               # Platform abstraction
│   ├── PlatformService.ts          # Platform interface
│   └── web/
│       └── WebPlatformService.ts   # Web implementation
├── errorService.ts         # Error handling service
└── index.ts               # Service layer exports
```

## 🔧 Core Service Patterns

### 1. Interface-First Design

**Pattern**: Define interfaces before implementations
```typescript
// File: /shared/services/tablebase/ITablebaseService.ts:10-25
interface ITablebaseService {
  lookupPosition(fen: string): Promise<TablebaseLookupResult | null>;
  isTablebasePosition(fen: string): boolean;
  getMaxPieces(): number;
  getConfig(): TablebaseServiceConfig;
  isHealthy(): Promise<boolean>;
  clearCache(): Promise<void>;
}
```

### 2. Factory Pattern Implementation

**Pattern**: Service creation through factories
```typescript
// File: /shared/services/tablebase/index.ts:15-25
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

### 3. Adapter Pattern Implementation

**Pattern**: Service-to-provider adaptation
```typescript
// File: /shared/services/tablebase/TablebaseServiceAdapter.ts:15-35
class TablebaseServiceAdapter {
  constructor(private tablebaseService: ITablebaseService) {}
  
  async getEvaluation(
    fen: string, 
    playerToMove: 'w' | 'b'
  ): Promise<TablebaseResult | null> {
    try {
      const serviceResult = await this.tablebaseService.lookupPosition(fen);
      
      if (!serviceResult) return null;
      
      // Transform service DTO to provider DTO
      return {
        wdl: serviceResult.wdl,
        dtz: serviceResult.dtz,
        dtm: serviceResult.dtm,
        category: serviceResult.category,
        precise: serviceResult.precise
      };
    } catch (error) {
      console.warn('TablebaseServiceAdapter error:', error);
      return null;
    }
  }
}
```

## 🎯 Critical Service Implementations

### TablebaseService
- **Interface**: `/shared/services/tablebase/ITablebaseService.ts`
- **Implementation**: `/shared/services/tablebase/MockTablebaseService.ts`
- **Purpose**: Chess endgame tablebase lookups
- **Pattern**: Cache-first with TTL expiration

### EngineService
- **Implementation**: `/shared/services/chess/EngineService.ts`
- **Purpose**: Stockfish chess engine management
- **Pattern**: Singleton with worker lifecycle management

### PositionService
- **Interface**: `/shared/services/database/IPositionService.ts`
- **Implementation**: `/shared/services/database/PositionService.ts`
- **Purpose**: Position data persistence and retrieval
- **Pattern**: Repository pattern with Firebase backend

## 🔄 Service Interaction Patterns

### Service → Adapter → Provider Flow
```
Business Logic Request
  ↓
Service Interface (ITablebaseService)
  ↓
Service Implementation (MockTablebaseService)
  ↓
Service Adapter (TablebaseServiceAdapter)
  ↓
Provider Adapter (TablebaseProviderAdapter)
  ↓
Unified Evaluation Service
  ↓
Hook/Component
```

### Error Handling Pattern
```typescript
// Pattern: Graceful error handling at service boundaries
async getEvaluation(fen: string): Promise<TablebaseResult | null> {
  try {
    return await this.tablebaseService.lookupPosition(fen);
  } catch (error) {
    // Log error but return null for graceful degradation
    ErrorService.logError('TablebaseService', error);
    return null;
  }
}
```

## 📊 Service Configuration Patterns

### Configuration Injection
```typescript
// Pattern: Configuration through constructor injection
interface TablebaseServiceConfig {
  maxPieces: number;
  enableCaching: boolean;
  cacheTtl: number;
  timeout: number;
}

class MockTablebaseService implements ITablebaseService {
  constructor(private config: TablebaseServiceConfig) {}
}
```

### Environment-Based Configuration
```typescript
// Pattern: Environment-specific service configuration
export const serviceConfig = {
  tablebase: {
    type: process.env.NODE_ENV === 'test' ? 'mock' : 'syzygy',
    maxPieces: 7,
    enableCaching: true,
    timeout: process.env.NODE_ENV === 'development' ? 5000 : 2000
  }
};
```

## 🧪 Service Testing Patterns

### Mock Service Testing
```typescript
// File: /tests/unit/services/tablebase/MockTablebaseService.test.ts:20-40
describe('MockTablebaseService', () => {
  let service: MockTablebaseService;
  
  beforeEach(() => {
    service = new MockTablebaseService({
      maxPieces: 7,
      enableCaching: true,
      cacheTtl: 3600,
      timeout: 2000
    });
  });
  
  it('should return win for KQvK endgame', async () => {
    const result = await service.lookupPosition('8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1');
    
    expect(result).not.toBeNull();
    expect(result!.wdl).toBe(2);
    expect(result!.category).toBe('win');
  });
});
```

### Service Integration Testing
```typescript
// Pattern: Test service through adapter
describe('TablebaseServiceAdapter', () => {
  let adapter: TablebaseServiceAdapter;
  let mockService: jest.Mocked<ITablebaseService>;
  
  beforeEach(() => {
    mockService = {
      lookupPosition: jest.fn(),
      isTablebasePosition: jest.fn()
    } as jest.Mocked<ITablebaseService>;
    
    adapter = new TablebaseServiceAdapter(mockService);
  });
  
  it('should transform service result to provider format', async () => {
    const serviceResult = { wdl: 2, category: 'win', precise: true };
    mockService.lookupPosition.mockResolvedValue(serviceResult);
    
    const result = await adapter.getEvaluation(TEST_FEN, 'w');
    
    expect(result).toEqual({
      wdl: 2,
      category: 'win',
      precise: true
    });
  });
});
```

## 🎨 Service Implementation Guidelines

### 1. Interface Segregation
- Keep interfaces focused and cohesive
- Separate read and write operations when appropriate
- Avoid fat interfaces with too many responsibilities

### 2. Dependency Injection
- Use constructor injection for dependencies
- Inject interfaces, not concrete implementations
- Configure services through factory functions

### 3. Error Handling
- Return null for expected failures (position not found)
- Throw exceptions for unexpected failures (network errors)
- Log errors with sufficient context for debugging

### 4. Caching Strategy
- Implement caching at service level, not adapter level
- Use TTL-based expiration for external data
- Provide cache invalidation methods

### 5. Configuration Management
- Use configuration objects instead of multiple parameters
- Validate configuration at service creation time
- Support environment-specific configurations

---

**Next**: Review specific service implementations:
- [tablebase/](./tablebase/) - Tablebase service patterns
- [database/](./database/) - Database service patterns
- [platform/](./platform/) - Platform abstraction patterns