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

## 🌐 MSW (Mock Service Worker) Integration

### MSW Architecture

**MSW Integration Status**: ✅ **Installed and Configured**
- **Framework**: MSW 2.x with Playwright E2E integration  
- **Purpose**: HTTP request interception for E2E testing
- **Coverage**: API mocking, service worker patterns, deterministic testing

### MSW Setup Pattern

```typescript
// MSW Handler Configuration
// File: tests/e2e/fixtures/msw-handlers.ts
import { http, HttpResponse } from 'msw';
import { E2E } from '../../../shared/constants';

export const handlers = [
  // Mock position service API
  http.get(`${E2E.API_BASE_URL}/api/positions/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      title: `Test Position ${id}`,
      difficulty: 'intermediate'
    });
  }),
  
  // Mock tablebase lookups
  http.get(`${E2E.TABLEBASE_API_URL}/:fen`, ({ params }) => {
    return HttpResponse.json({
      wdl: 0,
      category: 'draw',
      dtm: null
    });
  })
];
```

### MSW Server Configuration

```typescript
// MSW Server Setup  
// File: tests/e2e/fixtures/msw-server.ts
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

export const server = setupServer(...handlers);

// Global setup for all E2E tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

### E2E Test Integration

```typescript
// E2E Test with MSW
// File: tests/e2e/domains/core-training.spec.ts
import { test, expect } from '@playwright/test';
import { server } from '../fixtures/msw-server';
import { http, HttpResponse } from 'msw';

test.describe('Training with MSW', () => {
  test('should handle mocked position loading', async ({ page }) => {
    // Override default handler for specific test
    server.use(
      http.get('/api/positions/1', () => {
        return HttpResponse.json({
          id: '1',
          fen: '8/8/8/8/8/8/4K3/4k1Q1 w - - 0 1',
          title: 'King & Queen vs King',
          difficulty: 'beginner'
        });
      })
    );

    await page.goto('/train/1');
    
    // Verify mocked data is displayed
    await expect(page.locator('[data-testid="position-title"]')).toContainText('King & Queen vs King');
    await expect(page.locator('[data-testid="difficulty"]')).toContainText('beginner');
  });
});
```

### Route Mocking Pattern

```typescript
// Advanced Route Mocking
// File: tests/e2e/fixtures/route-mocking.ts
export class RouteMockingService {
  constructor(private server: SetupServer) {}

  mockPositionNotFound(id: string) {
    this.server.use(
      http.get(`/api/positions/${id}`, () => {
        return new HttpResponse(null, { status: 404 });
      })
    );
  }

  mockSlowResponse(delay: number = 3000) {
    this.server.use(
      http.get('/api/positions/*', async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return HttpResponse.json({ /* data */ });
      })
    );
  }

  mockNetworkError() {
    this.server.use(
      http.get('/api/positions/*', () => {
        return HttpResponse.error();
      })
    );
  }
}
```

### MSW vs Jest Mocking

**Use MSW for**:
- ✅ HTTP requests in E2E tests
- ✅ Service worker testing  
- ✅ Network error simulation
- ✅ API integration testing

**Use Jest mocks for**:
- ✅ Unit test module mocking
- ✅ Function/service interface mocking
- ✅ Component dependency injection
- ✅ Synchronous operation testing

### MSW Best Practices

```typescript
// Best Practice: Type-safe handlers
interface PositionResponse {
  id: string;
  fen: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const createPositionHandler = (data: PositionResponse) => {
  return http.get(`/api/positions/${data.id}`, () => {
    return HttpResponse.json<PositionResponse>(data);
  });
};

// Best Practice: Handler composition
export const createTestHandlers = (scenario: 'success' | 'error' | 'slow') => {
  const baseHandlers = [/* common handlers */];
  
  switch (scenario) {
    case 'error':
      return [...baseHandlers, ...errorHandlers];
    case 'slow':
      return [...baseHandlers, ...slowHandlers];
    default:
      return baseHandlers;
  }
};
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