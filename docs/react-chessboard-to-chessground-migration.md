# Migration Brief: react-chessboard zu chessground

**Chess Endgame Trainer - Clean Architecture Migration**

---

## 📋 Migration Overview

### Problem Statement

`react-chessboard` v5.2.2 has React 18 peer dependency incompatibilities with our Next.js 15 + React 19 stack, requiring workarounds (`next-transpile-modules`) that introduce technical debt.

### Solution

Migrate to `chessground` - the battle-tested chess UI library used by Lichess - with a custom React wrapper following Clean Architecture principles.

### Benefits

- **Performance**: 10KB gzipped vs. larger React wrappers
- **Stability**: Framework-agnostic, immune to React version changes
- **Clean Architecture**: Controlled abstraction layer
- **TypeScript**: Native TS support with excellent type definitions
- **Future-proof**: No dependency on React-specific wrapper maintenance

---

## 🏗️ Current State Analysis

### Existing Components Using react-chessboard

#### `src/shared/components/chess/Chessboard.tsx`

- Main chessboard wrapper component
- Handles promotion dialog integration
- Props: `fen`, `onPieceDrop`, `onSquareClick`, `boardWidth`, etc.

#### `src/shared/components/training/TrainingBoard/TrainingBoard.tsx`

- Training-specific board implementation
- Integrates with move validation and game state
- Handler debugging wrappers for E2E testing

#### Typical Usage Pattern

```tsx
<Chessboard
  fen={currentFen}
  onPieceDrop={(from, to, piece, promotion?) => {
    return handleMove(from, to, promotion);
  }}
  boardWidth={600}
  arePiecesDraggable={true}
/>
```

### Current Dependencies

```json
{
  "react-chessboard": "^5.2.2",
  "next-transpile-modules": "^10.0.1" // Workaround dependency
}
```

---

## 🎯 Target Architecture

### New Component Structure

```
src/shared/components/chess/
├── ChessboardAdapter.tsx          # New: chessground wrapper
├── ChessboardAdapter.module.css   # Styling
├── Chessboard.tsx                 # Updated: use ChessboardAdapter
├── PromotionDialog.tsx            # Unchanged
└── index.ts                       # Updated exports
```

### ChessboardAdapter API Design

```typescript
interface ChessboardAdapterProps {
  // Core display
  fen: string;
  orientation?: 'white' | 'black';

  // Interaction
  movable?: {
    free: boolean;
    color?: 'white' | 'black' | 'both';
  };

  // Event handlers
  onMove?: (from: Square, to: Square, metadata: MoveMetadata) => void;
  onSquareClick?: (square: Square) => void;

  // Visual
  boardWidth?: number;
  highlightSquares?: Array<{
    square: Square;
    style: 'check' | 'lastMove' | 'selected' | 'possible';
  }>;

  // Advanced
  drawable?: {
    enabled: boolean;
    visible: boolean;
  };

  // Pass-through for chessground config
  config?: Partial<Config>;
}

type Square = 'a1' | 'a2' | ... | 'h8';
type MoveMetadata = {
  captured?: boolean;
  promotion?: boolean;
};
```

### Implementation Strategy

#### 1. Lifecycle Management

```typescript
export const ChessboardAdapter: React.FC<ChessboardAdapterProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);

  // Initialize chessground on mount
  useEffect(() => {
    if (containerRef.current) {
      const cg = Chessground(containerRef.current, {
        fen: props.fen,
        orientation: props.orientation || 'white',
        movable: props.movable || { free: false },
        events: {
          move: (orig, dest, metadata) => {
            props.onMove?.(orig, dest, metadata);
          },
          select: (square) => {
            props.onSquareClick?.(square);
          }
        }
      });

      apiRef.current = cg;

      return () => {
        cg.destroy();
        apiRef.current = null;
      };
    }
  }, []);

  // Sync props to chessground instance
  useEffect(() => {
    if (apiRef.current && apiRef.current.state.fen !== props.fen) {
      apiRef.current.set({ fen: props.fen });
    }
  }, [props.fen]);

  // Additional useEffects for orientation, movable, highlights, etc.

  return (
    <div
      ref={containerRef}
      style={{
        width: props.boardWidth || 400,
        height: props.boardWidth || 400
      }}
    />
  );
};
```

#### 2. CSS Integration

```typescript
// Import required chessground CSS
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css'; // Theme
import 'chessground/assets/chessground.cburnett.css'; // Pieces
```

#### 3. TypeScript Integration

```typescript
// Re-export chessground types for application use
export type { Key as Square } from 'chessground/types';
export type { MoveMetadata } from 'chessground/move';
export type { Config as ChessgroundConfig } from 'chessground/config';
```

---

## 📦 Migration Dependencies

### Add Dependencies

```bash
pnpm add chessground
```

### Remove Dependencies (after migration)

```bash
pnpm remove react-chessboard next-transpile-modules
```

### Update next.config.js

Remove transpilation configuration after migration completes.

---

## 🔄 Migration Phases

### Phase 1: Foundation

1. Install chessground dependency
2. Create `ChessboardAdapter` component with basic functionality
3. Create Storybook stories for development/testing
4. Unit tests for adapter component

### Phase 2: Feature Parity

1. Implement all props from existing `Chessboard` interface
2. Handle promotion dialog integration
3. Add square highlighting support
4. Ensure visual consistency with current design

### Phase 3: Component Migration

1. Update `src/shared/components/chess/Chessboard.tsx` to use adapter
2. Update `TrainingBoard` integration
3. Verify E2E tests still pass
4. Update any other components using chess board

### Phase 4: Cleanup

1. Remove `react-chessboard` dependency
2. Remove `next-transpile-modules` configuration
3. Update documentation
4. Performance benchmarking

---

## ✅ Acceptance Criteria

### Functional Requirements

- [ ] All existing chess board functionality preserved
- [ ] Drag & drop piece movement works identically
- [ ] Promotion dialog appears and functions correctly
- [ ] Board orientation can be flipped
- [ ] Square highlighting works (last move, check, possible moves)
- [ ] Click-to-move functionality (onSquareClick) works
- [ ] FEN position updates reflect immediately on board

### Technical Requirements

- [ ] TypeScript compilation without errors
- [ ] All existing unit tests pass
- [ ] All E2E tests pass without modification
- [ ] Bundle size ≤ current implementation
- [ ] Render performance ≥ current implementation
- [ ] No console errors or warnings

### Quality Requirements

- [ ] Code review completed
- [ ] Documentation updated
- [ ] Storybook stories created
- [ ] No accessibility regressions

---

## 🚨 Migration Risks & Mitigation

### Risk: Feature Gaps

**Mitigation**: Create comprehensive test matrix comparing react-chessboard vs ChessboardAdapter features before starting migration.

### Risk: Visual Inconsistencies

**Mitigation**: Pixel-perfect comparison screenshots in Storybook. Custom CSS overrides if needed.

### Risk: Performance Regression

**Mitigation**: Benchmark current performance. Set performance budgets. Monitor bundle size.

### Risk: E2E Test Failures

**Mitigation**: Maintain identical DOM structure for test selectors. Update selectors only if necessary.

---

## 🔗 References

### External Documentation

- [Chessground Official Repository](https://github.com/lichess-org/chessground)
- [Chessground API Documentation](https://github.com/lichess-org/chessground/blob/master/src/api.ts)
- [Lichess Integration Example](https://github.com/lichess-org/lila/tree/master/ui/round/src/view)

### Internal Documentation

- `docs/CORE.md` - Project architecture
- `src/shared/components/chess/README.md` - Chess component documentation
- `src/tests/e2e/README.md` - E2E testing guidelines

### Related Issues

- Epic: [Chessground Migration Epic](#) (to be created)
- Stories: See epic for full list of implementation tasks

---

## 💻 Implementation Notes for LLMs

### Key Implementation Details

1. **Client-side only**: Use `"use client"` directive - chessground manipulates DOM
2. **Ref management**: Use `useRef` for both DOM element and chessground API instance
3. **Cleanup**: Always call `cg.destroy()` in useEffect cleanup
4. **State sync**: Use separate useEffects for each prop that needs syncing
5. **CSS imports**: Import at component level to ensure proper scoping

### Testing Strategy

1. **Unit tests**: Focus on prop-to-API mapping and lifecycle
2. **Integration tests**: Test with promotion dialog and parent components
3. **Visual tests**: Storybook visual regression testing
4. **E2E tests**: Minimal changes - maintain existing test structure

### Performance Considerations

1. **Bundle splitting**: Use dynamic imports if needed
2. **CSS optimization**: Only import required chessground CSS themes
3. **Memory management**: Ensure proper cleanup to prevent leaks
4. **Render optimization**: Minimize unnecessary chessground API calls

---

_This document serves as the single source of truth for the react-chessboard to chessground migration. All implementation issues should reference this document._
