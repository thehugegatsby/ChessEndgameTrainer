# ModernDriver Migration Guide

## Overview

AppDriver is deprecated as of 2025-01-17 and will be removed on 2025-02-28. This guide helps you migrate from AppDriver (1847 lines) to ModernDriver (300 lines).

## Why Migrate?

- **6x smaller codebase**: 300 lines vs 1847 lines
- **Cleaner architecture**: Proper separation of concerns with Component Object Model
- **Built-in Test Bridge**: Deterministic testing without flaky waits
- **Better error handling**: Custom error types with clear context
- **Modern patterns**: Follows "sauberste, langfristig beste Lösung" principle

## Quick Start

### Before (AppDriver)
```typescript
import { AppDriver } from '../components/AppDriver';

const driver = new AppDriver(page);
await driver.waitForPageReady();
await driver.makeMove('e2', 'e4');
const state = await driver.getCurrentState();
```

### After (ModernDriver)
```typescript
import { ModernDriver } from '../components/ModernDriver';

const driver = new ModernDriver(page, { useTestBridge: true });
await driver.visit('/train/1');
await driver.makeMove('e2', 'e4');
const state = await driver.getGameState();
```

## Key Differences

### 1. Initialization

**AppDriver**:
```typescript
const driver = new AppDriver(page, {
  baseUrl: 'http://localhost:3002',
  autoWaitForEngine: true,
  autoSetupTestBridge: true
});
```

**ModernDriver**:
```typescript
const driver = new ModernDriver(page, {
  useTestBridge: true,  // Enables deterministic testing
  defaultTimeout: 30000
});
```

### 2. Navigation

**AppDriver**:
```typescript
await driver.visit();  // Goes to baseUrl
await driver.visit('/train/1');
await driver.waitForPageReady();
```

**ModernDriver**:
```typescript
await driver.visit('/train/1');  // Automatically waits until ready
```

### 3. Making Moves

**AppDriver**:
```typescript
// Multiple ways to make moves
await driver.makeMoveAndAwaitUpdate('e2', 'e4');
await driver.board.makeMove('e2', 'e4');
await driver.makeMove('e2', 'e4');
```

**ModernDriver**:
```typescript
// One consistent way
await driver.makeMove('e2', 'e4');
// Or via board component
await driver.board.makeMove('e2', 'e4');
```

### 4. Game State

**AppDriver**:
```typescript
const state = await driver.getCurrentState();
const fen = await driver.getCurrentFen();
const moveCount = await driver.getMoveCount();
```

**ModernDriver**:
```typescript
// All state in one call
const state = await driver.getGameState();
// state includes: fen, moveCount, status, evaluation
```

### 5. Test Bridge

**AppDriver**:
```typescript
// Manual setup required
await driver.setupTestBridge();
await driver.testBridge.setNextMove(fen, move);
```

**ModernDriver**:
```typescript
// Automatic with useTestBridge: true
if (driver.bridge) {
  await driver.bridge.setNextMove(fen, move);
}
```

### 6. Component Access

Both drivers provide access to page components:

```typescript
// Same in both drivers
await driver.board.makeMove('e2', 'e4');
await driver.moveList.clickMove(0);
await driver.evaluationPanel.getEvaluation();
```

### 7. Error Handling

**AppDriver**:
```typescript
try {
  await driver.makeMove('invalid', 'move');
} catch (error) {
  // Generic error
}
```

**ModernDriver**:
```typescript
try {
  await driver.makeMove('invalid', 'move');
} catch (error) {
  if (error instanceof ChessError) {
    // Specific chess-related error
  }
}
```

## Migration Checklist

- [ ] Replace import statements
- [ ] Update initialization (add `useTestBridge: true`)
- [ ] Replace `waitForPageReady()` calls (automatic now)
- [ ] Update state access methods to use `getGameState()`
- [ ] Remove manual test bridge setup
- [ ] Update error handling for specific error types
- [ ] Run tests to verify functionality

## Common Patterns

### Setting up a test
```typescript
// Old (AppDriver)
test('makes a move', async ({ page }) => {
  const driver = new AppDriver(page);
  await driver.visit();
  await driver.waitForPageReady();
  await driver.setupTestBridge();
  await driver.makeMove('e2', 'e4');
});

// New (ModernDriver)
test('makes a move', async ({ page }) => {
  const driver = new ModernDriver(page, { useTestBridge: true });
  await driver.visit('/train/1');
  await driver.makeMove('e2', 'e4');
});
```

### Complex test with navigation
```typescript
// Old (AppDriver)
const driver = new AppDriver(page);
await driver.visit('/train/1');
await driver.waitForPageReady();
await driver.makeMove('e2', 'e4');
await driver.navigationControls.goToStart();
await driver.navigationControls.goForward();

// New (ModernDriver)
const driver = new ModernDriver(page, { useTestBridge: true });
await driver.visit('/train/1');
await driver.makeMove('e2', 'e4');
await driver.navigation.goToStart();
await driver.navigation.goForward();
```

## Troubleshooting

### ESLint Errors
If you see: "AppDriver is deprecated. Use ModernDriver instead."
- This is expected! Update your imports to use ModernDriver.

### Test Timeouts
- ModernDriver has better built-in waits
- If tests timeout, check that `useTestBridge: true` is set
- Default timeout is 30000ms (configurable)

### Missing Methods
Some AppDriver methods were removed for simplicity:
- `setupGame()` → Use `setupPosition()` or `visit('/train/id')`
- `getCurrentState()` → Use `getGameState()`
- `waitForPageReady()` → Automatic now

## Need Help?

1. Check the [ModernDriver source](../tests/e2e/components/ModernDriver.ts)
2. Look at [example tests](../tests/e2e/critical/)
3. File an issue if you find missing functionality

## Timeline

- **2025-01-17**: ESLint warnings active
- **2025-02-01**: Final reminder
- **2025-02-28**: AppDriver removed from codebase

Migrate early to avoid disruption!