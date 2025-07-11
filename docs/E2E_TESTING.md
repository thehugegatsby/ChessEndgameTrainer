# E2E Testing with Two-Phase Ready Detection

**Last Updated:** 2025-01-11  
**Status:** Production Ready  
**Version:** 2.0  

## Overview

This guide documents the **Two-Phase Ready Detection System** implemented to solve timing issues in Playwright E2E tests. The system ensures tests wait for complete application initialization before proceeding, eliminating race conditions and flaky test failures.

## Problem Solved

**Previous Issues:**
- Tests timing out while looking for existing UI elements
- Race conditions between React hydration and test execution
- Arbitrary timeouts causing flaky behavior
- Inconsistent test results across environments

**Root Cause:** Tests were starting before React components had fully mounted and initialized.

## Solution Architecture

### Two-Phase Detection System

```mermaid
graph TD
    A[Test Starts] --> B[Phase 1: App Shell Ready]
    B --> C[body[data-app-ready="true"]]
    C --> D[Phase 2: Page-Specific Ready]
    D --> E[data-page-ready="true"]
    E --> F[Phase 3: Component Visibility]
    F --> G[Test Proceeds Safely]
```

### Implementation Components

1. **Custom Hook** (`usePageReady.ts`)
2. **Component Integration** (TrainingBoard, MovePanel)
3. **Test Helper Updates** (TrainingPage.ts)
4. **Driver Simplification** (ModernDriver.ts)
5. **Environment Configuration** (.env.test)

## Implementation Details

### 1. usePageReady Hook

**Location:** `/shared/hooks/usePageReady.ts`

```typescript
export function usePageReady(dependencies: boolean[] = []): boolean {
  const [isPageReady, setIsPageReady] = useState(false);
  
  useEffect(() => {
    const allReady = dependencies.length === 0 || dependencies.every(dep => dep === true);
    
    if (allReady && !isPageReady) {
      setIsPageReady(true);
      
      // Emit event for debugging (test builds only)
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_E2E_SIGNALS === 'true') {
        window.dispatchEvent(new CustomEvent('page-ready', {
          detail: { timestamp: Date.now() }
        }));
      }
    }
  }, dependencies);
  
  return isPageReady;
}
```

**Key Features:**
- Tracks multiple boolean dependencies
- Emits debug events in test environment
- Reusable across all page components

### 2. Component Integration

#### TrainingBoard Integration

```typescript
// Ready state tracking
const isEngineReady = training.engineStatus === 'ready' || training.engineStatus === 'idle';
const isBoardReady = !!currentFen && !!game;
const isPageReady = usePageReady([isEngineReady, isBoardReady]);

// Conditional attribute rendering
const showE2ESignals = process.env.NEXT_PUBLIC_E2E_SIGNALS === 'true';

return (
  <div 
    className="flex flex-col items-center"
    {...(showE2ESignals && { 'data-page-ready': isPageReady })}
  >
    {/* Board content */}
  </div>
);
```

#### MovePanel Integration

```typescript
const hasContent = movePairs.length > 0 || currentMoveIndex === 0;
const showE2ESignals = process.env.NEXT_PUBLIC_E2E_SIGNALS === 'true';

return (
  <div 
    className="space-y-1"
    data-testid={TEST_IDS.MOVE_PANEL.CONTAINER}
    {...(showE2ESignals && { 'data-component-ready': hasContent ? 'true' : 'false' })}
  >
    {/* Move content */}
  </div>
);
```

### 3. Three-Phase Wait Strategy

**Location:** `/tests/e2e/pages/TrainingPage.ts`

```typescript
async waitForBoard(): Promise<void> {
  // Phase 1: App-Shell ready
  await this.page.waitForSelector('body[data-app-ready="true"]', { 
    timeout: 10000,
    state: 'attached'
  });
  
  // Phase 2: Page-specific ready signal
  await this.page.waitForSelector('[data-page-ready="true"]', {
    timeout: 15000,
    state: 'attached'
  });
  
  // Phase 3: Critical components visible (Belt & Suspenders)
  await Promise.all([
    this.trainingBoard.waitFor({ state: 'visible', timeout: 5000 }),
    this.movePanel.waitFor({ state: 'visible', timeout: 5000 })
  ]);
  
  console.log('✅ App ready, page ready, components visible');
}
```

**Phase Breakdown:**
1. **App Shell Ready:** Basic Next.js hydration complete
2. **Page Ready:** All page-specific components initialized
3. **Component Visibility:** Final safety check for critical elements

### 4. Environment Configuration

**Test Environment (`.env.test`):**
```bash
# Enable E2E test signals for conditional rendering
NEXT_PUBLIC_E2E_SIGNALS=true
```

**Security Note:** Test attributes only appear when this environment variable is true, preventing production exposure.

### 5. Playwright Configuration

**Updated timeouts in `playwright.config.ts`:**
```typescript
use: {
  actionTimeout: 10000, // 10s for individual actions
  navigationTimeout: 30000, // 30s for page navigation and ready detection
}
```

## Usage Guide

### For New Pages

1. **Add usePageReady Hook:**
```typescript
import { usePageReady } from '@shared/hooks/usePageReady';

const MyPageComponent = () => {
  const isEngineReady = /* your engine ready logic */;
  const isDataLoaded = /* your data ready logic */;
  const isPageReady = usePageReady([isEngineReady, isDataLoaded]);
  
  return (
    <div data-page-ready={isPageReady}>
      {/* page content */}
    </div>
  );
};
```

2. **Update Page Object Model:**
```typescript
async waitForPageReady(): Promise<void> {
  await this.page.waitForSelector('[data-page-ready="true"]', {
    timeout: 15000,
    state: 'attached'
  });
}
```

### For New Components

1. **Add Component Ready Signal:**
```typescript
const hasContent = /* your content ready logic */;
const showE2ESignals = process.env.NEXT_PUBLIC_E2E_SIGNALS === 'true';

return (
  <div 
    data-testid="my-component"
    {...(showE2ESignals && { 'data-component-ready': hasContent })}
  >
    {/* component content */}
  </div>
);
```

### For Tests

1. **Use Three-Phase Wait:**
```typescript
// Always wait for full ready state
await trainingPage.waitForBoard();

// Then proceed with test actions
await trainingPage.makeMove('e2-e4');
```

2. **Avoid Arbitrary Timeouts:**
```typescript
// ❌ Don't do this
await page.waitForTimeout(5000);

// ✅ Do this instead
await page.waitForSelector('[data-page-ready="true"]');
```

## Debugging

### Debug Events

When `NEXT_PUBLIC_E2E_SIGNALS=true`, components emit custom events:

```typescript
// Listen for page ready events
page.on('console', msg => {
  if (msg.text().includes('page-ready')) {
    console.log('Page ready event:', msg.text());
  }
});

// Or listen for custom events
await page.evaluate(() => {
  window.addEventListener('page-ready', (e) => {
    console.log('Page ready at:', e.detail.timestamp);
  });
});
```

### Common Issues

1. **Signal Not Emitted:**
   - Check `NEXT_PUBLIC_E2E_SIGNALS=true` in test environment
   - Verify component is using `usePageReady` hook
   - Ensure dependencies are correctly defined

2. **Premature Signal:**
   - Review dependency logic (all must be truly ready)
   - Add additional dependencies if needed
   - Check for race conditions in state updates

3. **Timeout Issues:**
   - Increase timeout for complex pages
   - Verify all dependencies are reachable
   - Check for infinite waiting states

### Test Debugging Commands

```bash
# Run specific test with debug output
npx playwright test tests/e2e/bridge-building.spec.ts --headed --debug

# Run with console output
npx playwright test --headed --project=chromium

# Generate trace for analysis
npx playwright test --trace=on
```

## Best Practices

### Do's ✅

1. **Always use `usePageReady`** for new pages
2. **Define meaningful dependencies** that truly indicate readiness
3. **Use conditional rendering** for test attributes
4. **Wait for page-ready** before test actions
5. **Add component-ready signals** for complex components

### Don'ts ❌

1. **Don't use arbitrary timeouts** (`waitForTimeout`)
2. **Don't add test attributes in production** 
3. **Don't skip the three-phase wait**
4. **Don't assume immediate readiness**
5. **Don't create race conditions** in dependency logic

### Dependency Guidelines

**Good Dependencies:**
```typescript
const isEngineReady = engine.status === 'ready';
const isDataLoaded = !!currentPosition && !!gameData;
const isUIReady = components.length > 0;
```

**Avoid These:**
```typescript
// Too broad - might never be true
const isReady = everything.isReady;

// Too narrow - might miss edge cases  
const isReady = !!data;

// Race condition prone
const isReady = someAsyncOperation();
```

## Maintenance

### Regular Checks

1. **Monthly:** Review failed test patterns for new timing issues
2. **Per Release:** Verify all new pages implement `usePageReady`
3. **Quarterly:** Audit timeout values and adjust if needed

### Extending the System

1. **New Ready Types:** Add to `usePageReady` or create specialized hooks
2. **Additional Phases:** Extend the three-phase pattern as needed
3. **Framework Changes:** Update patterns when React/Next.js evolve

## Related Documentation

- [Testing Guidelines](./testing/TESTING_GUIDELINES.md)
- [Component Testing](./testing/COVERAGE_GUIDE.md) 
- [ModernDriver Architecture](./E2E_TEST_ARCHITECTURE.md)
- [Test Utilities](./testing/TEST_UTILITIES.md)

## Troubleshooting

For issues with this system:

1. Check the implementation against this guide
2. Review test output for timing patterns
3. Use debug events to trace ready state progression
4. Consult [GitHub Issues](https://github.com/anthropics/claude-code/issues) for similar problems

---

**Implementation Status:** ✅ Complete  
**Next Review:** 2025-02-11  
**Maintainer:** Development Team