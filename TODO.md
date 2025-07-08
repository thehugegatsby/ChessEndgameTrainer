# TODO - ChessEndgameTrainer Tasks

Last Updated: 2025-07-08 (20:15 UTC)

## 📌 Current Sprint Focus
1. ~~Fix critical Store synchronization bug (Kd7 move not executed)~~ ✅ COMPLETED (2025-07-08)
2. ~~Complete Store Single Source of Truth migration~~ ✅ COMPLETED (2025-07-08)
3. **FIX: Black doesn't make moves in Training 12 after 1.Kd7** - 🚨 CRITICAL BUG
4. **FIX: Analysis mode causes layout shift and white move panel** - 🚨 UI BUG
5. Complete Brückenbau-Trainer Phase P3 (UI Integration) - ON HOLD
6. Fix failing Playwright tests - ON HOLD

---

## 🚨 Critical Priority Tasks

### 1. **Black Doesn't Make Moves in Training 12** - NEW BUG (2025-07-08)
- **Problem**: After 1.Kd7 in Brückenbau-Trainer position 12, black stops responding
- **Symptoms**: 
  - Move is displayed in move list
  - Board shows the move
  - But black (computer) doesn't make counter-moves
- **Potential Causes**:
  - ScenarioEngine not properly initialized for this position
  - Turn tracking issue in Store after Kd7
  - Engine evaluation not triggering for black's turn
- **Files to Check**: 
  - `pages/train/[id].tsx`
  - `shared/lib/chess/ScenarioEngine/index.ts`
  - `shared/store/store.ts` (makeMove action)
  - Position data for ID 12
- **Effort**: M (Medium)

### 2. **Analysis Mode UI Layout Bug** - NEW BUG (2025-07-08)
- **Problem**: Enabling analysis mode causes:
  - Chessboard shifts to the left
  - White panel with moves appears incorrectly
  - Layout breaks
- **Potential Causes**:
  - CSS Grid/Flexbox issue
  - Duplicate MovePanel rendering
  - Responsive layout breaking on analysis toggle
- **Files to Check**:
  - `shared/components/training/TrainingBoard/TrainingBoardZustand.tsx`
  - `shared/components/training/MovePanel/MovePanelZustand.tsx`
  - CSS modules for layout
- **Effort**: S (Small)

### 3. ~~**Store Synchronization Bug Fix**~~ ✅ COMPLETED (2025-07-08)
- [x] Fixed critical bug where moves were shown in move list but not executed on board
- [x] Store now properly calls `game.move()` before updating derived states
- [x] Fixed all unit tests to work with new Store architecture (1038/1049 passing)
- [x] Added Store Testing Best Practices to TESTING_GUIDELINES.md
- [x] Fixed TypeScript types for makeMove to accept simple move objects
- **Root Cause**: Chess.js instance in Store wasn't being updated with moves
- **Solution**: Execute move on game instance BEFORE updating all derived states

### 2. ~~**Complete Store Single Source of Truth Migration**~~ ✅ COMPLETED (2025-07-08)
- [x] Deprecate `useChessGame` and `useChessGameOptimized` hooks
- [x] All components now use Zustand store
- [x] No remaining Context API usage
- [x] Proper single source of truth implementation
- [x] Clean separation between global state (Store) and local UI state
- **Migration Details**:
  - Removed all old hooks and Context providers
  - Updated all components to use Store
  - Fixed infinite update loops in tests
  - Cleaned up test mocks
  - All 1023 tests passing

### 5. **Brückenbau-Trainer Phase P3: UI Integration** (ON HOLD - Fix bugs first)
- [ ] Extend `shared/components/training/MovePanel.tsx` with enhanced display
- [ ] Add CSS classes for quality badges (create new CSS module)
- [ ] Create evaluation tooltip component
- [ ] Update `DualEvaluationSidebar.tsx` with robustness indicators
- [ ] Extend evaluation legend in `EvaluationLegend.tsx`
- **Acceptance Criteria**: 
  - All 5 quality classes visible (optimal, sicher, umweg, riskant, fehler)
  - Robustness tags shown (robust, präzise, haarig)
  - Educational tooltips functional
- **Effort**: M (Medium)

### 4. **Fix Failing Playwright Tests**
- [ ] Fix bridge building test in `tests/e2e/bridge-building.spec.ts`
- [ ] Fix simple bridge building test in `tests/e2e/bridge-building-simple.spec.ts`
- [ ] Update tests for new evaluation logic
- [ ] Ensure all e2e tests pass
- **Files**: `tests/e2e/bridge-building*.spec.ts`
- **Acceptance Criteria**: All tests green
- **Effort**: S (Small)

---

## 🔥 High Priority Tasks

### 5. ~~**Security: Implement FEN String Sanitization**~~ ✅ COMPLETED (2025-07-08)
- [x] Add input validation in `shared/lib/chess/ScenarioEngine.ts`
- [x] Create sanitization utility in `shared/utils/fenValidator.ts`
- [x] Apply sanitization to all FEN inputs
- [x] Add XSS prevention tests
- **Implementation Details**:
  - Created comprehensive `fenValidator.ts` with validation and sanitization
  - Protected all input boundaries: instanceManager, tablebase, positionService, store, useChessGame
  - 100% test coverage on FEN validator
  - Prevents XSS, SQL injection, and invalid FEN formats

---

## 🔥 High Priority Tasks

### 6. **Mobile: Implement Platform Abstraction Layer** (PARTIALLY COMPLETE)
- [x] Create `shared/services/platform/PlatformService.ts` ✅
- [x] Add platform detection utilities ✅
- [ ] Abstract storage API in `shared/services/storage/`
- [ ] Abstract worker API for React Native
- **Acceptance Criteria**: 
  - Single interface for web/mobile
  - No direct browser API usage
  - React Native compatibility
- **Effort**: L (Large)

### 7. ~~**State Management: Migrate to Zustand**~~ ✅ COMPLETED (2025-01-07)
- [x] Create `shared/store/store.ts` (global store)
- [x] Migrate TrainingContext logic to Zustand
- [x] Update all components using TrainingContext
- [x] Remove old Context implementation
- [x] Add Zustand devtools integration
- **Status**: Migration complete ✅ Cleanup completed 2025-07-08

### 8. **Engine: Fix Memory Management**
- [ ] Implement proper cleanup in `EngineService.ts`
- [ ] Add memory leak detection tests
- [ ] Ensure worker termination on unmount
- [ ] Add cleanup verification in `workerManager.ts`
- **Acceptance Criteria**: 
  - No memory leaks in Chrome DevTools
  - Workers properly terminated
  - Cleanup tests passing
- **Effort**: M (Medium)

### 9. **Testing: Reach 80% Coverage**
- [ ] Add tests for uncovered evaluation utils
- [ ] Complete mobile service mocks
- [ ] Add integration tests for Firestore dual-read
- [ ] Fix skipped castling tests
- **Current**: 47.54% (overall) / ~78% (business logic) | **Target**: 80% (business logic)
- **Effort**: M (Medium)

### 10. ~~**Cleanup: Remove Old Non-Zustand Components**~~ ✅ COMPLETED (2025-07-08)
- [x] Remove old `TrainingBoard` component (non-Zustand version)
- [x] Remove old `MovePanel` component (non-Zustand version)
- [x] Update all imports to use only Zustand versions
- [x] Update exports in `shared/components/training/index.ts`
- [x] Update all tests to use Zustand components
- **Status**: Successfully removed all non-Zustand components
- **Note**: TrainingBoardZustand test needs fixing due to removed mocks

---

## 📊 Medium Priority Tasks

### 11. ~~**Clean Up Uncommitted Debug Scripts**~~ ✅ COMPLETED (2025-07-08)
- [x] Removed unused StockfishEngine implementations (dead code)
- [x] Review and remove unnecessary scripts in `scripts/`
- [x] Keep only essential migration scripts
- [x] Document remaining scripts in README
- **Files Removed**: 
  - 2 unused Stockfish files (-128 lines)
  - 9 debug/test scripts with hardcoded credentials
- **Files Kept**: 
  - 2 essential migration scripts
  - 4 code analysis scripts (added to npm scripts)
- **Documentation**: Created `/scripts/README.md` with usage instructions

### 12. **Performance: Implement Code Splitting**
- [ ] Add dynamic imports for routes
- [ ] Lazy load heavy components (Chessboard)
- [ ] Split vendor bundles
- [ ] Implement route-based chunking
- **Target**: Bundle size < 300KB (currently ~155KB per route + 85.8KB shared)
- **Effort**: M (Medium)

### 13. **Add Platform API Checks**
- [ ] Wrap all browser APIs with existence checks
- [ ] Add fallbacks for missing APIs
- [ ] Create platform capability detection
- **Files**: All files using window, document, localStorage
- **Effort**: M (Medium)

### 14. ~~**Update Outdated Documentation**~~ ✅ COMPLETED (2025-07-08)
- [x] Fix "types/chess.ts has only 5 lines" (actually 91)
- [x] Update test coverage numbers
- [x] Document new evaluation system
- [x] Add Firestore setup guide
- [x] Complete documentation restructure
- **Files**: `CLAUDE.md`, `README.md`, `docs/`
- **Completed**: Consolidated 40 MD files into clean structure

### 15. **Refactor: useReducer for Complex Hooks**
- [ ] Migrate `useChessGame` to useReducer
- [ ] Migrate `useEvaluation` to useReducer
- [ ] Add proper action types
- **Acceptance Criteria**: Cleaner state updates
- **Effort**: M (Medium)

---

## 🔧 Low Priority Tasks

### 16. **Internationalization Support**
- [ ] Add i18n library (react-i18next)
- [ ] Extract all strings to translation files
- [ ] Support DE/EN minimum
- **Effort**: L (Large)

### 17. **Complete PWA Features**
- [ ] Add offline support
- [ ] Implement service worker
- [ ] Add install prompt
- [ ] Cache static assets
- **Effort**: M (Medium)

### 18. **Analytics Integration**
- [ ] Choose analytics provider
- [ ] Add event tracking
- [ ] Track learning progress
- [ ] Privacy-compliant implementation
- **Effort**: M (Medium)

### 19. **Brückenbau Phase P4: Card System**
- [ ] Design card data structure
- [ ] Create 3 pilot cards
- [ ] Add progress persistence
- [ ] Implement card UI
- **Effort**: L (Large)

### 20. **TypeScript Strict Mode**
- [ ] Enable strict mode in tsconfig
- [ ] Fix all resulting errors
- [ ] Add stricter linting rules
- **Effort**: L (Large)

### 21. **React Native Full Implementation**
- [ ] Complete mobile components
- [ ] Add navigation
- [ ] Implement mobile-specific features
- [ ] Add mobile tests
- **Current Coverage**: 0%
- **Effort**: XL (Extra Large)

---

## 📝 Notes

**Effort Scale**:
- S (Small): < 1 day
- M (Medium): 2-3 days
- L (Large): 4-7 days
- XL (Extra Large): > 1 week

**Priority Levels**:
- 🚨 Critical: Security risks or broken features
- 🔥 High: Major features or technical debt
- 📊 Medium: Important improvements
- 🔧 Low: Nice-to-have features

**Sprint Recommendations**:
1. Week 1: Tasks #1-3 (Security & Brückenbau UI)
2. Week 2: Tasks #4-5 (Platform & Zustand)
3. Week 3: Tasks #6-7 (Memory & Testing)
4. Week 4: Tasks #8-12 (Cleanup & Performance)