# OpponentTurnHandler Module

## Purpose

Manages comprehensive opponent turn scheduling and execution in chess training sessions with sophisticated race condition prevention and robust error handling.

## Architecture

### Core Components

1. **OpponentTurnManager Class**
   - Encapsulates timeout management
   - Manages cancellation state
   - Prevents race conditions

2. **Scheduling System**
   - Default 500ms delay for natural game feel
   - Configurable delays for different scenarios
   - Cancellation support for undo operations

3. **Move Selection Algorithm**
   - Fetches optimal moves from tablebase
   - Selects based on game theory principles
   - Handles winning, losing, and drawing positions

## Key Algorithms

### Optimal Move Selection

```typescript
function selectOptimalMove(moves: TablebaseMove[]): TablebaseMove {
  // 1. Group moves by outcome (win/draw/loss)
  // 2. Select best outcome group
  // 3. Within group:
  //    - Winning: Choose lowest DTM (fastest win)
  //    - Losing: Choose highest DTM (best defense)
  //    - Drawing: Any move (all equivalent)
}
```

### Race Condition Prevention

The handler implements a two-phase cancellation strategy:

1. **Cancellation Flag**: Set immediately to prevent execution
2. **Timeout Clearing**: Remove scheduled callback

This dual approach ensures no stale moves execute after cancellation.

## State Management

### Training State Updates

- `isPlayerTurn`: Toggles between player and opponent
- `isOpponentThinking`: Visual feedback during processing
- `moveHistory`: Tracks all moves for replay

### Synchronization Points

- Before move execution: Validate game state
- After move execution: Update UI state
- On cancellation: Clean up pending operations

## Error Handling

### Tablebase Failures

- Graceful degradation when API unavailable
- Returns control to player
- Logs error for debugging

### Invalid Moves

- Should never occur with tablebase moves
- Throws error for debugging
- Prevents game corruption

## Performance Considerations

### Optimization Strategies

- Single API call for all candidate moves
- Move sorting done server-side
- Caching of frequently accessed positions

### Memory Management

- Proper cleanup of timeouts
- No retained references
- Garbage collection friendly

## Cross-Platform Support

Works in both browser and Node.js environments:

- Browser: Uses `setTimeout`
- Node.js: Uses `NodeJS.Timeout`
- Test environment: Mockable timeouts

## Migration Guide

### From Legacy Functions

```typescript
// Old way (deprecated)
scheduleOpponentTurn(api, delay);
cancelScheduledOpponentTurn();

// New way (recommended)
const manager = getOpponentTurnManager();
manager.schedule(api, delay);
manager.cancel();
```

## Common Issues

### Issue: Opponent moves after undo

**Cause**: Timeout not cancelled properly
**Solution**: Always call `cancel()` before state changes

### Issue: Multiple opponent moves

**Cause**: Race condition in scheduling
**Solution**: Manager enforces single active timeout

### Issue: Slow opponent response

**Cause**: Tablebase API latency
**Solution**: Consider increasing timeout or showing loading state
