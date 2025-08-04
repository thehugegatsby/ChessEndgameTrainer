# Store Refactoring Notes

## Phase 1 Analysis

### Current Structure

- **Total Lines**: 1,297
- **Main State Slices**: 7 (User, Game, Tablebase, Training, Progress, UI, Settings)
- **Complex Functions**:
  - `makeUserMove`: 178 lines
  - Multiple cross-slice dependencies via `get()`

### Dependencies Found

- `get().showToast()` - UI actions called from other slices
- `get().updatePositionProgress()` - Progress actions from training
- `get().addDailyStats()` - Progress tracking from training
- `get().goToMove()` - Navigation actions
- `get().training.*` - Direct state access

### Key Challenges

1. **Cross-slice communication**: Actions frequently call other slice actions
2. **Async orchestration**: makeUserMove coordinates multiple async operations
3. **State composition**: Training state combines game, tablebase, and training-specific state
4. **Backward compatibility**: Need to maintain existing API for components

### Migration Strategy

1. Extract pure logic functions first
2. Create slices with clear boundaries
3. Use orchestrator pattern for complex actions
4. Maintain backward-compatible exports
