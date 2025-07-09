# Deprecation Notice

This document lists all deprecated APIs and their migration paths.

## Deprecated Hooks

### `useChessGame` and `useChessGameOptimized` 
- **Status**: REMOVED (2025-01-08)
- **Former Location**: `/shared/hooks/useChessGame.ts`, `/shared/hooks/useChessGameOptimized.ts`
- **Replacement**: `useTrainingGame`
- **Reason**: Moving to Zustand store as single source of truth
- **Migration Guide**:
  ```typescript
  // Before
  import { useChessGame } from '@shared/hooks';
  const { game, makeMove, history } = useChessGame({ initialFen });
  
  // After
  import { useTrainingGame } from '@shared/hooks';
  const { makeMove } = useTrainingGame();
  // Access game state through Store
  ```

## Deprecated Components

### Non-Zustand versions of components
- **Status**: Already removed (2025-01-08)
- **Components removed**:
  - `TrainingBoard` (use `TrainingBoardZustand`)
  - `MovePanel` (use `MovePanelZustand`)
- **Reason**: Completed migration to Zustand store

## Migration Timeline

1. **2025-01-08**: 
   - Deprecation notices added for hooks
   - `useChessGame` and `useChessGameOptimized` hooks removed (no components were using them)

## Store Migration Benefits

- Single source of truth for all state
- Better performance with atomic updates
- Easier testing with Store actions
- Consistent state across all components
- Time-travel debugging with Zustand devtools