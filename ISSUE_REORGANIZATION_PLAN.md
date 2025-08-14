# 🎯 ISSUE REORGANIZATION PLAN - Chess Endgame Trainer

## 📊 TECHNICAL DEBT ANALYSIS SUMMARY

**ROOT CAUSE**: Migration Debt > Technical Debt
- Multiple incomplete migrations (Jest→Vitest, Feature Structure)
- Mix of singleton services + Zustand causing confusion
- 1014-line trainingSlice.ts + 798-line ChessService.ts (DON'T REFACTOR - they work!)
- 21% test coverage, 5,728 lines of orchestrator code

**KEY INSIGHT**: Complete existing migrations before starting new ones. Working code > perfect code.

---

## 🚀 IMMEDIATE SETUP CHECKLIST (1 Hour)

### ✅ 1. CREATE MILESTONES (5 min)
GitHub → Issues → Milestones → New milestone:

```
Name: 00 Immediate (W1–W4): Vitest + Firebase
Description: Complete Jest→Vitest migration and switch to Firebase modular imports. Block new anti-patterns. Only migration/stabilization tasks allowed.
Due date: [4 Wochen ab Start]

Name: 01 Short-term (W5–W8): React Query + Zustand  
Description: Use React Query for new server state, add Zustand adapters for singletons, and ensure 60% coverage for new code. No refactoring of working legacy code.
Due date: [8 Wochen ab Start]

Name: 90 Postponed (Revisit after W8)
Description: Parked items: large-file refactors, global coverage targets, architecture rewrites. Re-evaluate post W8.
Due date: [kein Datum]
```

### ✅ 2. CREATE CODEOWNERS FILE (5 min)
Create `.github/CODEOWNERS`:
```
# Default owners  
* @thehu

# Frozen legacy files (no refactors without approval)
src/shared/store/slices/trainingSlice.ts @thehu
src/shared/services/ChessService.ts @thehu

# Block new orchestrators (require owner review)
src/shared/store/orchestrators/** @thehu

# Prevent new Jest during migration
jest.config.* @thehu
vitest.config.* @thehu
**/__tests__/** @thehu

# Server state guidelines
src/**/services/** @thehu
src/**/api/** @thehu
```

**THEN**: Enable Branch Protection → "Require review from Code Owners"

### ✅ 3. CREATE PR TEMPLATE (2 min)
Create `.github/pull_request_template.md`:
```markdown
## Linked Issue(s):
- Closes #

## Type of Change:
- [ ] Migration (Jest→Vitest)
- [ ] Infrastructure (Firebase modular imports) 
- [ ] Feature (uses React Query for server state)
- [ ] Chore/Docs

## Policy Check (REQUIRED):
- [ ] ❌ Does NOT refactor working legacy code (trainingSlice.ts, ChessService.ts)
- [ ] ❌ No new orchestrators introduced
- [ ] ✅ If server state: React Query is used (not custom orchestrators)
- [ ] ✅ Vitest only (no new Jest tests)
- [ ] ✅ 60%+ coverage for NEW code only

## Implementation:
- **Summary**: 
- **Trade-offs**: 

## Tests:
- [ ] All tests pass locally
- [ ] Coverage meets requirements for new code

## Risk Assessment:
- **Risks**: 
- **Rollback plan**: 

## Final Check:
- [ ] Small PR (≤400 lines excluding tests/snapshots)
- [ ] Linked to correct milestone
- [ ] Follows new patterns (React Query, no orchestrators)
```

### ✅ 4. CREATE GITHUB LABELS (5 min)
Via GitHub CLI oder UI:
```bash
# Type labels
gh label create "type:migration" --color "0e8a16"
gh label create "type:feature" --color "1d76db"
gh label create "type:chore" --color "fef2c0"

# Priority
gh label create "priority:p0" --color "d73a4a" 
gh label create "priority:p1" --color "fbca04"
gh label create "priority:p2" --color "0e8a16"

# Triage
gh label create "triage:kill-candidate" --color "d73a4a"
gh label create "triage:postpone-candidate" --color "fbca04"
gh label create "triage:modify-needed" --color "1d76db"

# Policy
gh label create "policy:no-orchestrators" --color "d73a4a"
gh label create "policy:no-refactor" --color "d73a4a"
```

### ✅ 5. TEAM COMMUNICATION (2 min)
**Slack/Discord Message**:
```
🚨 REPO REORGANISATION - W1-W8 Priorities

Für die nächsten 8 Wochen:
✅ W1-W4: Jest→Vitest Migration + Firebase modular imports
✅ W5-W8: React Query für server state + Zustand adapters
❌ Keine Refactoring von working code (trainingSlice.ts bleibt)
❌ Keine neuen Orchestrators (React Query verwenden)
❌ Keine globalen coverage targets

Alle Issues werden neu sortiert:
- 00 Immediate: Jest/Vitest/Firebase
- 01 Short-term: React Query/Zustand/New code coverage
- 90 Postponed: Refactoring/Architecture

Neue PRs brauchen Code Owner approval für frozen files.
Templates sind upgedated - bitte verwenden!

Questions? → Hier im Thread 👇
```

---

## 🔍 ISSUE TRIAGE WORKFLOW (30-60 min)

### DECISION TREE - CHEAT SHEET
```
🔍 ISSUE TRIAGE CHECKLIST:

Jest→Vitest oder Firebase modular?
→ YES: Keep → Milestone "00 Immediate"

Refactoring von working code (trainingSlice.ts)?  
→ YES: Postpone → Milestone "90 Postponed"

Neuer Orchestrator oder Server State ohne React Query?
→ YES: Kill OR Modify (wenn React Query möglich)

Test Coverage für existing code?
→ YES: Postpone → "90 Postponed"

Test Coverage nur für NEW code?
→ YES: Keep → Milestone "01 Short-term"

Zustand Adapter für Singletons?
→ YES: Keep → Milestone "01 Short-term"

Alles andere:
→ Modify (mehr Details anfordern)
```

### FIND ISSUES TO TRIAGE
```bash
# Find orchestrator issues
gh issue list -s open -S 'orchestrator' --json number,title

# Find refactoring issues
gh issue list -s open -S 'refactor OR split OR cleanup OR architecture' --json number,title

# Find test coverage issues  
gh issue list -s open -S 'coverage OR test' --json number,title

# Find migration issues
gh issue list -s open -S 'vitest OR jest OR firebase' --json number,title
```

### COMMENT TEMPLATES

**For KILL (Orchestrator Issues):**
```
Closing per current priorities. We're focusing on: (1) Jest→Vitest migration, (2) no new orchestrators (use React Query), (3) no refactoring of working code.

This issue proposes orchestrators which conflicts with our React Query approach. If you can rework this to use React Query for server state, please reopen with updated scope.

See: [Link to new issue templates]
```

**For POSTPONE (Refactoring Issues):**
```
Moving to "90 Postponed (Revisit after W8)" milestone.

We're not refactoring working legacy code (especially trainingSlice.ts) during W1-W8. This will be reconsidered after core migrations complete.

If this is blocking critical work, comment with "priority override" + justification.
```

**For MODIFY (Coverage/Feature Issues):**
```
This needs adjustments to proceed:
- ✅ Use React Query for server state (no orchestrators)
- ❌ Avoid refactoring trainingSlice.ts or other working code
- ✅ Scope to ≤2 days work
- ✅ 60% coverage for NEW code only

Please update using our new issue template within 5 days.
```

---

## 📋 6-WEEK IMPLEMENTATION PLAN

### Week 1: Stop the Bleeding
- [ ] Block new Jest tests via ESLint rule
- [ ] Switch to Firebase modular imports (saves 300KB)
- [ ] Add 500-line limit for NEW files only
- [ ] Document current hybrid patterns

### Week 2-3: Complete Test Migration
- [ ] Auto-migrate Jest syntax to Vitest
- [ ] Run both in parallel briefly
- [ ] Delete Jest configs and dependencies

### Week 4: State Management
- [ ] Create Zustand adapters for ChessService
- [ ] New features MUST use Zustand
- [ ] Deprecation warnings on singleton usage

### Week 5-6: Stabilization
- [ ] 60% coverage for NEW files only
- [ ] Add i18n for NEW components
- [ ] Unskip critical E2E tests

---

## ❌ CRITICAL DON'Ts

1. **DON'T** refactor working code (trainingSlice.ts works = leave it)
2. **DON'T** aim for global 60% coverage (unrealistic)
3. **DON'T** start new migrations until current ones complete
4. **DON'T** add more orchestrators (use React Query instead)

## ✅ QUICK WINS (Do Today!)

```javascript
// 1. Firebase Modular Imports (saves 300KB)
// Before:
import firebase from 'firebase/app'

// After:
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
```

```typescript
// 2. Fix WSL2 Config (if not done)
const isWSL = process.env.WSL_DISTRO_NAME !== undefined
export default {
  test: {
    pool: isWSL ? 'forks' : 'threads',
    poolOptions: {
      threads: { maxThreads: isWSL ? 2 : 4 }
    }
  }
}
```

---

## 📊 SUCCESS METRICS

| Week | Metric | Target |
|------|--------|--------|
| 1 | New Jest tests | 0 |
| 2 | Bundle size | -300KB |
| 4 | Test framework | 100% Vitest |
| 4 | CI speed | +20% faster |
| 6 | New code coverage | 60% |

---

## 🎯 FINAL PRIORITY ORDER

1. **Jest→Vitest Migration** (everything else blocked by this)
2. **Firebase Modular Imports** (instant wins)
3. **Zustand Adapters** (enables gradual state migration)
4. **React Query for New Features** (no more orchestrators)
5. **Everything Else Can Wait**

## 💡 KEY INSIGHT FROM BOTH GPT-5 & GEMINI

**GPT-5**: Systematic approach, clear end goals
**Gemini**: Pragmatic path, don't break working code
**CONSENSUS**: Follow Gemini's approach with GPT-5's end goal

**The 1014-line file that works is better than 10 broken files.**

---

## 🔗 REFERENCES

- Technical Debt Analysis: [Link to analysis results]
- Current Architecture: `docs/CORE.md`
- Migration Progress: Track in milestones
- Team Communication: Use comment templates above

---

**Generated**: $(date)
**Next Review**: After W8
**Owner**: @thehu