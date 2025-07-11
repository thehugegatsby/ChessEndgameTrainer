# TODO - Chess Endgame Trainer

## Current Sprint: Firebase Migration & Test Architecture Integration

### P0: Immediate Actions (This Week) 🚨
- [ ] Phase A: Activate Firebase Test Infrastructure (8 steps)
  - [ ] A.1: Create Firebase test suite using new architecture
  - [ ] A.2: Integrate firebase-test-helpers with Test API Server
  - [ ] A.3: Add Firebase emulator to global-setup.ts
  - [ ] A.4: Create FirebaseTestFixture extending base fixtures
  - [ ] A.5: Implement data seeding via Test API endpoints
  - [ ] A.6: Add Firebase-specific Page Objects
  - [ ] A.7: Create test for positionService with Firestore
  - [ ] A.8: Verify emulator cleanup between tests
- [ ] B.1-B.3: Implement Loading/Error States for UX
  - [ ] B.1: Create LoadingState component
  - [ ] B.2: Create ErrorBoundary component
  - [ ] B.3: Migrate HomePage.tsx to async pattern

### P1: Component Migration (Next Week) 🔄
- [ ] Phase B: Complete Component Migration (B.4-B.15)
  - [ ] Migrate ~18 remaining components to async/await
  - [ ] Add loading states and error handling everywhere
  - [ ] Implement retry logic and loading skeletons
- [ ] Phase C: Begin Test Migration (C.1-C.5)
  - [ ] Migrate core E2E tests to new Page Objects
  - [ ] Replace ModernDriver usage with new architecture
  - [ ] Implement visual regression tests

### P2: Advanced Testing & Production Readiness 🏗️
- [ ] Phase C: Complete Test Migration (C.6-C.12)
  - [ ] Add accessibility and performance tests
  - [ ] Implement fault injection and chaos testing
  - [ ] Use test tagging and monitoring system
- [ ] Phase D: Production Readiness (10 steps)
  - [ ] Performance test with 1000+ positions
  - [ ] Security rules testing
  - [ ] Error tracking and monitoring setup
  - [ ] Final documentation updates

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

### 9. **Testing: Reach 80% Coverage**
- [ ] Add tests for uncovered evaluation utils
- [ ] Complete mobile service mocks
- [ ] Add integration tests for Firestore
- [ ] Fix skipped castling tests
- **Current**: 47.54% (overall) / ~78% (business logic) | **Target**: 80% (business logic)
- **Effort**: M (Medium)

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
- ✅ Enterprise Test Architecture implemented but NOT YET IN USE
- ✅ Firebase Clean Cut complete (no more dual-read)
- ❌ Only 2/20 components migrated to async
- ❌ No tests using new architecture yet
- See TODO-FIREBASE-MIGRATION.md for detailed 45-step plan

---

## Recently Completed ✅

### Week of 2025-01-11
- [x] Implemented Enterprise Test Architecture
  - [x] Page Object Model with component separation
  - [x] Test API Server replacing window hooks
  - [x] Data factories, fault injection, visual/a11y/perf testing
  - [x] Comprehensive documentation created
- [x] Firebase Clean Cut (removed dual-read pattern)

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

**Focus**: Complete Firebase migration using the new test architecture before adding new features.