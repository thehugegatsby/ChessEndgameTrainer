# Testing Guidelines

**Target**: LLM comprehension for testing patterns and strategies
**Environment**: WSL + VS Code + Windows
**Updated**: 2025-01-13

## 🧪 Testing Architecture

### Testing Pyramid

```
                    /\
                   /  \
                  /E2E \     ← Playwright (User journeys)
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
├── e2e/                    # Playwright E2E tests
│   ├── domains/            # Domain-specific tests
│   ├── helpers/            # E2E test helpers
│   └── fixtures/           # Test data
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

## 🚀 E2E Testing Patterns

### Page Object Pattern

**File**: `/tests/e2e/helpers.ts:15-35`
```typescript
export class TrainingPageHelpers {
  constructor(private page: Page) {}
  
  async makeMove(notation: string): Promise<void> {
    // E2E pattern: Use test hooks for actions
    await this.page.evaluate((move) => {
      window.testBridge?.makeMove(move);
    }, notation);
    
    // E2E pattern: Wait for UI update
    await this.page.waitForSelector('[data-testid="move-made"]', {
      state: 'visible',
      timeout: 5000
    });
  }
  
  async waitForEngineResponse(moveCount: number): Promise<void> {
    // E2E pattern: Wait for engine evaluation
    await this.page.waitForFunction((count) => {
      return window.testBridge?.getGameState()?.evaluations?.length >= count;
    }, moveCount, { timeout: 10000 });
  }
  
  async getGameState(): Promise<any> {
    // E2E pattern: Extract test state
    return await this.page.evaluate(() => {
      return window.testBridge?.getGameState();
    });
  }
}
```

### Test Bridge Pattern

**File**: `/shared/services/test/TestBridge.ts:25-50`
```typescript
class TestBridge {
  constructor(private store: TrainingStore) {}
  
  // Test bridge pattern: Expose controlled actions
  makeMove(notation: string): void {
    const move = this.parseMove(notation);
    this.store.makeMove(move);
  }
  
  getGameState(): TestGameState {
    const state = this.store.getState();
    return {
      currentFen: state.currentFen,
      moveHistory: state.moveHistory,
      evaluations: state.evaluations
    };
  }
  
  // Test bridge pattern: Reset state for tests
  reset(): void {
    this.store.resetGame();
  }
}

// Global test bridge
declare global {
  interface Window {
    testBridge?: TestBridge;
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
      "branches": 78,
      "functions": 78,
      "lines": 78,
      "statements": 78
    },
    "./shared/lib/": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
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

## 🔧 Test Utilities

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