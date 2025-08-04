# ChessEndgameTrainer Architecture

## State Management Philosophy

We use Zustand with domain-specific slices and actions. The store is the Single Source of Truth - no component maintains chess state locally. All state mutations go through actions for consistency.

## Current Architecture: Tablebase-Only (v3.0)

```
TablebaseService (Lichess API)
         ↓
  Zustand Store (state)
         ↓
  React Components
```

### Key Components

1. **TablebaseService** (`/shared/services/TablebaseService.ts`)
   - Lichess tablebase API integration with single API call architecture
   - 7-piece endgame support
   - Smart LRU cache with FEN normalization
   - Request deduplication for concurrent calls
   - Zod schema validation for API responses
   - Rate limiting protection

2. **AnalysisService** (`/shared/services/AnalysisService.ts`)
   - Centralized position analysis logic
   - Consolidates tablebase data fetching and formatting
   - Reduces duplication between hooks and store actions
   - Leverages TablebaseService caching

3. **Zustand Store** (`/shared/store/`)
   - `store.ts` - Main store with all slices (using Immer middleware)
   - `endgameActions.ts` - Async actions (requestTablebaseMove, requestPositionEvaluation)
   - `types.ts` - TypeScript interfaces with proper types

4. **React Hooks** (`/shared/hooks/`)
   - `useEndgameSession` - Game state management
   - `usePositionAnalysis` - Tablebase evaluation (uses AnalysisService)
   - Domain-specific hooks for UI logic

5. **Error Handling** (`/shared/components/common/`)
   - `ErrorBoundary.tsx` - Generic React error boundary
   - `TablebasePanelWithBoundary.tsx` - Wrapped tablebase panel with error handling

## Data Flow Examples

### Move Execution Flow

```
User clicks square → TrainingBoard component
                           ↓
                    makeMove() action
                           ↓
                    Update Zustand store
                           ↓
                    requestTablebaseMove()
                           ↓
                    TablebaseService.getTopMoves()
                           ↓
                    Update store with tablebaseMove
                           ↓
                    Component re-renders
```

### Position Evaluation Flow

```
Position changes → usePositionAnalysis hook
                          ↓
                  AnalysisService.getPositionAnalysis()
                          ↓
                  TablebaseService.getEvaluation() [cached]
                  TablebaseService.getTopMoves() [uses cache]
                          ↓
                  Format and return PositionAnalysis
                          ↓
                  Update evaluations in store
                          ↓
                  UI displays results
```

## State Structure

```typescript
interface TrainingState {
  currentPosition?: EndgamePosition;
  game?: ChessInstance;
  moveHistory: ValidatedMove[];
  tablebaseMove?: string | null; // null = draw, undefined = no lookup yet
  evaluations: PositionAnalysis[];
  analysisStatus: "idle" | "loading" | "success" | "error";
  // ... other fields
}
```

## Error Handling

- All errors go through ErrorService
- User-friendly German messages
- Graceful degradation (show error, don't crash)

## Performance Optimizations

- Debouncing: 300ms for evaluations
- LRU Cache: 200 items max
- Request deduplication
- Memoization in hooks

## Security

- FEN validation before all operations (now using chess.js wrapper)
- Path validation for file access
- No direct chess.js manipulation

## Testing Strategy

- **Unit tests**: Services, hooks, and components with TablebaseService mocks
  - TablebaseService: 100% coverage with comprehensive test scenarios
  - AnalysisService: Tested through integration with TablebaseService
  - FEN validation: Simplified to use chess.js wrapper (50 lines, down from 120)
  - Store actions: Full TypeScript type safety (no `any` types)
- **Integration tests**: Store actions and service integrations
- **E2E tests**: Clean architecture with Playwright (core-training, error-recovery)
- **Mock patterns**: MSW for API mocking, TestFixtures for valid FENs, chess.js mocking for unit tests

## Migration History

- v1.0: Stockfish WASM (deprecated)
- v2.0: SimpleEngine abstraction (deprecated)
- v3.0: Tablebase-only (current)
- v3.1: E2E test cleanup and modernization
- v3.2: FEN validator refactoring, TablebaseService test coverage
- v3.3: Zustand v5 migration with useShallow
- v3.4: Complete removal of all engine references
- v3.5: TablebaseService optimization (single API call, smart caching, deduplication)
- v3.6: AnalysisService extraction, React Error Boundaries, TypeScript improvements

## Future Considerations (v4.0)

- Enhanced caching strategies
- Offline mode with cached positions
- Advanced training algorithms
- Performance optimizations for mobile
