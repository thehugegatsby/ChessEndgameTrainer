# Chess Endgame Trainer API Reference

This document provides a comprehensive reference for all public APIs, services, hooks, and types available in the Chess Endgame Trainer application.

## Table of Contents

1. [Core Services](#core-services)
2. [Engine APIs](#engine-apis)
3. [React Hooks](#react-hooks)
4. [Type Definitions](#type-definitions)
5. [Utility Functions](#utility-functions)
6. [Cache APIs](#cache-apis)

## Core Services

### Engine Service

Manages Stockfish engine instances with singleton pattern to ensure only one engine runs at a time.

```typescript
import { Engine } from 'shared/lib/engine';

// Get singleton instance
const engine = Engine.getInstance();

// Initialize engine
await engine.init();

// Evaluate position
const evaluation = await engine.evaluatePosition(fen: string);

// Get best move
const bestMove = await engine.getBestMove(fen: string, depth?: number);

// Clean up (IMPORTANT: Always call on cleanup)
engine.quit();
```

### Error Service

Centralized error handling and logging system.

```typescript
import { ErrorService } from 'shared/services/error/ErrorService';

// Log an error with context
ErrorService.logError('ComponentName', error, { 
  additionalInfo: 'context data' 
});

// Handle specific error types
ErrorService.handleChessEngineError(error, { fen, move });
ErrorService.handleNetworkError(error, { url, method });
```

### Platform Service

Platform detection and abstraction for cross-platform compatibility.

```typescript
import { PlatformService } from 'shared/services/platform/PlatformService';

// Check platform
const isWeb = PlatformService.isWeb();
const isMobile = PlatformService.isMobile();
const isDesktop = PlatformService.isDesktop();

// Get platform-specific config
const config = PlatformService.getConfig();
```

### Unified Evaluation Service

Orchestrates chess position evaluation from multiple sources.

```typescript
import { UnifiedEvaluationService } from 'shared/services/evaluation';

const service = new UnifiedEvaluationService();

// Evaluate position
const evaluation = await service.evaluatePosition(
  fen: string,
  options?: {
    includeTablebase?: boolean;
    depth?: number;
    perspective?: 'white' | 'black';
  }
);

// Clean up
service.cleanup();
```

## Engine APIs

### Engine Class

Low-level Stockfish engine wrapper.

```typescript
class Engine {
  // Singleton instance
  static getInstance(): Engine;
  
  // Lifecycle methods
  init(): Promise<void>;
  quit(): void;
  isReady(): boolean;
  
  // Evaluation methods
  evaluatePosition(fen: string): Promise<EngineEvaluation>;
  getBestMove(fen: string, depth?: number): Promise<BestMoveResult>;
  getTopMoves(fen: string, multiPV?: number): Promise<Move[]>;
  
  // Analysis methods
  analyzePosition(fen: string, options?: AnalysisOptions): Promise<Analysis>;
  stopAnalysis(): void;
}
```

### Scenario Engine

Higher-level chess engine interface for training scenarios.

```typescript
class ScenarioEngine {
  constructor(scenario: EndgameScenario);
  
  // Move validation
  isCorrectMove(move: Move): boolean;
  validateMove(from: string, to: string): ValidationResult;
  
  // Hints and guidance
  getHint(): string;
  getBestMoves(): Move[];
  
  // Scenario state
  getCurrentPosition(): Position;
  reset(): void;
}
```

## React Hooks

### useChessGame

Main hook for chess game state management.

```typescript
const game = useChessGame(initialFen?: string);

// Properties
game.fen;              // Current FEN position
game.turn;             // 'w' | 'b'
game.moveHistory;      // Array of moves
game.isGameOver;       // boolean
game.isInCheck;        // boolean

// Methods
game.move(move: Move): boolean;
game.undo(): void;
game.reset(): void;
game.loadFen(fen: string): void;
game.getLegalMoves(): Move[];
```

### useEvaluation

Hook for position evaluation with caching and debouncing.

```typescript
const evaluation = useEvaluation(fen: string, options?: {
  debounceMs?: number;  // Default: 300
  enabled?: boolean;
});

// Returns
{
  evaluation: FormattedEvaluation | null;
  isLoading: boolean;
  error: Error | null;
}
```

### useEngine

Hook for engine lifecycle management.

```typescript
const engine = useEngine();

// Properties
engine.isReady;        // boolean
engine.isLoading;      // boolean
engine.error;          // Error | null

// Methods
engine.evaluatePosition(fen: string): Promise<Evaluation>;
engine.getBestMove(fen: string): Promise<Move>;
```

### useAnalysisData

Hook for comprehensive position analysis.

```typescript
const analysis = useAnalysisData(fen: string);

// Returns
{
  bestMoves: Move[];
  evaluation: Evaluation;
  threats: Threat[];
  plans: string[];
  isAnalyzing: boolean;
}
```

### useLocalStorage

Type-safe local storage hook with React state synchronization.

```typescript
const [value, setValue] = useLocalStorage<T>(
  key: string,
  defaultValue: T
);

// Example
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

## Type Definitions

### Chess Types

```typescript
interface Move {
  from: string;      // e.g., 'e2'
  to: string;        // e.g., 'e4'
  piece: Piece;
  captured?: Piece;
  promotion?: Piece;
  san: string;       // Standard Algebraic Notation
}

interface Position {
  fen: string;
  board: Board;
  turn: 'w' | 'b';
  castling: CastlingRights;
  enPassant: string | null;
  halfMoves: number;
  fullMoves: number;
}

type Piece = 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 
             'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
```

### Evaluation Types

```typescript
interface FormattedEvaluation {
  score: number;           // Centipawns
  scoreText: string;       // e.g., '+2.5'
  mateIn?: number;         // Moves to mate
  bestMove?: string;       // Best move in UCI format
  depth: number;
  nodes: number;
  time: number;
}

interface NormalizedEvaluation {
  centipawns: number | null;
  mateIn: number | null;
  isTablebase: boolean;
  rawScore: string;
}
```

### Endgame Types

```typescript
interface EndgamePosition {
  id: string;
  name: string;
  fen: string;
  description: string;
  category: EndgameCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  solutionMoves: string[];
}

type EndgameCategory = 
  | 'pawn'
  | 'rook'
  | 'queen'
  | 'minor_piece'
  | 'complex';
```

## Utility Functions

### FEN Validation

```typescript
import { validateAndSanitizeFen } from 'shared/utils/fenValidator';

const result = validateAndSanitizeFen(userInput);
if (result.isValid) {
  // Use result.sanitized (safe FEN string)
} else {
  // Handle errors: result.errors
}
```

### Chess Helpers

```typescript
import { 
  isCheckmate,
  isStalemate,
  isDraw,
  isInsufficientMaterial,
  getGameStatus
} from 'shared/utils/chess';

// Check game status
const status = getGameStatus(game);
if (status.isGameOver) {
  console.log(status.result); // '1-0', '0-1', '1/2-1/2'
  console.log(status.reason); // 'checkmate', 'stalemate', etc.
}
```

## Cache APIs

### Evaluation Cache

LRU cache optimized for chess positions.

```typescript
import { EvaluationCache } from 'shared/services/cache';

const cache = new EvaluationCache({
  maxSize: 200,      // Maximum entries
  ttl: 3600000,      // Time to live in ms
});

// Store evaluation
cache.set(fen, evaluation);

// Retrieve evaluation
const cached = cache.get(fen);

// Clear cache
cache.clear();
```

### Performance Notes

- Engine evaluations are debounced by 300ms by default
- LRU cache maintains 99.99% hit rate in typical usage
- Maximum cache size is 200 entries (~70KB)
- Mobile devices limited to 1 engine instance (~20MB memory)

## Error Handling

All APIs follow consistent error handling patterns:

```typescript
try {
  const result = await api.method();
} catch (error) {
  if (error instanceof ChessEngineError) {
    // Handle engine-specific errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else {
    // Handle general errors
    ErrorService.logError('Context', error);
  }
}
```

## Best Practices

1. **Always clean up engines**: Call `quit()` or `cleanup()` when done
2. **Validate FEN strings**: Use `validateAndSanitizeFen` for user input
3. **Use hooks in components**: Prefer hooks over direct service access
4. **Handle loading states**: All async operations provide loading indicators
5. **Cache evaluations**: Use the built-in caching for repeated positions

---

For implementation examples and detailed usage, refer to the component documentation and test files.