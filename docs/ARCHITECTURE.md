# System Architecture

**Target**: LLM comprehension for AI-assisted development
**Environment**: WSL + VS Code + Windows
**Updated**: 2025-01-13

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph "UI LAYER"
        A[React Components]
        B[Training Pages]
        C[Chess Board UI]
    end
    
    subgraph "STATE LAYER"
        D[Zustand Store]
        E[Training Actions]
        F[Store State]
    end
    
    subgraph "HOOKS LAYER"
        G[useEvaluation]
        H[useTrainingGame]
        I[useEngine]
    end
    
    subgraph "SERVICE LAYER - Clean Architecture"
        subgraph "Services"
            J[ITablebaseService]
            K[MockTablebaseService]
            L[EngineService]
        end
        subgraph "Adapters"
            M[TablebaseServiceAdapter]
            N[EngineProviderAdapter]
            O[TablebaseProviderAdapter]
        end
        subgraph "Providers"
            P[IEngineProvider]
            Q[ITablebaseProvider]
            R[UnifiedEvaluationService]
        end
    end
    
    subgraph "INFRASTRUCTURE LAYER"
        S[Chess.js Library]
        T[Stockfish WASM]
        U[Tablebase Data]
        V[UCI Protocol]
    end
    
    A --> D
    B --> G
    C --> H
    G --> R
    H --> E
    I --> L
    R --> P
    R --> Q
    P --> N
    Q --> O
    O --> M
    M --> J
    J --> K
    N --> L
    L --> T
    T --> V
    K --> U
    
    style A fill:#e1f5fe
    style D fill:#f3e5f5
    style G fill:#e8f5e8
    style R fill:#fff3e0
    style T fill:#ffebee
```

## 🎯 Clean Architecture Implementation

### Service Layer
```typescript
// Location: /shared/services/
ITablebaseService → MockTablebaseService
IPositionService → PositionService
EngineService (singleton pattern)
```

### Adapter Layer
```typescript
// Location: /shared/lib/chess/evaluation/
TablebaseServiceAdapter
EngineProviderAdapter
TablebaseProviderAdapter
```

### Provider Layer
```typescript
// Location: /shared/lib/chess/evaluation/providers.ts
IEngineProvider
ITablebaseProvider
ICacheProvider
```

## 📊 Core Data Flows

### 1. Evaluation Pipeline
```
Position (FEN) 
  → UnifiedEvaluationService
    → EngineProvider + TablebaseProvider
      → Adapters (EngineProviderAdapter, TablebaseProviderAdapter)
        → Services (Engine, TablebaseService)
          → Infrastructure (Stockfish, Mock/Real Tablebase)
            → Unified Result
              → UI Components
```

### 2. State Management Flow
```
User Interaction 
  → Component Event Handler
    → Store Action (trainingActions.ts)
      → Store State Update (store.ts)
        → Component Re-render
```

### 3. Engine Communication
```
Position Request
  → Engine Singleton
    → Worker Manager
      → Stockfish WASM Worker
        → UCI Protocol
          → UCI Parser
            → Structured Evaluation
              → Provider Adapter
                → Unified Service
```

## 🔧 Key Architectural Decisions

### 1. Singleton Pattern for Engine
**File**: `/shared/lib/chess/engine/singleton.ts`
**Reason**: Mobile memory constraints (~20MB per worker)
**Implementation**: Single Stockfish instance across application

### 2. Unified Evaluation Service
**File**: `/shared/lib/chess/evaluation/unifiedService.ts`
**Purpose**: Single entry point for all evaluation requests
**Benefits**: Consistent interface, caching, error handling

### 3. Clean Architecture Layers
**Service → Adapter → Provider**
- Services: Business logic and data access
- Adapters: Interface conversion and protocol handling
- Providers: Infrastructure abstractions

### 4. Zustand Store as Single Source of Truth
**File**: `/shared/store/store.ts`
**Pattern**: Centralized state management
**Benefits**: Predictable state updates, easy debugging

## 📁 Directory Structure Mapping

```
/shared/
├── components/           # UI Layer - React components
├── hooks/               # Hooks Layer - Business logic hooks
├── lib/                 # Service Layer - Core libraries
│   ├── chess/
│   │   ├── engine/     # Engine infrastructure
│   │   └── evaluation/ # Evaluation pipeline
├── services/           # Service Layer - Business services
├── store/              # State Layer - Zustand store
└── types/              # Type definitions across layers
```

## 🎨 Pattern Implementation

### Clean Architecture Pattern
```typescript
// Service Interface
interface ITablebaseService {
  lookupPosition(fen: string): Promise<TablebaseLookupResult | null>;
}

// Service Implementation
class MockTablebaseService implements ITablebaseService {
  async lookupPosition(fen: string): Promise<TablebaseLookupResult | null> {
    // Implementation details
  }
}

// Adapter Layer
class TablebaseServiceAdapter {
  constructor(private service: ITablebaseService) {}
  
  async getEvaluation(fen: string, player: 'w' | 'b'): Promise<TablebaseResult | null> {
    // Adapter logic
  }
}

// Provider Layer
class TablebaseProviderAdapter implements ITablebaseProvider {
  // Provider implementation
}
```

### Evaluation Pipeline Pattern
```typescript
// Unified entry point
class UnifiedEvaluationService {
  constructor(
    private engineProvider: IEngineProvider,
    private tablebaseProvider: ITablebaseProvider,
    private cache: ICacheProvider
  ) {}
  
  async getFormattedEvaluation(fen: string, perspective: 'w' | 'b') {
    // Unified evaluation logic
  }
}
```

## 🚀 Performance Characteristics

### Engine Management
- **Single Instance**: One Stockfish worker maximum
- **Memory Constraint**: ~20MB per worker on mobile
- **Cleanup**: Always call `engine.quit()` on unmount

### Evaluation Caching
- **LRU Cache**: 200 items maximum
- **Debouncing**: 300ms for user inputs
- **Cache Keys**: Position-based with perspective

### Tablebase Performance
- **Mock Service**: Instant responses for development
- **Caching**: TTL-based caching (3600s default)
- **Timeout**: 2000ms per lookup

## 🔍 Integration Points

### Next.js Integration
- **Pages**: `/pages/train/[id].tsx` - Main training interface
- **API Routes**: None (client-side only)
- **Static Assets**: Stockfish WASM files in `/public`

### Worker Integration
- **Stockfish Worker**: Browser Web Worker for chess engine
- **Message Protocol**: UCI (Universal Chess Interface)
- **Parser**: Custom UCI message parser

### Testing Integration
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright with mock services
- **Mock Strategy**: MockEngineService for deterministic tests

## 🛡️ Error Handling Strategy

### Error Boundaries
- **Engine Errors**: EngineErrorBoundary component
- **General Errors**: ErrorBoundary component
- **Service Errors**: Graceful fallbacks with null returns

### Error Service
- **Centralized Logging**: ErrorService.logError()
- **Context Preservation**: Error context tracking
- **User Experience**: Graceful degradation

---

**Next**: Review [DATA_FLOWS.md](./DATA_FLOWS.md) for detailed data flow analysis.