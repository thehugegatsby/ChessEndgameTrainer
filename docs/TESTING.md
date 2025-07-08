# 🧪 Testing Guide - ChessEndgameTrainer

## 📊 Current Status (2025-07-08)
- **Coverage**: ~78% (Statement) - Goal: 80%
- **Test Success**: 99% (1100/1115 passing, 15 skipped)
- **Architecture**: Test Pyramid with Unit > Integration > E2E
- **Critical Bugs Found**: Perspective transformation fixed through testing

## 🚀 Quick Start

```bash
npm test                           # Run all tests
npm run test:coverage              # Overall coverage (~39% including UI)
npm run test:coverage:business     # Business logic only (~78% - more accurate)
npm run test:watch                 # Watch mode for development
```

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
Full system tests simulating real user interactions.

**Location**: `tests/e2e/[workflow]/`  
**Tool**: Playwright  
**Example**:
```typescript
// tests/e2e/training/complete-puzzle.spec.ts
test('complete endgame puzzle', async ({ page }) => {
  await page.goto('/train/king-rook-vs-king');
  await page.click('[data-square="e2"]');
  await page.click('[data-square="e4"]');
  await expect(page.locator('.move-quality')).toContainText('✓');
});
```

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

## ✅ Testing Checklist

Before committing, ensure your tests:

- [ ] **Single Responsibility**: Each test checks one thing
- [ ] **Self-Explanatory**: Clear test names, no comments needed
- [ ] **Deterministic**: Same result every time
- [ ] **Independent**: Order doesn't matter
- [ ] **Fast**: Unit tests < 50ms each
- [ ] **Comprehensive**: Happy path + edge cases + errors
- [ ] **Maintainable**: DRY principles, shared test utilities

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

## 🔗 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Docs](https://playwright.dev/docs/intro)
- Project-specific: `/tests/README.md` for setup

---

**Last Updated**: 2025-07-08
**Next Review**: When reaching 80% coverage goal