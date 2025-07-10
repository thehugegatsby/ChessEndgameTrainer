# E2E Test Code Duplications - Action Plan

## 🚨 Critical Findings from Systematic Code Review

### 1. **Helper Functions Triplication** (CRITICAL)
**Problem:** Core helper functions exist in 3 different files:
- `makeMove()`: helpers.ts, working-move-test.spec.ts, TrainingPage.ts
- `getGameState()`: same 3 files
- `waitForEngineResponse()`: same 3 files

**Impact:** Every bug fix must be applied 3 times!

### 2. **Inconsistent Test API Access** (HIGH)
**Problem:** Three different patterns to access the same API:
```typescript
// Pattern 1 (helpers.ts)
(window as any).e2e_makeMove

// Pattern 2 (fast-smoke-test.spec.ts)
(window as any).makeTestMove  

// Pattern 3 (TrainingPage.ts)
(window as any).__testApi.makeMove
```

### 3. **Repeated Wait Patterns** (MEDIUM)
- `page.waitForLoadState('networkidle')` - 29 occurrences
- `page.waitForTimeout(2000)` - 19 occurrences  
- Magic numbers everywhere

### 4. **Selector Duplication** (MEDIUM)
- Board selectors hardcoded in 20+ files
- No central constants used

## 📊 Impact Analysis
- **50+ duplicated code blocks**
- **30-40% code reduction potential**
- **20+ of 40 test files affected**

## ✅ Action Plan (AI Consensus: 9/10 Confidence)

### Phase 1: Helper Consolidation (IMMEDIATE)
1. Move all helper functions to `/tests/e2e/helpers.ts`
2. Update TrainingPage.ts to use helpers
3. Remove duplicates from working-move-test.spec.ts

### Phase 2: API Standardization (THIS WEEK)
1. Standardize on `__E2E_TEST_BRIDGE__` pattern
2. Create central `getTestApi()` function
3. Update all 3 patterns to use unified approach

### Phase 3: Selector Constants (NEXT WEEK)
1. Create `/tests/e2e/config/selectors.ts`
2. Define all UI selectors as constants
3. Replace all hardcoded selectors

### Phase 4: Wait Pattern Abstraction (ONGOING)
1. Create wait utilities with configurable timeouts
2. Remove magic numbers
3. Standardize network idle patterns

## 🛡️ Risk Mitigation
- **Main Risk:** Breaking tests during refactoring
- **Solution:** Step-by-step approach with verification after each change
- Run full test suite after each phase

## 📝 Standards to Establish
1. All helpers must be in `/tests/e2e/helpers/`
2. No direct window access - use getTestApi()
3. All selectors from constants file
4. Document any new patterns in this file

---
*Last Updated: 2025-01-09*
*Status: Ready for Phase 1 Implementation*