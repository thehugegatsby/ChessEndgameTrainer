# smoke-com.spec.ts Fix Plan

## 🔍 Problem Analysis

### Current Behavior:
- Tests use click-to-click fallback instead of `e2e_makeMove`
- E2E hooks ARE created (visible in window object)
- But `process.env.NEXT_PUBLIC_IS_E2E_TEST` returns `false` in browser

### Root Cause:
Next.js doesn't expose `process.env` to browser runtime, only at build time

## 🛠️ Proposed Solutions

### Solution 1: Window-based Flag (Recommended)

**Implementation:**

1. **Update TrainingBoardZustand.tsx:**
```typescript
// Replace environment check with window flag
useEffect(() => {
  // Check for E2E test mode via window flag OR environment variable
  const isE2ETest = (typeof window !== 'undefined' && window.__E2E_TEST_MODE__) || 
                    process.env.NEXT_PUBLIC_IS_E2E_TEST === 'true';
  
  if (isE2ETest) {
    logger.info('Attaching e2e hooks to window object');
    // ... attach hooks
  }
}, []);
```

2. **Update BoardComponent.ts:**
```typescript
// Before checking for e2e_makeMove, set the flag
await this.page.evaluate(() => {
  (window as any).__E2E_TEST_MODE__ = true;
});

// Then wait for hooks to be created
await this.page.waitForFunction(
  () => typeof (window as any).e2e_makeMove === 'function',
  { timeout: 5000 }
);
```

3. **Update test setup in AppDriver:**
```typescript
async setupTestEnvironment(): Promise<void> {
  // Set E2E test flag
  await this.page.evaluate(() => {
    (window as any).__E2E_TEST_MODE__ = true;
  });
  
  // Wait for app to recognize test mode
  await this.page.waitForTimeout(100);
}
```

### Solution 2: Use data-testid Attribute

**Alternative approach using DOM:**

1. **Add to _app.tsx or layout:**
```typescript
useEffect(() => {
  if (document.body.dataset.testid === 'e2e-test') {
    // Attach E2E hooks
  }
}, []);
```

2. **Set in Playwright:**
```typescript
await page.evaluate(() => {
  document.body.dataset.testid = 'e2e-test';
});
```

### Solution 3: Custom Event Trigger

**Event-based initialization:**

1. **Listen for custom event:**
```typescript
useEffect(() => {
  const handleE2EInit = () => {
    logger.info('E2E test mode activated via event');
    // Attach hooks
  };
  
  window.addEventListener('e2e:init', handleE2EInit);
  return () => window.removeEventListener('e2e:init', handleE2EInit);
}, []);
```

2. **Trigger from tests:**
```typescript
await page.evaluate(() => {
  window.dispatchEvent(new Event('e2e:init'));
});
```

## 📋 Implementation Steps

### Step 1: Update Hook Detection
- [ ] Modify TrainingBoardZustand.tsx to use window flag
- [ ] Add fallback for SSR compatibility
- [ ] Ensure hooks are attached on client-side only

### Step 2: Update Test Infrastructure
- [ ] Add `setupTestEnvironment()` to AppDriver
- [ ] Call setup in test beforeEach hooks
- [ ] Verify hooks are available before proceeding

### Step 3: Fix BoardComponent Logic
- [ ] Update `hasE2EMakeMove` check to wait for initialization
- [ ] Add retry logic for hook availability
- [ ] Log when using e2e_makeMove vs click-to-click

### Step 4: Test & Verify
- [ ] Run smoke-com.spec.ts with verbose logging
- [ ] Verify e2e_makeMove is being used
- [ ] Check test execution time improvement

## 🧪 Test Plan

### 1. Unit Test for Hook Creation:
```typescript
test('E2E hooks are created when flag is set', async () => {
  await page.goto('/');
  
  // Set flag
  await page.evaluate(() => {
    (window as any).__E2E_TEST_MODE__ = true;
  });
  
  // Wait for hooks
  await page.waitForFunction(
    () => typeof (window as any).e2e_makeMove === 'function'
  );
  
  // Verify
  const hasHook = await page.evaluate(() => 
    typeof (window as any).e2e_makeMove === 'function'
  );
  expect(hasHook).toBe(true);
});
```

### 2. Integration Test:
```typescript
test('Uses e2e_makeMove when available', async () => {
  const app = new AppDriver(page);
  await app.setupTestEnvironment();
  await app.visit('/train/1');
  
  // Spy on console to verify which method is used
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));
  
  await app.board.makeMove('e6', 'd6');
  
  // Should see "Using e2e_makeMove test hook"
  expect(logs).toContain(expect.stringContaining('e2e_makeMove'));
});
```

## 📊 Expected Outcomes

### Before Fix:
- Tests use click-to-click (slower, less reliable)
- Test execution: ~30 seconds per test
- Potential flakiness from UI interactions

### After Fix:
- Tests use e2e_makeMove (faster, more reliable)
- Test execution: ~5 seconds per test
- Direct state manipulation, no UI dependency

## 🚀 Quick Start

```bash
# 1. Create fix branch
git checkout -b fix/e2e-hook-usage

# 2. Apply Solution 1 (window flag)
# Edit files as described above

# 3. Run affected tests
npm run test:e2e -- tests/e2e/smoke-com.spec.ts

# 4. Verify improvement
# Check console output for "Using e2e_makeMove test hook"
```

---

*Created: January 10, 2025*
*Priority: HIGH - Blocks efficient E2E testing*