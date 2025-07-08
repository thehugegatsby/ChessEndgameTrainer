# ChessEndgameTrainer Architecture

## Overview

ChessEndgameTrainer is a web/mobile chess endgame training application with AI engine integration. The architecture prioritizes cross-platform code sharing (80%), performance optimization, and clean separation of concerns.

## Tech Stack

### Core Technologies
- **Frontend**: Next.js 15.3, React 18.3, TypeScript 5.3
- **UI**: Tailwind CSS 3.4, Radix UI, react-chessboard 4.3
- **State**: Zustand 4.4 (installed), React Context API (current)
- **Chess Engine**: chess.js 1.0.0-beta.6, Stockfish WASM (NNUE)
- **Testing**: Jest 29.7, React Testing Library 14.1
- **Mobile**: React Native 0.73 (prepared, 0% implementation)
- **Database**: Firebase Firestore (optional with local fallback)

### Project Structure
```
/
├── pages/              # Next.js pages (web only)
├── shared/             # 80% shared code (web + mobile ready)
│   ├── components/     # UI components (platform-agnostic)
│   ├── hooks/         # Business logic as hooks
│   ├── lib/           # Core libraries & engine
│   ├── services/      # Platform service abstractions
│   ├── utils/         # Utility functions
│   ├── constants/     # Centralized configuration
│   └── types/         # TypeScript definitions
├── app/mobile/        # React Native app (prepared)
├── tests/             # Test suites
└── public/            # Static assets + stockfish.wasm
```

## Core Architecture Patterns

### 1. Singleton Engine Pattern
```typescript
// Only ONE Stockfish instance system-wide
const engine = Engine.getInstance();
// Mobile constraint: ~20MB memory per worker
// Critical: Always call quit() on cleanup
```

### 2. Evaluation Pipeline Architecture
```
Raw Engine Data → Normalizer → PerspectiveTransformer → Formatter → UI
```

**Pipeline Components**:
- **Normalizer**: Converts all evaluations to White's perspective
- **PerspectiveTransformer**: Transforms to display perspective (White/Black)
- **EvaluationDeduplicator**: Removes redundant evaluations
- **ChessAwareCache**: LRU cache with chess-specific optimizations
- **Formatter**: Formats for UI display (no perspective logic)

### 3. Dual Evaluation System
- **Engine Evaluation**: Stockfish.js for position analysis
- **Tablebase Lookup**: 7-piece endgame perfect play
- **Unified Pipeline**: Both sources go through same evaluation pipeline

### 4. State Management (Current)
- **React Context**: Current implementation for global state
- **Local State**: Component-level state with hooks
- **Zustand**: Installed but not yet migrated (planned)

### 5. Error Handling Architecture
```typescript
// Centralized error handling
ErrorService.handleError('Context', error);
// Structured logging
const logger = getLogger();
logger.info('Operation', { data });
```

## Performance Optimizations

### Achieved Metrics
- **75% API Call Reduction**: Through intelligent debouncing
- **99.99% Cache Hit Rate**: LRU cache with chess-aware optimizations  
- **31% Faster Evaluations**: Parallel promise handling
- **53% Faster Navigation**: Optimized game state management

### Key Techniques
1. **Debouncing**: 300ms delay prevents evaluation flooding
2. **LRU Cache**: 200 items (~70KB) for repeated positions
3. **Parallel Processing**: Tablebase comparisons run in parallel
4. **AbortController**: Cancels outdated evaluation requests
5. **Instance Reuse**: Single Chess.js instance per game

## Security Architecture

### Current Implementation
- FEN validation at service boundaries
- Path validation for worker scripts
- No hardcoded credentials
- ErrorService for secure error handling

### Critical Gaps
- No input sanitization for user-provided FEN strings
- Missing Content Security Policy (CSP)
- No XSS protection in place

## Cross-Platform Strategy

### Shared Code Structure (80%)
```typescript
// Platform abstraction interface (TODO)
interface PlatformService {
  storage: StorageAdapter;
  notification: NotificationAdapter;
  worker: WorkerAdapter;
}
```

### Platform-Specific Code (20%)
- Navigation (Next.js router vs React Navigation)
- Storage (localStorage vs AsyncStorage)
- Worker management (Web Workers vs React Native modules)

## Data Flow Architecture

### Chess Move Flow
1. User makes move on board
2. `useChessGame` hook validates move
3. Move sent to evaluation pipeline
4. Engine + Tablebase evaluate position
5. Results normalized and transformed
6. UI updates with evaluation

### State Update Flow
1. Action triggered (move, undo, reset)
2. State updated in Context/Zustand
3. Version number incremented
4. React re-renders affected components
5. Side effects trigger (evaluation, persistence)

## Deployment Architecture

### Web Deployment (Vercel)
- Static export with Next.js
- WASM files served with correct headers
- Environment variables for configuration
- Firebase integration optional

### Mobile Deployment (Planned)
- React Native bundle
- Native Stockfish integration
- Offline-first with local storage
- App store distribution

## Technical Constraints

### Memory Constraints
- Mobile: Max 1 Stockfish instance (~20MB)
- LRU Cache: 200 items max (~70KB)
- Web Worker limitations on iOS Safari

### Performance Constraints
- Debounce delay: 300ms for evaluations
- Touch targets: Minimum 44px for mobile
- Bundle size target: <300KB (currently ~500KB)

### Browser Constraints
- WASM requires specific server headers
- iOS Safari may terminate workers
- Web Worker API differences across browsers

## Architecture Health Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|---------|
| Test Coverage | ~78% | 80% | ⚠️ |
| Bundle Size | ~500KB | <300KB | ❌ |
| API Call Reduction | 75% | 70% | ✅ |
| Cache Hit Rate | 99.99% | 95% | ✅ |
| Mobile Coverage | 0% | 80% | ❌ |

## Future Architecture Goals

### Phase 1: Foundation (Immediate)
- [ ] Implement platform abstraction layer
- [ ] Add FEN input sanitization
- [ ] Complete Zustand migration
- [x] Centralized error handling ✅
- [x] Replace magic numbers ✅

### Phase 2: Scalability (Month 1-2)
- [ ] Complete React Native implementation
- [ ] Add offline support
- [ ] Implement code splitting
- [ ] Add monitoring/analytics

### Phase 3: Production (Month 3)
- [ ] Security hardening (CSP, XSS protection)
- [ ] Performance monitoring dashboard
- [ ] A/B testing infrastructure
- [ ] Multi-language support

## Architecture Decisions Record

### Why Evaluation Pipeline?
- **Clear Separation**: Each component has single responsibility
- **Testability**: Components tested in isolation
- **Extensibility**: Easy to add new transformations
- **Type Safety**: Strong contracts between components

### Why Singleton Engine?
- **Memory Efficiency**: Mobile devices have limited memory
- **Resource Management**: Prevents multiple worker spawns
- **Consistent State**: Single source of truth for evaluations

### Why Dual Evaluation?
- **Accuracy**: Tablebase provides perfect endgame play
- **Flexibility**: Engine handles all positions
- **Learning**: Compare engine vs perfect play

---
*Last Updated: 2025-07-08*