# Test Migration TODO List

**Objective:** Complete migration from `src/tests/` to `src/features/` with Vitest

## Phase 1: Critical Training Domain Migration 🔴
**Issue:** #154  
**Priority:** CRITICAL  
**Files:** 5 tests need immediate migration

- [ ] Migrate `src/tests/unit/store/slices/trainingSlice.test.ts` → `src/features/training/__tests__/`
- [ ] Migrate `src/tests/unit/components/training/TrainingBoard.test.tsx` → `src/features/training/__tests__/`
- [ ] Migrate `src/tests/unit/pages/EndgameTrainingPage.test.tsx` → `src/features/training/__tests__/`
- [ ] Migrate `src/tests/integration/training-service.test.ts` → `src/features/training/__tests__/`
- [ ] Migrate `src/tests/integration/EndgameTrainingPage.test.tsx` → `src/features/training/__tests__/`
- [ ] Update imports from Jest to Vitest (`jest.fn()` → `vi.fn()`)
- [ ] Verify all training tests pass

## Phase 2: Chess Domain Deduplication 🟡
**Issue:** #155  
**Priority:** HIGH  
**Goal:** Consolidate duplicate test coverage

- [ ] Audit `ChessService.*.test.ts` files for unique test cases
- [ ] Merge unique cases into `ChessServiceFacade.test.ts`
- [ ] Delete redundant `ChessService.cache.test.ts`
- [ ] Delete redundant `ChessService.germanPromotion.test.ts`
- [ ] Delete redundant `ChessService.pgn.test.ts`
- [ ] Delete redundant `ChessService.status.test.ts`
- [ ] Delete redundant `ChessService.unit.test.ts`
- [ ] Delete redundant `ChessService.validateMove.test.ts`
- [ ] Verify chess-core test coverage remains at 100%

## Phase 3: Remaining Unit Tests Migration 🟡
**Issue:** #156  
**Priority:** MEDIUM  
**Files:** ~50 remaining unit tests

### Tablebase Tests
- [ ] Migrate remaining tablebase tests
- [ ] Consolidate TablebaseService tests

### UI Component Tests
- [ ] Migrate `MoveErrorDialog.test.tsx`
- [ ] Migrate `MoveSuccessDialog.test.tsx`
- [ ] Migrate other UI component tests

### Store Tests
- [ ] Migrate `gameSlice.test.ts`
- [ ] Migrate `progressSlice.test.ts`
- [ ] Migrate `tablebaseSlice.test.ts`
- [ ] Migrate `uiSlice.test.ts`

### Service Tests
- [ ] Migrate `ErrorService.test.ts`
- [ ] Migrate `SpacedRepetitionService.test.ts`
- [ ] Migrate `DueCardsCacheService.test.ts`

## Phase 4: Integration & E2E Tests 🟢
**Issue:** #157  
**Priority:** MEDIUM  
**Goal:** Migrate cross-cutting tests

### Integration Tests
- [ ] Create `vitest.integration.config.ts` if missing
- [ ] Migrate `src/tests/integration/*.test.ts`
- [ ] Update MSW handlers for Vitest
- [ ] Verify Firebase integration tests

### E2E Tests
- [ ] Keep Playwright tests in current structure
- [ ] Update any Jest references in E2E helpers
- [ ] Verify E2E test execution

## Phase 5: Final Cleanup & Removal 🔵
**Issue:** #158  
**Priority:** LOW (but CRITICAL after other phases)  
**Goal:** Remove all legacy test infrastructure

### Pre-removal Checklist
- [ ] All 77 tests migrated or consolidated
- [ ] Run full test suite - all pass
- [ ] Coverage report shows no regression
- [ ] No "jest" references remain in codebase

### Cleanup Actions
- [ ] Delete `src/tests/` directory completely
- [ ] Update `vitest.unit.config.ts` - remove `src/tests/unit/` include
- [ ] Remove `@testing-library/jest-dom` if not needed
- [ ] Remove migration scripts (`migrate-jest-to-vitest.js`)
- [ ] Update documentation (TESTING_STRATEGY.md)
- [ ] Update CI/CD if needed

### Verification
- [ ] Run `pnpm test` - all pass
- [ ] Run `pnpm test:features` - all pass  
- [ ] Run `pnpm test:integration` - all pass
- [ ] Run `pnpm test:coverage` - meets threshold
- [ ] Build succeeds: `pnpm build`
- [ ] No TypeScript errors: `pnpm tsc`

## Success Criteria ✅

1. **Zero tests in `src/tests/`** - Directory deleted
2. **All tests in `src/features/`** - Co-located with code
3. **No Jest references** - Pure Vitest syntax
4. **Coverage maintained** - No regression from current levels
5. **CI/CD green** - All workflows pass
6. **Bundle size stable** - No increase from 288kB

## Commands for Verification

```bash
# Count tests in old structure
find src/tests -name "*.test.ts" -o -name "*.test.tsx" | wc -l

# Count tests in new structure  
find src/features -name "*.test.ts" -o -name "*.test.tsx" | wc -l

# Find remaining Jest references
grep -r "jest\." src/ --include="*.ts" --include="*.tsx"

# Run all tests
pnpm test:all

# Check coverage
pnpm test:coverage
```

## Notes for AI/LLM Implementation

When working on these tasks:
1. **Preserve test logic** - Only update syntax, not behavior
2. **Run tests after each migration** - Ensure nothing breaks
3. **Commit frequently** - One file or logical group per commit
4. **Check imports** - Update paths to new feature structure
5. **Mock updates** - Change `jest.mock()` to `vi.mock()`

See [TEST_MIGRATION_STATUS.md](./TEST_MIGRATION_STATUS.md) for current state analysis.