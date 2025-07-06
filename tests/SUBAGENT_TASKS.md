# Test Migration - 4 Subagent Tasks

## 🤖 Subagent Task 1: Engine & Worker Core (25 Dateien)
**Estimated Time:** 2-3 hours

### Scope:
- **Integration Tests**: Engine-Worker Communication
- **Unit Tests**: Core Engine Logic
- **Performance Tests**: Engine Initialization

### Files to Migrate:
```bash
# From shared/lib/chess/engine/__tests__/ → tests/integration/worker/handlers/
- index.test.ts (Worker lifecycle)
- messageHandler.test.ts (Message processing)  
- requestManager.test.ts (Request handling)
- workerManager.test.ts (Worker management)

# From shared/lib/chess/evaluation/__tests__/ → tests/integration/engine/evaluation/
- ChessAwareCache.test.ts
- EvaluationDeduplicator.test.ts
- ParallelEvaluationService.test.ts
- evaluation.baseline.test.ts
- moveQualityAnalyzer.test.ts
- normalizer.test.ts
- perspectiveTransformer.test.ts
- unifiedService.test.ts

# From shared/lib/chess/__tests__/ → tests/integration/engine/core/
- ScenarioEngine.test.ts
- ScenarioEngine.deepAnalysis.test.ts
- ScenarioEngine.errorHandling.test.ts

# Performance tests → tests/performance/engine/
- shared/__tests__/performance/engineInitialization.test.ts
- shared/__tests__/performance/engineOptimized.test.ts
- shared/__tests__/performance/engineStateMachine.test.ts
- shared/__tests__/performance/workerPerformance.test.ts
```

### Import Updates Required:
```typescript
// Update all relative imports:
from '../../../' → '@/'
from '../../' → '@/'
from '../' → '@/'
```

### Success Criteria:
- All 25 tests pass with `npm run test:integration -- --testPathPattern="engine|worker"`
- No import errors
- Performance tests run separately with `npm run test:performance`

---

## 🤖 Subagent Task 2: UI Components & Training (28 Dateien)
**Estimated Time:** 2-3 hours

### Scope:
- **Unit Tests**: React Components
- **Integration Tests**: Component-Hook Integration
- **Training Flow Tests**: User Interaction Logic

### Files to Migrate:
```bash
# From shared/components/training/*/__tests__/ → tests/unit/ui/training/
- TrainingBoard/*.test.tsx (4 files)
- DualEvaluationPanel/*.test.tsx (3 files)
- MovePanel/*.test.tsx (2 files)
- NavigationControls/*.test.tsx (2 files)

# From shared/components/chess/*/__tests__/ → tests/unit/ui/chess/
- Chessboard.test.tsx
- ChessboardWrapper.test.tsx

# From shared/components/ui/*/__tests__/ → tests/unit/ui/components/
- Button.test.tsx
- Card.test.tsx
- Dialog.test.tsx

# From shared/hooks/__tests__/ → tests/unit/hooks/
- useChessGame.test.ts
- useEvaluation.test.ts
- useTraining.test.ts
- useKeyboardShortcuts.test.ts

# From shared/contexts/__tests__/ → tests/integration/contexts/
- TrainingContext.test.tsx
```

### Mock Strategy:
```typescript
// Standard React Testing Library setup
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

// Mock worker APIs
jest.mock('@/services/chess/EngineService');
jest.mock('@/services/tablebaseService');
```

### Success Criteria:
- All 28 tests pass with `npm run test:unit -- --testPathPattern="ui|hooks"`
- React components render without errors
- User interactions work correctly

---

## 🤖 Subagent Task 3: Services & Utilities (22 Dateien)
**Estimated Time:** 2-3 hours

### Scope:
- **Unit Tests**: Pure Functions & Utilities
- **Integration Tests**: Service Layer
- **Data Processing Tests**: FEN, PGN, Game State

### Files to Migrate:
```bash
# From shared/services/__tests__/ → tests/unit/services/
- errorService.test.ts
- loggerService.test.ts
- platformService.test.ts
- storageService.test.ts

# From shared/utils/__tests__/ → tests/unit/utils/
- formatters.test.ts
- validators.test.ts
- constants.test.ts

# From shared/data/__tests__/ → tests/unit/data/
- endgames.test.ts
- categories.test.ts
- positions.test.ts

# From shared/lib/__tests__/ → tests/unit/chess/
- stockfish.test.ts
- chess.test.ts
- mistakeCheck.test.ts
- successCriteria.test.ts

# From shared/store/__tests__/ → tests/unit/store/
- trainingStore.test.ts
```

### Special Considerations:
```typescript
// Platform service tests need different environments
describe.each(['web', 'mobile'])('Platform: %s', (platform) => {
  // Test platform-specific behavior
});

// Storage service tests need localStorage/AsyncStorage mocks
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: mockStorage });
});
```

### Success Criteria:
- All 22 tests pass with `npm run test:unit -- --testPathPattern="services|utils|data|store"`
- Platform abstraction works correctly
- Storage operations are properly mocked

---

## 🤖 Subagent Task 4: E2E, Performance & Cleanup (26 Dateien)
**Estimated Time:** 3-4 hours

### Scope:
- **E2E Tests**: Complete User Flows
- **Performance Tests**: Benchmarks & Optimization
- **Regression Tests**: Bug Reproductions
- **Cleanup**: Remove Duplicates & Consolidate

### Files to Migrate:
```bash
# E2E Tests → tests/e2e/
- shared/__tests__/e2e/scenarios/completeTrainingFlow.spec.ts → tests/e2e/training-flow/
- tests/e2e/performance-benchmark.spec.ts → tests/e2e/performance/

# Performance Tests → tests/performance/
- shared/__tests__/performance/baseline-metrics.json
- shared/__tests__/performance/cache*.test.ts (3 files)
- shared/__tests__/performance/contextComparison.test.ts
- shared/__tests__/performance/reactContextPerformance.test.tsx

# Bug Reproduction Tests → tests/regression/bugs/
- shared/__tests__/bugs/*.test.ts (7 files)

# Cleanup Operations:
1. Remove shared/tests/unit/ (duplicate structure)
2. Merge .comprehensive.test.ts files with main tests
3. Update all package.json test scripts
4. Create final Jest configuration
5. Remove old __tests__ directories (after verification)
```

### E2E Test Framework:
```typescript
// Playwright configuration for complete flows
test.describe('Training Session E2E', () => {
  test('complete evaluation cycle', async ({ page }) => {
    await page.goto('/train/1');
    // ... user flow testing
  });
});
```

### Cleanup Script:
```bash
#!/bin/bash
# Final cleanup after migration verification
echo "🧹 Cleaning up old test structure..."

# Remove duplicate directories (after tests pass)
rm -rf shared/tests/unit/
rm -rf shared/components/*/(__tests__)
rm -rf shared/hooks/__tests__
rm -rf shared/services/__tests__

echo "✅ Migration complete!"
```

### Success Criteria:
- All E2E tests pass with `npm run test:e2e`
- Performance benchmarks execute successfully
- All regression tests pass
- Old test structure completely removed
- Final test coverage > 85%

---

## 🎯 Coordination Between Subagents

### Prerequisites:
- Jest configuration from Pilot (already done)
- Module aliases working (already done)
- New directory structure created (already done)

### Parallel Execution:
All 4 tasks can run **completely in parallel** since they target different areas.

### Integration Point:
After all 4 subagents complete, run:
```bash
npm run test:ci:all
npm run test:coverage
```

### Final Verification:
```bash
# Ensure 100% migration
find shared -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | wc -l
# Should be 0 after cleanup

find tests -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | wc -l  
# Should be ~121 (all tests migrated)
```