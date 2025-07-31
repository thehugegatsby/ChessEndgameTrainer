# ChessEndgameTrainer Architecture

**Purpose**: LLM-optimized architecture reference for the simplified chess endgame training system
**Last Updated**: 2025-07-31
**Architecture Version**: 2.0 (Simplified)

## 🏗️ Core Architecture

```
SimpleEngine (singleton) → AnalysisService → UI Components
                              ↓
                      TablebaseService (direct calls)
```

### Key Components

1. **SimpleEngine** (`/shared/lib/chess/engine/simple/SimpleEngine.ts`)
   - Singleton Stockfish WASM wrapper
   - Handles UCI protocol communication
   - Multi-PV support (3 lines)
   - Memory-efficient (~20MB per worker)

2. **AnalysisService** (`/shared/lib/chess/AnalysisService.ts`)
   - Central evaluation orchestrator
   - Prioritizes tablebase over engine
   - Provides unified API for position analysis
   - Move quality assessment

3. **TablebaseService** (`/shared/services/TablebaseService.ts`)
   - Lichess tablebase API integration
   - 7-piece endgame support
   - DTZ/DTM calculations

4. **UI Layer** (React components)
   - Training pages (`/pages/train/[id].tsx`)
   - Chess board (`react-chessboard`)
   - Analysis panels

## 📊 Primary Data Flows

### Position Evaluation Flow

```
User Move → Zustand Store → useEvaluation Hook → AnalysisService
                                                       ↓
                                              TablebaseService.getEvaluation()
                                                       ↓
                                              [Tablebase Hit?]
                                                  Yes → Return TB result
                                                  No  → SimpleEngine.evaluatePosition()
                                                       ↓
                                              Format & Return to UI
```

### Computer Move Flow

```
Computer's Turn → trainingActions.requestEngineMove() → AnalysisService.getBestMove()
                                                              ↓
                                                      TablebaseService.getTopMoves(1)
                                                              ↓
                                                      [Tablebase Move?]
                                                          Yes → Use TB move
                                                          No  → SimpleEngine.findBestMove()
                                                              ↓
                                                      Return move to Store
```

## 🗂️ File Structure

```
/shared/
├── lib/
│   ├── chess/
│   │   ├── engine/simple/SimpleEngine.ts    # Stockfish wrapper
│   │   └── AnalysisService.ts              # Evaluation orchestrator
│   └── cache/
│       └── EvaluationCache.ts              # LRU cache for evaluations
├── services/
│   └── TablebaseService.ts                 # Tablebase API client
├── hooks/
│   ├── useEvaluation.ts                    # Position evaluation hook
│   └── useTrainingGame.ts                  # Game state management
├── store/
│   ├── trainingStore.ts                    # Zustand store
│   └── trainingActions.ts                  # Async engine operations
└── types/
    └── evaluation.ts                       # Core types

Key interfaces:
- SimplifiedMoveQualityResult            # Move quality assessment
- AnalysisResult                        # Position analysis data
- TablebaseData                         # Tablebase evaluation data
```

## 🔑 Key Design Decisions

### 1. Singleton Pattern for Engine
```typescript
// Always use the singleton instance
const engine = getSimpleEngine();
```
- Prevents multiple WASM instances
- Centralized lifecycle management
- Consistent configuration

### 2. Tablebase-First Strategy
```typescript
// In AnalysisService.getBestMove()
1. Check tablebase first (authoritative for endgames)
2. Fall back to engine if no tablebase data
```

### 3. Simplified Type System
```typescript
interface SimplifiedMoveQualityResult {
  quality: MoveQualityType;       // excellent|good|inaccuracy|mistake|blunder
  reason: string;                 // Human-readable explanation
  isTablebaseAnalysis: boolean;  // Source indicator
}
```

## ⚡ Performance Constraints

- **Engine**: Single instance, max 1 worker thread
- **Evaluation**: 300ms debounce on position changes
- **Cache**: LRU with 200 position limit
- **Tablebase**: Network calls, cached responses
- **Memory**: ~20MB for Stockfish WASM

## 🔧 Configuration

- **Multi-PV**: 3 lines (`EVALUATION.MULTI_PV_COUNT`)
- **Engine Depth**: 20 (`EVALUATION.DEFAULT_DEPTH`)
- **Cache TTL**: 5 minutes
- **Dev Port**: 3002 (`DEV_PORT`)

## 🚀 Usage Examples

### Evaluate Position
```typescript
const result = await analysisService.analyzePosition(fen);
// Returns: { evaluation, displayText, className, tablebase?, engineData? }
```

### Get Best Move
```typescript
const move = await analysisService.getBestMove(fen);
// Returns: "e2e4" (SAN format) or null
```

### Assess Move Quality
```typescript
const quality = await analysisService.assessMoveQuality(fenBefore, move, 'w');
// Returns: { quality: 'excellent', reason: 'Optimal tablebase move', ... }
```

## 🔄 State Management

**Zustand Store** (`trainingStore.ts`)
- Single source of truth for game state
- Async actions via thunks
- No direct Chess.js manipulation

**Key Store Actions**:
- `makeMove()` - User/computer moves
- `requestEngineMove()` - Computer thinking
- `requestPositionEvaluation()` - Analysis update

## 🧪 Testing Considerations

- Mock SimpleEngine for unit tests
- Use TestFixtures.ts for validated FENs
- Test tablebase fallback scenarios
- Verify singleton behavior

## 📝 Migration Notes

**From v1.0 (Complex) to v2.0 (Simplified)**:
- Removed: UnifiedEvaluationService, EngineProviderAdapter, EvaluationPipeline
- Removed: PlayerPerspectiveEvaluation, NormalizedEvaluation types
- Consolidated: All evaluation logic in AnalysisService
- Simplified: Direct service calls instead of adapter layers