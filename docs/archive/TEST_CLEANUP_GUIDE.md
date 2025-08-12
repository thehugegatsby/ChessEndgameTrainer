# Test Cleanup Guide

## Overview

Our test suite uses **automatic global cleanup** to prevent memory leaks and ensure test isolation. This system handles 95% of cleanup tasks automatically, so you can focus on writing tests.

## What's Cleaned Up Automatically ✅

The following resources are **automatically cleaned up** after each test:

- ✅ **Timers**: `setTimeout`, `setInterval`
- ✅ **Animation Frames**: `requestAnimationFrame`
- ✅ **Event Listeners**: on `window`, `document`, `document.body`
- ✅ **React Components**: DOM cleanup via React Testing Library
- ✅ **Zustand Stores**: Automatic state reset
- ✅ **Jest Mocks**: `clearAllMocks()` after each test
- ✅ **Fake Timers**: Restored to real timers

## When You Need Manual Cleanup ⚠️

You only need to add manual `afterEach` blocks in these specific cases:

### 1. Complex Mocks with `jest.spyOn`

```typescript
describe("MyService", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore(); // Manual restore needed
  });
});
```

### 2. Custom Event Targets

```typescript
describe("CustomEventEmitter", () => {
  let emitter: EventEmitter;
  let handler: jest.Mock;

  beforeEach(() => {
    emitter = new EventEmitter();
    handler = jest.fn();
    emitter.on("data", handler);
  });

  afterEach(() => {
    emitter.off("data", handler); // Manual cleanup for custom objects
    emitter.removeAllListeners();
  });
});
```

### 3. External Resources

```typescript
describe("WebSocket Tests", () => {
  let ws: WebSocket;

  beforeEach(() => {
    ws = new WebSocket("ws://localhost:8080");
  });

  afterEach(() => {
    ws.close(); // Manual cleanup for external connections
  });
});
```

### 4. File System Operations

```typescript
describe("File Operations", () => {
  const testFile = "/tmp/test-file.txt";

  afterEach(async () => {
    await fs.promises.unlink(testFile).catch(() => {}); // Manual cleanup
  });
});
```

## Best Practices

### ✅ DO

```typescript
// Good: Let automatic cleanup handle standard cases
it("should handle timers", () => {
  const callback = jest.fn();
  setTimeout(callback, 100); // Automatically cleaned up
  jest.runAllTimers();
  expect(callback).toHaveBeenCalled();
});

// Good: Use tracked AbortController for fetch
import { createTrackedAbortController } from "@tests/setup/global-test-cleanup";

it("should handle fetch", async () => {
  const controller = createTrackedAbortController(); // Auto-cleanup
  const response = await fetch("/api/data", { signal: controller.signal });
  // ...
});
```

### ❌ DON'T

```typescript
// Bad: Manual cleanup for standard timers (unnecessary)
it("should handle timers", () => {
  const timer = setTimeout(() => {}, 100);
  clearTimeout(timer); // Unnecessary - auto-cleaned
});

// Bad: Forgetting cleanup for custom resources
it("should handle custom emitter", () => {
  const emitter = new EventEmitter();
  emitter.on("data", handler); // Memory leak - needs manual cleanup!
});
```

## Debugging Memory Leaks

If you suspect a memory leak:

1. **Check for unhandled promises**:

   ```typescript
   import { waitForPendingPromises } from "@tests/setup/global-test-cleanup";

   afterEach(async () => {
     await waitForPendingPromises();
   });
   ```

2. **Run tests with leak detection**:

   ```bash
   npm test -- --detectLeaks --detectOpenHandles
   ```

3. **Enable debug mode**:
   ```bash
   DEBUG_TESTS=1 npm test
   ```

## Special Cases

### Opting Out of Automatic Cleanup

In rare cases where automatic cleanup interferes with your test:

```typescript
import { disableAutomaticCleanup } from "@tests/setup/global-test-cleanup";

describe("Special Test Suite", () => {
  disableAutomaticCleanup(); // Use with caution!

  afterEach(() => {
    // You're now responsible for ALL cleanup
  });
});
```

### Testing with Fake Timers

```typescript
describe("Timer Tests", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  // No manual cleanup needed - automatic restoration

  it("should handle delayed operations", () => {
    const callback = jest.fn();
    setTimeout(callback, 1000);

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });
});
```

## Common Patterns

### React Component Tests

```typescript
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  // No cleanup needed - handled automatically

  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Zustand Store Tests

```typescript
import { useStore } from "@shared/store/rootStore";

describe("Store Tests", () => {
  // Store automatically reset between tests

  it("should update state", () => {
    const { increment } = useStore.getState();
    increment();
    expect(useStore.getState().count).toBe(1);
  });

  it("should start fresh", () => {
    // Store is reset - starts at 0 again
    expect(useStore.getState().count).toBe(0);
  });
});
```

## Migration Guide

If you're updating existing tests:

1. **Remove unnecessary cleanup code**:
   - Remove `afterEach(() => cleanup())` for React Testing Library
   - Remove timer cleanup for standard `setTimeout`/`setInterval`
   - Remove `jest.clearAllMocks()` calls

2. **Keep necessary cleanup**:
   - Custom event emitters
   - External connections (WebSocket, database)
   - File system operations
   - Complex spy mocks

3. **Test your changes**:
   ```bash
   npm test -- --watch path/to/your/test
   ```

## Questions?

If you're unsure whether you need manual cleanup, ask yourself:

1. Is it a standard browser API? → **No manual cleanup needed**
2. Is it a React component? → **No manual cleanup needed**
3. Is it a Zustand store? → **No manual cleanup needed**
4. Is it a custom object/resource? → **Manual cleanup probably needed**

When in doubt, check if the test passes and doesn't leak with:

```bash
npm test -- --detectLeaks path/to/your/test
```
