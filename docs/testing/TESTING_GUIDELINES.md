# Testing Guidelines

**Purpose**: LLM-optimized testing patterns for simplified architecture
**Last Updated**: 2025-08-01
**Architecture Version**: 3.0 (Tablebase-Only)

## 🧪 Testing Architecture

### Testing Pyramid

```
                    /\
                   /  \
                  /E2E \     ← Playwright (Active - Clean Architecture)
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
├── e2e/                    # E2E tests (Active - Clean Architecture)
│   ├── domains/            # Domain-specific tests (core-training, error-recovery)
│   ├── fixtures/           # MSW server and test data
│   └── global-setup.ts     # E2E test configuration
└── integration/            # Integration tests
```

## 🎯 Unit Testing Patterns

### Service Testing Pattern

**File**: `/tests/unit/lib/chess/AnalysisService.test.ts`

```typescript
describe("AnalysisService", () => {
  let service: AnalysisService;
  let mockEngine: any;
  let mockTablebaseService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine = {
      evaluatePosition: jest.fn(),
      findBestMove: jest.fn(),
    };
    mockTablebaseService = {
      getEvaluation: jest.fn(),
      getTopMoves: jest.fn(),
    };
    service = AnalysisService.getInstance();
  });

  it("should prioritize tablebase over engine", async () => {
    mockTablebaseService.getEvaluation.mockResolvedValue({
      isAvailable: true,
      result: { wdl: 2, category: "win" },
    });

    const result = await service.analyzePosition(TEST_FEN);

    expect(mockTablebaseService.getEvaluation).toHaveBeenCalled();
    expect(mockEngine.evaluatePosition).not.toHaveBeenCalled();
  });
});
```

### Hook Testing Pattern

**File**: `/tests/unit/hooks/useEvaluation.test.ts`

```typescript
// Mock pattern: Service mocking for hooks
const mockAnalysisService = {
  analyzePosition: jest.fn(),
  getBestMove: jest.fn(),
  assessMoveQuality: jest.fn(),
};

jest.mock("@shared/lib/chess/AnalysisService", () => ({
  analysisService: mockAnalysisService,
}));

describe("useEvaluation", () => {
  it("should debounce evaluation requests", async () => {
    const { result } = renderHook(() => useEvaluation());

    // Trigger multiple rapid changes
    act(() => result.current.evaluatePosition(FEN1));
    act(() => result.current.evaluatePosition(FEN2));
    act(() => result.current.evaluatePosition(FEN3));

    // Wait for debounce
    await waitFor(() => {
      expect(mockAnalysisService.analyzePosition).toHaveBeenCalledTimes(1);
      expect(mockAnalysisService.analyzePosition).toHaveBeenCalledWith(FEN3);
    });
  });
});
```

### TablebaseService Mocking

```typescript
// Mock pattern: TablebaseService mocking for tablebase-only architecture
jest.mock("@shared/services/TablebaseService", () => ({
  tablebaseService: {
    getEvaluation: jest.fn().mockResolvedValue({
      isAvailable: true,
      result: { wdl: 2, category: "win", dtz: 5 },
    }),
    getTopMoves: jest.fn().mockResolvedValue([
      { move: "Kf6", category: "win", dtz: 2 },
      { move: "Kd6", category: "win", dtz: 3 },
    ]),
  },
}));
```

### Component Mocking

```typescript
// Mock pattern: Service dependency mocking
jest.mock("@shared/lib/chess/AnalysisService", () => ({
  analysisService: {
    analyzePosition: jest.fn().mockResolvedValue({
      evaluation: 150,
      displayText: "+1.5",
      className: "advantage",
    }),
  },
}));

jest.mock("@shared/services/TablebaseService", () => ({
  tablebaseService: {
    getEvaluation: jest.fn(),
    getTopMoves: jest.fn(),
  },
}));
```

## 🌐 MSW (Mock Service Worker) Integration

### MSW Architecture

```typescript
// Location: /shared/mocks/
├── handlers/
│   ├── tablebase.ts      # Lichess API mocks
│   └── database.ts       # Firestore mocks
├── browser.ts           # Browser setup
└── server.ts           # Node setup
```

### MSW Handler Pattern

```typescript
// File: /shared/mocks/handlers/tablebase.ts
export const tablebaseHandlers = [
  rest.get("https://tablebase.lichess.ovh/standard", (req, res, ctx) => {
    const fen = req.url.searchParams.get("fen");

    // Return mock tablebase data
    return res(
      ctx.json({
        wdl: 2,
        dtz: 5,
        category: "win",
      }),
    );
  }),
];
```

## 📋 Test Fixture Guidelines

### Using TestFixtures.ts

```typescript
import {
  TestFixtures,
  type ValidatedPosition,
} from "@shared/testing/TestFixtures";

// Get specific position
const position = TestFixtures.getPosition("pawn-k-k");

// Get all positions of a type
const matePositions = TestFixtures.getPositionsByType("mate");

// Validate FEN
const isValid = TestFixtures.validateFEN(fen);
```

### FEN Position Standards

1. **Always use validated FENs** from TestFixtures
2. **Never hardcode FENs** in tests
3. **Use descriptive position names** (e.g., 'rook-mate-in-2')

## 🔧 Configuration

### Jest Configuration

```javascript
// File: /config/jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
  moduleNameMapper: {
    "^@shared/(.*)$": "<rootDir>/shared/$1",
  },
};
```

### Test Environment Setup

```typescript
// File: /tests/setup/jest.setup.js
// Mock Web Worker API
global.Worker = jest.fn();

// Mock WASM
global.WebAssembly = {
  instantiate: jest.fn(),
  compile: jest.fn(),
};
```

## ✅ Testing Checklist

Before committing tests:

- [ ] Tests use simplified architecture (AnalysisService, not old providers)
- [ ] Mocks reflect current service structure
- [ ] FENs from TestFixtures only
- [ ] Async operations properly awaited
- [ ] No hardcoded timeouts
- [ ] Clear test descriptions
- [ ] Proper cleanup in afterEach
- [ ] Coverage ≥80% for new code

## 🚀 Running Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run all tests (unit + integration)
npm run test:all

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- TablebaseService.test.ts

# Run in watch mode
npm run test:watch
```

## 📝 Migration Notes

**From v2.0 to v3.0 Testing (Tablebase-Only)**:

- **E2E Tests**: Updated terminology from "engine" to "tablebase"
- **Test Structure**: Cleaned up obsolete E2E tests (modern-driver-api, app-platform-integration)
- **Configuration**: Optimized Next.js config for E2E test environment
- **Architecture**: Pure tablebase-only testing approach

**From v1.0 to v2.0 Testing**:

- Replace `UnifiedEvaluationService` mocks with `AnalysisService`
- Remove `EngineProviderAdapter`, `TablebaseProviderAdapter` mocks
- Use `getSimpleEngine()` for engine mocking
- Direct `tablebaseService` mocking instead of adapters
