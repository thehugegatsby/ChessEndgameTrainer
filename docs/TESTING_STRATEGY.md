# TESTING_STRATEGY.md

<!-- nav: docs/README#development | tags: [testing, wsl] | updated: 2025-08-12 -->

## 1. ⚠️ CRITICAL: Test Execution in WSL

**WSL Rules:** → [WSL2_ENV.md](./WSL2_ENV.md#testing-commands)

**NEVER** use `--` with `pnpm test` as it causes crashes in WSL environments. Always specify the file path directly.

```bash
# ❌ NEVER - crashes in WSL
pnpm test -- --run path/to/test.tsx
pnpm test -- path/to/test.tsx

# ✅ ALWAYS - direct path
pnpm test path/to/test.tsx
```

## 2. Framework

**Vitest** - Single framework for all tests (Jest removed completely)

- **Unit tests**: `src/tests/unit/`
- **Feature tests**: `src/features/*/` (4 domains: chess-core, tablebase, training, move-quality)
- **Integration tests**: Dedicated integration test files
- **Configs**: `vitest.unit.config.ts`, `vitest.integration.config.ts`

## 3. Test Commands

Execute tests using `pnpm` for consistent WSL compatibility:

```bash
pnpm test                    # Run unit tests (src/tests/unit/)
pnpm test:features           # Run feature tests (src/features/)
pnpm test:unit               # Unit tests with unit config
pnpm test:integration        # Integration tests
pnpm test:e2e                # Playwright E2E tests
pnpm test:coverage           # Tests with coverage report
pnpm test:watch              # Watch mode for development
```

## 4. Test Patterns

### Test Directory Structure

```
tests/
├── unit/             # Jest unit tests
├── integration/      # Jest integration tests (MSW-based)
└── e2e/              # Playwright E2E tests
```

### 4.1. Unit Tests (`.test.ts`)

- **Purpose**: Test individual components, hooks, services in isolation
- **Environment**: Standard `jsdom`
- **Location**: `tests/unit/` or `src/features/*/` (Vitest)

**Example: Service Testing**

```typescript
// tests/unit/services/AnalysisService.test.ts
describe("AnalysisService", () => {
  let service: AnalysisService;
  let mockTablebaseService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTablebaseService = { getEvaluation: jest.fn() };
    service = AnalysisService.getInstance();
  });

  it("should prioritize tablebase over engine", async () => {
    mockTablebaseService.getEvaluation.mockResolvedValue({ isAvailable: true });
    await service.analyzePosition("FEN_STRING");
    expect(mockTablebaseService.getEvaluation).toHaveBeenCalled();
  });
});
```

**DO**: Mock external dependencies  
**DON'T**: Make real API calls in unit tests

### 4.2. Integration Tests (`.spec.ts`)

- **Purpose**: Test complete user flows with mocked APIs
- **Environment**: `jest-fixed-jsdom` (MSW v2 compatible)
- **Location**: `tests/integration/`
- **Key Feature**: Uses MSW for API mocking

**Test File Naming**:

- `*.test.ts`: Unit tests (standard jsdom)
- `*.spec.ts`: Integration tests (jest-fixed-jsdom with MSW)

**Example: MSW Handler**

```typescript
// shared/mocks/handlers/tablebase.ts
import { rest } from "msw";

export const tablebaseHandlers = [
  rest.get("https://tablebase.lichess.ovh/standard", (req, res, ctx) => {
    return res(ctx.json({ wdl: 2, category: "win" }));
  }),
];
```

**Real API Tests**:

- File: `*-real-api.integration.spec.ts`
- Command: `pnpm test:real-api`
- Note: Skipped in CI to avoid rate limiting

### 4.3. E2E Tests (Playwright)

- **Purpose**: Full browser automation for critical scenarios
- **Command**: `pnpm test:e2e`
- **Location**: `tests/e2e/`

### 4.4. Test Fixtures

**DO**: Use validated FENs from TestFixtures

```typescript
import { TestFixtures } from "@shared/testing/TestFixtures";
const position = TestFixtures.getPosition("pawn-k-k");
```

**DON'T**: Hardcode FENs directly in tests
