# Coding Standards

## Naming Conventions

### React/TypeScript

- **Hooks**: `use` prefix (e.g., `useTrainingGame`, `useDebounce`)
- **Services**: PascalCase with `Service` suffix (e.g., `TablebaseService`, `ErrorService`)
- **Components**: PascalCase (e.g., `TrainingBoard`, `MovePanel`)
- **Utils**: camelCase (e.g., `formatPositionTitle`, `validateFen`)
- **Constants**: UPPER_CASE (e.g., `TABLEBASE_TIMEOUT`, `CACHE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `AnalysisStatus`, `TrainingState`)

### File Organization

```
shared/
├── components/      # UI components (organized by feature)
│   ├── ui/         # Generic, reusable UI components
│   └── [feature]/  # Feature-specific components
├── hooks/          # React hooks (business logic)
├── services/       # External integrations, API calls
├── lib/            # Core libraries (framework-agnostic)
├── utils/          # Small utility functions
├── store/          # Zustand state management
└── types/          # TypeScript type definitions
```

### Import Order

1. External dependencies (`react`, `next`, etc.)
2. Internal aliases (`@shared/...`)
3. Relative imports (`./...`, `../...`)
4. Type imports (`import type {...}`)

## Code Style

### TypeScript

```typescript
// ✅ Good - explicit types
export function calculateScore(moves: Move[], position: Position): number {
  return moves.length * position.difficulty;
}

// ❌ Bad - implicit any
export function calculateScore(moves, position) {
  return moves.length * position.difficulty;
}
```

### React Components

```typescript
// ✅ Good - functional component with typed props
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {
  return (
    <button onClick={onClick} className={styles[variant]}>
      {children}
    </button>
  );
};

// ❌ Bad - untyped props, no explicit return
export const Button = (props) => <button {...props} />;
```

### State Management (Zustand)

```typescript
// ✅ Good - actions modify state immutably
makeMove: (move) => set((state) => ({
  training: {
    ...state.training,
    moveHistory: [...state.training.moveHistory, move],
  }
})),

// ❌ Bad - direct mutation
makeMove: (move) => set((state) => {
  state.training.moveHistory.push(move); // Don't mutate!
}),
```

## Documentation

### JSDoc Comments

All exported functions should have JSDoc comments:

```typescript
/**
 * Validates a FEN string and returns sanitized version
 * @param fen - The FEN string to validate
 * @returns Validation result with sanitized FEN
 */
export function validateAndSanitizeFen(fen: string): FenValidationResult {
  // implementation
}
```

### Component Documentation

```typescript
/**
 * Training board component for chess endgame practice
 *
 * @example
 * <TrainingBoard
 *   position={endgamePosition}
 *   onComplete={(success) => console.log('Training complete:', success)}
 * />
 */
export const TrainingBoard: React.FC<TrainingBoardProps> = (props) => {
  // implementation
};
```

## Error Handling

### Service Layer

```typescript
try {
  const result = await tablebaseService.getEvaluation(fen);
  return result;
} catch (error) {
  const userMessage = ErrorService.handleTablebaseError(error, {
    component: "PositionAnalysis",
    action: "evaluate",
  });
  // Show user message, log error
  throw error; // Re-throw for caller to handle
}
```

### Component Layer

```typescript
const handleMove = async (move: Move) => {
  try {
    await makeMove(move);
  } catch (error) {
    showToast("Ungültiger Zug", "error");
  }
};
```

## Testing

### Unit Tests

```typescript
describe("TablebaseService", () => {
  it("should return evaluation for valid FEN", async () => {
    const fen = "K7/P7/k7/8/8/8/8/8 w - - 0 1";
    const result = await tablebaseService.getEvaluation(fen);
    expect(result.isAvailable).toBe(true);
  });
});
```

### Component Tests

```typescript
describe('TrainingBoard', () => {
  it('should handle user moves', async () => {
    const onComplete = jest.fn();
    render(<TrainingBoard position={mockPosition} onComplete={onComplete} />);

    // Make move
    fireEvent.click(screen.getByTestId('square-e2'));
    fireEvent.click(screen.getByTestId('square-e4'));

    await waitFor(() => {
      expect(screen.getByText('e4')).toBeInTheDocument();
    });
  });
});
```

## Performance Guidelines

1. **Debounce user input**: 300ms minimum
2. **Memoize expensive calculations**: Use `useMemo`
3. **Lazy load components**: Use `dynamic` imports
4. **Cache API responses**: LRU cache with TTL
5. **Avoid unnecessary re-renders**: Use `React.memo`

## Security

1. **Always validate FEN**: Use `validateAndSanitizeFen`
2. **Sanitize user input**: No direct HTML insertion
3. **Validate file paths**: Prevent directory traversal
4. **No hardcoded secrets**: Use environment variables
5. **CORS protection**: Validate API origins
