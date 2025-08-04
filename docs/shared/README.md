# Shared Directory Documentation

**Target**: LLM comprehension for shared codebase structure
**Environment**: WSL + VS Code + Windows
**Updated**: 2025-08-04

## 📁 Directory Structure Overview

```
shared/
├── benchmarks/         # Performance benchmarking
├── components/         # UI Layer - React components
├── constants/          # Application constants
├── contexts/           # React Context Providers
├── data/               # Static data files
├── hooks/              # Business Logic Layer - Custom hooks
├── infrastructure/     # Infrastructure adapters (chess-adapter)
├── lib/                # Core Library Layer - Domain logic
├── pages/              # Page-level components
├── repositories/       # Data Access Layer - Repository pattern
├── services/           # Service Layer - External integrations
├── store/              # State Layer - Zustand store (v5)
├── testing/            # Test utilities and fixtures
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
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
- **Purpose**: Domain-specific libraries, chess logic, training
- **Dependencies**: types/, utils/
- **Pattern**: Core business logic, no engine (tablebase-only)

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
├── analysis/           # Analysis UI components
├── chess/              # Chess-specific UI components
├── layout/             # Layout components
├── navigation/         # Navigation components
├── tablebase/          # Tablebase-specific components
├── training/           # Training-specific components
│   ├── TrainingBoard/
│   ├── TablebaseAnalysisPanel/
│   ├── MoveHistory.tsx
│   ├── NavigationControls.tsx
│   └── [other training components]
└── ui/                 # Generic UI components
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── [other UI components]
```

### hooks/

```
hooks/
├── useDebounce.ts      # Input debouncing
├── useLocalStorage.ts  # Browser storage
├── usePageReady.ts     # Page readiness state
├── usePositionAnalysis.ts  # Tablebase position analysis
├── useToast.ts         # Toast notifications
├── useEndgameSession.ts  # Endgame session state
└── [other hooks]
```

### lib/

```
lib/
├── cache/              # Caching implementations
│   └── LRUCache.ts
├── chess/              # Chess domain logic
│   └── [chess utilities]
├── firebase/           # Firebase integration
├── training/           # Training utilities
└── [other libraries]
```

### services/

```
services/
├── chess/              # Chess-related services (legacy)
├── container/          # Dependency injection
├── database/           # Database services
├── engine/             # Legacy engine directory (empty)
├── logging/            # Logging infrastructure
├── mistakeAnalysis/    # Mistake analysis services
├── platform/           # Platform abstractions
├── test/               # Testing services
├── MoveStrategyService.ts    # Move selection strategies
├── TablebaseService.ts       # Main tablebase service
├── TablebaseService.e2e.mocks.ts  # E2E test mocks
├── errorService.ts           # Centralized error handling
└── index.ts
```

### store/

```
store/
├── store.ts            # Main Zustand v5 store
├── storeConfig.ts      # Store configuration
├── trainingActions.ts  # Async training actions
├── types.ts            # TypeScript interfaces
└── [store slices]
```

## 🎨 Import Patterns

### Absolute Imports

```typescript
// Preferred pattern: Absolute imports with @shared alias
import { useEvaluation } from "@shared/hooks/useEvaluation";
import { TrainingStore } from "@shared/store/types";
import { EvaluationData } from "@shared/types/evaluation";
```

### Barrel Exports

```typescript
// Pattern: Barrel exports for clean imports
// shared/hooks/index.ts
export { useEvaluation } from "./useEvaluation";
export { useEngine } from "./useEngine";
export { useEndgameSession } from "./useEndgameSession";

// Usage
import { useEvaluation, useEngine } from "@shared/hooks";
```

### Layer Dependency Rules

```typescript
// ✅ Allowed: Lower layers can import from higher layers
// hooks/ can import from lib/, services/, store/
import { analysisService } from "@shared/lib/chess/AnalysisService";

// ✅ Allowed: Same layer imports
import { formatEvaluation } from "@shared/utils/chess/evaluation";

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
// Pattern: Store consumption in hooks with Zustand v5
const currentFen = useTrainingStore((state) => state.currentFen);
const makeMove = useTrainingStore((state) => state.makeMove);
// Use useShallow for object selectors to prevent re-renders
const { evaluations, analysisStatus } = useTrainingStore(
  useShallow((state) => ({
    evaluations: state.evaluations,
    analysisStatus: state.analysisStatus,
  })),
);

// Pattern: Store updates from hooks
const handleMoveResult = useCallback(
  (result: MoveResult) => {
    makeMove(result.move);
    updateEvaluation(result.evaluation);
  },
  [makeMove, updateEvaluation],
);
```

### Service ↔ Hook Integration

```typescript
// Pattern: Service usage in hooks (tablebase-only)
const tablebaseService = getTablebaseService();

// Direct tablebase API calls
const result = await tablebaseService.getEvaluation(fen);
const moves = await tablebaseService.getTopMoves(fen);

// Pattern: Service method calls in hooks with error handling
const evaluatePosition = useCallback(
  async (fen: string) => {
    try {
      const result = await service.getFormattedEvaluation(fen, playerToMove);
      return result;
    } catch (error) {
      ErrorService.handleChessEngineError(error as Error, {
        action: "evaluatePosition",
      });
      return null;
    }
  },
  [service, playerToMove],
);
```

### Component ↔ Hook Integration

```typescript
// Pattern: Hook consumption in components
function TrainingBoard() {
  const {
    evaluations,
    analysisStatus,
    error
  } = usePositionAnalysis({
    fen: currentFen,
    enabled: true,
    debounceMs: 300
  });

  return (
    <div>
      {error && <Toast type="error" message={error} />}
      {analysisStatus === 'loading' ? (
        <LoadingState />
      ) : (
        <TablebaseAnalysisPanel evaluations={evaluations} />
      )}
    </div>
  );
}
```

## 🚀 Architecture Notes

### Key Architecture Changes

1. **Tablebase-Only**: No local chess engine, all evaluations via Lichess Tablebase API
2. **Zustand v5**: Updated state management with useShallow for performance
3. **Clean Migration**: All "engine" references removed, replaced with "tablebase"
4. **Simplified State**: `analysisStatus` replaces multiple status fields

### Shared Business Logic

```typescript
// Pattern: Platform-independent business logic
// This code works unchanged on web and mobile
export function useEndgameSession() {
  const store = useTrainingStore();

  const makeMove = useCallback(
    (move: Move) => {
      // Business logic is platform-agnostic
      const validatedMove = validateMove(move, store.getState().position);
      store.makeMove(validatedMove);
    },
    [store],
  );

  return { makeMove };
}
```

## 🔍 Documentation Navigation

### By Functionality

- **Tablebase Integration**: `services/TablebaseService.ts`
- **State Management**: `store/` (Zustand v5)
- **UI Components**: `components/`
- **Business Logic**: `hooks/`

### By Layer

- **Service Layer**: `services/` (TablebaseService, MoveStrategyService)
- **Infrastructure**: `infrastructure/` (chess-adapter)
- **Application Layer**: `hooks/`
- **Presentation Layer**: `components/`

### Key Services

- **TablebaseService**: Main service for Lichess Tablebase API integration
- **MoveStrategyService**: Different strategies for move selection (DTM, DTZ, WDL)
- **ErrorService**: Centralized error handling with German user messages

---

**Note**: Each subdirectory contains detailed documentation about specific implementations and patterns.
