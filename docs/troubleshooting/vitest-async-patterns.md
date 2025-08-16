# Vitest Async Patterns & Race Conditions

**LLM Reference:** Solutions for unhandled promise rejections and async cleanup issues in Vitest tests.

**Keywords:** unhandled promise rejection, vitest, finally handler, Promise.allSettled, race condition, afterEach, cleanup, request deduplication, pending requests, test lifecycle

## Problem: Unhandled Promise Rejections with finally() handlers

### Symptoms

- Tests fail with "Vitest caught X unhandled error during the test run"
- Error message: "unhandled promise rejection"
- Proper `await` and `.catch()` patterns don't prevent the issue
- `afterEach` hooks don't resolve the problem
- Tests may pass individually but fail in test suites

### Root Cause Analysis

**The Issue:** When using `Promise.allSettled()` to wait for promises in test cleanup, Vitest only waits for the **main promise settlement**, NOT for attached `finally()` handlers to complete.

**Race Condition Scenario:**

1. Promise with `finally()` handler is stored in a Map/Set
2. Test calls `Promise.allSettled()` on stored promises
3. Main promise settles, `allSettled()` resolves
4. Test cleanup begins or test ends
5. `finally()` handler runs AFTER test completion
6. Results in "unhandled promise rejection"

## Code Patterns

### WRONG Pattern (Causes Race Condition)

```typescript
// ❌ WRONG: Storing promise WITH finally() handler
class ApiClient {
  private pendingRequests = new Map<string, Promise<any>>();

  query(id: string): Promise<any> {
    const requestPromise = this.executeQuery(id).finally(() => {
      // This cleanup runs AFTER Promise.allSettled() resolves
      this.pendingRequests.delete(id);
    });

    // Stored promise includes the finally() handler
    this.pendingRequests.set(id, requestPromise);
    return requestPromise;
  }

  // Used in test cleanup
  async awaitPendingRequests(): Promise<void> {
    // Only waits for main promise, NOT finally() handlers
    await Promise.allSettled(this.pendingRequests.values());
  }
}
```

### CORRECT Pattern (Avoids Race Condition)

```typescript
// ✅ CORRECT: Store raw promise, attach finally() to return value
class ApiClient {
  private pendingRequests = new Map<string, Promise<any>>();

  query(id: string): Promise<any> {
    // Create raw promise without cleanup
    const requestPromise = this.executeQuery(id);

    // Store the RAW promise for deduplication
    this.pendingRequests.set(id, requestPromise);

    // Return promise WITH cleanup attached (but don't store this version)
    return requestPromise.finally(() => {
      this.pendingRequests.delete(id);
    });
  }

  async awaitPendingRequests(): Promise<void> {
    // Waits for raw promises, cleanup happens in parallel
    await Promise.allSettled(this.pendingRequests.values());
  }
}
```

## Test Cleanup Pattern

### Proper afterEach Setup

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
  });

  afterEach(async () => {
    // CRITICAL: Wait for all pending requests to settle
    await client.awaitPendingRequests();

    // Verify cleanup completed
    expect(client.getPendingRequestsCount()).toBe(0);

    // Optional: Clear any remaining state
    client.clearPendingRequests();
  });

  it('should handle concurrent requests', async () => {
    const promises = [client.query('test1'), client.query('test2'), client.query('test3')];

    await Promise.all(promises);
    // Cleanup happens in afterEach
  });
});
```

## Real-World Fix Example

**File:** `src/features/tablebase/services/TablebaseApiClient.ts`

**Before (Race Condition):**

```typescript
query(fen: string): Promise<TablebaseApiResponse> {
  const requestPromise = this.executeQuery(fen)
    .finally(() => {
      this.pendingRequests.delete(normalizedFen);
    });

  this.pendingRequests.set(normalizedFen, requestPromise);
  return requestPromise;
}
```

**After (Fixed):**

```typescript
query(fen: string): Promise<TablebaseApiResponse> {
  // Create new request promise WITHOUT finally() for clean tracking
  const requestPromise = this.executeQuery(fen);

  // Store the raw promise for deduplication
  this.pendingRequests.set(normalizedFen, requestPromise);

  // Return promise with cleanup attached (but don't store this version)
  return requestPromise.finally(() => {
    this.pendingRequests.delete(normalizedFen);
  });
}
```

## Additional Patterns

### Alternative: Explicit Cleanup Tracking

```typescript
class ApiClient {
  private pendingRequests = new Map<string, Promise<any>>();
  private pendingCleanups = new Set<Promise<void>>();

  query(id: string): Promise<any> {
    const requestPromise = this.executeQuery(id);
    this.pendingRequests.set(id, requestPromise);

    const cleanupPromise = requestPromise.finally(() => {
      this.pendingRequests.delete(id);
      this.pendingCleanups.delete(cleanupPromise);
    });

    this.pendingCleanups.add(cleanupPromise);
    return cleanupPromise;
  }

  async awaitPendingRequests(): Promise<void> {
    // Wait for both requests AND their cleanup
    await Promise.allSettled([...this.pendingRequests.values(), ...this.pendingCleanups.values()]);
  }
}
```

## Debugging Tips

### Identify the Issue

1. Look for "unhandled promise rejection" in test output
2. Check if issue occurs in test suites but not individual tests
3. Examine if you're storing promises with `finally()` handlers
4. Verify if `Promise.allSettled()` is used in test cleanup

### Debug Commands

```bash
# Run single test file
pnpm test path/to/test.ts

# Run with verbose output
pnpm test path/to/test.ts --reporter=verbose

# Check for race conditions
pnpm test path/to/test.ts --run --reporter=verbose 2>&1 | grep -i "unhandled"
```

## Prevention Checklist

- [ ] Store raw promises for deduplication, not promises with cleanup handlers
- [ ] Use `finally()` on returned promises, not stored promises
- [ ] Implement `awaitPendingRequests()` method for test cleanup
- [ ] Always await pending operations in `afterEach()` hooks
- [ ] Verify cleanup state with assertions in `afterEach()`
- [ ] Test both individual tests and full test suites

## Related Documentation

- [Testing Patterns](../guides/testing.md#vitest-issues)
- [WSL2 Environment](../guides/wsl2.md#testing-commands)
- [TablebaseApiClient Implementation](../shared/services/tablebase/README.md)

---

**Last Updated:** 2025-08-14  
**Based on Issue:** TablebaseApiClient Promise Race Condition Fix  
**Commit:** fc6fe4e - resolve TablebaseApiClient promise race condition causing unhandled rejections
