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
   - Lichess tablebase API integration
   - 7-piece endgame support
   - LRU cache for API responses
   - Rate limiting protection

2. **Zustand Store** (`/shared/store/`)
   - `store.ts` - Main store with all slices
   - `trainingActions.ts` - Async actions (requestTablebaseMove)
   - `types.ts` - TypeScript interfaces

3. **React Hooks** (`/shared/hooks/`)
   - `useTrainingGame` - Game state management
   - `usePositionAnalysis` - Tablebase evaluation
   - Domain-specific hooks for UI logic

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
                  TablebaseService.getEvaluation()
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

- FEN validation before all operations
- Path validation for file access
- No direct chess.js manipulation

## Testing Strategy

- Unit tests for services and hooks
- Integration tests for store actions
- Mock TablebaseService for tests
- Use TestFixtures for valid FENs

## Migration History

- v1.0: Stockfish WASM engine
- v2.0: SimpleEngine abstraction
- v3.0: Tablebase-only (current)

## Future Considerations (v4.0)

- Potential local engine fallback
- Offline mode with cached positions
- Advanced training algorithms
