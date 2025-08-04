# TODO List from Technical Debt Analysis

_Created: 2025-08-04_  
_Source: TECHNICAL_DEBT_AND_AI_BEST_PRACTICES.md_

## 🚨 Critical Issues (Priority: HIGH)

### 1. Monolithic Store File

- [ ] Split `/shared/store/store.ts` (1,298 lines) into domain-specific files:
  - [ ] `store/gameActions.ts` - Chess game logic
  - [ ] `store/userActions.ts` - User management
  - [ ] `store/progressActions.ts` - Progress tracking
  - [ ] `store/uiActions.ts` - UI state

### 2. Complex Functions Exceeding 50 Lines

- [ ] Refactor `makeUserMove` (178 lines) into smaller functions:
  - [ ] `validateUserMove(move: Move): ValidationResult`
  - [ ] `calculateWDLPerspective(before: Position, after: Position): WDLData`
  - [ ] `updateGameStateAfterMove(move: Move): void`
  - [ ] `handleMoveError(error: Error): void`
- [ ] Refactor `_fetchAndTransform` (120 lines) - separate retry logic from transformation
- [ ] Refactor `getLongestResistanceMove` (120 lines) - simplify strategy selection

### 3. Production Code Mixed with Test Code

- [ ] Extract E2E test code from `/shared/components/training/TrainingBoard/EndgameBoard.tsx`
- [ ] Move `window.endgameboardActions` (lines 693-787) to separate test utilities file

## ⚠️ Medium Priority Issues

### 1. Console Logging Instead of Service

- [x] ✅ Replace console.log with Logger service in production code
  - [x] ✅ `MoveQualityIndicator.tsx` - Now uses Logger for debug and ErrorService for errors
  - [x] ✅ `wdlNormalization.ts` - Now uses Logger for warnings
  - [x] ✅ `MockPositionServiceFactory.ts` - Now uses Logger for all logging
  - [x] ✅ `tablebase-demo/page.tsx` - Now uses Logger for debug logging
- [ ] Replace remaining console.log in test services (TestApiService, BrowserTestApi)
- [x] ✅ Add ESLint rule to prevent new console.log usage
  - Added `no-console: "error"` globally
  - Added `no-console: "off"` for all test files
  - Verified with ESLint - no violations found

### 2. TODO Comments Without Tracking

- [x] ✅ `Logger.ts:131` - "TODO: Implement actual remote logging" - **IMPLEMENTED**
  - Added flush() method with retry mechanism and concurrency control
- [x] ✅ `TestApiService.ts:300` - "TODO: Apply configuration to actual tablebase instance" - **ALREADY HANDLED**
  - TestBridge system already provides this functionality
- [ ] Create GitHub issues for remaining TODOs
- [ ] Remove completed TODO comments from code

### 3. Deprecated Code Still in Use

- [ ] Remove `useTraining` hook (replace with `useEndgameState`)
- [ ] Remove `resetTablebaseState` (no engine to reset anymore)
- [ ] Remove other deprecated code (4 more instances)

## 📝 Low Priority Issues

### 1. Naming Inconsistencies

- [ ] Resolve `useTraining` vs `useEndgameState` naming conflict
- [ ] Add documentation for abbreviated terms: `wdl`, `dtz`, `dtm`

## ✅ Completed Items

### Logger Implementation (2025-08-04)

- [x] ✅ Implemented RemoteTransport flush() method
- [x] ✅ Added transport injection for testability
- [x] ✅ Created comprehensive Logger tests (86.56% coverage)
- [x] ✅ Added JSDoc documentation to all Logger public methods

### Console.log Migration (2025-08-04)

- [x] ✅ Established pattern: ErrorService for errors, Logger for debug/info/warn
- [x] ✅ Updated critical production files to use proper logging
- [x] ✅ Maintained backward compatibility

### ErrorService Enhancement (2025-08-04)

- [x] ✅ Created comprehensive ErrorService tests (98.83% coverage, 31 tests)
- [x] ✅ Added complete JSDoc documentation to all ErrorService methods
- [x] ✅ Documented side effects, examples, and common error scenarios
- [x] ✅ Maintained singleton pattern with proper test coverage

### ESLint no-console Rule (2025-08-04)

- [x] ✅ Added global no-console rule as "error" to prevent console usage in production
- [x] ✅ Added exception for test files (tests/\*\*) where console is allowed
- [x] ✅ Fixed all existing console.log violations in production code
- [x] ✅ Verified ESLint configuration works correctly

## 📊 Progress Summary

**Critical Issues**: 0/3 completed (0%)  
**Medium Priority**: 2/3 completed (67%)  
**Low Priority**: 0/2 completed (0%)  
**Overall**: 2/8 major items completed (25%)

**Additional Achievements**:

- ErrorService: Comprehensive tests (98.83% coverage) + complete JSDoc
- Logger: Full implementation with remote logging + tests (86.56% coverage)
- Established clear logging patterns across the codebase

## 🎯 Next Steps

1. **Immediate**: Add ESLint no-console rule to prevent regression
2. **Next Sprint**: Start splitting the monolithic store file
3. **Future**: Address complex function refactoring

## 📝 Notes

- Logger service is now fully functional with remote logging capability
- ErrorService and Logger work together without duplication
- Test code can continue using console.log per best practices
- All changes maintain backward compatibility
