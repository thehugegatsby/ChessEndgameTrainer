# TESTING_STRATEGY.md

## 1. ⚠️ CRITICAL: Test Execution in WSL

**NEVER** use `--` with `pnpm test` as it causes crashes in WSL environments. Always specify the file path directly.

```bash
# ❌ NEVER - crashes in WSL
pnpm test -- --run path/to/test.tsx
pnpm test -- path/to/test.tsx

# ✅ ALWAYS - direct path
pnpm test path/to/test.tsx
```

## 2. Framework Selection

We employ a dual-framework approach based on test location:

### Jest

- **Use for**: `src/shared/`, `tests/unit/`, `tests/integration/`
- **Example**: `tests/unit/chess.test.ts` for `src/shared/utils/chess.ts`

### Vitest

- **Use for**: `src/features/*/`
- **Example**: `src/features/auth/LoginForm.test.tsx` for `src/features/auth/LoginForm.tsx`

## 3. Test Commands

Execute tests using `pnpm` for consistent WSL compatibility:

```bash
pnpm test                    # Run all unit tests
pnpm test path/to/test.tsx   # Run specific test file
pnpm test:unit               # Jest unit tests only
pnpm test:integration        # Jest integration tests only
pnpm test:real-api           # Real API tests (skipped in CI)
pnpm test:e2e                # Playwright E2E tests
pnpm test:coverage           # Tests with coverage report
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
