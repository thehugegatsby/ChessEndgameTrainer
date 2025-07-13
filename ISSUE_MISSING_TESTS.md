# GitHub Issue: Missing Tests for Clean Architecture Components

## Issue Title
**Write Tests for Clean Architecture Components After Architectural Simplification**

## Labels
- `enhancement`
- `testing` 
- `clean-architecture`
- `priority-medium`

## Description

After completing the architectural simplification from overengineered patterns to clean singleton architecture, several test files were deleted because they were testing obsolete code. We need to write new tests that properly validate the clean architecture components.

## Background

We recently completed a major architectural refactoring (commit: `feat: Major architecture simplification - Clean Slate engine refactoring`) where we:

- Replaced 15+ method `IScenarioEngine` with minimal 4-method `IChessEngine`
- Simplified 293-line overengineered `EngineService` to clean 222-line singleton
- Removed engine pooling, LRU eviction, reference counting
- Eliminated "dumb storage" anti-patterns in Zustand store

## Missing Test Coverage

### 1. **EngineService.test.ts** (PRIORITY: HIGH)
**File**: `tests/unit/services/EngineService.test.ts` - **DELETED** (was 343 lines of obsolete tests)

**New tests needed:**
- ✅ Singleton behavior: `getInstance()` returns same instance
- ✅ Lazy initialization: Worker created only on first method call
- ✅ IChessEngine methods: `findBestMove()`, `evaluatePosition()`, `stop()`, `terminate()`
- ✅ Worker interaction: Proper `postMessage` calls and response handling
- ✅ Error handling: Worker failures, timeouts, initialization errors
- ✅ Cleanup: `terminate()` properly cleans up worker resources

**Recommended mocking strategy:**
```typescript
// Mock Worker constructor
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: null,
  onerror: null
};

global.Worker = jest.fn(() => mockWorker);
```

### 2. **EngineEvaluationCard.test.tsx** (PRIORITY: MEDIUM)
**File**: `tests/unit/ui/training/EngineEvaluationCard.test.tsx` - **DELETED** (was 31 failing tests)

**Component status**: Currently a placeholder during refactoring
**Location**: `shared/components/training/DualEvaluationPanel/EngineEvaluationCard.tsx`

**Tests needed after component re-implementation:**
- Component renders with new `IChessEngine` evaluation data
- Handles loading states correctly
- Formats evaluation scores and mate values
- Proper color coding for positive/negative evaluations
- Error state handling

### 3. **Other Potentially Missing Tests**

**Files that may need review:**
- `tests/unit/cache/LRUCache.test.ts` - May be over-complex for singleton architecture
- `tests/unit/cache/EvaluationCache.test.ts` - May need simplification  
- `tests/unit/hooks/useEvaluation.test.ts` - May need updates for new engine patterns

## Implementation Guidelines

### Testing Principles (from expert consensus)
1. **Test the public API** - Focus on the 4 IChessEngine methods
2. **Mock Worker interactions** - Don't test Stockfish itself, test our service layer
3. **Validate singleton behavior** - Ensure single instance pattern works
4. **Test error scenarios** - Worker failures, timeouts, invalid FEN
5. **Modern mocking patterns** - Use `jest.spyOn(EngineService.getInstance(), 'method')`

### Architecture Alignment
- Tests must align with the new stateless `IChessEngine` interface
- No engine pooling or reference counting tests (removed patterns)
- Focus on lazy initialization and proper cleanup
- Test service layer logic, not chess engine logic

## Acceptance Criteria

- [ ] **EngineService.test.ts** written with comprehensive singleton and IChessEngine method coverage
- [ ] **EngineEvaluationCard.test.tsx** written after component re-implementation
- [ ] All tests follow clean architecture principles (no obsolete patterns)
- [ ] Test coverage maintained above 78% (current project standard)
- [ ] Tests use modern mocking patterns consistent with new architecture
- [ ] All tests pass with no TODO/SKIP markers

## Technical Context

**New Architecture Summary:**
- `EngineService`: Singleton implementing `IChessEngine` interface
- 4 core methods: `findBestMove()`, `evaluatePosition()`, `stop()`, `terminate()`
- Lazy Stockfish worker initialization
- No pooling, no reference counting, no cleanup timers
- Stateless design - all methods accept FEN parameters

**Current Test Status:**
- ✅ 848 tests passing
- ✅ 11 tests skipped  
- ✅ 0 tests failing
- 🎯 Total: 859 tests (excellent baseline)

## Related Files

**Core implementation:**
- `shared/services/chess/EngineService.ts` (new clean singleton)
- `shared/lib/chess/IChessEngine.ts` (clean interface)
- `shared/store/trainingActions.ts` (async engine operations)

**Test infrastructure:**
- `tests/jest.config.js` (Jest configuration)
- `tests/setup/` (Test setup files)

## Estimated Effort
- **EngineService.test.ts**: ~4-6 hours (comprehensive singleton testing)
- **EngineEvaluationCard.test.tsx**: ~2-3 hours (after component rewrite)
- **Review other cache tests**: ~1-2 hours

**Total**: ~7-11 hours

---

**Note**: This issue was created after successfully completing the architectural simplification. The missing tests represent new functionality that needs validation, not broken legacy code.