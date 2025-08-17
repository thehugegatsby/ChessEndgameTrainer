# Phase B: TrainingSlice Service Extraction - LOC Tracking

> **Target:** Reduce TrainingSlice from 1010 LOC → <600 LOC (>40% reduction)
> **Strategy:** Extract Position/Move/GameState services incrementally

## LOC Progress Tracking

| Phase | Task | TrainingSlice LOC | Change | Services Added | Status |
|-------|------|-------------------|--------|----------------|--------|
| **Baseline** | B.1 - Analysis | **1010** | - | - | ✅ |
| B.2 | Service Scaffolding | 1010 | 0 | Interfaces only | 🎯 |
| B.3 | Dependency Injection | 1010 | 0 | DI setup | 🎯 |
| B.4 | PositionService | ~950 | -60 | PositionService | 🎯 |
| B.5 | MoveService (basic) | ~900 | -50 | MoveService | 🎯 |
| B.6 | GameStateService | ~850 | -50 | GameStateService | 🎯 |
| B.7 | MoveService (extended) | ~800 | -50 | Extended moves | 🎯 |
| B.8 | Consolidation | ~750 | -50 | Cleanup | 🎯 |
| B.9-B.13 | Testing & Polish | ~700 | -50 | Final cleanup | 🎯 |
| **TARGET** | **Final State** | **<600** | **-410+** | **3 Services** | 🎯 |

## Extractable Code Blocks Identified

### ✅ **Analysis Complete** - TODO Comments Added

**PositionService Candidates (~150-200 LOC):**
- `resetPosition()` - FEN loading logic
- `setEvaluationBaseline()` - Position evaluation management  
- `evaluateMoveQuality()` - Move quality evaluation logic
- Position-related state management

**MoveService Candidates (~100-150 LOC):**
- `addTrainingMove()` - Move execution and validation
- `resetPosition()` - Move history management
- Move validation logic (in stubs)
- Training-specific move metadata

**GameStateService Candidates (~100-150 LOC):**
- `resetPosition()` - Turn management logic
- `finalizeTrainingSession()` - Game termination detection
- Game state evaluation (checkmate/stalemate/draw)
- Training completion criteria

**Remaining in TrainingSlice (~600 LOC):**
- UI state management (dialogs, loading states)
- Training-specific counters (hints, mistakes, streaks)
- Navigation state (next/previous positions)
- Session management (progress, completion)

## Success Criteria

- [x] **Analysis:** All extractable blocks identified with TODO comments
- [ ] **LOC Reduction:** 1010 → <600 LOC (target: 40%+ reduction)
- [ ] **Service Count:** 3 domain services (Position/Move/GameState)
- [ ] **Testing:** All existing tests continue passing
- [ ] **TypeScript:** Clean compilation throughout process
- [ ] **Architecture:** Clean service boundaries established

## Quality Gates (Each Task)

```bash
pnpm tsc && pnpm lint    # TypeScript + Linter validation
pnpm test               # All tests passing
```

---

**Status:** ✅ **B.1 Complete** - Analysis done, extractable blocks marked, ready for B.2