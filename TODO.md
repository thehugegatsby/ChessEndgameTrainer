# TODO - Chess Endgame Trainer

## Current Sprint: E2E Test Rewrite & Documentation Modernization

### P0: Immediate Actions (This Week) 🚨
- [ ] **E2E Test System Rewrite** - Complete rewrite of E2E testing approach
  - [ ] Design new Playwright architecture (see ISSUE_E2E_REWRITE.md)
  - [ ] Implement modern Page Object Model patterns
  - [ ] Create deterministic MockEngineService integration
  - [ ] Fix the 1 failing unit test (useEvaluation undefined variable)
  - [ ] Restore E2E test coverage for critical user flows
- [ ] **Documentation System Modernization**
  - [ ] Update /docs structure with current architecture
  - [ ] Modernize API documentation
  - [ ] Create comprehensive testing guidelines

### P1: Performance & Quality (Next Week) 🔄
- [ ] **Bundle Size Optimization**
  - [ ] Implement code splitting for heavy components
  - [ ] Optimize Stockfish WASM loading
  - [ ] Target <300KB per route achievement
- [ ] **TypeScript Error Elimination**
  - [ ] Address remaining 42 TypeScript errors
  - [ ] Achieve zero-error TypeScript compilation
  - [ ] Improve type safety across codebase

### P2: Advanced Features & Production Readiness 🏗️
- [ ] **Firebase Integration Enhancement**
  - [ ] Complete Firebase Firestore integration
  - [ ] Implement user authentication and data persistence
  - [ ] Add offline capability with service workers
- [ ] **Advanced Chess Features**
  - [ ] Expand endgame position library
  - [ ] Implement spaced repetition algorithm
  - [ ] Add progress tracking and analytics

---

## 🔥 High Priority Tasks

### 6. **Complete Engine DI Architecture** (ON HOLD - Focus on Firebase)
- [ ] Create ProductionEngineService that wraps existing Engine singleton
- [ ] Fix EngineContext TODO - use ProductionEngineService in production
- [ ] Migrate ScenarioEngine to accept injected engine service
- [ ] Remove direct Engine.getInstance() calls
- [ ] Use runtime detection for test mode instead of build-time flags
- **Effort**: M (Medium)

### 7. **Implement Playwright Worker Mocking** (ON HOLD - Focus on Firebase)
- [ ] Create Worker mock for Playwright tests
- [ ] Provide deterministic instant responses (1-10ms)
- [ ] Remove dependency on real Stockfish in E2E tests
- [ ] Test with existing @smoke tests
- **Effort**: S (Small)

### 8. **Engine: Fix Memory Management**
- [ ] Implement proper cleanup in `EngineService.ts`
- [ ] Add memory leak detection tests
- [ ] Ensure worker termination on unmount
- [ ] Add cleanup verification in `workerManager.ts`
- **Effort**: M (Medium)

### 9. **Testing: Maintain High Coverage & Fix Failing Test**
- [ ] Fix the 1 failing unit test (useEvaluation ReferenceError)
- [ ] Add tests for uncovered evaluation utils
- [ ] Maintain current 951 test comprehensive coverage
- [ ] Implement E2E test rewrite plan
- **Current**: 951 tests (950 passed, 1 failing) | **Target**: 100% passing
- **Effort**: S (Small for fix) + L (Large for E2E rewrite)

---

## 📊 Medium Priority Tasks

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
- **Effort**: M (Medium)

### 15. **Refactor: useReducer for Complex Hooks**
- [ ] Migrate `useChessGame` to useReducer
- [ ] Migrate `useEvaluation` to useReducer
- [ ] Add proper action types
- **Effort**: M (Medium)

---

## Backlog

### Code Quality & Architecture
- [ ] Remove AppDriver after full test migration
- [ ] Extend Firebase security rules for user data
- [ ] Implement client-side caching strategy
- [ ] Add Firebase Performance Monitoring
- [ ] Create architectural decision records (ADRs)

### Important Context
- ✅ 951 comprehensive unit tests (950 passed, 1 failing)
- ✅ TypeScript errors reduced from 144→42 (71% improvement)
- ✅ Mobile app components removed (web-focused architecture)
- ❌ E2E tests pending complete rewrite
- ❌ 1 failing unit test needs immediate fix
- See ISSUE_E2E_REWRITE.md for detailed E2E rewrite plan

---

## Recently Completed ✅

### Week of 2025-07-13
- [x] Complete CI/CD Pipeline Stabilization with Expert Consensus
  - [x] TypeScript error reduction from 144→42 (71% improvement)
  - [x] Mobile app removal and architecture cleanup
  - [x] E2E test architecture planning (rewrite approach)
  - [x] Unit test suite stabilization (951 tests total)
- [x] Clean Architecture Implementation
  - [x] IChessEngine interface simplification
  - [x] Singleton pattern optimization
  - [x] Store architecture cleanup

### Week of 2025-01-06
- [x] Fixed critical Store synchronization bug
- [x] Complete Store Single Source of Truth migration
- [x] Fixed Black doesn't make moves in Training 12
- [x] Fixed Analysis mode UI layout bug
- [x] E2E Test Performance Optimization - DI Architecture
- [x] Security: Implement FEN String Sanitization
- [x] Clean Up Uncommitted Debug Scripts
- [x] Update Outdated Documentation

---

## 📝 Notes

**Effort Scale**:
- S (Small): < 1 day
- M (Medium): 2-3 days
- L (Large): 4-7 days
- XL (Extra Large): > 1 week

**Priority Levels**:
- 🚨 P0: Critical - Must do this week
- 🔄 P1: High - Next week
- 🏗️ P2: Medium - Following weeks
- 📋 Backlog: Future work

**Focus**: Complete E2E test rewrite and fix remaining unit test failure for 100% test suite stability.