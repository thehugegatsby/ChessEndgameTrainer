# Type Definitions

## Centralized Types (Refactored)

**Purpose**: Eliminate type duplication and provide consistent interfaces.

### Import Strategy
```typescript
// ✅ Centralized import
import { EvaluationData, DualEvaluation, MoveEvaluation } from '@shared/types';

// ❌ Avoid scattered imports
import { EvaluationData } from './local-types';
```

## Key Interfaces

### EvaluationData
```typescript
interface EvaluationData {
  evaluation: number;      // Engine score in centipawns
  mateInMoves?: number;   // Mate distance (if applicable)
  tablebase?: {           // Tablebase information
    isTablebasePosition: boolean;
    wdlBefore?: number;   // Win/Draw/Loss before move
    wdlAfter?: number;    // Win/Draw/Loss after move
    category?: string;    // Tablebase category
    dtz?: number;        // Distance to zero
  };
}
```

### DualEvaluation (ScenarioEngine)
```typescript
interface DualEvaluation {
  engine: {
    score: number;        // Centipawn evaluation
    mate: number | null;  // Mate in X moves
    evaluation: string;   // Human-readable text
  };
  tablebase?: {
    isAvailable: boolean;
    result: {
      wdl: number;        // -2 to +2 (loss to win)
      dtz?: number;       // Distance to zero
      category: TablebaseCategory;
      precise: boolean;
    };
    evaluation: string;
  };
}
```

### MoveEvaluation
```typescript
interface MoveEvaluation {
  evaluation: number;
  mateInMoves?: number;
}
```

## File Structure
```
shared/types/
├── index.ts           # Barrel export
├── chess.ts          # Chess-specific types
├── evaluation.ts     # Evaluation interfaces (new)
└── analysisTypes.ts  # Analysis data types
```

## Migration Impact
- **4 duplicate interfaces** → 1 centralized definition
- **Absolute imports** with `@shared/types`
- **Consistent TypeScript** across all components

## Performance Type Optimizations (January 2025)

### Enhanced Types for Caching
```typescript
interface CachedEvaluation extends EvaluationData {
  cacheKey: string;
  timestamp: number;
  hitCount?: number;
}
```

### Debounced Request Types
```typescript
interface DebouncedRequest {
  fen: string;
  previousFen?: string;
  abortController: AbortController;
}
```

### Performance Metrics Types
```typescript
interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
}
```

These types support the new performance optimizations:
- LRU caching with TTL
- Request debouncing
- Parallel API calls
- Performance monitoring