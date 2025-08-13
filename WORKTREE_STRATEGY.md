# Worktree Strategy for Test Migration

## Active Worktrees

### 1. ✅ `feature/critical-training-chess` 
**Location:** `../EndgameTrainer-critical-training-chess`  
**Created:** 2025-08-13  
**Issues:** #154 (CRITICAL) + #155 (HIGH)  
**Status:** ACTIVE

#### Scope
- **Phase 1:** Migrate 5 training domain tests (#154)
- **Phase 2:** Deduplicate ~10 chess domain tests (#155)

#### Files to Migrate

**Training Tests (5 files):**
```
src/tests/unit/store/slices/trainingSlice.test.ts
src/tests/unit/components/training/TrainingBoard.test.tsx  
src/tests/unit/pages/EndgameTrainingPage.test.tsx
src/tests/integration/training-service.test.ts
src/tests/integration/EndgameTrainingPage.test.tsx
```

**Chess Tests to Deduplicate (6+ files):**
```
src/tests/unit/services/ChessService.cache.test.ts
src/tests/unit/services/ChessService.germanPromotion.test.ts
src/tests/unit/services/ChessService.pgn.test.ts
src/tests/unit/services/ChessService.status.test.ts
src/tests/unit/services/ChessService.unit.test.ts
src/tests/unit/services/ChessService.validateMove.test.ts
```

#### Commands for This Worktree
```bash
# Navigate to worktree (in new terminal/VS Code window)
cd ../EndgameTrainer-critical-training-chess

# Install dependencies
pnpm install

# Run tests to verify current state
pnpm test src/features/training  # Should show 0 tests
pnpm test src/features/chess-core # Should show 7 tests

# After migration, verify
pnpm test src/features/training  # Should show 5 tests
pnpm test src/features/chess-core # Should show 7+ tests (after dedup)
```

## Planned Worktrees (Not Yet Created)

### 2. 🔜 `feature/unit-tests-batch-1`
**Issues:** #156 (Part 1)  
**Scope:** Migrate ~25 unit tests (Store, Services)  
**Duration:** 2-3 days

### 3. 🔜 `feature/unit-tests-batch-2`  
**Issues:** #156 (Part 2)  
**Scope:** Migrate ~25 unit tests (UI, Utilities)  
**Duration:** 2-3 days

### 4. 🔜 `feature/integration-e2e`
**Issues:** #157  
**Scope:** Migrate integration/E2E tests  
**Duration:** 1-2 days

### 5. 🔜 `feature/final-cleanup`
**Issues:** #158  
**Scope:** Delete src/tests/, update configs  
**Duration:** < 1 day  
**IMPORTANT:** Only after ALL other worktrees merged!

## Worktree Management Commands

```bash
# List all worktrees
git worktree list

# Create new worktree
git worktree add -b feature/[name] ../EndgameTrainer-[name]

# Remove worktree after merge
git worktree remove ../EndgameTrainer-[name]

# Prune stale worktree references
git worktree prune
```

## Merge Strategy

1. Complete work in worktree
2. Push branch: `git push -u origin feature/[name]`
3. Create PR via GitHub
4. After merge, remove worktree locally
5. Delete remote branch

## Current Progress

- [x] Worktree 1 created: critical-training-chess
- [ ] Worktree 1 work complete
- [ ] Worktree 1 merged
- [ ] Worktree 2 created
- [ ] Worktree 3 created
- [ ] Worktree 4 created
- [ ] Worktree 5 created (LAST!)

## Notes for LLM Implementation

When working in the worktree:
1. You cannot navigate to worktree directory from main session
2. User must open new terminal/VS Code window for worktree
3. Each worktree has independent git history
4. Changes in worktree don't affect main until merged
5. Always verify tests pass before committing