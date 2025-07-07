# 📋 Unit Test Development Tasks

## 📊 Current Status (2025-01-16)
- **Test Files**: 37 unit test files (+6 new)
- **Coverage**: 76.16% → ~78% statement coverage
- **Test Success**: 99% (787/796 tests passing, 9 skipped)
- **Tests Added**: 128 new tests in Phase 1 & 2
- **Goal**: 80%+ coverage for production

## 🎯 Identified Test Gaps

### Priority 1: Chess Engine Module (Critical) ✅ COMPLETED
These are the core components for Stockfish integration and must be thoroughly tested.

- [x] **workerManager.test.ts** - Worker lifecycle, memory management, mobile constraints ✅
  - Completed: 2025-01-16
  - 24 tests passing
  - 3 bugs found and fixed (UCI init, cleanup state, error handlers)
- [x] **messageHandler.test.ts** - UCI protocol parsing, response handling, error processing ✅
  - Completed: 2025-01-16
  - 24 tests passing
  - Replaced console.log with central logger
- [x] **requestManager.test.ts** - Request deduplication, timeout handling, abort support ✅
  - Completed: 2025-01-16
  - 26 tests passing
  - 98.57% coverage achieved
  - No bugs found

### Priority 2: Evaluation Pipeline (High) 🟡 IN PROGRESS
Central evaluation logic for the Brückenbau-Trainer feature.

- [x] **perspectiveTransformer.test.ts** - WDL perspective transformation for Black/White ✅
  - Completed: 2025-01-16
  - 16 tests passing
  - **CRITICAL BUG FOUND**: Perspective not inverted for Black
  - Bug documented in PERSPECTIVE_BUG_REPORT.md
- [x] **EvaluationDeduplicator.test.ts** - Concurrent request handling, cache integration ✅
  - Completed: 2025-01-16
  - 16 tests passing
  - 100% coverage achieved
- [x] **ChessAwareCache.test.ts** - Chess-specific caching logic, FEN normalization ✅
  - Completed: 2025-01-16
  - 22 tests passing
  - 94.44% coverage achieved
- [ ] **unifiedService.test.ts** - Engine + Tablebase integration, fallback mechanisms
- [ ] **pipelineFactory.test.ts** - Pipeline creation, configuration handling

### Priority 3: Training & Progress (Medium) 🟢
User progress tracking and spaced repetition system.

- [ ] **spacedRepetition.test.ts** - FSRS algorithm, progress calculation, scheduling
- [ ] **store.test.ts** - Zustand store integration, state management
- [ ] **successCriteria.test.ts** - Training completion criteria validation

### Priority 4: Additional Components (Low) 🔵
Nice to have for complete coverage.

- [ ] **formatter.test.ts** - Evaluation display formatting
- [ ] **providerAdapters.test.ts** - Provider abstraction layer
- [ ] **stockfish.ts** (lib) - Stockfish wrapper functions

## 📝 Test Implementation Details

### Phase 1: Engine Module Tests (Week 1)

#### 1. workerManager.test.ts
**Test Areas**:
- Worker initialization and termination
- Memory management (instance tracking)
- Mobile constraints (max 1 instance)
- Error recovery on worker crashes
- Cleanup on component unmount

**Key Scenarios**:
```typescript
- 'should initialize worker with correct WASM path'
- 'should limit to single instance on mobile'
- 'should cleanup worker on termination'
- 'should handle worker crash gracefully'
- 'should track memory usage accurately'
```

#### 2. messageHandler.test.ts
**Test Areas**:
- UCI command formatting
- Response parsing (info, bestmove, readyok)
- Error message handling
- Async message queue management
- Multi-PV parsing

**Key Scenarios**:
```typescript
- 'should parse UCI info strings correctly'
- 'should extract evaluation from engine output'
- 'should handle mate scores properly'
- 'should queue messages when engine busy'
- 'should parse multi-PV variations'
```

#### 3. requestManager.test.ts
**Test Areas**:
- Request deduplication for same position
- Timeout handling (configurable)
- AbortController integration
- Priority queue for urgent requests
- Error propagation

**Key Scenarios**:
```typescript
- 'should deduplicate concurrent requests for same FEN'
- 'should timeout long-running evaluations'
- 'should abort cancelled requests'
- 'should prioritize tablebase requests'
- 'should propagate engine errors correctly'
```

### Phase 2: Evaluation Pipeline Tests (Week 2)

#### 4. EvaluationDeduplicator.test.ts
**Test Areas**:
- Concurrent request batching
- Result sharing between callers
- Cache integration
- Error handling for failed evaluations

#### 5. unifiedService.test.ts
**Test Areas**:
- Engine + Tablebase coordination
- Fallback from tablebase to engine
- Error recovery strategies
- Performance optimization

### Phase 3: Training Tests (Week 3)

#### 6. spacedRepetition.test.ts
**Test Areas**:
- FSRS algorithm correctness
- Difficulty adjustment
- Next review scheduling
- Progress persistence

## 🛠️ Test Patterns & Conventions

### Naming Convention
```typescript
describe('[Component]_[method]_[condition]_[expected]', () => {
  it('should [expected behavior] when [condition]', () => {
    // Test implementation
  });
});
```

### Mock Patterns
```typescript
// Worker Mock
const mockWorker = {
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Engine Mock
const mockEngine = {
  evaluatePosition: jest.fn().mockResolvedValue({ score: 50, mate: null }),
  getBestMove: jest.fn().mockResolvedValue({ from: 'e2', to: 'e4' })
};
```

### Performance Testing
```typescript
const MOBILE_MEMORY_LIMIT = 50 * 1024; // 50KB
const MAX_OPERATION_TIME = 10; // 10ms

// Memory test
expect(component.getMemoryUsage()).toBeLessThan(MOBILE_MEMORY_LIMIT);

// Performance test
const start = performance.now();
await operation();
expect(performance.now() - start).toBeLessThan(MAX_OPERATION_TIME);
```

## ✅ Success Criteria

### Coverage Goals
- Statement Coverage: > 80%
- Branch Coverage: > 75%
- Function Coverage: > 90%
- Line Coverage: > 80%

### Quality Metrics
- All tests pass in CI/CD pipeline
- No flaky tests
- Performance benchmarks met
- Mobile constraints validated

## 📈 Progress Tracking

### Completed Tests (2025-01-16)
- ✅ **Phase 1 - Engine Core**: 74 tests total
  - workerManager.test.ts - 24 tests
  - messageHandler.test.ts - 24 tests
  - requestManager.test.ts - 26 tests
- ✅ **Phase 2 - Evaluation Pipeline**: 54 tests total (in progress)
  - perspectiveTransformer.test.ts - 16 tests
  - EvaluationDeduplicator.test.ts - 16 tests
  - ChessAwareCache.test.ts - 22 tests
- **Total**: 128 tests passing

### Next Steps
1. **CRITICAL**: Fix perspective bug in perspectiveTransformer
2. **Immediate**: Complete remaining Phase 2 tests
   - unifiedService.test.ts
   - pipelineFactory.test.ts
3. **This Week**: Start Phase 3 - Training & Progress tests
4. **Focus Areas**: 
   - Integration testing between components
   - Performance optimization validation
   - Mobile compatibility

### Bugs Found & Fixed
1. **WorkerManager**: UCI command not sent due to isReady check ✅
2. **WorkerManager**: Cleanup state not reset on terminate error ✅
3. **WorkerManager**: Missing onmessageerror handler ✅
4. **Code Quality**: Replaced all console.log with central logger ✅
5. **perspectiveTransformer**: Values not inverted for Black perspective 🐛 (TO FIX)

## 🚀 Getting Started

1. Review `docs/testing/TESTING_GUIDELINES.md` for detailed patterns
2. Start with Priority 1 tests (Engine Module)
3. Use existing tests in `tests/unit/` as reference
4. Run `npm test -- --coverage` to check progress
5. Ensure all tests pass before moving to next phase

---
*Last Updated: 2025-01-16*
*Next Review: After Phase 1 completion*