# Testing Guidelines

**Target**: LLM comprehension for testing patterns and strategies
**Environment**: WSL + VS Code + Windows
**Updated**: 2025-01-13

## 🧪 Testing Architecture

### Testing Pyramid

```
                    /\
                   /  \
                  /E2E \     ← Playwright (DISABLED - Rewrite planned)
                 /______\
                /        \
               /Integration\  ← Component + Service integration
              /__________\
             /            \
            /    Unit      \   ← Jest (Business logic)
           /______________\
```

## 📁 Test Directory Structure

```
tests/
├── unit/                    # Jest unit tests
│   ├── hooks/              # Hook testing
│   ├── lib/                # Library testing
│   ├── services/           # Service testing
│   └── components/         # Component testing
├── e2e/                    # E2E tests (DISABLED - see scripts comments)
│   ├── domains/            # Domain-specific tests (legacy)
│   ├── helpers/            # E2E test helpers (legacy)
│   └── fixtures/           # Test data (legacy)
└── integration/            # Integration tests
```

## 🎯 Unit Testing Patterns

### Hook Testing Pattern

**File**: `/tests/unit/hooks/useEvaluation.test.ts:100-135`
```typescript
describe('useEvaluation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock setup pattern
    mockUnifiedService.getFormattedEvaluation.mockResolvedValue(mockFormattedEvaluation);
    mockUnifiedService.getRawEngineEvaluation.mockResolvedValue(mockEngineEvaluation);
  });
  
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useEvaluation({
      fen: TEST_FENS.STARTING_POSITION,
      isEnabled: false
    }));

    expect(result.current.evaluations).toEqual([]);
    expect(result.current.lastEvaluation).toBeNull();
    expect(result.current.isEvaluating).toBe(false);
  });
  
  it('should evaluate position when enabled', async () => {
    const { result } = renderHook(() => useEvaluation({
      fen: TEST_FENS.STARTING_POSITION,
      isEnabled: true
    }));

    await waitFor(() => {
      expect(result.current.isEvaluating).toBe(false);
    });

    expect(mockUnifiedService.getFormattedEvaluation).toHaveBeenCalledWith(
      TEST_FENS.STARTING_POSITION,
      'w'
    );
  });
});
```

### Service Testing Pattern

**File**: `/tests/unit/services/tablebase/MockTablebaseService.test.ts:25-50`
```typescript
describe('MockTablebaseService', () => {
  let service: MockTablebaseService;
  
  beforeEach(() => {
    service = new MockTablebaseService({
      maxPieces: 7,
      enableCaching: true,
      cacheTtl: 3600,
      timeout: 2000
    });
  });
  
  describe('lookupPosition', () => {
    it('should return win for KQvK endgame', async () => {
      const result = await service.lookupPosition('8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1');
      
      expect(result).not.toBeNull();
      expect(result!.wdl).toBe(2);
      expect(result!.category).toBe('win');
      expect(result!.precise).toBe(true);
    });
    
    it('should return null for positions with too many pieces', async () => {
      const result = await service.lookupPosition(TEST_FENS.STARTING_POSITION);
      
      expect(result).toBeNull();
    });
  });
});
```

### Provider Testing Pattern

**File**: `/tests/unit/lib/chess/evaluation/providerAdapters.test.ts:40-80`
```typescript
describe('EngineProviderAdapter', () => {
  let adapter: EngineProviderAdapter;
  let mockEngine: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { engine } = require('../../../../../shared/lib/chess/engine/singleton');
    mockEngine = engine;
    adapter = new EngineProviderAdapter();
  });

  it('should return engine evaluation with score', async () => {
    const mockEvaluationResult = {
      score: 150,
      mate: null,
      depth: 20,
      pv: ['e2e4', 'e7e5'],
      pvString: 'e2e4 e7e5'
    };
    
    mockEngine.evaluatePositionEnhanced.mockResolvedValue(mockEvaluationResult);
    
    const result = await adapter.getEvaluation(TEST_FEN, 'w');
    
    expect(result).toEqual({
      score: 150,
      mate: null,
      evaluation: '1.50',
      depth: 20,
      pv: ['e2e4', 'e7e5'],
      pvString: 'e2e4 e7e5'
    });
  });
});
```

## 🎭 Mocking Patterns

### Service Mocking

```typescript
// Mock pattern: Service interface mocking
const mockUnifiedService = {
  getFormattedEvaluation: jest.fn(),
  getPerspectiveEvaluation: jest.fn(),
  getRawEngineEvaluation: jest.fn()
};

jest.mock('@shared/lib/chess/evaluation/unifiedService', () => ({
  UnifiedEvaluationService: jest.fn().mockImplementation(() => mockUnifiedService)
}));
```

### Engine Mocking

```typescript
// Mock pattern: Singleton engine mocking
jest.mock('../../../../../shared/lib/chess/engine/singleton', () => ({
  engine: {
    evaluatePositionEnhanced: jest.fn()
  }
}));
```

### Component Mocking

```typescript
// Mock pattern: Component dependency mocking
jest.mock('@shared/lib/chess/evaluation/providerAdapters', () => ({
  EngineProviderAdapter: jest.fn(),
  TablebaseProviderAdapter: jest.fn()
}));
```

## 🚀 E2E Testing Status

### Current Status: DISABLED

**E2E Testing Infrastructure Status:**
- **Framework**: Playwright 1.53.2 (installed but disabled)
- **Test Files**: 54 unit test files, 951 total tests
- **E2E Scripts**: Commented out in package.json with `_` prefix
- **Status**: E2E tests require complete rewrite

### E2E Rewrite Plan (Future)

**Planned E2E Infrastructure:**
```typescript
// Future: Page Object Pattern
export class TrainingPageHelpers {
  constructor(private page: Page) {}
  
  async makeMove(notation: string): Promise<void> {
    // E2E pattern: Direct UI interaction
    await this.page.click(`[data-move="${notation}"]`);
    
    // E2E pattern: Wait for UI update
    await this.page.waitForSelector('[data-testid="move-made"]', {
      state: 'visible',
      timeout: 5000
    });
  }
  
  async waitForEngineResponse(): Promise<void> {
    // E2E pattern: Wait for evaluation display
    await this.page.waitForSelector('[data-testid="evaluation-complete"]', {
      timeout: 10000
    });
  }
}
```

### Mock Service Pattern (Current)

**File**: `/tests/unit/services/tablebase/MockTablebaseService.test.ts:25-50`
```typescript
// Current pattern: Mock services for deterministic testing
class MockEngineService {
  async evaluatePosition(fen: string): Promise<EngineEvaluation> {
    // Instant, deterministic responses for testing
    return {
      score: this.calculateMockScore(fen),
      depth: 20,
      pv: this.generateMockPV(fen),
      mate: this.checkMockMate(fen)
    };
  }
}
```

## 📊 Coverage Patterns

### Coverage Requirements

```json
// jest.config.js coverage thresholds
{
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 75,
      "lines": 75,
      "statements": 75
    },
    "./shared/lib/": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Coverage Exclusions

```typescript
// Coverage pattern: Exclude development utilities
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  window.testBridge = new TestBridge(store);
}

// Coverage pattern: Exclude error paths that can't be tested
/* istanbul ignore next */
throw new Error('Unreachable code path');
```

## 🔧 Test Infrastructure

### Current Test Commands

**Available Test Scripts:**
```bash
# Core testing commands
npm test                    # Run all tests (Jest 29.7)
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
npm run test:performance    # Performance tests
npm run test:regression     # Regression tests
npm run test:all           # All test categories
npm run test:ci            # CI pipeline tests

# E2E commands (DISABLED)
# _test:e2e                 # E2E tests (commented out)
# _test:e2e:headed          # Headed E2E tests (commented out)
# _test:e2e:ui              # E2E UI mode (commented out)
```

### Mock Services Architecture

**Current Pattern**: Mock services provide instant, deterministic responses:
```typescript
// Mock pattern: Instant evaluation responses
class MockEngineService {
  async evaluatePosition(fen: string): Promise<EngineEvaluation> {
    // No actual engine - instant response
    return this.generateMockEvaluation(fen);
  }
}

// Mock pattern: Tablebase simulation
class MockTablebaseService {
  async lookupPosition(fen: string): Promise<TablebaseResult | null> {
    // Simulate 7-piece tablebase lookup
    return this.simulateTablebaseLookup(fen);
  }
}
```

### Test Data Factories

**File**: `/tests/factories/PositionFactory.ts:10-25`
```typescript
export class PositionFactory {
  static createKQvK(): TestPosition {
    return {
      fen: '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1',
      expectedEvaluation: { wdl: 2, category: 'win' },
      description: 'King and Queen vs King endgame'
    };
  }
  
  static createDrawnEndgame(): TestPosition {
    return {
      fen: '8/8/8/8/8/8/4K3/4k3 w - - 0 1',
      expectedEvaluation: { wdl: 0, category: 'draw' },
      description: 'King vs King drawn endgame'
    };
  }
}
```

### Mock Data Fixtures

**File**: `/shared/testing/TestFixtures.ts:10-25`
```typescript
export const TEST_FENS = {
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  WHITE_ADVANTAGE: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
  KQK_TABLEBASE_WIN: '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1',
  KRK_TABLEBASE_DRAW: '8/8/8/8/8/3k4/8/3K3R b - - 0 1'
};

export const MOCK_EVALUATIONS = {
  POSITIVE_ENGINE: {
    score: 150,
    mate: null,
    evaluation: '1.50',
    depth: 20
  },
  MATE_EVALUATION: {
    score: 10000,
    mate: 3,
    evaluation: '#3',
    depth: 15
  }
};
```

## 🎯 Test Organization

### Test Categories

```typescript
// Test organization pattern: Descriptive nesting
describe('useEvaluation Hook', () => {
  describe('Basic Functionality', () => {
    it('should initialize with empty state', () => {});
    it('should not evaluate when disabled', () => {});
  });
  
  describe('Engine Evaluations', () => {
    it('should evaluate position when enabled', () => {});
    it('should handle mate evaluations', () => {});
  });
  
  describe('Error Handling', () => {
    it('should handle evaluation errors', () => {});
    it('should not set error for AbortError', () => {});
  });
});
```

### Current Test Statistics

**Jest 29.7 Framework Statistics:**
- **Total Test Suites**: 50 passing, 1 failing
- **Total Tests**: 951 tests (950 passing, 1 failing)
- **Test Files**: 54 unit test files
- **Framework**: Jest 29.7.0 with @swc/jest transform
- **Testing Library**: React Testing Library 14.2.1
- **Environment**: jsdom with setupFilesAfterEnv

### Test Naming Convention

```typescript
// Naming pattern: Should + behavior + context
it('should return win for KQvK endgame', () => {});
it('should handle evaluation errors gracefully', () => {});
it('should cache results for identical positions', () => {});
it('should prioritize tablebase over engine evaluation', () => {});
```

## 🚨 Anti-Patterns to Avoid

### ❌ Timing-Based Tests

```typescript
// Anti-pattern: Timing assertions
it('should parse quickly', async () => {
  const start = Date.now();
  await parseUCI(line);
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(10); // ❌ Flaky
});

// ✅ Better: Functional validation
it('should parse UCI line correctly', async () => {
  const result = await parseUCI(line);
  expect(result.isValid).toBe(true);
  expect(result.evaluation.score).toBe(150);
});
```

### ❌ Implementation Details Testing

```typescript
// Anti-pattern: Testing implementation
it('should call internal method', () => {
  const spy = jest.spyOn(service, 'internalMethod');
  service.publicMethod();
  expect(spy).toHaveBeenCalled(); // ❌ Implementation detail
});

// ✅ Better: Behavior testing
it('should return correct result', () => {
  const result = service.publicMethod();
  expect(result).toEqual(expectedResult);
});
```

### ❌ Magic Values

```typescript
// Anti-pattern: Magic values
expect(result.score).toBe(150); // ❌ What does 150 mean?

// ✅ Better: Named constants
expect(result.score).toBe(EXPECTED_ADVANTAGE_SCORE);
expect(result.category).toBe(TablebaseCategory.WIN);
```

---

**Next**: Review [shared/](../shared/) directory documentation for specific implementation patterns.