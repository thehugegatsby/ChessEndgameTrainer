# ARCHITECTURE REFACTORING PLAN - EndgameTrainer

> **Target:** Domain-Driven Design | **Approach:** Clean, Hard Cuts  
> **Phase 1:** Evaluation Domain Migration | **Philosophy:** No Legacy, No Overengineering
> **Continuation ID:** 87d9ec7e-c1e3-41e2-82e9-2218eb6fd28d

---

## THE BIG PICTURE

### Current Problem
```
TablebaseService Chaos: 6 Files (2 Real + 4 Mocks)
- Every API change = 4+ Mock files to maintain
- No clear domain boundaries  
- /shared becomes dumping ground
```

### Target State
```
Clean Domain Architecture:
src/domains/evaluation/
├── services/TablebaseService.ts     [1 Implementation]
├── __mocks__/TablebaseService.ts    [1 Mock - Vitest Standard]
├── types/                           [Domain Types]
└── index.ts                         [Public API]

Result: 67% fewer files, 100% less maintenance hell
```

---

## STRATEGY & PHILOSOPHY

### Hard Cuts Approach
- **No Legacy Support** - Clean breaks, immediate migration
- **No Backwards Compatibility** - Update all imports atomically  
- **No Deprecation Warnings** - Delete duplicates immediately
- **TypeScript First** - Validation after every file change
- **Test Safety** - Green tests after every commit

### Domain-Driven Design Benefits
1. **Clear Boundaries** - Code is where you expect it
2. **Independent Evolution** - Domains evolve separately
3. **Mobile Ready** - Clean abstractions for React Native
4. **Firebase Ready** - Domain-specific data layers
5. **Better Testing** - Isolated domains, minimal mocks

---

## PHASE 1: EVALUATION DOMAIN

### Why Start Here?
- **Most Isolated** - TablebaseService has minimal dependencies
- **Biggest Pain Point** - 6 duplicates causing maintenance hell
- **Clear Win** - Immediate reduction from 6→2 files
- **Foundation** - Sets pattern for other domains

### Success Metrics
```
Before: 6 TablebaseService files
After:  2 TablebaseService files (1 real + 1 mock)

Before: API change = 4+ files to update  
After:  API change = 1 file to update

Before: Mock inconsistencies across tests
After:  Single Vitest-standard mock strategy
```

---

## EXECUTION APPROACH

### Atomic File-by-File Migration
```
Phase A: ANALYZE & DECIDE    [Analysis + Decision Matrix]
Phase B: BUILD & MIGRATE     [Domain Creation + Service Migration]  
Phase C: CLEANUP & VALIDATE  [Legacy Deletion + Final Tests]
```

### Safety & Validation
- **Git Branch:** `evaluation-domain-migration`
- **Atomic Commits:** After each file operation
- **Continuous Validation:** `pnpm tsc && pnpm test` after each step
- **Rollback Ready:** `git reset --hard HEAD~1` if anything breaks

---

## FUTURE PHASES (Post Phase 1)

### Phase 2: Game Domain
```
Target: src/domains/game/
- Chess-core logic from /shared/utils/chess/
- Position management from TrainingSlice
- Move validation and parsing
```

### Phase 3: Session Domain  
```
Target: src/domains/session/
- TrainingSlice decomposition
- Session state management
- Progress tracking
```

### Phase 4: Infrastructure Cleanup
```
Target: src/infrastructure/
- API clients consolidation
- Firebase setup organization
- Logging standardization
```

---

## DECISION RATIONALE

### Why Domain-Driven vs Feature-Based?
- **Current Features are Empty** - /features/chess-core, /features/training mostly empty
- **Technical vs Business Boundaries** - Domains follow business concepts
- **Real Use Cases** - App deals with positions, moves, evaluations, sessions
- **Scalability** - New features have clear domain homes

### Why Hard Cuts vs Gradual Migration?
- **Development Environment** - No production downtime risk
- **LLM Development** - Can handle bulk updates efficiently  
- **Maintenance Burden** - Gradual migration means maintaining both old and new
- **Clear End State** - Hard cuts force complete migration

### Why Start with Evaluation Domain?
- **Lowest Risk** - TablebaseService is most isolated
- **Highest Pain** - 6 duplicates causing most maintenance issues
- **Clear Boundaries** - Evaluation logic is well-defined
- **Foundation Pattern** - Sets template for other domains

---

## ANTI-PATTERNS TO AVOID

### Code Smells We're Eliminating
- Multiple implementations of same service
- Mock explosion (4+ mocks for 1 service)
- Feature folders without clear business purpose
- /shared as dumping ground for everything
- Circular dependencies between "features"

### Implementation Anti-Patterns
- Gradual migration with both old/new systems
- Backwards compatibility shims
- Deprecation warnings and interim states
- Complex factory patterns for simple mocks
- Feature folders based on technical concerns

---

**This plan guides the WHY and WHAT. See ARCHITECTURE_REFACTORING_TODO.md for HOW and STATUS.**