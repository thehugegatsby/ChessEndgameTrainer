# AnalysisPanel Migration Status

## Component Versions

### Original: `index.tsx`

- **Status**: Legacy (still active)
- **Pattern**: Direct tablebaseService calls in useEffect
- **Loading**: Single loading state for all moves
- **Caching**: No caching, refetches on every open

### New: `AnalysisPanelWithQuery.tsx`

- **Status**: React Query implementation (ready for testing)
- **Pattern**: Individual React Query hooks per position
- **Loading**: Granular loading states per move analysis
- **Caching**: Automatic FEN-based caching with 30min staleTime
- **Features**:
  - Parallel query execution
  - Automatic deduplication
  - Better error handling
  - Performance limits (max 10 moves analyzed)

## Migration Benefits

1. **Caching**: FEN-based queries cached across panel opens/closes
2. **Performance**: Parallel execution with React Query's built-in optimizations
3. **UX**: Progressive loading (shows completed analyses while others load)
4. **Memory**: Automatic garbage collection of unused queries
5. **Network**: Deduplication prevents duplicate API calls for same positions

## Usage Instructions

To test the new version:

1. **Import the new component**:

   ```tsx
   import { AnalysisPanelWithQuery } from "./AnalysisPanel/AnalysisPanelWithQuery";
   ```

2. **Replace in parent component**:

   ```tsx
   // Old
   <AnalysisPanel history={history} onClose={onClose} isVisible={visible} />

   // New
   <AnalysisPanelWithQuery history={history} onClose={onClose} isVisible={visible} />
   ```

3. **Test behavior**:
   - Open panel multiple times (should use cached data)
   - Try with games of different lengths
   - Monitor network tab for reduced API calls

## Performance Notes

- **Limit**: Currently analyzes max 10 moves to prevent overwhelming the API
- **Concurrency**: React Query manages concurrent requests automatically
- **Memory**: Old queries automatically garbage collected after 1 hour
- **Network**: 30-minute cache means repeated panel opens use cached data

## Next Steps

1. Test the new component in isolation
2. A/B test against original version
3. Monitor performance metrics
4. Gradually replace usage across application
5. Eventually remove original `index.tsx` when migration complete
