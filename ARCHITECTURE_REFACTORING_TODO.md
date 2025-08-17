# ARCHITECTURE REFACTORING TODO - Execution Checklist

> **Status:** READY TO START | **Current Phase:** A - Analyze & Decide  
> **Branch:** evaluation-domain-migration | **Last Updated:** 2025-08-17

---

## PHASE A: ANALYZE & DECIDE

### A.1 Git Safety Setup
- [x] ~~Create branch: `git checkout -b evaluation-domain-migration`~~
- [x] ~~Backup commit: `git add -A && git commit -m "Backup: Before evaluation domain migration"`~~

### A.2 Code Analysis - TablebaseService Implementations

**Files Analyzed (6 total):**
- [x] `/shared/services/TablebaseService.ts` [641 LOC - **WINNER** - Optimized, modern]
- [x] `/features/tablebase/services/TablebaseService.ts` [381 LOC - Older implementation]
- [x] `/shared/services/TablebaseService.e2e.mocks.ts` [462 LOC - E2E Mock - TO DELETE]
- [x] `/shared/services/__mocks__/TablebaseService.ts` [324 LOC - **WINNER MOCK** - Vitest Standard] 
- [x] `/tests/mocks/TablebaseServiceMockFactory.ts` [251 LOC - Factory Pattern - TO DELETE]
- [x] `/tests/__mocks__/tablebaseService.ts` [68 LOC - Simple Mock - TO DELETE]

**Analysis Results:**

**WINNER SERVICE: `/shared/services/TablebaseService.ts`**
- ✅ **Modern Architecture:** Single API call optimization, LRU cache, Result pattern
- ✅ **TypeScript Quality:** Strict types, proper interfaces, no any types
- ✅ **Performance:** Optimized caching, request deduplication, metrics tracking
- ✅ **API Surface:** Clean methods (getEvaluation, getTopMoves), good error handling
- ✅ **Dependencies:** Well-structured imports, proper abstractions
- ⚠️ **Minor Issue:** German text generation violates separation of concerns

**WINNER MOCK: `/shared/services/__mocks__/TablebaseService.ts`**
- ✅ **Vitest Standard:** Proper vi.fn() usage, follows Vitest patterns
- ✅ **Comprehensive:** Helper methods for different scenarios (win/loss/draw)
- ✅ **Good API:** mockWinPosition, mockDrawPosition, resetMock helpers
- ✅ **Maintainable:** Clean, well-documented, easy to extend

### A.3 Mock Strategy Investigation
- [x] Search current test usage: `GREP "TablebaseService" --include="*.test.*" --include="*.spec.*"`
- [x] Find mock imports: `GREP "import.*Mock" --include="*.test.*"`
- [x] Identify preferred mock pattern: **Vitest __mocks__ standard**

### A.4 Decision Matrix
- [x] **WINNER_SERVICE:** `/shared/services/TablebaseService.ts` (needs minor refactoring)
- [x] **WINNER_MOCK:** `/shared/services/__mocks__/TablebaseService.ts` (Vitest standard)
- [x] **DELETE_LIST:** 
  - [x] `/features/tablebase/services/TablebaseService.ts` (old implementation)
  - [x] `/shared/services/TablebaseService.e2e.mocks.ts` (E2E mock)
  - [x] `/tests/mocks/TablebaseServiceMockFactory.ts` (factory pattern)
  - [x] `/tests/__mocks__/tablebaseService.ts` (simple mock)

**REFACTORING NEEDED:**
- [x] ~~Remove German text generation from service (_getEvaluationText method)~~
- [x] ~~Move text generation to UI layer (create evaluationText.ts utility)~~

**Phase A Complete:** [x] (All analysis done, decisions made)

---

## PHASE B: BUILD & MIGRATE

### B.0 Refactor Service (NEW - before migration)
- [x] ~~Remove `evaluation` field from TablebaseResult type~~
- [x] ~~Remove `evaluation` field from PositionEvaluation type~~
- [x] ~~Remove `evaluation` field from _transformApiResponse (line 494)~~
- [x] ~~Create `src/shared/utils/evaluationText.ts`~~
- [x] ~~Move German text logic to evaluationText.ts~~
- [x] ~~Remove `_getEvaluationText()` method (lines 567-590)~~
- [x] ~~Test refactored service still works (pnpm tsc && pnpm lint ✅)~~
- [x] ~~Commit: `git add . && git commit -m "refactor: remove UI concerns from TablebaseService"`~~

### B.1 Domain Structure Creation
- [x] ~~Create directories: `mkdir -p src/domains/evaluation/{services,types,utils,__mocks__}`~~
- [x] ~~Add domain index.ts, README.md, and @domains/* path alias~~
- [x] ~~Commit: `git add . && git commit -m "Create evaluation domain structure"`~~
- [x] ~~**Validation:** `pnpm tsc` ✅~~

### B.2 Service Migration  
- [ ] Copy winner: `cp WINNER_SERVICE src/domains/evaluation/services/TablebaseService.ts`
- [ ] Extract types to `src/domains/evaluation/types/` (if needed)
- [ ] Create public API: `src/domains/evaluation/index.ts`
- [ ] Commit: `git add . && git commit -m "Migrate TablebaseService to evaluation domain"`
- [ ] **Validation:** `pnpm tsc` ✅

### B.3 Mock Migration
- [ ] Copy mock: `cp WINNER_MOCK src/domains/evaluation/__mocks__/TablebaseService.ts`
- [ ] Adjust mock imports for new domain structure
- [ ] Commit: `git add . && git commit -m "Migrate TablebaseService mock to evaluation domain"`
- [ ] **Validation:** `pnpm test` ✅

### B.4 Import Replacement
- [ ] Find all imports: `GREP -r "from.*TablebaseService" src/ --include="*.ts" --include="*.tsx"`
- [ ] **Import Update Batches:**
  - [ ] Batch 1: Test files - Update + validate: `pnpm tsc && pnpm test`
  - [ ] Batch 2: Component files - Update + validate: `pnpm tsc && pnpm test`  
  - [ ] Batch 3: Service files - Update + validate: `pnpm tsc && pnpm test`
  - [ ] Batch 4: Store files - Update + validate: `pnpm tsc && pnpm test`
- [ ] **Final Validation:** All imports point to `src/domains/evaluation/`

**Phase B Complete:** [ ] (All services migrated, imports updated, tests green)

---

## PHASE C: CLEANUP & VALIDATE

### C.1 Legacy Deletion
- [ ] Delete old implementations:
  - [ ] `rm /features/tablebase/services/TablebaseService.ts`
  - [ ] `rm /shared/services/TablebaseService.ts`
  - [ ] `rm /shared/services/TablebaseService.e2e.mocks.ts`
  - [ ] `rm /shared/services/__mocks__/TablebaseService.ts`
  - [ ] `rm /tests/mocks/TablebaseServiceMockFactory.ts`
  - [ ] `rm /tests/__mocks__/tablebaseService.ts`
- [ ] Commit: `git add . && git commit -m "Remove legacy TablebaseService duplicates"`

### C.2 Final Validation Suite
- [ ] **TypeScript:** `pnpm tsc` - No errors
- [ ] **Tests:** `pnpm test` - All green
- [ ] **Linting:** `pnpm lint` - No errors
- [ ] **Build:** `pnpm build` - Successful (if available)
- [ ] Commit: `git add . && git commit -m "Final validation: TypeScript + Tests + Lint passed"`

### C.3 Success Verification
- [ ] **File Count:** Only 2 TablebaseService files exist (1 service + 1 mock)
- [ ] **Domain Structure:** `src/domains/evaluation/` exists and exports work
- [ ] **Import Consistency:** All imports use new domain paths
- [ ] **Mock Strategy:** Single, consistent mock approach
- [ ] **Git History:** Clean atomic commits

**Phase C Complete:** [ ] (Legacy cleaned, validation passed)

---

## ROLLBACK PLAN

**If anything breaks during execution:**
- [ ] `git reset --hard HEAD~1` (rollback last commit)
- [ ] Identify issue and fix
- [ ] Resume from last successful step

**Emergency full rollback:**
- [ ] `git checkout main`
- [ ] `git branch -D evaluation-domain-migration`
- [ ] Start over with lessons learned

---

## SUCCESS METRICS

### Architecture Improvements
- [x] Service is right-sized (90% good, 10% needs refactoring)
- [ ] Separation of concerns fixed (UI text moved out)
- [ ] Clean domain boundaries established

### What We Keep (Right-sized features)
- ✅ Result pattern & error handling - Essential for robustness
- ✅ Request deduplication - Prevents API rate limits  
- ✅ LRU cache with TTL - Standard best practice
- ✅ Perspective conversion - Core domain logic
- ✅ Metrics tracking - Production monitoring

### What We Remove (Violations)
- ❌ German text generation - Moves to UI layer

### Quantitative Targets
- [x] **Starting State:** 6 TablebaseService files
- [ ] **Target State:** 2 TablebaseService files
- [ ] **Reduction:** 67% fewer files
- [ ] **Tests:** 100% passing
- [ ] **TypeScript:** 0 errors

### Qualitative Goals  
- [ ] No more mock maintenance hell
- [ ] Clean domain boundaries established
- [ ] Pattern set for future domain migrations
- [ ] Developer experience improved

---

**CURRENT STATUS:** [x] Phase A | [ ] Phase B | [ ] Phase C | [ ] COMPLETE

**NEXT ACTION:** Start Phase B.0 - Refactor Service (remove UI concerns)

**NOTES:**
```
[2025-08-17] Gemini analysis confirmed:
- TablebaseService is NOT overengineered, it's robust and well-designed
- Only issue: German text generation violates separation of concerns
- Decision: Keep service, refactor out UI text generation
- Service provides data (category, dtz), UI generates display text
- 90% of service features are right-sized for production use
```