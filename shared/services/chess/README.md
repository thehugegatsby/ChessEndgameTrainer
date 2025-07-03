# Chess Engine Services

## EngineService

**Purpose**: Centralized Stockfish engine management with resource pooling and memory cleanup.

### Architecture
```
EngineService (Singleton)
├── engines: Map<id, EngineInstance>
├── maxInstances: 5
├── cleanupInterval: 60s
└── autoCleanup: 5min idle
```

### Key Methods
- `getEngine(id)` - Get/create engine instance
- `releaseEngine(id)` - Decrease reference count
- `cleanupEngine(id)` - Force cleanup specific engine
- `getStats()` - Monitor memory usage

### Usage
```typescript
// Via Hook (Recommended)
const { engine, isLoading } = useEngine({ id: 'my-component' });

// Direct (Advanced)
const service = EngineService.getInstance();
const engine = await service.getEngine('my-id');
```

### Memory Management
- **Max 5 engines** simultaneously
- **Auto-cleanup** after 5min idle
- **Reference counting** for safe disposal
- **Error recovery** with automatic restart

### Performance Optimizations (January 2025)
- **Singleton Pattern**: Prevents multiple service instances
- **Instance Pooling**: Reuses engines across components
- **Lazy Loading**: Engines created only when needed
- **Smart Cleanup**: Removes idle engines to free memory
- **Mobile Optimized**: Low memory footprint for mobile devices

### Error Boundaries
Wrap engine components with `EngineErrorBoundary` for graceful error handling.

---

## Related Files
- `EngineService.ts` - Main service implementation
- `EngineService.test.ts` - 62 comprehensive tests
- `useEngine.ts` - React hook wrapper
- `EngineErrorBoundary.tsx` - Error boundary component