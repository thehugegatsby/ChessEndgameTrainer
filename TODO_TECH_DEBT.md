# Technical Debt TODO List - ChessEndgameTrainer

Generated: 2025-08-03

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

- [ ] **Dependency Updates**
  - [x] Update TypeScript from 5.8.3 to 5.9.2 ✅
  - [x] Zustand 5.0 migration ✅
    - [x] Update zustand to v5.0.7
    - [x] Add useShallow to 3 action selector hooks
    - [x] Implement hydration gates for persist middleware
    - [x] Run full test suite
  - [ ] Update other minor dependencies
  - [ ] Run full test suite after each update

- [ ] **Type Error Resolution**
  - [ ] Fix all TypeScript errors systematically
  - [ ] Ensure strict mode compliance
  - [ ] Update tsconfig if needed

## 🧪 Phase 3: Code-Qualität (1 Woche)

- [ ] **Test Coverage Improvement**
  - [ ] Increase coverage to 70% minimum for critical paths
  - [ ] Focus areas:
    - [ ] TablebaseService
    - [ ] Store Actions (trainingActions.ts)
    - [ ] Training Components (TrainingBoard)
  - [ ] Add missing unit tests
  - [ ] Add integration tests for critical flows

- [ ] **Code Cleanup**
  - [ ] Remove 46 "engine" references
    - [ ] Update UI texts
    - [ ] Clean test mocks
    - [ ] Update comments
  - [ ] Delete unused files:
    - [ ] pages/dialog-showcase.tsx
    - [ ] shared/utils/wdlNormalization.ts
  - [ ] Remove debug console.logs
  - [ ] Clean up deprecated methods in TestScenarios

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

## ⚡ Quick Wins (Sofort machbar)

- [ ] Run `npm audit fix` (5 min)
- [ ] Delete unused files (10 min)
- [ ] Remove debug logs (20 min)
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
