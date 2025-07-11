# Engine API Changes and Fixes

## Overview
This document describes the fixes applied to resolve Engine API test failures after the modular refactoring.

## Problems Fixed

### 1. UCI Protocol Implementation
**Problem**: The messageHandler was returning `{ type: 'ready' }` for both 'uciok' and 'readyok' messages, causing premature engine initialization.

**Solution**: Modified `messageHandler.ts` to only signal ready on 'readyok':
```typescript
// Before
if (trimmed === 'uciok') {
  this.uciReady = true;
  return { type: 'ready' };
}

// After  
if (trimmed === 'uciok') {
  this.uciReady = true;
  return null; // Don't signal ready yet, wait for readyok
}
```

### 2. MockWorker Factory Tracking
**Problem**: The `createWorker` override in `engineTestHelper.ts` wasn't adding workers to the factory's array, causing `getLastWorker()` to return null.

**Solution**: 
- Made `workers` array public in `MockWorkerFactory`
- Ensured workers are properly tracked when created

### 3. Jest Worker Global
**Problem**: Tests failed with "typeof Worker === 'undefined'" in Jest environment.

**Solution**: Added Worker global mock in `jest.setup.js`:
```javascript
if (typeof Worker === 'undefined') {
  global.Worker = class Worker {
    constructor(scriptURL) {
      this.scriptURL = scriptURL;
      this.onmessage = null;
      this.onerror = null;
      this.onmessageerror = null;
    }
    
    postMessage(message) {
      // Replaced by mock implementations
    }
    
    terminate() {
      // Replaced by mock implementations
    }
  };
}
```

### 4. Worker Error Propagation
**Problem**: When `mockWorker.triggerError()` was called, it triggered `worker.onerror` which called `cleanup()`, but didn't reject pending request promises.

**Solution**: Added error callback mechanism:

1. Added `errorCallback` property to `StockfishWorkerManager`:
```typescript
private errorCallback: ((error: Error) => void) | null = null;
```

2. Modified `worker.onerror` to notify the callback:
```typescript
this.worker.onerror = (e) => {
  logger.error('Worker error:', e);
  
  // Notify the error callback if set
  if (this.errorCallback) {
    const errorMessage = e.message || 'Worker crashed';
    this.errorCallback(new Error(errorMessage));
  }
  
  this.cleanup();
};
```

3. Added `handleWorkerError` method in Engine:
```typescript
private handleWorkerError(error: Error): void {
  logger.error('Worker crashed, cancelling all pending requests:', error);
  
  // Cancel all pending requests
  this.requestManager.cancelAllRequests(`Worker error: ${error.message}`);
  
  // Clear the request queue
  this.requestQueue = [];
  this.isProcessingQueue = false;
}
```

## Test Updates

### Message Handler Tests
Updated expectations to match new UCI protocol behavior:
```typescript
// Before
expect(response).toEqual({ type: 'ready' });

// After
expect(response).toBeNull(); // uciok doesn't trigger ready
```

### Error Simulation Test
Updated to expect promise rejection:
```typescript
// Before
const result = await movePromise;
expect(result).toBeNull();

// After
await expect(movePromise).rejects.toThrow('Worker error: Worker crashed');
```

## Results
- All 11 Engine test helper tests now pass
- Message handler tests updated and passing
- Proper error propagation from worker crashes to pending requests
- Clean separation of UCI protocol steps (uci → uciok → isready → readyok)