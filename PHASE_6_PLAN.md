# Phase 6: Code Review & Cleanup

**Date**: 2025-08-13  
**Status**: ACTIVE 🚀  
**Goal**: Clean up technical debt and reduce complexity

---

## 📊 Current Code Quality Metrics

### ESLint Analysis

- **Total Warnings**: 46
- **No Errors**: ✅ (Clean)
- **Main Issues**:
  - Functions too long (>170 lines): 10 occurrences
  - Complexity too high (>18): 6 occurrences
  - Nested ternary expressions: 3 occurrences
  - Array index as key: 2 occurrences
  - Deeply nested blocks: 5 occurrences

### Most Critical Files to Refactor

1. **ChessService.ts**
   - Complexity: 39 (validateMove), 28 (move)
   - Deep nesting issues
2. **AdvancedEndgameMenu.tsx**
   - 300 lines (way over 170 limit)
3. **useMoveQuality.ts**
   - 260 lines function
   - Complexity: 20

4. **useProgressSync.ts**
   - 373 lines function (!!)
5. **EndgameTrainingPage(Lite).tsx**
   - Both have 236 line functions

---

## 🎯 Phase 6 Tasks

### Priority 1: High Complexity Functions

- [ ] Refactor ChessService.validateMove (complexity 39 → <18)
- [ ] Refactor ChessService.move (complexity 28 → <18)
- [ ] Split MoveValidator.validateEnPassant (complexity 20)
- [ ] Simplify useMoveQuality logic (complexity 20)

### Priority 2: Oversized Components

- [ ] Break down AdvancedEndgameMenu (300 → <170 lines)
- [ ] Split useProgressSync hook (373 → multiple hooks)
- [ ] Refactor EndgameTrainingPage components (236 → <170)
- [ ] Decompose MoveHistory component (204 lines)

### Priority 3: Code Smells

- [ ] Replace nested ternary expressions with if/else or switch
- [ ] Fix array index key warnings (use unique IDs)
- [ ] Reduce nesting depth (max 4 levels)
- [ ] Extract magic numbers to constants

### Priority 4: Legacy Code Removal

- [ ] Remove disabled tablebase-demo pages
- [ ] Clean up unused test utilities
- [ ] Remove commented-out code
- [ ] Delete unused imports

### Priority 5: Dependency Updates

- [ ] Update minor dependencies
- [ ] Check for security vulnerabilities
- [ ] Remove unused dependencies
- [ ] Optimize bundle dependencies

---

## 📈 Success Metrics

### Target Improvements

- ESLint warnings: 46 → <10
- Max complexity: 39 → 18
- Max function length: 373 → 170
- Max nesting: 6 → 4
- Bundle size: Maintain <300 kB

### Quality Gates

- ✅ All tests must pass
- ✅ TypeScript: 0 errors
- ✅ No new ESLint errors
- ✅ Bundle size under budget

---

## 🔧 Refactoring Strategy

### For High Complexity Functions

1. **Extract Method Pattern**
   - Break into smaller, focused functions
   - Each function: single responsibility
   - Max 3 parameters per function

2. **Strategy Pattern**
   - Replace complex conditionals
   - Use lookup tables/maps
   - Polymorphic dispatch

### For Oversized Components

1. **Component Composition**
   - Extract sub-components
   - Use custom hooks for logic
   - Separate presentational/container

2. **Hook Extraction**
   - Business logic → custom hooks
   - Shared state → context/store
   - Side effects → separate hooks

---

## 📝 File-by-File Plan

### ChessService.ts

```typescript
// Current: validateMove with 39 complexity
// Target: Split into:
-validateBasicMove() -
  validateSpecialMoves() -
  validateCastling() -
  validateEnPassant() -
  validatePromotion();
```

### AdvancedEndgameMenu.tsx

```typescript
// Current: 300 lines monolith
// Target: Split into:
-MenuHeader.tsx - MenuCategories.tsx - MenuItems.tsx - useMenuState.ts;
```

### useProgressSync.ts

```typescript
// Current: 373 lines single hook
// Target: Split into:
-useProgressData() -
  useProgressSync() -
  useProgressCalculations() -
  useProgressPersistence();
```

---

## 🚫 What NOT to Do

- Don't break existing functionality
- Don't over-engineer simple code
- Don't reduce readability for metrics
- Don't ignore test coverage
- Don't rush - quality over speed

---

## 📅 Timeline

### Week 1 (Current)

- High complexity functions
- Critical ESLint warnings

### Week 2

- Oversized components
- Hook extractions

### Week 3

- Legacy code removal
- Final cleanup

---

## 🎓 Lessons from Previous Phases

From Phase 4 failure:

- Test actual routes, not just components
- Small incremental changes
- Verify UI after each change

From Phase 5 success:

- Document decisions
- Get consensus before major changes
- Metrics aren't everything

---

**Next Step**: Start with ChessService.validateMove refactoring
