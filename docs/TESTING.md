# 🧪 Testing Guide - ChessEndgameTrainer

## 📊 Current Status (2025-01-17)
- **Coverage**: ~78% (Business Logic) / ~47% (Overall) - Goal: 80%
- **Test Success**: 99% (1023/1034 passing, 11 skipped)
- **Architecture**: Test Pyramid with Unit > Integration > E2E
- **E2E Tests**: Complete rewrite - 9 focused ModernDriver tests (was 38 legacy tests)
- **Recent Changes**: E2E test suite migration to ModernDriver architecture + Ready Signal implementation

## 🚀 Quick Start

```bash
npm test                           # Run all tests
npm run test:coverage              # Overall coverage (~39% including UI)
npm run test:coverage:business     # Business logic only (~78% - more accurate)
npm run test:watch                 # Watch mode for development
```

### Test Utilities

We provide centralized test utilities to reduce boilerplate and ensure consistency:

- **Logger Utilities** (`tests/shared/logger-utils.ts`): Type-safe logger mocks
- **Config Adapters** (`tests/e2e/utils/config-adapter.ts`): Configuration transformers

See [TEST_UTILITIES.md](testing/TEST_UTILITIES.md) for detailed documentation.

## 📈 Test Types & Structure

### 1. **Unit Tests** - Isolated Components
Fast, focused tests for individual functions/modules in isolation.

**Location**: `tests/unit/[module]/`  
**Naming**: `ComponentName.test.ts`  
**Example**: 
```typescript
// tests/unit/cache/LRUCache.test.ts
describe('LRUCache', () => {
  it('should evict least recently used item when capacity exceeded', () => {
    const cache = new LRUCache<string>(2);
    cache.set('a', 'value1');
    cache.set('b', 'value2');
    cache.set('c', 'value3'); // 'a' should be evicted
    expect(cache.get('a')).toBeUndefined();
  });
});
```

### 2. **Integration Tests** - Component Interactions
Test how multiple modules work together with realistic dependencies.

**Location**: `tests/integration/[feature]/`  
**Naming**: `Feature.integration.test.ts`  
**Example**:
```typescript
// tests/integration/evaluation/tablebase.integration.test.ts
describe('Tablebase Integration', () => {
  it('should override engine evaluation with tablebase data', async () => {
    const result = await evaluationService.evaluate(knownTablebasePosition);
    expect(result.source).toBe('tablebase');
    expect(result.wdl).toBeDefined();
  });
});
```

### 3. **E2E Tests** - User Workflows
Full system tests simulating real user interactions using Playwright.

**Location**: `tests/e2e/[category]/[test].spec.ts`  
**Tool**: Playwright with ModernDriver  
**Architecture**: Component Object Model with lean orchestrator pattern

#### New Test Architecture (2025-01-17)
Complete rewrite from 38 legacy tests to 8-12 focused ModernDriver tests:

**Structure**:
```
tests/e2e/
├── 00-smoke/           # Basic app functionality (1 test)
├── 01-core-driver/     # ModernDriver core features (5 tests)
│   ├── lifecycle.spec.ts
│   ├── ready-signal.spec.ts    # NEW: App ready detection tests
│   └── ...
├── 02-user-journeys/   # Critical user workflows (4 tests)
└── 03-integration/     # Component integration (3 tests)
```

**Components**:
- **ModernDriver** (`tests/e2e/components/ModernDriver.ts`): Lean orchestrator (442 lines)
- **Component Objects**: BoardComponent, MoveListComponent, EvaluationPanel, NavigationControls
- **Test Bridge**: Deterministic engine responses for reliable testing
- **Helper Services**: GamePlayer, ValidationHelper, PuzzleSolver

**Setup**:
```bash
# Start development server
npm run dev

# Run E2E tests
npm run test:e2e
```

**Example with ModernDriver**:
```typescript
// tests/e2e/02-user-journeys/complete-training.spec.ts
test('should complete training session', async ({ page }) => {
  const driver = new ModernDriver(page, { useTestBridge: true });
  
  // Navigate to training
  await driver.visit('/train/1');
  
  // Make move with deterministic engine response
  await driver.makeMove('e2', 'e4');
  
  // Get game state
  const state = await driver.getGameState();
  expect(state.moveCount).toBe(2); // Player + engine
  expect(state.status).toBe('playing');
  
  // Clean up
  await driver.dispose();
});
```

**Key Improvements**:
- ✅ 76% code reduction (ModernDriver: 442 lines vs AppDriver: 1,889 lines)
- ✅ Component Object Model for clean separation
- ✅ Test Bridge for deterministic behavior
- ✅ Focused test scope (9-12 tests vs 38 legacy tests)
- ✅ Fast execution with mock engine responses
- ✅ Robust ready detection with primary signal + fallback mechanism

## 🎯 Coverage Strategy

### Business Logic vs Overall Coverage
The project has two coverage metrics:

1. **Overall Coverage** (~39%): Includes UI components, pages, etc.
2. **Business Logic Coverage** (~78%): Core functionality only

### Measure Business Logic Coverage
```bash
npm run test:coverage:business
open coverage-business/index.html  # View detailed report
```

### Coverage Goals by Module Type
- **Services & Utilities**: >90% coverage
- **Hooks & Contexts**: >80% coverage  
- **Core Libraries**: >85% coverage
- **UI Components**: Optional (not in business logic metric)

### What Counts as Business Logic?
```javascript
// Included in business logic coverage:
'shared/lib/**'      // Core libraries
'shared/services/**' // Service layer
'shared/hooks/**'    // React hooks
'shared/store/**'    // State management
'shared/utils/**'    // Utilities

// Excluded from business logic coverage:
'shared/components/**' // UI components
'pages/**'            // Next.js pages
'*.d.ts'              // Type definitions
```

## 🏗️ Writing Effective Tests

### Test Structure Pattern
```typescript
describe('ComponentName', () => {
  // Setup
  let service: ServiceType;
  
  beforeEach(() => {
    service = new ServiceType();
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    service.cleanup();
  });
  
  describe('methodName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = service.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });
    
    it('should handle edge case', () => {
      // Test edge cases
    });
    
    it('should handle errors gracefully', () => {
      // Test error scenarios
    });
  });
});
```

### Common Mock Patterns

**Worker API Mocking**:
```typescript
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn()
}));
```

**Logger Mocking**:
```typescript
jest.mock('shared/services/logging', () => ({
  getLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));
```

**Time Control for TTL Testing**:
```typescript
const advanceTime = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

jest.useFakeTimers();
// ... test code
jest.useRealTimers();
```

## 🎨 Domain-Specific Testing

### Chess Evaluation Tests
Critical for accuracy of move quality assessment:

```typescript
// Test perspective transformation
it('should invert evaluation for black player', () => {
  const whiteEval = { score: 100 };
  const blackEval = transformer.transform(whiteEval, 'b');
  expect(blackEval.score).toBe(-100);
});

// Test tablebase integration
it('should prefer tablebase over engine', async () => {
  const position = 'KR vs K endgame FEN';
  const result = await evaluate(position);
  expect(result.source).toBe('tablebase');
});
```

#### Key Chess Testing Scenarios

1. **Tablebase Validation**: Ensure endgames in tablebases ALWAYS return exact tablebase results and correctly override engine estimates
2. **FEN Test Suite**: Build comprehensive tests with known positions (mate in N, draw positions, winning positions) verifying exact numerical and qualitative evaluations
3. **Blunder & Optimal Move Verification**: Test specific moves for correct symbol display
   - Example: Blunder `Kb5` in position `2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1` must show `🚨` (win → draw)
4. **Edge Cases**: Test stalemate, perpetual check, impossible positions, and other rule exceptions

### Cache Testing
For detailed cache testing strategies, see `/tests/unit/cache/CACHE_TEST_STRATEGY.md`

Key cache test areas:
- LRU eviction behavior
- TTL expiration
- Memory management
- Performance benchmarks

### Performance Testing
Ensure operations meet time constraints:

```typescript
describe('Performance', () => {
  it('should complete evaluation within 100ms', async () => {
    const start = performance.now();
    await service.evaluate(position);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

## ✅ Testing Checklist - What Makes a Good Test?

Use this checklist when writing and reviewing tests:

- [ ] **Single Responsibility**: Each test checks exactly one thing
- [ ] **Self-Explanatory**: Clear test names that describe what is being tested
- [ ] **Quick to Read**: Can be understood in seconds without comments
- [ ] **Helpful Failure Messages**: Provides clear information when test fails
- [ ] **Descriptive Names**: Use meaningful names for tests, mocks, and variables
- [ ] **No Magic Values**: Replace `expect(x).toBe(42)` with `const expectedMoveCount = 42`
- [ ] **Order Independent**: Tests pass regardless of execution order
- [ ] **Deterministic**: Always produces the same result
- [ ] **Fast**: Unit tests < 50ms each
- [ ] **Comprehensive**: Covers happy path + edge cases + error scenarios
- [ ] **Maintainable**: Follows DRY principles, uses shared test utilities

## 🏪 Store Testing Best Practices (Zustand)

### Single Source of Truth - Critical Learning
When testing Zustand Store-based components, it's essential to respect the **Single Source of Truth** principle. A common mistake that leads to confusing test failures:

#### ❌ Anti-Pattern: Direct Manipulation + Store Actions
```typescript
// WRONG: Double manipulation leads to conflicts
act(() => {
  const game = useStore.getState().training.game;
  game.move({ from: 'e2', to: 'e4' });          // Direct manipulation
  useStore.getState().makeMove({ from: 'e2', to: 'e4' }); // Store Action → ERROR!
});
```

**Problem**: The first call directly modifies the game state, causing the second call to fail since the move was already executed.

#### ✅ Correct: Use Store Actions Only
```typescript
// CORRECT: Use Store Actions exclusively
act(() => {
  useStore.getState().makeMove({ from: 'e2', to: 'e4' }); // Store manages everything
});
```

### Store Testing Patterns

1. **Avoid Mock Interference**:
   - Component mocks should NEVER override Store state
   - If parent component already calls `setPosition()`, mock must not call `setGame()`
   
2. **Async Store Updates**:
   ```typescript
   // Use waitFor for state-dependent callbacks
   await waitFor(() => {
     expect(onCompleteMock).toHaveBeenCalledWith(true);
   });
   ```

3. **Store Reset Between Tests**:
   ```typescript
   beforeEach(() => {
     useStore.getState().reset();
   });
   ```

4. **Minimal Move Objects**:
   ```typescript
   // Store expects only essential properties
   makeMove({ from: 'e2', to: 'e4' }); // Nothing more!
   ```

### Lessons Learned
- **Store as Single Source of Truth**: Tests must use same interaction patterns as the application
- **No Double Manipulations**: One move = One Store action
- **Mock Hygiene**: Mocks must not override Store state when parent components handle it
- **Consider Asynchronicity**: React components respond asynchronously to Store changes

## 🚦 E2E Ready Signal Pattern

### Overview
The E2E test suite uses an explicit ready signal pattern to ensure tests only start when the application is fully initialized. This eliminates timing-related flakiness.

### Implementation
1. **Frontend Signal** (`_app.tsx`):
   ```typescript
   // App sets data-app-ready based on router + engine status
   document.body.setAttribute('data-app-ready', 'true');  // ready
   document.body.setAttribute('data-app-ready', 'false'); // loading
   document.body.setAttribute('data-app-ready', 'error'); // failed
   ```

2. **Test Driver** (`ModernDriver.ts`):
   ```typescript
   // Primary: Wait for explicit signal
   await page.waitForSelector('body[data-app-ready="true"]');
   
   // Fallback: Check for chess-specific elements
   if (primary fails) {
     await checkBoardVisibility();
     await validateInteractiveElements();
   }
   ```

3. **Configuration** (`constants.js`):
   ```javascript
   appReady: 30000,      // Primary signal timeout
   fallbackReady: 5000   // Fallback detection timeout
   ```

### Testing the Pattern
- `ready-signal.spec.ts`: Tests both primary and fallback paths
- Includes deterministic test that blocks signal to force fallback
- Unit tests verify frontend signal logic

## 🐛 Known Issues & Workarounds

### TrainingBoardZustand Tests
3 tests skipped due to infinite loop in `setGame` useEffect:
```typescript
// Skipped tests:
- "should set position in Zustand store on mount"
- "should update Zustand when making a move"
- "should handle game completion"

// Workaround: Use mock or restructure state management
```

### Worker Mock Limitations
Some Worker-based tests require special handling:
```typescript
// If Worker tests fail, check:
1. Mock is properly set up before imports
2. Cleanup in afterEach
3. No real Worker instantiation
```

## 📝 Best Practices

### 1. **Test Naming Convention**
```typescript
// Format: should_expectedBehavior_when_condition
it('should return cached value when key exists', () => {});
it('should throw error when invalid input provided', () => {});
```

### 2. **Arrange-Act-Assert Pattern**
```typescript
it('should calculate correctly', () => {
  // Arrange
  const calculator = new Calculator();
  const a = 5, b = 3;
  
  // Act
  const result = calculator.add(a, b);
  
  // Assert
  expect(result).toBe(8);
});
```

### 3. **Test Data Builders**
```typescript
const createTestPosition = (overrides = {}) => ({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'w',
  ...overrides
});
```

### 4. **Error Testing**
```typescript
it('should handle errors gracefully', async () => {
  mockService.method.mockRejectedValue(new Error('Network error'));
  
  await expect(service.operation()).rejects.toThrow('Network error');
  expect(logger.error).toHaveBeenCalledWith(
    expect.stringContaining('Network error')
  );
});
```

## 🚀 Running Tests Efficiently

### During Development
```bash
# Run tests for current work
npm run test:watch -- --testPathPattern=cache

# Run with coverage for specific module
npm test -- --coverage --collectCoverageFrom='shared/lib/cache/**'

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.ts
```

### Before Committing
```bash
# Full test suite
npm test

# Check business logic coverage
npm run test:coverage:business

# Lint and type check
npm run lint && npm run type-check
```

### CI/CD Pipeline
Tests run automatically on:
- Every push to any branch
- Pull request creation/update
- Pre-deployment checks

## 📊 Monitoring Test Health

### Key Metrics to Track
1. **Coverage Trend**: Should increase or stay stable
2. **Test Duration**: Watch for slow tests (>1s)
3. **Flaky Tests**: Investigate intermittent failures
4. **Test/Code Ratio**: Aim for 1.5:1 or higher

### When to Add Tests
- **New Feature**: Write tests first (TDD)
- **Bug Fix**: Add regression test
- **Refactoring**: Ensure tests still pass
- **Performance Issue**: Add performance test

## 🔗 Resources & Specialized Guides

### External Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Docs](https://playwright.dev/docs/intro)

### Project-Specific Guides
- **Cache Testing**: `/tests/unit/cache/CACHE_TEST_STRATEGY.md` - Detailed cache testing strategies
- **Test Setup**: `/tests/README.md` - Initial test configuration
- **Agent Config**: `/AGENT_CONFIG.json` - Testing requirements and quality gates

---

**Last Updated**: 2025-01-09
**Next Review**: When reaching 80% coverage goal