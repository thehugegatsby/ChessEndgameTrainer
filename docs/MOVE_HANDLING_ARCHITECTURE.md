# Move Handling Architecture

<!-- nav: docs/README#architecture | tags: [architecture, moves] | updated: 2025-08-12 -->

**Quick Overview:** → [SYSTEM_GUIDE.md#orchestrators](./SYSTEM_GUIDE.md#orchestrators)

## Overview

The chess move handling in ChessEndgameTrainer follows a layered architecture with clear separation of concerns. After the Phase 8 refactoring, the system uses domain-specific slices, orchestrators, and services to handle moves consistently.

## Architecture Flow

```
User Interface (TrainingBoard)
         ↓
React Hook (useTrainingSession)
         ↓
Store Action (trainingActions.handlePlayerMove)
         ↓
Orchestrator (handlePlayerMove)
         ↓
Services (ChessService, TablebaseService)
         ↓
Store Updates (via setState)
         ↓
UI Re-renders
```

## Key Components

### 1. TrainingBoard Component

**File**: `/shared/components/training/TrainingBoard/TrainingBoard.tsx`

The main UI component that handles user interactions:

```typescript
const handleMove = useCallback(async (move: any) => {
  // Validates position is ready
  // Delegates to useTrainingSession
  const result = await makeMove(move);
  return result;
}, [...]);
```

**Responsibilities**:

- User input handling (drag & drop)
- Position readiness validation
- Error dialog management
- E2E test hooks

### 2. useTrainingSession Hook

**File**: `/shared/hooks/useTrainingSession.ts`

Bridge between UI and store:

```typescript
const makeMove = useCallback(async (move) => {
  // Delegates to store orchestrator
  const moveResult = await trainingActions.handlePlayerMove(move);

  // Check game completion
  if (gameState.isGameFinished) {
    trainingActions.completeTraining(success);
    onComplete?.(success);
  }

  // Notify position change
  onPositionChange?.(gameState.currentFen, gameState.currentPgn);

  return moveResult;
}, [...]);
```

**Responsibilities**:

- Store interaction abstraction
- Game completion detection
- Position change notifications
- Error handling

### 3. Store Orchestrator

**File**: `/shared/store/orchestrators/handlePlayerMove/index.ts`

The main orchestrator (533 lines) that coordinates the entire move flow:

```typescript
export const handlePlayerMove = async (
  api: StoreApi,
  move: ChessJsMove | { from: string; to: string } | string,
): Promise<boolean> => {
  // 1. Validate turn
  if (!state.training.isPlayerTurn || state.training.isOpponentThinking) {
    return false;
  }

  // 2. Validate move with ChessService
  const isValid = chessService.validateMove(move);

  // 3. Execute move
  const validatedMove = chessService.move(move);

  // 4. Evaluate move quality with tablebase
  const evalBefore = await tablebaseService.getEvaluation(fenBefore);
  const evalAfter = await tablebaseService.getEvaluation(fenAfter);

  // 5. Check for suboptimal moves
  if (!playedMoveWasBest && outcomeChanged) {
    setState((draft) => {
      draft.training.moveErrorDialog = {
        isOpen: true,
        wdlBefore,
        wdlAfter,
        bestMove,
      };
    });
    return true; // No opponent turn for errors
  }

  // 6. Check game completion
  if (chessService.isGameOver()) {
    await handleTrainingCompletion(api, true);
    return true;
  }

  // 7. Schedule opponent turn if needed
  if (currentTurn !== trainingColor) {
    scheduleOpponentTurn(api);
  }

  return true;
};
```

**Key Features**:

- Move validation
- Move quality evaluation
- Suboptimal move detection
- Error dialog triggering
- Opponent turn scheduling
- Game completion handling

### 4. Move Quality Evaluation

The orchestrator performs sophisticated move quality checks:

```typescript
// Get best moves for comparison
const topMoves = await tablebaseService.getTopMoves(fenBefore, 3);

// Check if played move was best
const playedMoveWasBest = topMoves.moves?.some(
  (m) => m.san === validatedMove.san,
);

// Check if position outcome changed
const outcomeChanged =
  (wdlBeforeFromPlayerPerspective > 0 && wdlAfterFromPlayerPerspective <= 0) || // Win -> Draw/Loss
  (wdlBeforeFromPlayerPerspective === 0 && wdlAfterFromPlayerPerspective < 0); // Draw -> Loss

// Show error dialog for suboptimal moves
if (!playedMoveWasBest && outcomeChanged) {
  // Trigger error dialog
}
```

### 5. Opponent Turn Handling

Opponent moves are scheduled asynchronously:

```typescript
function scheduleOpponentTurn(api: StoreApi): void {
  // Store timeout globally for cancellation
  window.__opponentTurnTimeout = setTimeout(async () => {
    // Check if cancelled (e.g., by undo)
    if (window.__opponentTurnCancelled) return;

    // Execute opponent turn
    await executeOpponentTurn(api);
  }, 500);
}

async function executeOpponentTurn(api: StoreApi): Promise<void> {
  // Get best move from tablebase
  const topMoves = await tablebaseService.getTopMoves(currentFen, 1);

  // Execute move
  const move = chessService.move(bestMove.san);

  // Update state
  setState((draft) => {
    draft.training.isPlayerTurn = true;
    draft.training.isOpponentThinking = false;
  });
}
```

### 6. Services

#### ChessService

**File**: `/shared/services/ChessService.ts`

Singleton service managing chess.js instance:

- Move validation
- Move execution
- FEN management
- Game state tracking
- Event emission for state updates

#### TablebaseService

**File**: `/shared/services/TablebaseService.ts`

Lichess tablebase API integration:

- Position evaluation
- Best move calculation
- Move quality assessment
- Caching and request deduplication

### 7. State Management

#### Game Slice

```typescript
interface GameState {
  currentFen: string | null;
  currentPgn: string | null;
  moveHistory: ValidatedMove[];
  currentMoveIndex: number;
  isGameFinished: boolean;
  gameResult: GameResult | null;
}
```

#### Training Slice

```typescript
interface TrainingState {
  currentPosition: EndgamePosition | null;
  isPlayerTurn: boolean;
  isOpponentThinking: boolean;
  moveErrorDialog: MoveErrorDialog | null;
  // ...
}
```

## Move Flow Sequence

1. **User drags piece** → TrainingBoard.handleMove()
2. **Position validation** → Check if position is ready
3. **Hook delegation** → useTrainingSession.makeMove()
4. **Store action** → trainingActions.handlePlayerMove()
5. **Orchestrator** → handlePlayerMove orchestrator
6. **Move validation** → ChessService.validateMove()
7. **Move execution** → ChessService.move()
8. **State sync** → ChessService emits stateUpdate event
9. **Store update** → rootStore subscription updates game state
10. **Quality check** → TablebaseService evaluations
11. **Error handling** → Show dialog for suboptimal moves
12. **Opponent turn** → Schedule async opponent move
13. **UI update** → React re-renders with new state

## Error Handling

### Move Errors

- Invalid moves → Toast notification
- Suboptimal moves → Error dialog with best move
- Network errors → Graceful degradation

### Error Dialog Flow

```typescript
// When suboptimal move detected
setState((draft) => {
  draft.training.moveErrorDialog = {
    isOpen: true,
    wdlBefore: 2, // Was winning
    wdlAfter: 0, // Now draw
    bestMove: "Qb7+",
  };
});

// User options:
// 1. Take back → undoMove() + cancelScheduledOpponentTurn()
// 2. Continue → Close dialog, accept mistake
// 3. Show best → Display optimal move in toast
```

## Undo Mechanism

```typescript
const handleMoveErrorTakeBack = useCallback(() => {
  // Cancel scheduled opponent turn
  cancelScheduledOpponentTurn();

  // Undo move
  const undoResult = undoMove();

  // Reset turn
  trainingActions.setPlayerTurn(true);
  trainingActions.clearOpponentThinking();

  // Close dialog
  trainingActions.setMoveErrorDialog(null);
}, [...]);
```

## E2E Testing Support

TrainingBoard exposes test hooks:

```typescript
if (isE2ETest) {
  window.e2e_makeMove = async (move: string) => {
    // Parse move notation
    const moveObj = parseMove(move);
    // Execute move
    return await handleMove(moveObj);
  };
}
```

## Performance Considerations

1. **Request Deduplication**: TablebaseService prevents duplicate API calls
2. **Caching**: LRU cache for tablebase evaluations
3. **Async Opponent Moves**: Non-blocking opponent turns
4. **State Batching**: Atomic state updates via Immer
5. **Event-driven Updates**: ChessService events prevent redundant updates

## Known Issues

1. **handlePlayerMove is 533 lines** - Needs refactoring into smaller functions
2. **Complex WDL Logic** - Move quality evaluation is hard to understand
3. **Global Window Variables** - Opponent turn cancellation uses window object
4. **Mixed Concerns** - Orchestrator handles too many responsibilities

## Future Improvements

1. **Extract Move Validation** - Separate validation logic
2. **Extract Move Quality** - Move quality evaluation to service
3. **Extract Opponent Logic** - Opponent turn handling to separate module
4. **Improve Type Safety** - Better move type definitions
5. **Add Unit Tests** - Currently hard to test due to size

## Summary

The move handling system is functional but complex. The orchestrator pattern successfully coordinates between services and state slices, but the main orchestrator function (533 lines) has become a maintenance burden. The system would benefit from further decomposition while maintaining the clear separation between UI, hooks, orchestrators, and services established in Phase 8.
