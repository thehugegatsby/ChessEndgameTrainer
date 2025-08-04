# Technical Debt TODO List - ChessEndgameTrainer

Generated: 2025-08-03
Last Updated: 2025-08-04

## 🎉 Phase 2 Complete!

- All dependencies updated (Zustand v5, TypeScript 5.9.2)
- 0 TypeScript errors
- All 577 tests passing
- Ready for Phase 3: Code Quality improvements

## 🚨 Phase 1: Kritische Fixes (1-2 Tage)

- [x] **Security Fix (P0)** ✅
  - [x] Run `npm audit fix`
  - [x] If not auto-fixable: Manual dependency updates for lodash.set
  - [x] Verify no new vulnerabilities introduced

- [x] **React Type Compatibility** ✅
  - [x] Check if @types/react@19 and @types/react-dom@19 are available
  - [x] If not available: Consider temporary downgrade to React 18
  - [x] Fix all resulting TypeScript errors (None found!)

## 📦 Phase 2: Stabilisierung (3-5 Tage)

- [x] **Dependency Updates** ✅
  - [x] Update TypeScript from 5.8.3 to 5.9.2 ✅
  - [x] Zustand 5.0 migration ✅
    - [x] Update zustand to v5.0.7
    - [x] Add useShallow to 3 action selector hooks
    - [x] Implement hydration gates for persist middleware
    - [x] Run full test suite
  - [x] Update other minor dependencies ✅
  - [x] Run full test suite after each update ✅

- [x] **Type Error Resolution** ✅
  - [x] Fix all TypeScript errors systematically ✅
  - [x] Ensure strict mode compliance ✅
  - [x] Update tsconfig if needed ✅ (already strict)

## 🧪 Phase 3: Code-Qualität (1 Woche)

- [ ] **Test Coverage Improvement** (In Progress)
  - [ ] Increase coverage to 70% minimum for critical paths
  - [ ] Focus areas:
    - [x] TablebaseService ✅ (93.73% coverage!)
    - [ ] Store Actions (trainingActions.ts)
    - [ ] Training Components (TrainingBoard)
  - [ ] Add missing unit tests
  - [ ] Add integration tests for critical flows

- [x] **Code Cleanup** ✅
  - [x] Remove 46 "engine" references ✅
    - [x] Update UI texts ✅
    - [x] Clean test mocks ✅
    - [x] Update comments ✅
  - [x] Delete unused files: ✅
    - [x] pages/dialog-showcase.tsx ✅
    - [x] shared/utils/wdlNormalization.ts ✅
  - [x] Remove debug console.logs ✅
  - [x] Clean up deprecated methods in TestScenarios ✅
  - [x] Refactor fenValidator to use chess.js ✅ (reduced from 120 to 50 lines)

## 🔧 Phase 4: Infrastruktur (Optional, parallel)

- [ ] **CI/CD Improvements**
  - [ ] Add automated security scanning
  - [ ] Set coverage thresholds in CI
  - [ ] Add type-check to pre-commit hooks
  - [ ] Configure automated dependency updates

- [ ] **Documentation**
  - [ ] Update architecture docs after cleanup
  - [ ] Document new testing standards
  - [ ] Update README with current stack versions

## ⚡ Quick Wins (Sofort machbar) ✅

- [x] Run `npm audit fix` (5 min) ✅
- [x] Delete unused files (10 min) ✅
- [x] Remove debug logs (20 min) ✅
- [ ] Update CLAUDE.md with current priorities

## 📊 Success Metrics

- ✅ 0 Security Vulnerabilities
- ✅ 0 TypeScript Errors
- ✅ Test Coverage >70% for critical paths
- ✅ All dependencies current (or intentionally held back)
- ✅ Clean code without legacy references

## Notes

- NO new features until Phase 1 & 2 complete!
- Each phase should be tested thoroughly
- Create git branches for each major phase
- Document any decisions about held-back dependencies
