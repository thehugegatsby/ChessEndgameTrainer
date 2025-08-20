# 🤖 Multi-LLM Context: Chess Endgame Trainer

**FOR: Gemini 2.5 Pro, GPT-5, O3, O4-Mini and other AI assistants**  
**PROJECT**: Chess Endgame Trainer | React 19 + TypeScript + Zustand + Next.js 15  
**ENVIRONMENT**: WSL2 Linux | pnpm package manager  
**STATUS**: Production-ready, Vitest v3 migration complete

---

## 🎯 INSTANT ORIENTATION

You are working on a **Chess Endgame Trainer** - a modern web application for learning chess endgames with AI assistance.

**CRITICAL**: This runs in **WSL2** environment with specific command constraints.

### Quick Commands

```bash
pnpm run dev              # Start development (port 3002)
pnpm test:chess           # Test chess-core feature
pnpm run lint && pnpm tsc # Validate code
pnpm run build            # Production build
```

### Architecture at a Glance

- **State**: Zustand with 7 domain slices (Game, Training, Tablebase, UI, etc.)
- **Testing**: Vitest v3 (245 tests passing, Jest removed)
- **Features**: 4 bounded domains (chess-core, tablebase, training, move-quality)
- **Services**: TablebaseService (Lichess API), ChessService (legacy)

---

## 🚨 WSL2 CRITICAL CONSTRAINTS

**These commands WILL CRASH in WSL2:**

```bash
❌ pnpm test -- --run file.tsx    # Never use '--' with pnpm
❌ npm run build | grep error      # Pipes cause crashes
❌ pnpm test 2>&1 | tail          # Stderr redirects fail
```

**Use these instead:**

```bash
✅ pnpm test file.tsx             # Direct file paths
✅ pnpm run build && echo "done"  # Use && not pipes
✅ pnpm test:chess                # Feature-specific tests
```

---

## 📁 PROJECT STRUCTURE

```
EndgameTrainer/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout + providers
│   ├── page.tsx            # Homepage with categories
│   ├── training/page.tsx   # Main training interface
│   └── providers.tsx       # Client providers
│
├── src/
│   ├── features/           # 4 bounded domains (chess-core, tablebase, training, move-quality)
│   ├── shared/             # Cross-domain utilities
│   │   ├── components/     # UI components (chess/, training/, ui/)
│   │   ├── services/       # Business logic services
│   │   ├── store/          # Zustand slices + orchestrators
│   │   └── hooks/          # React hooks
│   └── tests/              # Integration + E2E tests
│
├── config/                 # Centralized configurations
│   ├── testing/            # Vitest configurations per feature
│   └── ports.ts            # Port configuration
│
├── docs/                   # Comprehensive documentation
│   ├── CORE.md            # ALWAYS LOAD FIRST - Architecture
│   ├── guides/            # Testing, WSL2, Firebase
│   └── tooling/           # MCP tools, decision matrix
│
└── CLAUDE.md              # Quick reference for AI assistants
```

---

## 🏗️ STATE MANAGEMENT (Zustand)

**Domain-Driven Store Architecture** - 7 specialized slices:

```typescript
// Main store composition
rootStore.ts combines:
├── GameSlice       # Chess position, move history, FEN state
├── TrainingSlice   # Training mode, sessions, progress
├── TablebaseSlice  # Lichess API cache, evaluations
├── UISlice         # Modals, toasts, loading states
├── ProgressSlice   # User advancement tracking
├── SettingsSlice   # App configuration
└── UserSlice       # User authentication state
```

### Usage Patterns

```typescript
// ✅ Correct: Use specific hooks
const { makeMove } = useGameActions(); // Actions only
const { position } = useGameState(); // State only

// ✅ Correct: Zustand with Immer
makeMove: move =>
  set(state => {
    state.game.moveHistory.push(move); // Direct mutation via Immer
  });

// ❌ Avoid: Direct store access
const store = useGameStore(); // Too broad, causes re-renders
```

### Orchestrators Pattern

Complex cross-slice operations in `/shared/store/orchestrators/`:

**handlePlayerMove** (964 lines, 4 modules) - Sophisticated chess training:

1. **Validation** → MoveValidator checks legality
2. **Quality Analysis** → MoveQualityEvaluator compares vs tablebase
3. **Promotion Logic** → PawnPromotionHandler detects auto-wins
4. **Dialog Management** → EventBasedMoveDialogManager shows feedback
5. **Opponent Simulation** → OpponentTurnHandler schedules turns

_Multi-model analysis confirmed: NOT over-engineered, domain-appropriate complexity_

---

## 🧪 TESTING STRATEGY

### Vitest v3 Migration (COMPLETE)

- **Status**: All 245 tests passing ✅
- **Framework**: Vitest only (Jest completely removed)
- **Structure**: Feature-based with project separation

### Test Commands

```bash
# Feature-specific testing (RECOMMENDED)
pnpm test:chess           # chess-core domain only
pnpm test:tablebase       # tablebase domain only
pnpm test:training        # training domain only
pnpm test:shared          # shared utilities

# General commands
pnpm test                 # Smart runner (warns if >100 tests)
pnpm test file.test.tsx   # Single file (WSL2 optimized)
pnpm test:watch           # Watch mode for development
```

### WSL2 Optimizations (Auto-Applied)

- **Pool**: `forks` instead of `threads` (prevents pipe issues)
- **Workers**: Limited to 2 (prevents memory issues)
- **Parallelism**: `fileParallelism: false` (stability)
- **Detection**: Automatic via `WSL_DISTRO_NAME` environment variable

### Test Structure

```
Testing Architecture:
├── src/features/*/         # Unit tests (co-located with source)
├── src/tests/integration/  # Cross-feature tests (Vitest + MSW)
├── src/tests/e2e/          # Browser tests (Playwright)
└── config/testing/         # Vitest configurations per feature
```

---

## 🔧 SERVICES & BUSINESS LOGIC

### Core Services

```typescript
// TablebaseService - Primary evaluation source
class TablebaseService {
  // Lichess API integration with LRU cache
  // Request deduplication, FEN normalization
  // 75% fewer API calls vs naive implementation
}

// ChessService - Legacy wrapper (prefer GameSlice)
class ChessService {
  // chess.js wrapper for move validation
  // German notation support (D=Dame, T=Turm, etc.)
  // Being phased out in favor of GameSlice
}

// AnalysisService - Position evaluation orchestration
class AnalysisService {
  // Coordinates between tablebase and engine analysis
  // Caches position evaluations with TTL
}
```

### German UI Language

```typescript
// ✅ Correct: German error messages
showToast('Ungültiger Zug', 'error');
showErrorMessage('Fehler beim Laden der Position');

// ✅ Correct: German piece notation
const promotion = { D: 'q', T: 'r', L: 'b', S: 'n' }; // Dame, Turm, Läufer, Springer
```

---

## 📋 CODE STANDARDS

### TypeScript Rules

- **Strict**: Zero `any` types allowed
- **Branded Types**: `ValidatedMove`, `ValidatedFEN` for type safety
- **Path Mapping**: Use `@shared/`, `@features/`, `@tests/` aliases

### Component Patterns

```typescript
// ✅ Container/Presentation separation
function BoardContainer() {
  const { position, makeMove } = useGameActions();
  return <BoardPresentation fen={position.fen()} onMove={makeMove} />;
}

function BoardPresentation({ fen, onMove }: Props) {
  return <Chessboard position={fen} onMove={onMove} />; // Pure UI
}
```

### File Naming

- **Components**: `PascalCase.tsx`
- **Hooks**: `useCamelCase.ts`
- **Services**: `PascalCaseService.ts`
- **Tests**: `Component.test.tsx`
- **Integration**: `Feature.spec.ts`

### Import Order

```typescript
// 1. External libraries
import React from 'react';
import { create } from 'zustand';

// 2. Internal with aliases
import { useGameActions } from '@shared/store/hooks';
import { ChessService } from '@shared/services/ChessService';

// 3. Types (separate import)
import type { Move, Position } from '@shared/types/chess';
```

---

## 🛠️ DEVELOPMENT WORKFLOW

### Quality Gates (Run Before Commit)

```bash
pnpm run lint       # ESLint (only 1 warning - non-critical)
pnpm tsc           # TypeScript check (0 errors ✅)
pnpm test          # All tests (245 passing ✅)
pnpm run build     # Production build (succeeds in 7s ✅)
```

### Documentation Loading Strategy

1. **ALWAYS FIRST**: Load `docs/CORE.md` (architecture overview)
2. **For Testing**: Load `docs/guides/testing.md`
3. **For Tools**: Load `docs/tooling/mcp-matrix.md`
4. **For WSL Issues**: Load `docs/guides/wsl2.md`

### Git Workflow

- **Main Branch**: `main` (clean status)
- **Recent Commits**: Vitest v3 migration, test fixes, TypeScript cleanup
- **No Engine**: Stockfish completely removed (tablebase-only architecture)

---

## 🎯 FEATURE DOMAINS

### 1. chess-core/

**Purpose**: Core chess logic, move validation, German notation  
**Key Files**:

- `ChessEngine.ts` - Game state management
- `MoveValidator.ts` - Move legality checking
- `GermanNotation.ts` - German piece notation (D/T/L/S)

### 2. tablebase/

**Purpose**: Lichess API integration, perfect endgame analysis  
**Key Files**:

- `TablebaseService.ts` - API client with caching
- `TablebaseCache.ts` - LRU cache implementation
- `TablebaseTypes.ts` - Evaluation interfaces

### 3. training/

**Purpose**: Training sessions, progress tracking, spaced repetition  
**Key Files**:

- `TrainingManager.ts` - Session orchestration
- `ProgressTracker.ts` - User advancement
- `SpacedRepetition.ts` - FSRS algorithm implementation

### 4. move-quality/

**Purpose**: Move evaluation, hint system, quality assessment  
**Key Files**:

- `MoveEvaluator.ts` - Position evaluation
- `HintGenerator.ts` - Training hints
- `QualityMeter.ts` - Move quality assessment

---

## 🔍 DEBUGGING & TROUBLESHOOTING

### Common Issues

**1. WSL Command Failures**

```bash
# ❌ This fails in WSL2
pnpm test -- src/features/chess-core/

# ✅ Use this instead
pnpm test src/features/chess-core/
```

**2. Test Import Errors**

```typescript
// ❌ Path not resolved
import { GameStore } from '../../../store/gameSlice';

// ✅ Use alias
import { GameStore } from '@shared/store/gameSlice';
```

**3. TypeScript Compilation Errors**

```bash
# Check for any type errors
pnpm tsc --noEmit

# Should return 0 errors (current status: ✅ clean)
```

### Performance Optimization

- **Bundle Size**: <300KB per route
- **API Calls**: 75% reduction via caching
- **Re-renders**: Minimized via specific Zustand selectors
- **Test Speed**: WSL2-optimized with worker limits

---

## 📊 PROJECT STATUS

### ✅ COMPLETED (Phase 8 - August 2025)

- **Store Refactoring**: Monolithic → 7 domain slices
- **Vitest Migration**: Complete (245 tests passing)
- **TypeScript Health**: 0 compilation errors
- **Performance**: LRU cache, API optimization
- **Security**: FEN sanitization, input validation

### 🎯 CURRENT STATE: Ready for Development

- **Architecture**: Stable domain-driven design
- **Testing**: Comprehensive coverage with Vitest v3
- **Documentation**: Complete for AI assistants
- **Quality**: All gates passing

### 🚀 NEXT PHASE: Feature Development

Ready for new features on solid architectural foundation.

---

## 🤖 AI ASSISTANT INTEGRATION NOTES

### For Gemini Pro / GPT-5 / O3 / O4-Mini

**Before Starting Any Task:**

1. Load `docs/CORE.md` for architecture context
2. Check WSL2 constraints (no pipes, no `--` with pnpm)
3. Use feature-specific test commands
4. Follow Zustand slice patterns
5. Maintain German UI text for errors

**Code Patterns to Follow:**

```typescript
// ✅ Zustand actions with Immer
const useGameActions = () =>
  useGameStore(state => ({
    makeMove: state.makeMove,
    resetGame: state.resetGame,
  }));

// ✅ Error handling with German text
try {
  await makeMove(move);
} catch (error) {
  showToast('Ungültiger Zug', 'error');
}

// ✅ Testing with proper imports
import { describe, it, expect } from 'vitest';
import { useGameStore } from '@shared/store/hooks';
```

**Anti-Patterns to Avoid:**

- Using `any` types (use proper TypeScript)
- Accessing store directly (use hooks)
- Hardcoding FENs (use TestFixtures)
- Using Jest syntax (Vitest only)
- Using pipes in WSL commands

### Context Refresh Commands

When you need updated context, use these commands:

```bash
# Get current git status
git status

# Check test health
pnpm test:chess

# Validate TypeScript
pnpm tsc

# Check documentation
cat docs/CORE.md
```

---

**END OF CONTEXT**

**FOR QUICK REFERENCE**: Load `CLAUDE.md` and `docs/CORE.md` first, then proceed with your specific task. Follow WSL2 rules and use Zustand patterns. 🎯
