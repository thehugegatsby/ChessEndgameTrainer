# E2E Test Architecture

## Overview
The E2E test suite uses a clean Component Object Model architecture with ModernDriver as the lean orchestrator (442 lines).

## Recent Migration (2025-01-17)
- **Deleted**: 32 legacy tests (84% of test suite)
- **Migrated**: 6 ModernDriver tests from critical/
- **Created**: 4 new core driver tests
- **Result**: 8 focused tests replacing 38 legacy tests

## Core Components

### 1. ModernDriver (442 lines)
- **Role**: Lean orchestrator and facade
- **Responsibilities**: Component initialization, test lifecycle management
- **Key Features**: Built-in Test Bridge support, enhanced error handling with timing

### 2. UI Components
- **BoardComponent**: Chess board interactions (moves, piece locations)
- **MoveListComponent** (614 lines): Move history navigation and display
- **EvaluationPanel**: Engine evaluation and analysis display
- **NavigationControls**: Game navigation (first/last/prev/next)

### 3. Helper Services
- **GamePlayer**: Move execution and validation
- **ValidationHelper** (328 lines): Comprehensive chess rule validation
- **PuzzleSolver**: Automated puzzle solving logic
- **EngineAnalyzer**: Engine analysis and evaluation
- **TestBridgeWrapper**: Mock engine for deterministic testing

## Architecture Principles

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Delegation Pattern**: ModernDriver delegates to specialized components
3. **No Circular Dependencies**: Clean module boundaries
4. **Lazy Initialization**: Components created on-demand
5. **Error Context**: Custom error types with detailed context
6. **Ready Signal Pattern**: Explicit app-ready signaling for test stability

## Best Practices

1. **Test Structure**:
   ```typescript
   const driver = new ModernDriver(page, { useTestBridge: true });
   await driver.visit('/train/1');
   await driver.makeMove('e2', 'e4');
   const state = await driver.getGameState();
   ```

2. **Component Access**:
   - Direct: `driver.board.getPosition()`
   - Orchestrated: `driver.makeMove()` (uses multiple components)

3. **Error Handling**: All errors include context for debugging

## Test Execution

### Running the New Test Suite
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test category
npx playwright test tests/e2e/00-smoke --project=chromium
npx playwright test tests/e2e/01-core-driver --project=chromium

# Run with UI mode for debugging
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/01-core-driver/lifecycle.spec.ts
```

### Expected Results
- **Total Tests**: 9 (expandable to 12)
- **Execution Time**: <20 seconds with Test Bridge
- **Reliability**: 100% deterministic with mock engine
- **Ready Detection**: Primary signal + fallback mechanism for robustness

## Ready Signal Implementation (2025-01-17)

The E2E test suite implements a robust ready detection mechanism to ensure tests only start when the application is fully initialized.

### Primary Signal: `data-app-ready`
- Set by `_app.tsx` when both Next.js router and Engine are ready
- Three states: `'true'` (ready), `'false'` (loading), `'error'` (initialization failed)
- Automatically resets on route changes for client-side navigation

### Fallback Mechanism
When the primary signal is not available (legacy support), ModernDriver uses:
1. Board visibility check
2. Chess-specific interactive elements validation
3. Requires at least 2 different types of chess elements

### Configuration
Timeouts are environment-specific in `constants.js`:
- **appReady**: 30s (dev), 20s (test), 45s (CI)
- **fallbackReady**: 5s (dev), 3s (test), 10s (CI)

### Testing
- `ready-signal.spec.ts`: Tests both primary and fallback paths
- Includes deterministic fallback trigger test
- Unit tests for frontend signal logic

## Migration History
The architecture was successfully migrated from the monolithic AppDriver (1,889 lines) to the current component-based model in January 2025. This resulted in a 76% code reduction while maintaining all features.

For historical context, see: `docs/archive/2025-01-moderndriver-migration/`