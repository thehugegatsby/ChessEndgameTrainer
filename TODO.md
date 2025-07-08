# TODO - ChessEndgameTrainer Tasks

Last Updated: 2025-07-08

## 📌 Current Sprint Focus
1. Complete Brückenbau-Trainer Phase P3 (UI Integration)
2. ~~Fix security vulnerabilities (FEN sanitization)~~ ✅ COMPLETED (2025-07-08)
3. Fix failing Playwright test

---

## 🚨 Critical Priority Tasks

### 1. ~~**Security: Implement FEN String Sanitization**~~ ✅ COMPLETED (2025-07-08)
- [x] Add input validation in `shared/lib/chess/ScenarioEngine.ts`
- [x] Create sanitization utility in `shared/utils/fenValidator.ts`
- [x] Apply sanitization to all FEN inputs
- [x] Add XSS prevention tests
- **Implementation Details**:
  - Created comprehensive `fenValidator.ts` with validation and sanitization
  - Protected all input boundaries: instanceManager, tablebase, positionService, store, useChessGame
  - 100% test coverage on FEN validator
  - Prevents XSS, SQL injection, and invalid FEN formats

### 2. **Brückenbau-Trainer Phase P3: UI Integration**
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

### 3. **Fix Failing Playwright Test**
- [ ] Fix bridge building test in `tests/e2e/bridge-building.spec.ts`
- [ ] Fix simple bridge building test in `tests/e2e/bridge-building-simple.spec.ts`
- [ ] Update tests for new evaluation logic
- [ ] Ensure all e2e tests pass
- **Files**: `tests/e2e/bridge-building*.spec.ts`
- **Acceptance Criteria**: All tests green
- **Effort**: S (Small)

---

## 🔥 High Priority Tasks

### 4. **Mobile: Implement Platform Abstraction Layer** (PARTIALLY COMPLETE)
- [x] Create `shared/services/platform/PlatformService.ts` ✅
- [x] Add platform detection utilities ✅
- [ ] Abstract storage API in `shared/services/storage/`
- [ ] Abstract worker API for React Native
- **Acceptance Criteria**: 
  - Single interface for web/mobile
  - No direct browser API usage
  - React Native compatibility
- **Effort**: L (Large)

### 5. ~~**State Management: Migrate to Zustand**~~ ✅ COMPLETED (2025-01-07)
- [x] Create `shared/store/store.ts` (global store)
- [x] Migrate TrainingContext logic to Zustand
- [x] Update all components using TrainingContext
- [x] Remove old Context implementation
- [x] Add Zustand devtools integration
- **Status**: Migration complete ✅ Cleanup completed 2025-07-08

### 6. **Engine: Fix Memory Management**
- [ ] Implement proper cleanup in `EngineService.ts`
- [ ] Add memory leak detection tests
- [ ] Ensure worker termination on unmount
- [ ] Add cleanup verification in `workerManager.ts`
- **Acceptance Criteria**: 
  - No memory leaks in Chrome DevTools
  - Workers properly terminated
  - Cleanup tests passing
- **Effort**: M (Medium)

### 7. **Testing: Reach 80% Coverage**
- [ ] Add tests for uncovered evaluation utils
- [ ] Complete mobile service mocks
- [ ] Add integration tests for Firestore dual-read
- [ ] Fix skipped castling tests
- **Current**: 47.54% (overall) / ~78% (business logic) | **Target**: 80% (business logic)
- **Effort**: M (Medium)

### 8. ~~**Cleanup: Remove Old Non-Zustand Components**~~ ✅ COMPLETED (2025-07-08)
- [x] Remove old `TrainingBoard` component (non-Zustand version)
- [x] Remove old `MovePanel` component (non-Zustand version)
- [x] Update all imports to use only Zustand versions
- [x] Update exports in `shared/components/training/index.ts`
- [x] Update all tests to use Zustand components
- **Status**: Successfully removed all non-Zustand components
- **Note**: TrainingBoardZustand test needs fixing due to removed mocks

---

## 📊 Medium Priority Tasks

### 9. ~~**Clean Up Uncommitted Debug Scripts**~~ ✅ COMPLETED (2025-07-08)
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

### 10. **Performance: Implement Code Splitting**
- [ ] Add dynamic imports for routes
- [ ] Lazy load heavy components (Chessboard)
- [ ] Split vendor bundles
- [ ] Implement route-based chunking
- **Target**: Bundle size < 300KB (currently ~155KB per route + 85.8KB shared)
- **Effort**: M (Medium)

### 11. **Add Platform API Checks**
- [ ] Wrap all browser APIs with existence checks
- [ ] Add fallbacks for missing APIs
- [ ] Create platform capability detection
- **Files**: All files using window, document, localStorage
- **Effort**: M (Medium)

### 12. ~~**Update Outdated Documentation**~~ ✅ COMPLETED (2025-07-08)
- [x] Fix "types/chess.ts has only 5 lines" (actually 91)
- [x] Update test coverage numbers
- [x] Document new evaluation system
- [x] Add Firestore setup guide
- [x] Complete documentation restructure
- **Files**: `CLAUDE.md`, `README.md`, `docs/`
- **Completed**: Consolidated 40 MD files into clean structure

### 13. **Refactor: useReducer for Complex Hooks**
- [ ] Migrate `useChessGame` to useReducer
- [ ] Migrate `useEvaluation` to useReducer
- [ ] Add proper action types
- **Acceptance Criteria**: Cleaner state updates
- **Effort**: M (Medium)

---

## 🔧 Low Priority Tasks

### 14. **Internationalization Support**
- [ ] Add i18n library (react-i18next)
- [ ] Extract all strings to translation files
- [ ] Support DE/EN minimum
- **Effort**: L (Large)

### 15. **Complete PWA Features**
- [ ] Add offline support
- [ ] Implement service worker
- [ ] Add install prompt
- [ ] Cache static assets
- **Effort**: M (Medium)

### 16. **Analytics Integration**
- [ ] Choose analytics provider
- [ ] Add event tracking
- [ ] Track learning progress
- [ ] Privacy-compliant implementation
- **Effort**: M (Medium)

### 17. **Brückenbau Phase P4: Card System**
- [ ] Design card data structure
- [ ] Create 3 pilot cards
- [ ] Add progress persistence
- [ ] Implement card UI
- **Effort**: L (Large)

### 18. **TypeScript Strict Mode**
- [ ] Enable strict mode in tsconfig
- [ ] Fix all resulting errors
- [ ] Add stricter linting rules
- **Effort**: L (Large)

### 19. **React Native Full Implementation**
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