# 🚀 Chess Endgame Trainer - Complete Migration Context

**Version:** 1.0.0  
**Created:** 2025-01-11  
**Purpose:** Complete context for AI-assisted migration from monolithic to feature-based architecture

## 📋 Executive Summary

We are performing a complete architectural migration of the Chess Endgame Trainer application from a monolithic `shared/` structure to a clean, feature-based architecture using Test-First Migration with Vitest.

**Key Decision:** Based on AI consensus (Gemini Pro + O3-Mini), we chose Test-First Migration with Vertical Slice Architecture as the optimal approach for an AI-assisted rewrite.

## 🎯 Migration Goals

1. **Eliminate Technical Debt**
   - Fix 1082-line Logger service
   - Refactor 372-line useProgressSync hook
   - Decompose 740-line ChessService
   - Resolve 36 ESLint warnings

2. **Modernize Architecture**
   - From: Monolithic `shared/` folder
   - To: Feature-based `features/` structure
   - Pattern: Vertical Slice Architecture

3. **Improve Testing**
   - From: Jest with implementation-focused tests
   - To: Vitest with behavior-focused tests
   - Goal: 100% coverage of public APIs

4. **Enhance Developer Experience**
   - Each file < 100 lines
   - Each function < 20 lines
   - Cyclomatic complexity < 10
   - Clear separation of concerns

## 🏗️ Target Architecture

```
src/
├── app/                     # Next.js App Router (routes only!)
├── features/               # Feature-based modules
│   ├── chess-core/        # Core chess logic
│   ├── tablebase/         # Lichess integration
│   ├── training/          # Training sessions
│   ├── sync/              # Firebase sync
│   ├── ui/                # UI components
│   └── logging/           # Logging service
└── lib/                    # Shared utilities
```

### Vertical Slice Pattern

Each feature owns its complete stack:

```
features/[feature-name]/
├── components/         # UI components
├── hooks/             # React hooks
├── services/          # Business logic
├── store/             # State management
├── types/             # TypeScript types
├── utils/             # Utilities
└── __tests__/         # Vitest tests
```

## 📚 Migration Strategy: Test-First Migration

### Core Process

1. **Setup Dual Test Runners**
   - Jest continues running for `src/shared/` (legacy)
   - Vitest runs for `src/features/` (new)
   - Both run in parallel during migration

2. **Migrate Tests First**
   - Copy existing Jest tests as reference
   - Rewrite as behavior-focused Vitest tests
   - Tests should FAIL initially (no implementation)

3. **TDD Implementation**
   - AI implements code to pass tests
   - Human reviews and refactors
   - Add edge cases iteratively

4. **Integration & Cleanup**
   - Create adapters for backward compatibility
   - Gradually replace imports
   - Delete legacy code when complete

### AI Workflow Pattern

```typescript
// 1. Human writes behavior test
test('should validate legal pawn moves', () => {
  const board = BoardState.fromFEN('...');
  const result = validateMove(board, 'e2', 'e4');
  expect(result.isLegal).toBe(true);
});

// 2. Human creates prompt for AI
"Implement validateMove function to pass this test.
Requirements:
- Pure function, no side effects
- TypeScript strict mode
- Max 20 lines
- Use guard clauses for validation
- Return { isLegal: boolean, reason?: string }"

// 3. AI generates implementation
// 4. Human reviews and requests improvements
// 5. Iterate until test passes
```

## 📊 Current State Analysis

### Codebase Statistics

- **Total Files:** ~200
- **Total Lines:** ~30,000
- **Test Count:** 1,417 (98.9% pass rate)
- **Bundle Size:** ~300KB per route

### Major Problem Areas

| File/Module             | Lines | Issue                               | Priority |
| ----------------------- | ----- | ----------------------------------- | -------- |
| Logger.ts               | 1082  | Monolithic service with 59+ methods | HIGH     |
| ChessService.ts         | 740   | Singleton anti-pattern              | HIGH     |
| useProgressSync.ts      | 372   | Complex hook mixing concerns        | HIGH     |
| AdvancedEndgameMenu.tsx | 300   | Component too large                 | MEDIUM   |
| progressSlice.ts        | 274   | Complex state logic                 | MEDIUM   |

### ESLint Warnings (36 total)

- 13x `max-lines-per-function` (limit: 170)
- 11x `complexity` (limit: 18)
- 9x `max-depth` (limit: 4)
- 3x other warnings

## 📅 Migration Phases

### Phase 1: Chess-Core (Week 1-2)

**Issue:** #122  
**Goal:** Decompose ChessService into focused modules

```
features/chess-core/
├── board/          # Board state management
├── moves/          # Move validation/execution
├── rules/          # Game rules (check, checkmate)
└── notation/       # FEN/PGN parsing
```

### Phase 2: Tablebase (Week 3)

**Issue:** #123  
**Goal:** Clean separation of API, caching, and evaluation

```
features/tablebase/
├── api/            # Lichess HTTP client
├── evaluation/     # Position analysis
├── cache/          # LRU cache
└── wdl/            # Win/Draw/Loss calculations
```

### Phase 3: Training Logic (Week 4-5)

**Issue:** #124  
**Goal:** Extract SyncManager from useProgressSync

```
features/training/
├── session/        # Training state
├── progress/       # Progress tracking
├── sync/           # SyncManager class
└── positions/      # Position selection
```

### Phase 4: UI Components (Week 6-7)

**Issue:** #125  
**Goal:** Pure presentation components < 100 lines

```
features/ui/
├── board/          # Chess board UI
├── dialogs/        # Modal dialogs
├── panels/         # Analysis panels
└── menus/          # Navigation menus
```

### Phase 5: Legacy Cleanup (Week 8)

**Issue:** #126  
**Goal:** Delete src/shared/, refactor Logger

```
features/logging/
├── core/           # Logger interface
├── transports/     # Output destinations
├── formatters/     # Log formatting
└── middleware/     # Log enrichment
```

## 🛠️ Technical Setup

### Install Vitest

```bash
npm install -D vitest @vitest/ui @testing-library/react happy-dom
```

### Configure Dual Test Runners

```json
// package.json
{
  "scripts": {
    "test:jest": "jest src/shared src/tests",
    "test:vitest": "vitest src/features",
    "test": "npm run test:jest && npm run test:vitest",
    "test:watch": "vitest watch src/features"
  }
}
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./src/features/test-setup.ts",
    coverage: {
      reporter: ["text", "lcov"],
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
    },
  },
  resolve: {
    alias: {
      "@features": path.resolve(__dirname, "./src/features"),
      "@lib": path.resolve(__dirname, "./src/lib"),
    },
  },
});
```

### ESLint for Features

```json
// .eslintrc.json
{
  "overrides": [
    {
      "files": ["src/features/**/*"],
      "rules": {
        "max-lines-per-function": ["error", 100],
        "complexity": ["error", 10],
        "max-depth": ["error", 3],
        "max-lines": ["error", 100]
      }
    }
  ]
}
```

## 🤖 AI Assistant Guidelines

### When Implementing Features

1. **Always Start with Tests**
   - Ask for the behavior test first
   - Implement only what's needed to pass
   - Request edge cases after basic implementation

2. **Code Quality Standards**
   - Pure functions wherever possible
   - No side effects in business logic
   - Dependency injection over singletons
   - Composition over inheritance

3. **TypeScript Requirements**
   - Strict mode always enabled
   - No `any` types
   - Use branded types for domain concepts
   - Discriminated unions over enums

4. **File Size Limits**
   - Files: max 100 lines
   - Functions: max 20 lines
   - Classes: max 5 public methods
   - Complexity: max 10

### Example Prompts for AI

#### For New Feature Module

```
Create a BoardState class for features/chess-core/board/
Requirements:
- Immutable state (all methods return new instance)
- fromFEN() static factory method
- getPieceAt(square: string) method
- getTurn() method
- Max 100 lines total
- Include JSDoc comments
```

#### For Test Migration

```
Convert this Jest test to Vitest:
[paste Jest test]

Requirements:
- Focus on behavior not implementation
- Use describe/it/expect pattern
- Mock external dependencies
- Add edge case for [specific scenario]
```

#### For Refactoring

```
Refactor this 300-line component into smaller parts:
[paste component]

Split into:
1. Main component (< 50 lines)
2. Extract custom hook for logic
3. Create sub-components for sections
4. Keep all props strongly typed
```

## 📈 Success Metrics

### Code Quality

- [ ] Zero ESLint errors in features/
- [ ] All functions < 20 lines
- [ ] All files < 100 lines
- [ ] Cyclomatic complexity < 10

### Test Coverage

- [ ] 100% coverage of public APIs
- [ ] All edge cases tested
- [ ] Performance benchmarks passing

### Architecture

- [ ] No imports from shared/ in features/
- [ ] Clear separation of concerns
- [ ] No circular dependencies
- [ ] All state immutable

### Performance

- [ ] Bundle size reduced by 30%
- [ ] Initial load < 1 second
- [ ] API calls reduced by 75% (caching)

## 🚨 Common Pitfalls to Avoid

1. **Don't Port Tests Blindly**
   - Old tests may test implementation details
   - Rewrite to test behavior instead

2. **Don't Over-Engineer**
   - Vertical slices are simple by design
   - Avoid excessive abstraction

3. **Don't Mix Concerns**
   - UI components should have no business logic
   - Services should have no UI imports
   - Hooks are for composition, not logic

4. **Don't Skip Tests**
   - Every public API needs tests
   - Write tests BEFORE implementation

## 📚 References

### Architecture

- [Vertical Slice Architecture](https://jimmybogard.com/vertical-slice-architecture/)
- [Test-First Development](https://martinfowler.com/articles/test-driven-development.html)
- [Feature-Based Structure](https://www.robinwieruch.de/react-folder-structure/)

### Tools

- [Vitest Documentation](https://vitest.dev/)
- [MSW for API Mocking](https://mswjs.io/)
- [Testing Library](https://testing-library.com/)

### Current Code

- ChessService: `src/shared/services/ChessService.ts`
- TablebaseService: `src/shared/services/TablebaseService.ts`
- Logger: `src/shared/services/logging/Logger.ts`
- Store: `src/shared/store/`

### Migration Tracking

- GitHub Issues: #122 - #126
- Progress: 0/5 phases complete
- Timeline: 8 weeks estimated

## 🎯 Next Steps

1. **Immediate (Today)**
   - [ ] Install Vitest
   - [ ] Create features/ directory structure
   - [ ] Setup dual test runners

2. **This Week**
   - [ ] Start Phase 1: Chess-Core
   - [ ] Migrate first test file to Vitest
   - [ ] Implement BoardState with TDD

3. **Ongoing**
   - [ ] Daily progress updates in GitHub issues
   - [ ] Weekly architecture review
   - [ ] Continuous refactoring

---

**Remember:** This is a complete rewrite with AI assistance. Time is not the constraint - code quality and maintainability are the goals. Every line of code should be intentional, tested, and documented.
