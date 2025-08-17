# ARCHITECTURE REFACTORING TODO - Execution Checklist

> **Status:** READY TO START | **Current Phase:** A - Analyze & Decide  
> **Branch:** evaluation-domain-migration | **Last Updated:** 2025-08-17

---

## PHASE A: ANALYZE & DECIDE

### A.1 Git Safety Setup
- [ ] Create branch: `git checkout -b evaluation-domain-migration`
- [ ] Backup commit: `git add -A && git commit -m "Backup: Before evaluation domain migration"`

### A.2 Code Analysis - TablebaseService Implementations

**Files to Analyze (6 total):**
- [ ] `/shared/services/TablebaseService.ts` [641 LOC - Expected Winner]
- [ ] `/features/tablebase/services/TablebaseService.ts` [381 LOC - Likely Older]
- [ ] `/shared/services/TablebaseService.e2e.mocks.ts` [462 LOC - E2E Mock]
- [ ] `/shared/services/__mocks__/TablebaseService.ts` [324 LOC - Vitest Mock] 
- [ ] `/tests/mocks/TablebaseServiceMockFactory.ts` [251 LOC - Factory Pattern]
- [ ] `/tests/__mocks__/tablebaseService.ts` [68 LOC - Simple Mock]

**Analysis Criteria per File:**
- [ ] TypeScript quality (strict types, proper interfaces)
- [ ] Performance optimizations (caching, error handling)
- [ ] API surface area (clean, minimal methods)
- [ ] Dependencies (external libs, internal imports)
- [ ] Code complexity and maintainability

### A.3 Mock Strategy Investigation
- [ ] Search current test usage: `GREP "TablebaseService" --include="*.test.*" --include="*.spec.*"`
- [ ] Find mock imports: `GREP "import.*Mock" --include="*.test.*"`
- [ ] Identify preferred mock pattern (Vitest __mocks__ vs factory vs inline)

### A.4 Decision Matrix
- [ ] **WINNER_SERVICE:** `_________________` (file path)
- [ ] **WINNER_MOCK:** `_________________` (file path + strategy)
- [ ] **DELETE_LIST:** 
  - [ ] `_________________`
  - [ ] `_________________` 
  - [ ] `_________________`
  - [ ] `_________________`
  - [ ] `_________________`

**Phase A Complete:** [ ] (All analysis done, decisions made)

---

## PHASE B: BUILD & MIGRATE

### B.1 Domain Structure Creation
- [ ] Create directories: `mkdir -p src/domains/evaluation/{services,types,cache,__mocks__}`
- [ ] Commit: `git add . && git commit -m "Create evaluation domain structure"`
- [ ] **Validation:** `pnpm tsc` ✅

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

**CURRENT STATUS:** [ ] Phase A | [ ] Phase B | [ ] Phase C | [ ] COMPLETE

**NEXT ACTION:** Start Phase A.1 - Git Safety Setup

**NOTES:**
```
[Add execution notes, issues found, decisions made here]

```