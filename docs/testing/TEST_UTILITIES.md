# Test Utilities Documentation

This document describes the centralized test utilities available for the Chess Endgame Trainer project.

## Logger Utilities

Location: `tests/shared/logger-utils.ts`

### Overview

Provides type-safe logger implementations for testing purposes, eliminating the need for manual mocks in test files.

### Available Loggers

#### `noopLogger`
A complete no-operation logger that satisfies the ILogger interface without any side effects.

```typescript
import { noopLogger } from 'tests/shared/logger-utils';

// Use in tests where logging should be completely silent
const service = new MyService(noopLogger);
```

#### `createSilentLogger()`
Factory function that creates a fresh silent logger instance with spy functions.

```typescript
import { createSilentLogger } from 'tests/shared/logger-utils';

const logger = createSilentLogger();
// All methods are jest.fn() that return appropriate values
```

#### `createTestLogger()`
Factory function for a test logger with complete method spying capabilities.

```typescript
import { createTestLogger } from 'tests/shared/logger-utils';

// In your test mock
jest.mock('@shared/services/logging', () => ({
  getLogger: () => createTestLogger()
}));
```

#### `createDebugLogger(prefix?: string)`
Creates a logger that outputs to console for debugging tests.

```typescript
import { createDebugLogger } from 'tests/shared/logger-utils';

const logger = createDebugLogger('[TEST]');
// Will prefix all console output with [TEST]
```

### Migration from Manual Mocks

Before:
```typescript
jest.mock('@shared/services/logging', () => ({
  getLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn().mockReturnThis()
  })
}));
```

After:
```typescript
jest.mock('@shared/services/logging', () => ({
  getLogger: () => require('../../shared/logger-utils').createTestLogger()
}));
```

## Config Adapter Utilities

Location: `tests/e2e/utils/config-adapter.ts`

### Overview

Provides configuration transformation utilities for E2E tests, converting simple configurations to complex component-specific configurations.

### Functions

#### `createGamePlayerConfig(driverConfig: Required<ModernDriverConfig>): GamePlayerConfig`
Transforms a ModernDriverConfig to a GamePlayerConfig with sensible defaults.

```typescript
const gamePlayerConfig = createGamePlayerConfig({
  logger: noopLogger,
  defaultTimeout: 30000,
  baseUrl: 'http://localhost:3002',
  useTestBridge: true
});
```

#### `createGamePlayerConfigCached(driverConfig: Required<ModernDriverConfig>): GamePlayerConfig`
Same as above but with WeakMap caching for performance.

```typescript
// Subsequent calls with same config object return cached result
const config1 = createGamePlayerConfigCached(myConfig);
const config2 = createGamePlayerConfigCached(myConfig); // Returns cached instance
```

#### `isCompleteModernDriverConfig(config: ModernDriverConfig): config is Required<ModernDriverConfig>`
Type guard to check if a ModernDriverConfig has all required fields.

```typescript
if (isCompleteModernDriverConfig(config)) {
  // config is now typed as Required<ModernDriverConfig>
  const gameConfig = createGamePlayerConfig(config);
}
```

#### `ensureCompleteConfig(config: ModernDriverConfig): Required<ModernDriverConfig>`
Ensures a config has all required fields by applying defaults.

```typescript
const completeConfig = ensureCompleteConfig({
  logger: myLogger
  // Other fields will get defaults
});
```

### Default Values

- `defaultTimeout`: 30000ms
- `baseUrl`: 'http://localhost:3002'
- `useTestBridge`: true
- Navigation timeout: defaultTimeout * 2
- Engine response timeout: 15000ms (fixed)
- Retry attempts: 3
- Retry delay: 500ms
- Retry backoff factor: 1.5

## Best Practices

1. **Use the appropriate logger for your test context**
   - `noopLogger` for unit tests where logging is irrelevant
   - `createTestLogger()` when you need to spy on logging calls
   - `createDebugLogger()` when debugging test failures

2. **Leverage config caching in E2E tests**
   - Use `createGamePlayerConfigCached` when the same config is used multiple times
   - The WeakMap ensures automatic garbage collection

3. **Type safety first**
   - Always use type guards like `isCompleteModernDriverConfig`
   - Leverage TypeScript's type system for compile-time safety

4. **Centralized utilities over manual implementations**
   - Don't create manual logger mocks - use the utilities
   - Don't manually transform configs - use the adapters

## Testing the Utilities

The utilities themselves are fully tested:
- Logger utilities: Tested implicitly through usage
- Config adapter: Full unit test coverage in `tests/unit/utils/config-adapter.test.ts`

The config adapter tests use dependency injection pattern for clean, isolated testing of caching behavior.