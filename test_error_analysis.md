# Test Error Analysis

## Summary

- **Total Tests:** 1296
- **Failed:** 75
- **Passed:** 1176
- **Skipped:** 45
- **Failed Test Suites:** 12

## Error Categories

### 1. Mock/Spy Not Called (Most Common)

**Pattern:** `expect(mockFunction).toHaveBeenCalled()` fails with 0 calls
**Files Affected:**

- `gameSlice.test.ts` - ChessService.reset not called
- `ChessService.cache.test.ts` - Chess instance creation tracking
- `ChessService.status.test.ts` - Multiple mock methods (isCheck, isCheckmate, isStalemate, isDraw, isThreefoldRepetition, etc.)
- `ChessService.unit.test.ts` - MockedChess constructor not called

### 2. Undefined State Access

**Pattern:** `Cannot read properties of undefined (reading 'training')`
**Files Affected:**

- `PawnPromotionHandler.test.ts` - getState() returns undefined state structure

### 3. Incorrect Return Values

**Pattern:** Expected true/false but received opposite
**Files Affected:**

- `ChessService.status.test.ts` - isCheck() returns false instead of true
- `PawnPromotionHandler.test.ts` - evaluatePromotionOutcome returns false for checkmate
- `ChessService.unit.test.ts` - undo/redo/goToMove returning true instead of false on error

### 4. Move Validation Failures

**Pattern:** Invalid move operations or move history issues
**Files Affected:**

- `ChessService.unit.test.ts` - Complex navigation flows failing
- `useMoveValidation.test.ts` - Move validation errors

### 5. Async/Timing Issues

**Pattern:** Retry logic and waitFor timeouts
**Files Affected:**

- `useProgressSync.test.ts` - Exponential backoff and retry logic not working as expected

### 6. Memory Leak Warning

**Pattern:** "Force exiting Jest: Have you considered using `--detectOpenHandles`"

- Indicates async operations not properly cleaned up

## Root Causes Analysis

1. **Mock Setup Issues (60% of failures)**
   - Mocks not properly configured or not returning expected values
   - Spy functions not being triggered due to implementation changes

2. **State Management Problems (20% of failures)**
   - Store not properly initialized in tests
   - Missing state slices or incorrect state structure

3. **Async Operation Handling (10% of failures)**
   - Promises not properly awaited
   - Timer-based tests not properly controlled

4. **Business Logic Changes (10% of failures)**
   - Implementation changed but tests not updated
   - Expected behavior modified without updating assertions

## Priority Fixes

1. **High Priority:** Fix mock/spy setup in ChessService tests
2. **High Priority:** Fix state initialization in PawnPromotionHandler tests
3. **Medium Priority:** Update async test handling in useProgressSync
4. **Low Priority:** Address memory leak issues with --detectOpenHandles
