# E2E Test Suite

## Overview
Minimale, fokussierte E2E Test-Suite basierend auf ModernDriver (442 Zeilen).

## Test Structure

### 00-smoke/ (1 test)
- `basic-app-load.spec.ts` - Verifiziert dass die App lädt und grundlegend funktioniert

### 01-core-driver/ (4 tests)
- `lifecycle.spec.ts` - Initialization, disposal, error handling
- `components.spec.ts` - Component access patterns  
- `test-bridge.spec.ts` - Mock engine integration (TODO)
- `navigation.spec.ts` - Page navigation & routing (TODO)

### 02-user-journeys/ (4 tests)
- `complete-training.spec.ts` - Full training session happy path
- `make-moves.spec.ts` - Move execution and validation
- `position-navigation.spec.ts` - Navigate between positions
- `evaluation-display.spec.ts` - Engine evaluation display (TODO)

### 03-integration/ (3 tests)
- `board-movelist-sync.spec.ts` - Component synchronization (TODO)
- `state-persistence.spec.ts` - Session state management
- `error-recovery.spec.ts` - Error handling and recovery

## Test Philosophy

1. **Quality over Quantity**: 11 solid tests > 38 flaky tests
2. **Fast Feedback**: All tests use Test Bridge for deterministic results
3. **Clear Scope**: Each test has single responsibility
4. **Maintainable**: Based on Component Object Model

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/00-smoke/basic-app-load.spec.ts

# Run with UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

## Test Patterns

All tests follow the ModernDriver pattern:

```typescript
test('description', async ({ page }) => {
  const driver = new ModernDriver(page, { useTestBridge: true });
  await driver.visit('/train/1');
  
  // Test logic here
  
  await driver.dispose();
});
```

## Coverage Goals

- **Core Functionality**: 100% of critical paths
- **User Journeys**: Top 4 most common workflows  
- **Error Scenarios**: Graceful degradation
- **Performance**: Sub-2s per test with Test Bridge