# Migration Guide - Strangler Fig Pattern

## Overview

This guide documents the feature-by-feature migration from the legacy monolithic architecture to the new clean, feature-based architecture using the Strangler Fig Pattern.

## Migration Strategy

### 1. Strangler Fig Pattern
- Build new features alongside existing code
- Use feature flags to switch between implementations
- Gradually replace legacy code as new features are validated
- Remove legacy code only after new implementation is stable

### 2. Feature Flags
All new features are controlled by feature flags in `FeatureFlagService`:
- Development: Test new features locally
- Staging: A/B test with selected users
- Production: Gradual rollout with monitoring

## Migration Phases

### Phase 0: Foundation ✅
- [x] Vitest setup for new tests
- [x] Feature flags system
- [x] `/src/features/` directory structure
- [x] TypeScript path aliases
- [x] Barrel file templates
- [x] Migration documentation

### Phase 1: Chess Core (In Progress)
**Flag**: `USE_NEW_CHESS_CORE`
- [ ] Create new ChessEngineService in `/src/features/chess-core/`
- [ ] Implement move validation with TDD
- [ ] Replace ChessService gradually
- [ ] Validate with existing tests

### Phase 2: Tablebase
**Flag**: `USE_NEW_TABLEBASE_SERVICE`
- [ ] Migrate TablebaseService to `/src/features/tablebase/`
- [ ] Implement caching layer
- [ ] Create new UI components
- [ ] Test Lichess API integration

### Phase 3: Training
**Flag**: `USE_NEW_TRAINING_LOGIC`
- [ ] Decompose 533-line orchestrator
- [ ] Create focused training services
- [ ] Implement new TrainingBoard component
- [ ] Migrate session management

### Phase 4: Move Quality
**Flag**: `USE_NEW_MOVE_QUALITY`
- [ ] Extract move quality logic
- [ ] Create dedicated analysis service
- [ ] Implement quality indicators
- [ ] Add comprehensive tests

### Phase 5: Progress & UI
**Flag**: `USE_NEW_PROGRESS_TRACKING`
- [ ] Migrate progress tracking
- [ ] Create new dashboard components
- [ ] Implement statistics calculations
- [ ] Update UI components

## How to Migrate a Feature

### Step 1: Create Feature Structure
```bash
# Feature already has directories created
src/features/[feature-name]/
├── components/     # React components
├── services/       # Business logic & API calls
├── utils/          # Pure utility functions
├── hooks/          # React hooks
├── store/          # State management
├── types/          # TypeScript types
├── __tests__/      # Vitest tests
└── index.ts        # Public API (barrel file)
```

### Step 2: Implement with TDD
1. Write tests first in `__tests__/` using Vitest
2. Implement minimal code to pass tests
3. Refactor for clean code
4. Ensure 100% test coverage

### Step 3: Create Strangler Facade
```typescript
// Example: Switching between old and new service
import { createServiceFacade } from '@shared/components/StranglerFacade';
import { featureFlags, FeatureFlag } from '@shared/services/FeatureFlagService';

const tablebaseService = createServiceFacade(
  FeatureFlag.USE_NEW_TABLEBASE_SERVICE,
  legacyTablebaseService,
  newTablebaseService,
  (flag) => featureFlags.isEnabled(flag)
);
```

### Step 4: Test with Feature Flags
1. Enable feature flag in development
2. Test new implementation thoroughly
3. Monitor for errors and performance
4. Rollback if issues detected

### Step 5: Gradual Rollout
1. Enable for internal testing
2. A/B test with subset of users
3. Monitor metrics and feedback
4. Full rollout when stable

### Step 6: Remove Legacy Code
1. Wait for stability period (2-4 weeks)
2. Remove feature flag checks
3. Delete legacy implementation
4. Clean up unused dependencies

## Testing Strategy

### Unit Tests (Vitest)
- Test individual functions and components
- Mock external dependencies
- Focus on business logic
- Aim for 100% coverage

### Integration Tests
- Test feature workflows
- Use real services where possible
- Validate data flow
- Test error scenarios

### E2E Tests (Playwright)
- Test critical user journeys
- Validate with both legacy and new implementations
- Monitor performance metrics
- Ensure no regressions

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Explicit return types
- Proper error handling

### React Components
- Functional components only
- Custom hooks for logic
- Proper memo usage
- Accessibility compliance

### State Management
- Zustand for global state
- Local state for component-specific
- Proper state updates
- Avoid unnecessary re-renders

## Common Patterns

### Service Pattern
```typescript
export class NewTablebaseService implements ITablebaseService {
  private cache: Map<string, TablebaseResult>;
  
  async query(fen: string): Promise<TablebaseResult> {
    // Check cache first
    if (this.cache.has(fen)) {
      return this.cache.get(fen)!;
    }
    
    // Fetch from API
    const result = await this.fetchFromLichess(fen);
    this.cache.set(fen, result);
    return result;
  }
}
```

### Hook Pattern
```typescript
export function useTablebaseQuery(fen: string) {
  const [result, setResult] = useState<TablebaseResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  
  useEffect(() => {
    const query = async () => {
      setLoading(true);
      try {
        const data = await tablebaseService.query(fen);
        setResult(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    query();
  }, [fen]);
  
  return { result, loading, error };
}
```

### Component Pattern
```typescript
export function TablebasePanel({ fen }: Props) {
  const { result, loading, error } = useTablebaseQuery(fen);
  
  if (loading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!result) return null;
  
  return (
    <div className="tablebase-panel">
      <EvaluationDisplay evaluation={result.evaluation} />
      <MoveList moves={result.moves} />
    </div>
  );
}
```

## Troubleshooting

### Feature Flag Not Working
1. Check localStorage for overrides
2. Verify environment variables
3. Clear browser cache
4. Check console for errors

### Tests Failing After Migration
1. Update import paths
2. Check for missing mocks
3. Verify test environment setup
4. Compare with legacy test behavior

### Performance Regression
1. Profile with React DevTools
2. Check for unnecessary re-renders
3. Verify caching is working
4. Monitor API call frequency

## Resources

- [Feature Flags Panel](/dev) - Development UI for toggling features
- [Vitest Documentation](https://vitest.dev/)
- [PROJECT_STRUCTURE.md](/PROJECT_STRUCTURE.md) - Target architecture
- [CLAUDE.md](/CLAUDE.md) - AI assistance rules

## Contact

For questions or issues during migration:
- Create GitHub issue with `migration` label
- Tag in Slack: #architecture-migration
- Refer to AI consensus docs in issues #127-#137