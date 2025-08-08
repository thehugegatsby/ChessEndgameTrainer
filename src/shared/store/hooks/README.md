# Store Hooks Usage Guide

## Hook Architecture

Each domain slice provides three hooks following a performance-optimized pattern:

1. **State Hook** - `useXxxState()` - Returns reactive state (triggers re-renders)
2. **Actions Hook** - `useXxxActions()` - Returns stable action functions (never triggers re-renders)
3. **Combined Hook** - `useXxxStore()` - Returns `[state, actions]` tuple for convenience

## Usage Examples

### Using State Only (Component re-renders on state changes)

```tsx
import { useGameState } from "@shared/store/hooks";

export const GameStatus = () => {
  const gameState = useGameState();

  return (
    <div>
      <p>Current FEN: {gameState.currentFen}</p>
      <p>Move count: {gameState.moveHistory.length}</p>
      <p>Game finished: {gameState.isGameFinished ? "Yes" : "No"}</p>
    </div>
  );
};
```

### Using Actions Only (Component never re-renders)

```tsx
import { useGameActions } from "@shared/store/hooks";

export const GameControls = () => {
  const gameActions = useGameActions();

  return (
    <div>
      <button onClick={() => gameActions.makeMove({ from: "e2", to: "e4" })}>
        Play e2-e4
      </button>
      <button onClick={gameActions.resetGame}>Reset Game</button>
    </div>
  );
};
```

### Using Both State and Actions (Tuple pattern)

```tsx
import { useGameStore } from "@shared/store/hooks";

export const ChessBoard = () => {
  const [gameState, gameActions] = useGameStore();

  return (
    <div>
      <Board position={gameState.currentFen} />
      <button
        onClick={gameActions.goToPrevious}
        disabled={gameState.currentMoveIndex <= 0}
      >
        Previous Move
      </button>
    </div>
  );
};
```

## Performance Benefits

### Before (Old Pattern)

```tsx
// This component re-renders on ANY store change, even if it only uses actions
const GameControls = () => {
  const { makeMove, resetGame } = useGameStore(); // 🔴 Unnecessary re-renders
  // ...
};
```

### After (New Pattern)

```tsx
// This component NEVER re-renders because actions are stable references
const GameControls = () => {
  const gameActions = useGameActions(); // ✅ No re-renders
  // ...
};
```

## Available Hooks

### Game Slice

- `useGameState()` - Game state, moves, position
- `useGameActions()` - Move execution, navigation
- `useGameStore()` - Combined `[state, actions]`

### Training Slice

- `useTrainingState()` - Training session, progress
- `useTrainingActions()` - Session management, async orchestrators
- `useTrainingStore()` - Combined `[state, actions]`

### Tablebase Slice

- `useTablebaseState()` - Evaluations, analysis status
- `useTablebaseActions()` - Evaluation requests
- `useTablebaseStore()` - Combined `[state, actions]`

### UI Slice

- `useUIState()` - Toasts, modals, loading states
- `useUIActions()` - Show/hide UI elements
- `useUIStore()` - Combined `[state, actions]`

## Migration Guide

### Old Pattern

```tsx
const MyComponent = () => {
  const gameStore = useGameStore();

  return (
    <div>
      <p>{gameStore.currentFen}</p>
      <button onClick={() => gameStore.makeMove(move)}>Move</button>
    </div>
  );
};
```

### New Pattern

```tsx
const MyComponent = () => {
  const [gameState, gameActions] = useGameStore();

  return (
    <div>
      <p>{gameState.currentFen}</p>
      <button onClick={() => gameActions.makeMove(move)}>Move</button>
    </div>
  );
};
```

## Best Practices

1. **Use specific hooks for better performance**:
   - Need only state? Use `useXxxState()`
   - Need only actions? Use `useXxxActions()`
   - Need both? Use `useXxxStore()`

2. **Destructure at component level**:

   ```tsx
   // Good
   const [gameState, gameActions] = useGameStore();

   // Avoid
   const store = useGameStore();
   const state = store[0];
   const actions = store[1];
   ```

3. **Type safety is maintained**:
   ```tsx
   const [gameState, gameActions] = useGameStore();
   // gameState is fully typed as GameStateType
   // gameActions is fully typed as GameActionsType
   ```
