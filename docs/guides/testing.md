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

**Vitest** - Single framework for all tests (Migration complete as of 2025-08-14)

- **Unit tests**: `src/features/*/`, `src/shared/*/` (co-located with source)
- **Feature tests**: `src/features/*/` (3 domains: chess-core, tablebase, training)
- **Integration tests**: `src/tests/integration/` (API mocking, cross-feature)
- **E2E tests**: `src/tests/e2e/` (Playwright, separate pipeline)
- **Configs**: `config/testing/vitest.*.config.ts`

### 📦 Module Resolution Strategy (2025-01-13)

**Migration Plan:** Schrittweise von CommonJS zu ES6 Modules

```typescript
// ✅ NEUE Tests - ES6 imports verwenden
import { showErrorToast } from '@shared/utils/toast';
import { useGameStore } from '@shared/store/hooks';

// ⚠️ ALTE Tests - Nicht anfassen (require bleibt)
const { showErrorToast } = require('@shared/utils/toast'); // Legacy
```

**CI-Fix:** `vite-tsconfig-paths` Plugin löst TypeScript path aliases
- Installiert und konfiguriert in `vitest.config.ts`
- Ermöglicht `@shared/` imports in CI-Umgebung
- Keine Änderungen an alten Tests nötig

## 3. Test Commands

Execute tests using `pnpm` for consistent WSL compatibility:

### Basic Commands
```bash
pnpm test                    # Smart test runner (auto-detects WSL2, warns >100 tests)
pnpm test <file>             # Run specific test file
pnpm test --project <name>   # Run feature-specific tests
pnpm test:watch              # Watch mode for development
pnpm test:coverage           # Tests with coverage report
```

### Feature-Based Testing (NEW - Phase 0+1 Implementation)
```bash
pnpm test:chess              # Test chess-core feature only
pnpm test:tablebase          # Test tablebase feature only
pnpm test:training           # Test training feature only
pnpm test:shared             # Test shared utilities only
pnpm test:feature <name>     # Generic feature test command
```

**Note:** Currently using `vitest.workspace.ts` for project separation. This shows a deprecation warning but works correctly. Will migrate to `test.projects` field in root config in future update.

### Legacy Commands
```bash
pnpm test:unit               # Unit tests with unit config
pnpm test:integration        # Integration tests
pnpm test:e2e                # Playwright E2E tests
pnpm test:all                # Run all test suites
```

### WSL2 Optimizations (Auto-Applied)
- Automatic detection: `WSL_DISTRO_NAME` environment variable
- Pool type: `forks` instead of `threads` (avoids pipe issues)
- Worker limits: Max 2 workers (prevents memory issues)
- Sequential execution: `fileParallelism: false` for stability

### 🚨 Performance Guard (NEW)

The smart test runner includes a performance guard to prevent accidental full-suite runs:

```bash
# When running >100 tests, you'll see:
⚠️  WARNING: About to run 142 test files
This may take several minutes. Continue? (y/n/s)
  y = Yes, run all tests
  n = No, cancel
  s = Skip to specific feature tests

# To bypass the guard:
CONFIRM_ALL=1 pnpm test        # Auto-confirm
FORCE_TEST=1 pnpm test          # Skip all confirmations
CI=true pnpm test               # CI mode (auto-confirm)
```

### 🚨 Individual Test Execution

When running individual test files, always use the proper vitest config to ensure path mappings work:

```bash
# ❌ WRONG - Ignores @shared, @tests, @features path mappings
pnpm exec vitest run path/to/test.ts

# ✅ CORRECT - Uses proper config with all path aliases
pnpm exec vitest --config=config/testing/vitest.unit.config.ts run path/to/test.ts

# Alternative: Use standard commands that include proper config
pnpm test path/to/test.ts                    # Smart router auto-detects
pnpm test:feature chess-core                 # Feature-specific tests
```

**Why this matters:** Without the proper config, TypeScript path mappings like `@shared/*`, `@tests/*`, `@features/*` will fail to resolve, causing import errors.

## 4. Common Vitest Issues

### Async Promise Patterns

For **unhandled promise rejections** and race conditions in promise cleanup:  
→ **[Vitest Async Patterns](../troubleshooting/vitest-async-patterns.md)**

**Keywords for search:** unhandled promise rejection, finally handler, Promise.allSettled, race condition, afterEach cleanup

**Quick Fix Pattern:**
```typescript
// ❌ WRONG: Store promise WITH finally()
const promise = executeQuery().finally(() => cleanup());
pendingRequests.set(id, promise);

// ✅ CORRECT: Store raw promise, attach finally() to return
const promise = executeQuery();
pendingRequests.set(id, promise);
return promise.finally(() => cleanup());
```

## 5. Test Patterns

### Test Directory Structure

```
src/
├── features/*/       # Unit & feature tests (co-located)
├── shared/*/         # Shared utility tests (co-located)
└── tests/
    ├── integration/  # Cross-feature integration tests (Vitest)
    ├── e2e/          # End-to-end tests (Playwright)
    └── helpers/      # Test utilities and fixtures
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
