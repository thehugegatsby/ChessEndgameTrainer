# 🎯 Magic Numbers Elimination - Execution Plan

## 📋 Executive Summary

**Ziel:** 100% Elimination aller Magic Numbers für eine AI-first Codebase
**Start:** ~500 Magic Number Warnings
**Ziel:** 0 Warnings
**Strategie:** Domain-by-Domain Migration mit systematischer Konstanten-Architektur

---

## 📁 Konstanten-Architektur

### ✅ Bereits erstellt (7 Dateien)
- [x] `chess.constants.ts` - FEN-Handling, Board-Dimensionen, Game States
- [x] `meta.constants.ts` - App-Metadaten, URLs, Routes
- [x] `testing.constants.ts` - Test Runner, E2E Config, Mock Delays
- [x] `ui-layout.constants.ts` - Tailwind Classes, Components, Breakpoints
- [x] `http.constants.ts` - HTTP Config, Retry Strategy, Headers
- [x] `tablebase.constants.ts` - Tablebase-spezifische Errors und Config
- [x] `time.constants.ts` - Zeit-Units, Durations, Cache TTLs

### 📝 Neu zu erstellen (5 Dateien)
- [ ] `evaluation.constants.ts` - Scores, Thresholds, Move Quality
- [ ] `progress.constants.ts` - Spaced Repetition, Success Rates
- [ ] `animation.constants.ts` - UI Animations, Transitions, Delays
- [ ] `cache.constants.ts` - Erweitern mit zusätzlichen Cache-Configs
- [ ] `validation.constants.ts` - Input Limits, Patterns, Rules

---

## 🚀 MASTER TODO LIST

### Phase 1: Neue Konstanten-Dateien erstellen

#### evaluation.constants.ts
- [ ] Create file structure with JSDoc header
- [ ] Add SCORE_THRESHOLDS section
  - [ ] MATE_SCORE values
  - [ ] WIN/LOSS thresholds
  - [ ] DRAW ranges
- [ ] Add MOVE_QUALITY section
  - [ ] EXCELLENT threshold
  - [ ] GOOD threshold
  - [ ] INACCURACY threshold
  - [ ] MISTAKE threshold
  - [ ] BLUNDER threshold
- [ ] Add EVALUATION_CONFIG section
  - [ ] DEPTHS (shallow, normal, deep)
  - [ ] MULTI_PV settings
  - [ ] TIMEOUT values
- [ ] Add CENTIPAWN_CONVERSION section
  - [ ] Display factors
  - [ ] Rounding rules

#### progress.constants.ts
- [ ] Create file structure
- [ ] Add SPACED_REPETITION section
  - [ ] Interval multipliers
  - [ ] Success factors
  - [ ] Failure factors
  - [ ] Default intervals
- [ ] Add SUCCESS_METRICS section
  - [ ] Success rate thresholds
  - [ ] Streak multipliers
  - [ ] Completion criteria
- [ ] Add PROGRESS_CONFIG section
  - [ ] Min moves for completion
  - [ ] Max hints allowed
  - [ ] Reset thresholds

#### animation.constants.ts
- [ ] Create file structure
- [ ] Add PIECE_ANIMATION section
  - [ ] Move duration
  - [ ] Capture animation
  - [ ] Promotion effects
- [ ] Add UI_TRANSITIONS section
  - [ ] Panel slides
  - [ ] Modal fades
  - [ ] Toast animations
- [ ] Add EASING_FUNCTIONS section
  - [ ] Standard easings
  - [ ] Custom curves

#### cache.constants.ts (erweitern)
- [ ] Add CACHE_STRATEGIES section
  - [ ] LRU configurations
  - [ ] TTL strategies
  - [ ] Invalidation rules
- [ ] Add MEMORY_LIMITS section
  - [ ] Per-cache limits
  - [ ] Global limits
  - [ ] Cleanup thresholds

#### validation.constants.ts
- [ ] Create file structure
- [ ] Add INPUT_LIMITS section
  - [ ] String lengths
  - [ ] Number ranges
  - [ ] Array sizes
- [ ] Add VALIDATION_PATTERNS section
  - [ ] FEN regex
  - [ ] Move notation patterns
  - [ ] User input patterns

---

### Phase 2: Domain-by-Domain Migration

#### 🏁 Domain Cluster 1: Chess Core (170 warnings)

##### TablebaseService.ts (90 warnings)
- [ ] Import new constants files
- [ ] Replace time calculations with TIME_UNITS
- [ ] Replace score thresholds with EVALUATION.THRESHOLDS
- [ ] Replace array indices with ARRAY_INDICES
- [ ] Replace HTTP status codes with HTTP_STATUS
- [ ] Replace cache configs with CACHE constants
- [ ] Replace retry delays with HTTP_RETRY
- [ ] Test file after changes
- [ ] Run ESLint to verify reduction
- [ ] Commit changes

##### MoveQuality hooks (50 warnings)
- [ ] useMoveQuality.ts
  - [ ] Replace score thresholds
  - [ ] Replace quality levels
  - [ ] Replace timeouts
- [ ] useMoveValidation.ts
  - [ ] Replace validation limits
  - [ ] Replace piece counts
  - [ ] Replace board indices

##### ChessEventBus.ts (20 warnings)
- [ ] Replace event throttle delays
- [ ] Replace queue size limits
- [ ] Replace timeout values

##### FenCache.ts (10 warnings)
- [ ] Replace cache sizes
- [ ] Replace TTL values
- [ ] Replace cleanup intervals

#### 🎮 Domain Cluster 2: State Management (140 warnings)

##### ProgressService.ts (40 warnings)
- [ ] Replace success rate thresholds
- [ ] Replace interval calculations
- [ ] Replace streak multipliers
- [ ] Replace reset thresholds

##### SpacedRepetitionService.ts (40 warnings)
- [ ] Replace repetition intervals
- [ ] Replace difficulty factors
- [ ] Replace date calculations
- [ ] Replace success multipliers

##### rootStore.ts (30 warnings)
- [ ] Replace initialization values
- [ ] Replace state thresholds
- [ ] Replace timeout values

##### trainingSlice.ts (30 warnings)
- [ ] Replace game state values
- [ ] Replace move limits
- [ ] Replace evaluation thresholds

#### 🎨 Domain Cluster 3: UI Layer (180 warnings)

##### Components (100 warnings)
- [ ] PromotionDialog.tsx
  - [ ] Replace pixel values
  - [ ] Replace z-indices
  - [ ] Replace animation durations
- [ ] AnalysisPanel components
  - [ ] Replace score displays
  - [ ] Replace depth values
  - [ ] Replace layout dimensions
- [ ] MoveHistory.tsx
  - [ ] Replace scroll thresholds
  - [ ] Replace highlight durations
  - [ ] Replace index calculations
- [ ] ProgressCard.tsx
  - [ ] Replace percentage calculations
  - [ ] Replace display thresholds

##### Hooks (80 warnings)
- [ ] useTablebaseQuery.ts
  - [ ] Replace cache TTLs
  - [ ] Replace retry counts
  - [ ] Replace timeout values
- [ ] useMoveHandlers.ts
  - [ ] Replace debounce delays
  - [ ] Replace validation limits
- [ ] useChessAnimations.ts
  - [ ] Replace animation durations
  - [ ] Replace easing values
- [ ] useToast.ts
  - [ ] Replace display durations
  - [ ] Replace z-indices

##### Dialogs (30 warnings)
- [ ] MoveErrorDialog.tsx
  - [ ] Replace display timeouts
  - [ ] Replace animation values
- [ ] HintModal.tsx
  - [ ] Replace hint limits
  - [ ] Replace display delays

#### 🧪 Domain Cluster 4: Tests (50 warnings)

##### Test Configurations
- [ ] vitest.config.ts files
  - [ ] Replace timeouts with TEST_TIMEOUTS
  - [ ] Replace worker counts
  - [ ] Replace retry limits
- [ ] playwright.config.ts
  - [ ] Replace viewport sizes with BREAKPOINTS.VIEWPORT
  - [ ] Replace timeouts with TEST_TIMEOUTS
  - [ ] Replace retry counts

##### Test Files (nur Config, keine Test-Daten!)
- [ ] Replace setTimeout values
- [ ] Replace waitFor timeouts
- [ ] Replace polling intervals
- [ ] Keep test data local!

---

### Phase 3: Qualitätssicherung

#### ESLint Configuration
- [ ] Set no-magic-numbers rule to "error"
- [ ] Configure allowed numbers (0, 1, -1 for basic operations)
- [ ] Add ignore patterns for test data

#### Documentation
- [ ] Create CONSTANTS.md overview
- [ ] Document naming conventions
- [ ] Add migration guide for future code
- [ ] Create AI-readability guidelines

#### Validation
- [ ] Run full test suite
- [ ] Check bundle size impact
- [ ] Performance benchmarks
- [ ] Code coverage verification

---

## 📊 Progress Tracking

### Daily Metrics
| Tag | Domain | Files | Start Warnings | End Warnings | Reduction |
|-----|--------|-------|----------------|--------------|-----------|
| 1   | Setup  | 5     | 500            | 500          | 0         |
| 2   | Chess  | 4     | 500            | 330          | 170       |
| 3-4 | State  | 4     | 330            | 190          | 140       |
| 5-6 | UI     | 10+   | 190            | 10           | 180       |
| 7   | QA     | -     | 10             | 0            | 10        |

### Success Criteria
- ✅ 0 ESLint magic number warnings
- ✅ All tests passing
- ✅ No performance regression
- ✅ Improved AI readability score

---

## 🔧 Git Workflow

### Commit Message Format
```bash
refactor(constants): [domain] - eliminate magic numbers in [file]

- Created [new-constant-file] for [purpose]
- Replaced [X] magic numbers with semantic constants
- ESLint warnings: [before] -> [after]
```

### Branch Strategy
```bash
main
└── feature/eliminate-magic-numbers
    ├── constants/evaluation
    ├── constants/progress
    ├── refactor/chess-core
    ├── refactor/state-management
    └── refactor/ui-layer
```

---

## 📝 Notes & Decisions

### What stays as literals
1. Simple math operations (x/2, *100 for percentages)
2. Array access [0], [1] for first/second element
3. Test data values (keep tests readable)
4. CSS pixel values that are one-offs

### Naming Convention
```
DOMAIN_CATEGORY_SPECIFIC_DETAIL

Examples:
- CHESS_BOARD_SIZE
- UI_ANIMATION_DURATION_FAST
- TEST_TIMEOUT_INTEGRATION
- CACHE_TTL_EXTENDED
```

### Priority Order
1. High-frequency magic numbers (used 5+ times)
2. Business-critical values (scores, thresholds)
3. Configuration values (timeouts, limits)
4. UI values (only semantic ones)

---

## 🚨 Blockers & Risks

- [ ] Check for hardcoded values in build configs
- [ ] Review third-party library configurations
- [ ] Ensure no constants conflict with existing variables
- [ ] Monitor bundle size increase

---

## ✅ Completion Checklist

### Pre-Launch
- [ ] All new constant files created
- [ ] All imports updated
- [ ] TypeScript compilation successful
- [ ] ESLint passes with 0 magic numbers

### Post-Launch
- [ ] Documentation updated
- [ ] Team notified of new standards
- [ ] CI/CD rules updated
- [ ] Monitoring for regressions

---

## 📅 Timeline

```
Week 1: Foundation & Core
├── Day 1: Create constant files
├── Day 2: Chess core refactoring
├── Day 3-4: State management
├── Day 5-6: UI layer
└── Day 7: QA & Documentation

Week 2: Monitoring & Optimization
├── Monitor for regressions
├── Optimize bundle size if needed
└── Update coding standards
```

---

## 🎯 Final Goal

**ACHIEVED: 0 Magic Number Warnings**
- Clean, maintainable codebase
- 100% AI-readable constants
- Self-documenting code
- Future-proof architecture

---

*Last Updated: [Current Date]*
*Status: IN PROGRESS*
*Next Action: Create evaluation.constants.ts*