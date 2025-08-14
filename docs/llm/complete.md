# 🎯 Chess Endgame Trainer - Complete LLM Context

**Status: Ready for Multi-LLM Development** | React 19 + TypeScript + Zustand + Next.js 15 | WSL2 Linux

## 🚀 Quick Start Commands

```bash
pnpm run dev              # Dev server (port 3002)
pnpm run build            # Production build
pnpm test file.test.tsx   # Single test (WSL2 optimized)
pnpm test:chess           # Test chess-core feature
pnpm run lint && pnpm tsc # Full validation
```

## 🏗️ Architecture Overview

**Domain-Driven Design** with **Zustand Store** as Single Source of Truth.

### Core Architecture
- **Frontend**: React 19 + Next.js 15 App Router
- **State**: Zustand with domain-specific slices (7 slices)
- **Testing**: Vitest v3 (245 tests passing, migration complete)
- **Environment**: WSL2 Linux (critical constraints)
- **Language**: TypeScript 5.9.2 (zero errors)

### Domain Slices (Zustand Store)
```typescript
// Main store architecture
rootStore.ts → combines all slices:
├── GameSlice      → Chess logic, FEN, history
├── TrainingSlice  → Training sessions, progress  
├── TablebaseSlice → Lichess API cache
├── UISlice        → Modals, toasts, loading
├── ProgressSlice  → User advancement tracking
├── SettingsSlice  → App configuration
└── UserSlice      → User state management
```

## 📋 Critical WSL2 Rules

**THIS PROJECT RUNS IN WSL2** - These commands will crash:

❌ **NEVER use:**
```bash
pnpm test -- --run file.tsx    # Crashes in WSL
cmd | grep pattern              # Pipes cause failures
npm run cmd 2>&1 | tail         # Stderr redirect crashes
```

✅ **ALWAYS use:**
```bash
pnpm test file.tsx              # Direct paths only
pnpm run build && pnpm tsc      # Use && not pipes
pnpm test:chess                 # Feature-specific commands
```

## 🎯 Feature Structure

**4 Bounded Domains** with co-located tests:

```
src/features/
├── chess-core/     → Game logic, validation, German notation
├── tablebase/      → Lichess API integration
├── training/       → Session management, progress
└── move-quality/   → Move evaluation algorithms
```

Each feature contains:
- Components specific to domain
- Local hooks and utilities  
- Feature tests (Vitest)
- Service interfaces

## 🔧 Services & Business Logic

### Core Services
- **TablebaseService**: Lichess API with LRU cache, deduplication
- **ChessService**: chess.js wrapper (legacy - prefer GameSlice)
- **AnalysisService**: Position evaluation orchestration

### Orchestrators Pattern
Complex cross-slice operations in `/shared/store/orchestrators/`:

**Example: handlePlayerMove** (533 lines)
1. Validates move (GameSlice)
2. Updates progress (TrainingSlice)
3. Shows feedback (UISlice)  
4. Fetches evaluation (TablebaseSlice)

## 🧪 Testing Strategy

### Framework: Vitest v3 (Complete Migration)
- **Migration Status**: Complete (Jest removed, 245 tests passing)
- **Structure**: Feature-based testing with projects
- **Critical**: WSL2 optimizations auto-applied

### Test Commands
```bash
pnpm test                 # Smart runner (warns >100 tests)
pnpm test:chess           # chess-core feature only
pnpm test:tablebase       # tablebase feature only
pnpm test:training        # training feature only
pnpm test:shared          # shared utilities
```

### WSL2 Test Optimizations (Auto-Applied)
- Pool type: `forks` (not threads) 
- Worker limits: Max 2 workers
- Sequential: `fileParallelism: false`
- Auto-detection via `WSL_DISTRO_NAME`

## 📝 Code Standards

### Language Rules
- **Code/Comments**: English
- **UI Text**: German (`"Ungültiger Zug"`, `"Fehler beim Laden"`)
- **Types**: No `any` - always typed
- **Imports**: Use `@shared/` aliases

### Component Patterns
```typescript
// ✅ Container/Presentation Pattern
function BoardContainer() {
  const { position, makeMove } = useGameActions();
  return <BoardPresentation fen={position.fen()} onMove={makeMove} />;
}

// ✅ Zustand with Immer
makeMove: (move) => set((state) => {
  state.game.moveHistory.push(move);
})

// ✅ Optimized Hooks  
const { makeMove } = useGameActions();     // Actions only
const { fen } = useGameState();            // State only
```

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Services: `PascalCaseService.ts`
- Constants: `UPPER_CASE`

## 🛠️ MCP Tools Available

### Code Search & Navigation
- **claude-context**: Semantic code search (`"authentication middleware"`)
- **tracer**: Follow execution paths (`"trace move validation"`)

### Development Workflows  
- **zen:debug**: Step-by-step debugging
- **zen:codereview**: Quality & security assessment
- **zen:refactor**: Simplify & improve code
- **zen:testgen**: Generate comprehensive tests
- **zen:analyze**: Understand code structure

### Advanced Analysis
- **zen:thinkdeep**: Deep architectural problems
- **zen:consensus**: Architecture decisions
- **zen:precommit**: Validate changes
- **zen:secaudit**: Security & OWASP audit

### Browser Testing
- **playwright**: E2E testing, UI automation

## 📁 Critical File Locations

```
Key Files:
├── src/shared/store/rootStore.ts              # Main Zustand store
├── src/shared/services/ChessService.ts        # Chess logic wrapper
├── src/shared/store/orchestrators/            # Cross-slice operations
├── config/testing/vitest.*.config.ts          # Test configurations
├── docs/CORE.md                               # Architecture details
├── docs/guides/testing.md                     # Test strategy
├── docs/tooling/mcp-matrix.md                 # Tool selection guide
└── CLAUDE.md                                  # Quick reference
```

## 🚀 Development Workflow

### Quality Gates (Run Before Commit)
```bash
pnpm run lint       # ESLint (1 warning only - non-critical)
pnpm tsc           # TypeScript (0 errors ✅)
pnpm test          # All tests (245 passing ✅)
pnpm run build     # Production build (7s ✅)
```

### Documentation Loading Strategy
1. **ALWAYS**: Load `docs/CORE.md` first
2. **Testing**: Load `docs/guides/testing.md`
3. **MCP Tools**: Load `docs/tooling/mcp-matrix.md`
4. **WSL Issues**: Load `docs/guides/wsl2.md`

## 🔍 MCP Tool Selection Matrix

| Task Type | Primary Tool | Example |
|-----------|-------------|---------|
| **Find Code** | `claude-context` | `"authentication middleware"` |
| **Debug Issue** | `zen:debug` | `"null pointer in validation"` |
| **Code Review** | `zen:codereview` | `"review ChessService"` |
| **Refactor** | `zen:refactor` | `"simplify complex function"` |
| **Generate Tests** | `zen:testgen` | `"test UserManager class"` |
| **Security Audit** | `zen:secaudit` | `"check XSS vulnerabilities"` |
| **Architecture** | `zen:consensus` | `"migrate to GraphQL?"` |
| **Planning** | `zen:planner` | `"implement OAuth2"` |
| **Browser Test** | `playwright` | `"test chess move UI"` |

## 📊 Project Status (August 2025)

### ✅ **Phase 8 Complete: Store Refactoring**
- **Historic Milestone**: Monolithic store.ts (1,298 lines) → 7 focused domain slices
- **TypeScript**: 0 compilation errors (100% clean)
- **Tests**: 245 Vitest tests (100% passing)
- **Architecture**: Domain-driven with clean separation

### 🎯 **Current State: Ready for Development**
- **Vitest v3**: Complete migration, all tests passing
- **Zustand Store**: Domain slices with orchestrators
- **Security**: FEN sanitization implemented
- **Performance**: LRU cache, 75% fewer API calls
- **CI/CD**: Stable pipeline with quality gates

## 🧠 AI Assistant Guidelines

### For Gemini & GPT-5
1. **Load Context**: Always read `docs/CORE.md` first
2. **WSL Awareness**: Never use pipes or `--` with pnpm
3. **Tool Selection**: Use `docs/tooling/mcp-matrix.md` for decisions
4. **Test Execution**: Use feature-specific commands (`pnpm test:chess`)
5. **Code Style**: Follow container/presentation pattern
6. **State Management**: Use Zustand slices, avoid direct store access

### Common Patterns
```typescript
// ✅ Correct: Zustand hook usage
const { makeMove } = useGameActions();
const { position } = useGameState();

// ✅ Correct: Test execution
pnpm test:chess                    // Feature tests
pnpm test path/to/specific.test.ts // Single test

// ✅ Correct: Error handling (German UI)
showToast("Ungültiger Zug", "error");
```

### Anti-Patterns ❌
- Don't use `any` types
- Don't use Jest (Vitest only)
- Don't use pipes in WSL commands
- Don't hardcode FENs (use TestFixtures)
- Don't access store directly (use hooks)

---

**Ready for Multi-LLM Development** | Architecture Docs: `docs/CORE.md` | Tool Matrix: `docs/tooling/mcp-matrix.md`