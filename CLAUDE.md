# CLAUDE.md - AI Assistant Context

## Project Overview
**ChessEndgameTrainer** - Web/Mobile chess endgame training app with AI engine integration.

## Tech Stack
- **Frontend**: Next.js 15.3, React 18.3, TypeScript 5.3
- **UI**: Tailwind CSS 3.4, Radix UI, react-chessboard 4.3
- **State**: Zustand 4.4, React Context API
- **Chess**: chess.js 1.0.0-beta.6, Stockfish WASM (NNUE)
- **Testing**: Jest 29.7, React Testing Library 14.1
- **Mobile**: React Native 0.73 (prepared, not implemented)
- **Database**: Firebase Firestore (optional, with fallback)

## Project Structure
```
/
├── pages/              # Next.js pages (train/[id].tsx main)
├── shared/             # 80% shared code (web + mobile ready)
│   ├── components/     # UI components
│   ├── hooks/         # Business logic hooks
│   ├── lib/           # Core libraries (chess engine)
│   ├── services/      # Platform services
│   ├── utils/         # Utilities
│   └── types/         # TypeScript types
├── tests/             # Test suites
└── public/            # Static assets + stockfish.wasm
```

## Essential Commands
```bash
npm run dev              # Dev server (port 3002)
npm test                 # Run tests
npm run lint            # ESLint
npm run build           # Production build
npm run check-duplicates # Find duplicate components
npm run analyze-code    # Run all code analysis
```

## Key Architecture Decisions

### 1. Singleton Pattern for Engine
- `Engine.getInstance()` - Only ONE Stockfish instance
- Mobile constraint: ~20MB memory per worker
- Always call `quit()` on cleanup

### 2. Stable References in Hooks
- `useChessGame` uses useRef + useMemo for game instance
- Prevents infinite loops in React components
- Version tracking triggers re-renders

### 3. Dual Evaluation System
- Engine evaluation (Stockfish)
- Tablebase lookup (7-piece endgames)
- Unified through evaluation pipeline

### 4. Error Boundaries
- Centralized ErrorService
- FEN validation at all boundaries
- Graceful fallbacks

## Code Conventions

### TypeScript
- Strict mode preferred
- No `any` types
- Interfaces over types for objects

### React Patterns
```typescript
// Hooks for logic separation
const useChessLogic = () => { /* logic */ };
const ChessComponent = () => {
  const logic = useChessLogic();
  return <UI {...logic} />;
};
```

### Error Handling
```typescript
try {
  await riskyOperation();
} catch (error) {
  ErrorService.logError('Context', error);
  // Graceful degradation
}
```

### Testing
- Minimum 80% coverage for new features
- Mock Worker APIs properly
- Use factory patterns for test data

## Performance Constraints
- Mobile: Max 1 engine instance
- Debounce evaluations (300ms)
- LRU cache: 200 items max
- Touch targets: minimum 44px

## Security Requirements
- Validate all FEN inputs
- Sanitize user-generated content
- No hardcoded credentials
- Path validation for workers

## Current Focus Areas
1. Brückenbau-Trainer UI integration (Phase P3)
2. Mobile platform abstraction layer
3. State management migration to Zustand
4. Memory leak fixes in engine cleanup

## Important Notes
- WASM requires specific server headers
- iOS Safari may terminate workers
- Firestore is optional (fallback to local data)
- All times in milliseconds