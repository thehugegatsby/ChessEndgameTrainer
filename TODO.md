# TODO - ChessEndgameTrainer Tasks

Last Updated: 2025-01-07

## 📌 Current Sprint Focus
1. Complete Brückenbau-Trainer Phase P3 (UI Integration)
2. Fix security vulnerabilities (FEN sanitization)
3. Fix failing Playwright test

---

## 🚨 Critical Priority Tasks

### 1. **Security: Implement FEN String Sanitization**
- [ ] Add input validation in `shared/lib/chess/ScenarioEngine.ts`
- [ ] Create sanitization utility in `shared/utils/security/`
- [ ] Apply sanitization to all FEN inputs
- [ ] Add XSS prevention tests
- **Files**: `ScenarioEngine.ts`, `TrainingBoard.tsx`, `useChessGame.ts`
- **Acceptance Criteria**: No unsanitized FEN strings reach chess.js
- **Effort**: S (Small)

### 2. **Brückenbau-Trainer Phase P3: UI Integration**
- [ ] Extend `shared/components/training/MovePanel.tsx` with enhanced display
- [ ] Add CSS classes for quality badges to `styles/evaluation.css`
- [ ] Create `shared/components/ui/EvaluationTooltip.tsx`
- [ ] Update `DualEvaluationPanel.tsx` with robustness indicators
- [ ] Extend evaluation legend in `EvaluationLegend.tsx`
- **Acceptance Criteria**: 
  - All 5 quality classes visible (optimal, sicher, umweg, riskant, fehler)
  - Robustness tags shown (robust, präzise, haarig)
  - Educational tooltips functional
- **Effort**: M (Medium)

### 3. **Fix Failing Playwright Test**
- [ ] Fix bridge building test in `test-results/`
- [ ] Update test for new evaluation logic
- [ ] Ensure all e2e tests pass
- **Files**: Playwright test files
- **Acceptance Criteria**: All tests green
- **Effort**: S (Small)

---

## 🔥 High Priority Tasks

### 4. **Mobile: Implement Platform Abstraction Layer**
- [ ] Create `shared/services/platform/PlatformService.ts`
- [ ] Abstract storage API in `shared/services/storage/`
- [ ] Abstract worker API for React Native
- [ ] Add platform detection utilities
- **Acceptance Criteria**: 
  - Single interface for web/mobile
  - No direct browser API usage
  - React Native compatibility
- **Effort**: L (Large)

### 5. **State Management: Migrate to Zustand**
- [ ] Create `shared/stores/trainingStore.ts`
- [ ] Migrate TrainingContext logic to Zustand
- [ ] Update all components using TrainingContext
- [ ] Remove old Context implementation
- [ ] Add Zustand devtools integration
- **Files**: `TrainingContext.tsx`, all components using it
- **Acceptance Criteria**: 
  - No React Context for training state
  - Zustand store fully functional
  - Performance improvements measurable
- **Effort**: L (Large)

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
- **Current**: ~78% | **Target**: 80%
- **Effort**: M (Medium)

---

## 📊 Medium Priority Tasks

### 8. **Clean Up Uncommitted Debug Scripts**
- [ ] Review and remove unnecessary scripts in `scripts/`
- [ ] Keep only essential migration scripts
- [ ] Document remaining scripts in README
- **Files**: `scripts/debug*.ts`, `scripts/test*.ts`
- **Effort**: S (Small)

### 9. **Performance: Implement Code Splitting**
- [ ] Add dynamic imports for routes
- [ ] Lazy load heavy components (Chessboard)
- [ ] Split vendor bundles
- [ ] Implement route-based chunking
- **Target**: Bundle size < 300KB (currently ~500KB)
- **Effort**: M (Medium)

### 10. **Add Platform API Checks**
- [ ] Wrap all browser APIs with existence checks
- [ ] Add fallbacks for missing APIs
- [ ] Create platform capability detection
- **Files**: All files using window, document, localStorage
- **Effort**: M (Medium)

### 11. **Update Outdated Documentation**
- [ ] Fix "types/chess.ts has only 5 lines" (actually 91)
- [ ] Update test coverage numbers
- [ ] Document new evaluation system
- [ ] Add Firestore setup guide
- **Files**: `CLAUDE.md`, `README.md`, `docs/`
- **Effort**: S (Small)

### 12. **Refactor: useReducer for Complex Hooks**
- [ ] Migrate `useChessGame` to useReducer
- [ ] Migrate `useEvaluation` to useReducer
- [ ] Add proper action types
- **Acceptance Criteria**: Cleaner state updates
- **Effort**: M (Medium)

---

## 🔧 Low Priority Tasks

### 13. **Internationalization Support**
- [ ] Add i18n library (react-i18next)
- [ ] Extract all strings to translation files
- [ ] Support DE/EN minimum
- **Effort**: L (Large)

### 14. **Complete PWA Features**
- [ ] Add offline support
- [ ] Implement service worker
- [ ] Add install prompt
- [ ] Cache static assets
- **Effort**: M (Medium)

### 15. **Analytics Integration**
- [ ] Choose analytics provider
- [ ] Add event tracking
- [ ] Track learning progress
- [ ] Privacy-compliant implementation
- **Effort**: M (Medium)

### 16. **Brückenbau Phase P4: Card System**
- [ ] Design card data structure
- [ ] Create 3 pilot cards
- [ ] Add progress persistence
- [ ] Implement card UI
- **Effort**: L (Large)

### 17. **TypeScript Strict Mode**
- [ ] Enable strict mode in tsconfig
- [ ] Fix all resulting errors
- [ ] Add stricter linting rules
- **Effort**: L (Large)

### 18. **React Native Full Implementation**
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