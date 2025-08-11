# 🎯 Worktree #122: Chess-Core Migration

**Issue:** #122  
**Branch:** `feature/122-chess-core-migration`  
**Location:** `/home/thehu/coolProjects/EndgameTrainer-122`  
**Status:** ✅ Ready for Development

## 📋 Setup Complete

### ✅ Infrastructure

- [x] Git worktree created and configured
- [x] pnpm installed with global store at `~/.pnpm-store`
- [x] All configuration files symlinked from main project
- [x] VS Code settings configured

### ✅ Test Infrastructure

- [x] Vitest installed (`v3.2.4`)
- [x] Happy-DOM environment configured
- [x] Dual test runner setup (Jest for legacy, Vitest for new)
- [x] Test scripts added to package.json

### ✅ Directory Structure

```
src/
├── features/              # New feature-based structure
│   ├── chess-core/       # Target for this migration
│   ├── tablebase/
│   ├── training/
│   ├── sync/
│   ├── ui/
│   ├── logging/
│   └── test-setup.ts     # Vitest configuration
├── shared/               # Legacy code (to be migrated)
└── app/                  # Next.js routes
```

## 🚀 Quick Start

```bash
# Navigate to worktree
cd /home/thehu/coolProjects/EndgameTrainer-122

# Run tests
pnpm test:jest          # Legacy tests
pnpm test:vitest        # New feature tests
pnpm test              # Both runners

# Development
pnpm dev               # Start dev server
pnpm lint              # Run linter
pnpm build             # Build project
```

## 📝 Migration Plan for Chess-Core

### Phase 1.1: Board State (Week 1)

```
features/chess-core/board/
├── BoardState.ts          # Immutable board representation
├── BoardState.test.ts     # Behavior tests
├── types.ts               # Board types
└── utils.ts               # Board utilities
```

### Phase 1.2: Move Validation (Week 1)

```
features/chess-core/moves/
├── MoveValidator.ts       # Move validation logic
├── MoveExecutor.ts        # Move execution
├── MoveHistory.ts         # Move history tracking
└── __tests__/             # Move tests
```

### Phase 1.3: Game Rules (Week 2)

```
features/chess-core/rules/
├── CheckDetector.ts       # Check/checkmate detection
├── DrawConditions.ts     # Draw detection
├── GameStatus.ts          # Game state evaluation
└── __tests__/             # Rules tests
```

### Phase 1.4: Notation (Week 2)

```
features/chess-core/notation/
├── FENParser.ts           # FEN parsing/generation
├── PGNParser.ts           # PGN parsing/generation
├── MoveNotation.ts        # Algebraic notation
└── __tests__/             # Notation tests
```

## 🧪 Test-First Migration Process

1. **Write Behavior Test First**

```typescript
// features/chess-core/board/BoardState.test.ts
import { describe, it, expect } from "vitest";

describe("BoardState", () => {
  it("should create board from FEN string", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const board = BoardState.fromFEN(fen);

    expect(board.getPieceAt("e1")).toBe("K");
    expect(board.getPieceAt("e8")).toBe("k");
    expect(board.getTurn()).toBe("white");
  });
});
```

2. **Run Test (Should Fail)**

```bash
pnpm test:vitest:watch
```

3. **Implement Code to Pass Test**

```typescript
// features/chess-core/board/BoardState.ts
export class BoardState {
  // Implementation...
}
```

4. **Verify Test Passes**
5. **Add Edge Cases**
6. **Refactor if Needed**

## 📊 Success Metrics

- [ ] All ChessService functionality migrated
- [ ] 100% test coverage for public APIs
- [ ] No functions > 20 lines
- [ ] No files > 100 lines
- [ ] Cyclomatic complexity < 10
- [ ] Zero imports from `shared/` in `features/`

## 🔄 Daily Workflow

1. **Morning**
   - Review MIGRATION_CONTEXT.md
   - Pick next module to migrate
   - Write behavior tests

2. **Development**
   - Implement code to pass tests
   - Add edge cases
   - Refactor for quality

3. **Evening**
   - Update progress in GitHub issue
   - Commit with descriptive message
   - Push to remote

## 🐛 Troubleshooting

### Vitest Not Finding Tests

```bash
# Check test pattern
vitest list src/features

# Run with debug
vitest --reporter=verbose
```

### pnpm Issues

```bash
# Clear cache
pnpm store prune

# Reinstall
rm -rf node_modules
pnpm install
```

### Symlink Issues

```bash
# Re-run setup script
./scripts/setup-worktree.sh 122
```

## 📚 Resources

- [MIGRATION_CONTEXT.md](/home/thehu/coolProjects/EndgameTrainer/MIGRATION_CONTEXT.md) - Complete migration guide
- [PROJECT_STRUCTURE.md](/home/thehu/coolProjects/EndgameTrainer/PROJECT_STRUCTURE.md) - Target architecture
- [Vitest Documentation](https://vitest.dev/)
- [GitHub Issue #122](https://github.com/Schachklub-St-Pauli/EndgameTrainer/issues/122)

## 🎯 Next Steps

1. Start with BoardState class
2. Write comprehensive tests
3. Implement with TDD
4. Move to MoveValidator
5. Continue through all modules

---

**Remember:** Test-First, Small Functions, Clean Code!
