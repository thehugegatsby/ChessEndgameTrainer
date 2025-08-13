# SCRATCHPAD - Current Work

## TablebaseApiClient Test Analysis (2025-08-13)

### PROBLEM: 5 failing tests causing heap out of memory

**Root cause:** Both CODE and TESTS have fundamental testability issues

### 🔴 CRITICAL Code Issues (TablebaseApiClient.ts)

1. **Untestable Timer Dependencies**
   - `sleep()` method (line 187-189): Hardcoded `setTimeout`
   - `fetchWithTimeout()` (line 146): Mixed real timers with async ops
   - No dependency injection for timing functions

2. **Result:** `vi.useFakeTimers()` completely ineffective

### 🟠 Test Architecture Problems

1. **Testing implementation details** instead of behavior
   - `expect(mockFetch).toHaveBeenCalledTimes(X)` everywhere
   - Coupled to internal retry timing logic

2. **Fake timer misuse**
   - Tests don't properly advance timers for retry delays
   - Timeout test doesn't simulate real timeout
   - "Exhaust retries" test hangs on 16+ second delays

### ✅ What's Actually Good

- Request deduplication pattern
- Error handling (404, 429, network)  
- Zod validation
- Exponential backoff with jitter
- Clean interface separation

### 🎯 SOLUTION

1. **Refactor Code:** Inject TimerService interface
2. **Fix Tests:** Focus on behavior, use `vi.runAllTimersAsync()`
3. **Split Concerns:** Unit test logic, integration test HTTP/timing

### STATUS: Ready for GitHub issues