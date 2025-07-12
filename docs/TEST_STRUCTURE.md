# Test Structure Documentation

## Overview
This document provides a comprehensive overview of the test structure and recent improvements in the ChessEndgameTrainer project.

## Test Coverage Progress (as of 2025-07-12)

### Overall Progress
- **Initial Coverage**: 37.47% statements, 28.75% branches
- **Current Coverage**: 47.85% statements, 39.32% branches  
- **Improvement**: +10.38% statement coverage

### Coverage by Service
| Service | Coverage | Tests | Description |
|---------|----------|-------|-------------|
| **EngineService** | 89.33% | 28 tests | Singleton pattern, worker management |
| **ScenarioEngine Core** | 100% | 125 tests | Complete module coverage |
| **EvaluationService** | 93.82% | 22 tests | Perspective correction, dual evaluation |
| **MistakeAnalyzer** | 96.93% | 47 tests | Adaptive thresholds, explanations |
| **TablebaseClassifier** | 97.29% | 49 tests | Tablebase-first classification |

## Test Directory Structure

```
tests/
├── unit/                      # Unit tests (main focus)
│   ├── app/                   # App initialization
│   ├── cache/                 # Caching layer (LRU, Evaluation)
│   ├── chess/                 # Chess logic
│   ├── components/            # React components
│   ├── engine/                # Engine integration
│   ├── hooks/                 # React hooks
│   ├── lib/                   # Core libraries
│   │   ├── chess/
│   │   │   ├── ScenarioEngine/
│   │   │   │   ├── core/     # 100% coverage
│   │   │   │   └── *.test.ts
│   │   │   ├── evaluation/
│   │   │   └── engine/
│   │   └── training/
│   ├── services/
│   │   └── mistakeAnalysis/  # 97% coverage
│   ├── store/                # Zustand store
│   ├── ui/                   # UI components
│   └── utils/                # Utilities
├── integration/              # Integration tests
├── e2e/                      # End-to-end tests
├── smoke/                    # Basic functionality
├── __mocks__/               # Global mocks
├── fixtures/                # Test data
├── helpers/                 # Test utilities
└── _quarantined_e2e/        # Legacy E2E tests (excluded)
```

## Recent Test Additions (Phase 2)

### 1. EngineService Tests (89.33% coverage)
**File**: `tests/unit/services/EngineService.test.ts`
- Tests singleton pattern using `jest.isolateModules()`
- Worker lifecycle management
- Memory optimization and LRU eviction
- Error handling and recovery
- Concurrent request handling

**Key Testing Patterns**:
```typescript
jest.isolateModules(() => {
  const { EngineService } = require('@shared/services/chess/EngineService');
  // Test singleton in isolation
});
```

### 2. ScenarioEngine Core Tests (100% coverage)
**Files**: 
- `tests/unit/lib/chess/ScenarioEngine/index.test.ts`
- `tests/unit/lib/chess/ScenarioEngine/core/*.test.ts`

**Modules Tested**:
- **instanceManager**: FEN validation, instance tracking
- **evaluationManager**: Engine/tablebase evaluation, dual results
- **moveHandler**: Move validation, UCI conversion
- **tablebaseManager**: WDL perspective correction, DTM handling
- **utilities**: Helper functions, statistics

### 3. EvaluationService Tests (93.82% coverage)
**File**: `tests/unit/lib/chess/ScenarioEngine/evaluationService.test.ts`
- Perspective correction (White vs Black)
- Mistake detection algorithms
- Dual evaluation (engine + tablebase)
- Edge cases (JavaScript -0 vs 0)
- Timeout handling for tablebase positions

**Fixed Issue**: JavaScript -0 handling
```typescript
// Fixed with explicit check
const wdlFromCurrentPlayer = info.result.wdl === 0 ? 0 : -info.result.wdl;
```

### 4. MistakeAnalyzer Tests (96.93% coverage)
**File**: `tests/unit/services/mistakeAnalysis/mistakeAnalyzer.test.ts`
- Adaptive thresholds by skill level (Beginner/Intermediate/Advanced/Expert)
- Move classification (Perfect/Correct/Imprecise/Error/Blunder/Critical)
- Human-readable explanation generation
- Theme-based advice (Tactics/Endgame/King Safety)
- Config validation

### 5. TablebaseClassifier Tests (97.29% coverage)
**File**: `tests/unit/services/mistakeAnalysis/tablebaseClassifier.test.ts`
- Tablebase-first move classification
- Position type changes (win→draw, win→loss, etc.)
- DTM (Distance to Mate) optimality
- Fallback to engine evaluation for 8+ pieces
- Skill level adapted explanations

## Testing Best Practices Applied

### 1. Comprehensive Edge Case Testing
- Null/undefined handling
- Boundary values
- Error scenarios
- Race conditions
- JavaScript quirks (-0 vs 0)

### 2. Type Safety
- Minimal use of `as any`
- Proper TypeScript mock types
- `jest.Mocked<T>` for type-safe mocks

### 3. Test Organization
- AAA pattern (Arrange, Act, Assert)
- Descriptive test names
- Logical grouping with `describe` blocks
- Helper functions for test data creation

### 4. Mock Isolation
```typescript
// Example: Testing singleton pattern
jest.isolateModules(() => {
  // Each test gets fresh module instance
});
```

## Test Execution

### Running Specific Test Suites
```bash
# Run all unit tests
npm test -- tests/unit

# Run specific service tests
npm test -- tests/unit/services/mistakeAnalysis

# Run with coverage
npm test -- --coverage --collectCoverageFrom="shared/services/**"

# Run in watch mode
npm test -- --watch
```

### Coverage Reports
```bash
# Generate full coverage report
npm test -- --coverage

# View coverage in browser
open coverage/lcov-report/index.html

# Check specific module coverage
npm test -- --coverage --collectCoverageFrom="shared/lib/chess/**"
```

## Known Issues and Solutions

### 1. Quarantined E2E Tests
- **Issue**: Some tests import from `_quarantined_e2e` directory
- **Solution**: Skip these tests or fix imports
- **Files affected**: `config-adapter.test.ts`, `BoardComponent.test.ts`

### 2. Worker Mock Requirements
- **Issue**: Worker API needs proper mocking
- **Solution**: Set up global Worker mock before imports
```typescript
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn()
}));
```

### 3. Async Test Patterns
- **Issue**: Timing issues with async operations
- **Solution**: Use proper async/await and jest timers
```typescript
jest.useFakeTimers();
// ... test code
jest.runAllTimers();
jest.useRealTimers();
```

## Next Steps

### Phase 2 Continuation
- [ ] Improve Store coverage (69% → 85%)
- [ ] Test remaining services with 0% coverage
- [ ] Clean up quarantined test imports

### Phase 3 Goals
- [ ] Add visual regression tests
- [ ] Performance benchmarking
- [ ] Mobile-specific testing
- [ ] Integration test coverage

## Quality Metrics

### Current Metrics
- **Total Tests**: 1,113 passing
- **Test Suites**: 52 passing
- **Execution Time**: ~25 seconds
- **Test/Code Ratio**: ~1.2:1

### Target Metrics
- **Coverage Goal**: 80% for critical paths, 60% overall
- **Test Execution**: <30 seconds for full suite
- **Zero Flaky Tests**: 100% deterministic results

---

**Last Updated**: 2025-07-12
**Next Review**: When reaching 60% overall coverage