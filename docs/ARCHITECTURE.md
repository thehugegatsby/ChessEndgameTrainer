# ChessEndgameTrainer Architecture

## State Management Philosophy

We use Zustand with domain-specific slices and actions. The store is the Single Source of Truth - no component maintains chess state locally. All state mutations go through actions for consistency.

## Current Architecture: Domain-Specific Slices (v3.9)

```
TablebaseService (Lichess API)
         ↓
  Zustand RootStore (domain slices)
         ↓
  React Components
```

### Domain-Specific Slices Architecture

The store is now organized into focused, domain-specific slices:

- **GameSlice**: Chess game state, moves, position management
- **TrainingSlice**: Training sessions, progress tracking, scenarios
- **TablebaseSlice**: Tablebase evaluations, analysis status, cache management
- **ProgressSlice**: User progress, achievements, statistics, spaced repetition
- **UISlice**: Interface state, toasts, sidebar, modal management
- **SettingsSlice**: User preferences, themes, notifications
- **UserSlice**: Authentication, profile, preferences

Cross-slice operations are handled by orchestrators in `/shared/store/orchestrators/`.

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
   - `rootStore.ts` - Combined store with all domain slices (using Immer middleware)
   - `slices/` - Individual domain-specific slices with actions and state
   - `orchestrators/` - Cross-slice operations (requestTablebaseMove, makeUserMove)
   - `slices/types.ts` - TypeScript interfaces for all slice types

4. **React Hooks** (`/shared/hooks/`)
   - `useEndgameSession` - Game state management
   - `usePositionAnalysis` - Tablebase evaluation (uses AnalysisService)
   - Domain-specific hooks for UI logic

5. **Store Hooks** (`/shared/store/hooks/`) - **NEW Performance-Optimized Pattern**
   - Three-hook pattern for each slice:
     - `useXxxState()` - Returns reactive state (with useShallow optimization)
     - `useXxxActions()` - Returns stable action references (never re-renders)
     - `useXxxStore()` - Returns [state, actions] tuple for convenience
   - Prevents unnecessary re-renders in action-only components
   - Full TypeScript type safety maintained

6. **Error Handling** (`/shared/components/common/`)
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

The store is now composed of domain-specific slices:

```typescript
interface RootState {
  // Game slice - chess game state
  game: GameState;

  // Training slice - session management
  training: TrainingState;

  // Tablebase slice - API evaluations
  tablebase: TablebaseState;

  // Progress slice - user progress tracking
  progress: ProgressState;

  // UI slice - interface state
  ui: UIState;

  // Settings slice - user preferences
  settings: SettingsState;

  // User slice - authentication
  user: UserState;
}
```

Each slice contains its own state and actions, promoting separation of concerns and testability.

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

- **Unit tests**: Services, hooks, components, and individual slices
  - TablebaseService: 100% coverage with comprehensive test scenarios
  - AnalysisService: Tested through integration with TablebaseService
  - Store slices: Each slice tested in isolation with proper Immer middleware
  - FEN validation: Simplified to use chess.js wrapper (50 lines, down from 120)
  - Store actions: Full TypeScript type safety (no `any` types)
  - Branded types: Clean ValidatedMove test utilities with controlled factories
- **Integration tests**: Store orchestrators and service integrations
- **E2E tests**: Clean architecture with Playwright (core-training, error-recovery)
- **Mock patterns**: MSW for API mocking, TestFixtures for valid FENs, chess.js mocking for unit tests
- **Test infrastructure**: 721+ tests passing with comprehensive slice testing patterns

## Migration History

- v1.0: Stockfish WASM (deprecated)
- v2.0: SimpleEngine abstraction (deprecated)
- v3.0: Tablebase-only architecture
- v3.1: E2E test cleanup and modernization
- v3.2: FEN validator refactoring, TablebaseService test coverage
- v3.3: Zustand v5 migration with useShallow
- v3.4: Complete removal of all engine references
- v3.5: TablebaseService optimization (single API call, smart caching, deduplication)
- v3.6: AnalysisService extraction, React Error Boundaries, TypeScript improvements
- **v3.7: Phase 8 Store Refactoring (MAJOR MILESTONE)** ✅
  - Monolithic store.ts (1,298 lines) → domain-specific slices
  - All TypeScript errors resolved (0 compilation errors)
  - All 721+ tests passing with proper Immer middleware patterns
  - Branded types implementation with controlled test factories
  - Cross-slice orchestrators for complex operations
- **v3.8: Major Dependency Updates** ✅
  - TailwindCSS 3.4.1 → 4.1.11 (CSS-first configuration)
  - Firebase 11.x → 12.0.0 (modular SDK)
  - Next.js 15.3.3 → 15.4.5
  - All outdated dependencies updated
  - Circular dependency between Logger and WebPlatformService resolved
- **v3.9: Performance Optimization - State/Action Hook Split** ✅
  - Implemented three-hook pattern for all store slices
  - Components using only actions never re-render
  - Maintained full TypeScript type safety
  - All components migrated to new tuple pattern
  - Documentation added for new patterns

## Future Considerations (v4.0)

- Enhanced caching strategies
- Offline mode with cached positions
- Advanced training algorithms
- Performance optimizations for mobile
