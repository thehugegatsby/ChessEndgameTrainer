# Unified Evaluation System Migration Guide

## Overview

The Unified Evaluation System is a complete rewrite of the chess evaluation pipeline, designed to fix the "Black perspective double-inversion bug" and provide a cleaner, more maintainable architecture.

## Architecture

### Core Components

1. **UnifiedEvaluationService** - Central orchestrator
2. **EvaluationNormalizer** - Normalizes all values to White's perspective
3. **PlayerPerspectiveTransformer** - Handles perspective transformations
4. **EvaluationFormatter** - Formats evaluations for UI display
5. **MoveQualityAnalyzer** - Analyzes move quality based on evaluation changes

### Key Improvements

- **Correct Black Perspective**: Fixes the double-inversion bug where Black's evaluations were incorrectly displayed
- **Provider Abstraction**: Clean interfaces for engine and tablebase providers
- **Comprehensive Caching**: LRU cache with configurable TTL
- **Pipeline Pattern**: Clear data flow through transformation stages
- **Type Safety**: Strong TypeScript types throughout

## Migration Status

### Phase 1: Foundation ✅
- [x] Baseline tests for current behavior
- [x] Compatibility interfaces defined

### Phase 2: Implementation ✅
- [x] Unified evaluation components copied
- [x] Test suite migrated
- [x] Import paths fixed
- [x] Build passing

### Phase 3: Integration ✅
- [x] Feature flag implemented (USE_UNIFIED_EVALUATION_SYSTEM)
- [x] Hook wrapper created (useEvaluationWrapper)
- [x] Transparent migration path

### Phase 4: Cleanup 🚧
- [ ] Remove legacy evaluation services
- [ ] Update performance benchmarks
- [ ] Complete documentation

## Usage

### Enabling the New System

```bash
# Development (enabled by default)
npm run dev

# Development with old system
NEXT_PUBLIC_UNIFIED_EVAL=false npm run dev

# Production (disabled by default)
npm run build

# Production with new system
NEXT_PUBLIC_UNIFIED_EVAL=true npm run build
```

### Feature Flag Configuration

The system is controlled by the `USE_UNIFIED_EVALUATION_SYSTEM` flag in `shared/constants/index.ts`:

```typescript
USE_UNIFIED_EVALUATION_SYSTEM: 
  process.env.NEXT_PUBLIC_UNIFIED_EVAL === 'true'
```

### Hook Usage

The evaluation hook automatically uses the appropriate system:

```typescript
import { useEvaluation } from '@shared/hooks';

// Usage remains the same
const { evaluations, lastEvaluation, isEvaluating } = useEvaluation({
  fen: currentFen,
  isEnabled: true,
  previousFen: previousFen
});
```

## Testing

### Running Tests

```bash
# Test with new system
NEXT_PUBLIC_UNIFIED_EVAL=true npm test

# Test with old system  
NEXT_PUBLIC_UNIFIED_EVAL=false npm test

# Test both systems
npm run test:migration
```

### Key Test Files

- `evaluation.baseline.test.ts` - Baseline behavior tests
- `pipeline.e2e.test.ts` - End-to-end pipeline tests
- `featureFlag.integration.test.ts` - Feature flag behavior tests

## Performance Considerations

The new system includes several performance optimizations:

1. **Parallel Evaluation**: Engine and tablebase queries run in parallel
2. **Smart Caching**: LRU cache prevents redundant evaluations
3. **Abort Control**: Pending evaluations are cancelled when positions change
4. **Debouncing**: Built into the hook wrapper (300ms default)

## Migration Checklist

- [x] Feature flag defaults to false in production
- [x] All existing tests pass with flag disabled
- [x] Hook wrapper maintains Rules of Hooks compliance
- [x] No side effects when disabled
- [ ] Performance benchmarks updated
- [ ] Production monitoring in place
- [ ] Rollback plan documented

## Rollback Procedure

If issues arise in production:

1. Set `NEXT_PUBLIC_UNIFIED_EVAL=false`
2. Redeploy application
3. The old system will be used immediately

## Future Work

Once the new system is stable:

1. Enable by default in production
2. Run A/B tests to verify improvements
3. Remove legacy code (Phase 4)
4. Update all documentation
5. Optimize bundle size

## Architecture Decisions

### Why Provider Interfaces?

The provider pattern allows:
- Easy mocking in tests
- Future engine swapping
- Clean separation of concerns
- Dependency injection

### Why Normalize to White's Perspective?

Chess engines always evaluate from White's perspective. By normalizing early:
- Consistent data throughout the pipeline
- Single source of truth
- Easier debugging
- Clear transformation points

### Why Feature Flags?

Feature flags enable:
- Gradual rollout
- Quick rollback
- A/B testing
- Risk mitigation

## Known Issues

1. Some unit tests fail with the new system enabled (expected during migration)
2. Cache stats not yet exposed in the hook wrapper
3. Performance metrics need updating

## Contact

For questions or issues with the migration, please open an issue in the repository.