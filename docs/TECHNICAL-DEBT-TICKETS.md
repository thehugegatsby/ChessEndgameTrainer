# Technical Debt Tickets - 2025-01-10

## Overview
Based on the critical analysis by Gemini 2.5 Pro and O3-Mini, these tickets track the technical debt accumulated from the TypeScript fixes and outline the refactoring roadmap.

---

## HIGH PRIORITY - AppDriver Refactoring

### Ticket: TECH-001 - Break Down AppDriver Monolith (Phase 1)
**Priority:** HIGH  
**Estimated Effort:** 1 Sprint  
**Blocked By:** None  
**Blocks:** All other AppDriver refactoring

#### Problem
- AppDriver.ts is 1650+ lines (God Object anti-pattern)
- Violates Single Responsibility Principle
- Makes tests brittle and hard to maintain
- Difficult to onboard new developers

#### Acceptance Criteria
- [ ] Extract MovePanelPOM as first dedicated Page Object
- [ ] Move all move panel related methods from AppDriver to MovePanelPOM
- [ ] Update AppDriver to delegate to MovePanelPOM
- [ ] All existing tests still pass
- [ ] Document the new pattern for other POMs

#### Technical Details
```typescript
// New structure example:
class AppDriver {
  private movePanel: MovePanelPOM;
  
  constructor(page: Page) {
    this.movePanel = new MovePanelPOM(page);
  }
  
  // Delegate instead of implement
  async getMoveCount() {
    return this.movePanel.getMoveCount();
  }
}
```

---

## MEDIUM PRIORITY - Dependency Management

### Ticket: TECH-002 - Investigate react-chessboard Upgrade
**Priority:** MEDIUM  
**Estimated Effort:** 1 Day (Spike)  
**Blocked By:** None  
**Blocks:** TECH-006

#### Problem
- Currently on v2.1.3, latest is v4.x
- Missing security patches and modern features
- Had to remove customSquareRenderer due to version incompatibility

#### Acceptance Criteria
- [ ] Document all breaking changes between v2.1.3 and v4.x
- [ ] Identify code changes required for upgrade
- [ ] Estimate effort for full upgrade
- [ ] Create follow-up tickets for actual upgrade
- [ ] Risk assessment of staying on old version

#### Research Questions
1. What features were removed/changed?
2. What new features could we leverage?
3. Are there security vulnerabilities in v2.1.3?
4. Migration guide availability?

---

## MEDIUM PRIORITY - Code Conventions

### Ticket: TECH-003 - Document null/undefined Conventions
**Priority:** MEDIUM  
**Estimated Effort:** 2 Days  
**Blocked By:** None  
**Blocks:** TECH-007

#### Problem
- Inconsistent use of null vs undefined across codebase
- Type fixes used null ?? undefined conversions (code smell)
- No documented convention for "absence" representation

#### Acceptance Criteria
- [ ] Audit current null/undefined usage patterns
- [ ] Define clear convention (prefer undefined for optional values)
- [ ] Document in coding standards
- [ ] Create ESLint rules to enforce
- [ ] Migration plan for existing code

#### Documentation Template
```markdown
## Null vs Undefined Convention

### Use `undefined` for:
- Optional function parameters
- Optional object properties
- Uninitialized values

### Use `null` for:
- Explicit "no value" in domain logic
- Database null values
- External API compatibility

### Never:
- Mix null and undefined for same concept
- Use null ?? undefined conversions
```

---

## LOW PRIORITY - API Cleanup

### Ticket: TECH-004 - Remove Method Aliases ✅ COMPLETED 2025-01-10
**Priority:** LOW  
**Estimated Effort:** 1 Day  
**Blocked By:** None  
**Blocks:** None

#### Problem
- Deprecated aliases create API confusion
- Two ways to call same functionality
- cleanup() vs dispose()
- getGameState() vs getFullGameState()
- ~~waitForReady() vs waitForAppReady()~~ (different issue - was missing public interface)

#### Acceptance Criteria
- [x] Choose canonical method names
- [x] Update all test files to use canonical names
- [x] Remove @deprecated aliases from AppDriver
- [x] Update any documentation
- [x] Verify no runtime errors

#### Migration Steps Executed
1. Found all usages using grep
2. Replaced cleanup() with dispose() in 2 E2E test files
3. Replaced getGameState() with getFullGameState() in 2 E2E test files
4. Removed deprecated method aliases from AppDriver
5. Added public waitForReady() method after LLM consultation (clean encapsulation)
6. All unit tests pass, E2E tests run (some fail due to unrelated selector issues)

---

## Sprint Planning Recommendations

### Sprint 1 (Immediate)
1. TECH-001 - Start AppDriver refactoring (MovePanelPOM)
2. TECH-002 - react-chessboard upgrade spike
3. TECH-004 - Remove method aliases (if capacity)

### Sprint 2
1. Continue TECH-001 - Extract BoardPOM, EvaluationPOM
2. TECH-003 - Document conventions
3. Implement findings from TECH-002 spike

### Sprint 3-4
1. Complete AppDriver modularization
2. Add ESLint rules from TECH-003
3. Begin react-chessboard upgrade if approved

---

## Long-term Roadmap

### Q1 2025
- Complete AppDriver refactoring
- Establish coding conventions
- Remove all deprecated code

### Q2 2025
- Upgrade major dependencies
- Implement comprehensive ESLint rules
- Achieve 90%+ test coverage

### Success Metrics
- AppDriver < 500 lines
- 0 deprecated methods
- Consistent null/undefined usage
- All dependencies current stable versions
- New developer onboarding < 1 day for E2E tests