# Shared Directory Documentation

**Target**: LLM comprehension for shared codebase structure
**Environment**: WSL + VS Code + Windows
**Updated**: 2025-01-13

## 📁 Directory Structure Overview

```
shared/
├── components/          # UI Layer - React components (80% shared)
├── hooks/              # Business Logic Layer - Custom hooks
├── lib/                # Core Library Layer - Domain logic
├── services/           # Service Layer - External integrations
├── store/              # State Layer - Zustand store
├── types/              # Type Definitions - Shared contracts
├── utils/              # Utility Layer - Helper functions
├── testing/            # Test Utilities - Mock factories
├── constants/          # Application Constants
├── contexts/           # React Context Providers
├── repositories/       # Data Access Layer - Repository pattern
├── infrastructure/     # Infrastructure adapters
├── benchmarks/         # Performance benchmarking
├── data/               # Static data files
└── pages/              # Page-level components
```

## 🎯 Layer Architecture Mapping

### UI Layer
- **Location**: `components/`
- **Purpose**: React components, UI logic
- **Dependencies**: hooks/, store/, types/
- **Pattern**: Presentational + Container components

### Business Logic Layer  
- **Location**: `hooks/`
- **Purpose**: Reusable business logic, state management bridges
- **Dependencies**: lib/, services/, store/, types/
- **Pattern**: Custom hooks with clean separation

### Core Library Layer
- **Location**: `lib/`
- **Purpose**: Domain-specific libraries, chess engine, evaluation
- **Dependencies**: types/, utils/
- **Pattern**: Clean architecture (Service → Adapter → Provider)

### Service Layer
- **Location**: `services/`
- **Purpose**: External service integrations, platform abstractions
- **Dependencies**: types/, utils/
- **Pattern**: Interface-driven design with implementations

### State Layer
- **Location**: `store/`
- **Purpose**: Global state management with Zustand
- **Dependencies**: types/
- **Pattern**: Single source of truth with action creators

## 🔍 Key Directories Deep Dive

### components/
```
components/
├── chess/              # Chess-specific UI components
│   └── Chessboard.tsx
├── layout/             # Layout components
│   ├── AppLayout.tsx
│   └── Header.tsx
├── navigation/         # Navigation components
│   └── AdvancedEndgameMenu.tsx
├── training/           # Training-specific components
│   ├── AnalysisPanel/
│   ├── DualEvaluationPanel/
│   ├── TrainingBoard/
│   ├── EvaluationLegend.tsx
│   ├── MoveHistory.tsx
│   ├── MovePanelZustand.tsx
│   ├── NavigationControls.tsx
│   ├── PrincipalVariation.tsx
│   ├── TrainingControls.tsx
│   └── WikiPanel.tsx
└── ui/                 # Generic UI components
    ├── ErrorBoundary.tsx
    ├── EngineErrorBoundary.tsx
    ├── DarkModeToggle.tsx
    ├── ProgressCard.tsx
    ├── SettingsIcon.tsx
    ├── Toast.tsx
    └── button.tsx
```

### hooks/
```
hooks/
├── index.ts            # Hook exports
├── useAnalysisData.ts  # Analysis data management
├── useDebounce.ts      # Input debouncing
├── useEngine.ts        # Engine integration
├── useEvaluation.ts    # Position evaluation
├── useLocalStorage.ts  # Browser storage
├── usePageReady.ts     # Page readiness state
├── useToast.ts         # Toast notification management
└── useTrainingGame.ts  # Training game state
```

### lib/
```
lib/
├── cache/              # Caching implementations
│   ├── EvaluationCache.ts
│   ├── LRUCache.ts
│   └── index.ts
├── chess/              # Chess domain logic
│   ├── ChessEngine/    # Engine factory patterns
│   ├── engine/         # Stockfish WASM integration
│   ├── evaluation/     # Evaluation pipeline
│   ├── IChessEngine.ts # Engine interface
│   ├── MockScenarioEngine.ts
│   ├── ScenarioEngine.ts
│   ├── tablebase.ts    # Tablebase utilities
│   └── validation.ts   # Chess validation
├── firebase/           # Firebase integration
├── training/           # Training utilities
└── utils.ts            # Library utilities
```

### services/
```
services/
├── chess/              # Chess-related services
│   └── EngineService.ts
├── database/           # Database services
│   ├── IPositionService.ts
│   ├── PositionService.ts
│   ├── errors.ts
│   ├── index.ts
│   └── serverPositionService.ts
├── engine/             # Engine service abstractions
├── logging/            # Logging infrastructure
│   ├── Logger.ts
│   ├── index.ts
│   └── types.ts
├── mistakeAnalysis/    # Mistake analysis services
├── platform/           # Platform abstractions
│   ├── PlatformService.ts
│   ├── types.ts
│   └── web/WebPlatformService.ts
├── tablebase/          # Tablebase services
│   ├── ITablebaseService.ts
│   ├── MockTablebaseService.ts
│   ├── TablebaseServiceAdapter.ts
│   └── index.ts
├── test/               # Testing services
│   ├── BrowserTestApi.ts
│   ├── TestApiService.ts
│   ├── TestBridge.ts
│   └── index.ts
├── errorService.ts     # Centralized error handling
└── index.ts
```

### store/
```
store/
├── index.ts            # Store exports
├── store.ts            # Main store definition
├── storeConfig.ts      # Store configuration
├── trainingActions.ts  # Training action creators
└── types.ts            # Store type definitions
```

## 🎨 Import Patterns

### Absolute Imports
```typescript
// Preferred pattern: Absolute imports with @shared alias
import { useEvaluation } from '@shared/hooks/useEvaluation';
import { TrainingStore } from '@shared/store/types';
import { EvaluationData } from '@shared/types/evaluation';
```

### Barrel Exports
```typescript
// Pattern: Barrel exports for clean imports
// shared/hooks/index.ts
export { useEvaluation } from './useEvaluation';
export { useEngine } from './useEngine';
export { useTrainingGame } from './useTrainingGame';

// Usage
import { useEvaluation, useEngine } from '@shared/hooks';
```

### Layer Dependency Rules
```typescript
// ✅ Allowed: Lower layers can import from higher layers
// hooks/ can import from lib/, services/, store/
import { analysisService } from '@shared/lib/chess/AnalysisService';

// ✅ Allowed: Same layer imports
import { formatEvaluation } from '@shared/utils/chess/evaluation';

// ❌ Forbidden: Higher layers importing from lower layers
// lib/ should NOT import from hooks/
```

## 🔧 Configuration Patterns

### TypeScript Path Mapping
```json
// tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["./shared/*"],
      "@shared/components/*": ["./shared/components/*"],
      "@shared/hooks/*": ["./shared/hooks/*"],
      "@shared/lib/*": ["./shared/lib/*"],
      "@shared/services/*": ["./shared/services/*"],
      "@shared/store/*": ["./shared/store/*"],
      "@shared/types/*": ["./shared/types/*"],
      "@shared/utils/*": ["./shared/utils/*"]
    }
  }
}
```

### Jest Module Mapping
```javascript
// jest.config.js moduleNameMapper
moduleNameMapper: {
  '^@shared/(.*)$': '<rootDir>/shared/$1',
  '^@shared/components/(.*)$': '<rootDir>/shared/components/$1',
  '^@shared/hooks/(.*)$': '<rootDir>/shared/hooks/$1',
  '^@shared/lib/(.*)$': '<rootDir>/shared/lib/$1',
  '^@shared/services/(.*)$': '<rootDir>/shared/services/$1',
  '^@shared/store/(.*)$': '<rootDir>/shared/store/$1',
  '^@shared/types/(.*)$': '<rootDir>/shared/types/$1',
  '^@shared/utils/(.*)$': '<rootDir>/shared/utils/$1'
}
```

## 📊 Data Flow Between Layers

### Top-Down Flow (User Interaction)
```
User Interaction
  ↓
components/ (UI Layer)
  ↓
hooks/ (Business Logic Layer)
  ↓
store/ (State Layer) + lib/ (Core Layer)
  ↓
services/ (Service Layer)
  ↓
External Systems (Engine, Tablebase, Database)
```

### Bottom-Up Flow (Data Response)
```
External Systems
  ↓
services/ (Service Layer)
  ↓
lib/ (Core Layer) → store/ (State Layer)
  ↓
hooks/ (Business Logic Layer)
  ↓
components/ (UI Layer)
  ↓
User Interface Update
```

## 🎯 Key Integration Points

### Hook ↔ Store Integration (Zustand Single Source of Truth)
```typescript
// Pattern: Store consumption in hooks with Zustand
const currentFen = useTrainingStore(state => state.currentFen);
const makeMove = useTrainingStore(state => state.makeMove);
const { evaluations, isEvaluating } = useTrainingStore(state => ({
  evaluations: state.evaluations,
  isEvaluating: state.isEvaluating
}));

// Pattern: Store updates from hooks
const handleMoveResult = useCallback((result: MoveResult) => {
  makeMove(result.move);
  updateEvaluation(result.evaluation);
}, [makeMove, updateEvaluation]);
```

### Service ↔ Hook Integration
```typescript
// Pattern: Service instantiation in hooks with singleton pattern
const engineService = useMemo(() => EngineService.getInstance(), []);
// Use the singleton AnalysisService
const result = await analysisService.analyzePosition(fen);
  new TablebaseProviderAdapter(),
  new ChessAwareCache(new LRUCache(200))
), [engineService]);

// Pattern: Service method calls in hooks with error handling
const evaluatePosition = useCallback(async (fen: string) => {
  try {
    const result = await service.getFormattedEvaluation(fen, playerToMove);
    return result;
  } catch (error) {
    ErrorService.handleChessEngineError(error as Error, { action: 'evaluatePosition' });
    return null;
  }
}, [service, playerToMove]);
```

### Component ↔ Hook Integration
```typescript
// Pattern: Hook consumption in components with error boundaries
function TrainingBoard() {
  const { 
    evaluations, 
    lastEvaluation, 
    isEvaluating,
    error 
  } = useEvaluation({
    fen: currentFen,
    isEnabled: true,
    debounceMs: 300
  });
  
  return (
    <EngineErrorBoundary>
      <div>
        {error && <Toast type="error" message={error} />}
        {isEvaluating ? (
          <ProgressCard title="Analyzing..." />
        ) : (
          <DualEvaluationPanel evaluation={lastEvaluation} />
        )}
      </div>
    </EngineErrorBoundary>
  );
}
```

## 🚀 Mobile Readiness (80% Shared Code)

### Platform Abstraction Pattern
```typescript
// Pattern: Platform-agnostic interfaces in services/platform/
interface IPlatformService {
  getDeviceInfo(): DeviceInfo;
  showNotification(message: string): void;
  vibrate(pattern: number[]): void;
  detectCapabilities(): PlatformCapabilities;
}

// Current: Web implementation
class WebPlatformService implements IPlatformService {
  // Web-specific implementations for browser environment
}

// Platform detection service
interface IPlatformDetection {
  isWeb(): boolean;
  isMobile(): boolean;
  isAndroid(): boolean;
  isIOS(): boolean;
  isDesktop(): boolean;
  isTouchDevice(): boolean;
  isStandalone(): boolean; // PWA mode
}

// Factory pattern for platform services
export function getPlatformService(): IPlatformService;
export function getPlatformDetection(): IPlatformDetection;
```

### Shared Business Logic
```typescript
// Pattern: Platform-independent business logic
// This code works unchanged on web and mobile
export function useTrainingGame() {
  const store = useTrainingStore();
  
  const makeMove = useCallback((move: Move) => {
    // Business logic is platform-agnostic
    const validatedMove = validateMove(move, store.getState().position);
    store.makeMove(validatedMove);
  }, [store]);
  
  return { makeMove };
}
```

## 🔍 Documentation Navigation

### By Functionality
- **Chess Engine**: [lib/chess/](./lib/chess/)
- **Evaluation System**: [lib/chess/evaluation/](./lib/chess/evaluation/)
- **State Management**: [store/](./store/)
- **UI Components**: [components/](./components/)
- **Business Logic**: [hooks/](./hooks/)

### By Layer
- **Service Layer**: [services/](./services/)
- **Domain Layer**: [lib/](./lib/)
- **Application Layer**: [hooks/](./hooks/)
- **Presentation Layer**: [components/](./components/)

### By Pattern
- **Clean Architecture**: [../patterns/CLEAN_ARCHITECTURE.md](../patterns/CLEAN_ARCHITECTURE.md)
- **Evaluation Pipeline**: [../patterns/EVALUATION_PIPELINE.md](../patterns/EVALUATION_PIPELINE.md)
- **Testing Patterns**: [../testing/TESTING_GUIDELINES.md](../testing/TESTING_GUIDELINES.md)

---

**Note**: Each subdirectory contains detailed documentation about specific implementations and patterns.