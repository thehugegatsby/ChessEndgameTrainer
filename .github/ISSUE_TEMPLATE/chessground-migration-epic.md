---
name: 'Epic: Migration zu Chessground'
about: 'Tracking-Issue für die Migration von react-chessboard zu chessground'
title: '[EPIC] Migrate from react-chessboard to chessground for clean architecture'
labels: epic, tech-debt, frontend, architecture, migration
assignees: ''
---

```yaml
type: epic
priority: high
status: ready
effort: 8-12 days
ai_context:
  current_stack: react-chessboard v5.2.2, Next.js 15, React 19
  target_stack: chessground + custom React wrapper
  complexity: medium
  risk_level: low
  migration_type: library_replacement
```

## 🎯 Epic Overview

Migrate the Chess Endgame Trainer from `react-chessboard` to `chessground` to achieve clean architecture principles and eliminate React version compatibility issues.

## 🚀 Business Value

**Problem**: `react-chessboard` v5.2.2 has React 18 peer dependency conflicts with our React 19 stack, requiring technical debt workarounds (`next-transpile-modules`).

**Solution**: Migrate to `chessground` - Lichess's battle-tested chess UI library - with a custom React wrapper.

**Benefits**:

- ✅ **Performance**: 10KB gzipped vs. larger React wrappers
- ✅ **Stability**: Framework-agnostic, immune to React version changes
- ✅ **Clean Architecture**: Controlled abstraction layer
- ✅ **Future-proof**: No dependency on third-party React wrapper maintenance

## 🧠 Technical Planning & Context

**📚 Migration Brief**: All technical details, architecture decisions, and implementation guidance are documented in **[docs/react-chessboard-to-chessground-migration.md](../../../docs/react-chessboard-to-chessground-migration.md)**

This is the **Single Source of Truth** for all technical decisions and implementation details. All stories reference this document.

## 📋 Migration Phases & Stories

### 🏗️ Phase 1: Foundation (Days 1-3)

- [ ] **Story #1**: Install chessground dependency and setup project structure
- [ ] **Story #2**: Create `ChessboardAdapter` component with basic chessground integration
- [ ] **Story #3**: Implement core props mapping (fen, orientation, onMove)
- [ ] **Story #4**: Add CSS integration and basic styling

### 🎮 Phase 2: Feature Parity (Days 4-6)

- [ ] **Story #5**: Implement square highlighting system (check, lastMove, possible moves)
- [ ] **Story #6**: Integrate promotion dialog with ChessboardAdapter
- [ ] **Story #7**: Add onSquareClick support for click-to-move functionality
- [ ] **Story #8**: Create Storybook stories for development and testing

### 🔄 Phase 3: Component Migration (Days 7-9)

- [ ] **Story #9**: Update `src/shared/components/chess/Chessboard.tsx` to use ChessboardAdapter
- [ ] **Story #10**: Migrate `TrainingBoard` component integration
- [ ] **Story #11**: Verify E2E tests pass with new implementation
- [ ] **Story #12**: Update any other components using chess board

### 🧹 Phase 4: Cleanup & Optimization (Days 10-12)

- [ ] **Story #13**: Remove react-chessboard dependency and next-transpile-modules config
- [ ] **Story #14**: Performance benchmarking and bundle size analysis
- [ ] **Story #15**: Documentation updates and final code review

## ✅ Epic Success Criteria

### Functional Requirements

- [ ] All existing chess board functionality preserved (drag & drop, promotion, orientation)
- [ ] Visual consistency maintained (no UI regressions)
- [ ] All E2E tests pass without modification to test logic

### Technical Requirements

- [ ] TypeScript compilation without errors
- [ ] Bundle size ≤ current implementation
- [ ] Render performance ≥ current implementation
- [ ] No console errors or warnings

### Quality Requirements

- [ ] Code review completed for all components
- [ ] Storybook stories created for visual testing
- [ ] Documentation updated in relevant files

## 🚨 Risk Assessment & Mitigation

| Risk                            | Impact | Probability | Mitigation                                                        |
| ------------------------------- | ------ | ----------- | ----------------------------------------------------------------- |
| **Feature gaps in chessground** | Medium | Low         | Comprehensive feature matrix comparison before migration          |
| **E2E test failures**           | High   | Medium      | Maintain identical DOM structure, update selectors only if needed |
| **Performance regression**      | Medium | Low         | Benchmark current performance, set budgets, monitor bundle size   |
| **Visual inconsistencies**      | Low    | Medium      | Pixel-perfect comparison in Storybook, custom CSS if needed       |

## 📊 Definition of Done

- [ ] All 15 stories completed and verified
- [ ] Migration brief requirements met (see [technical criteria](../../../docs/react-chessboard-to-chessground-migration.md#-acceptance-criteria))
- [ ] react-chessboard dependency removed from package.json
- [ ] next-transpile-modules configuration removed
- [ ] Performance metrics equal or better than baseline
- [ ] Zero regressions in user functionality

## 🔗 Dependencies & References

### External Dependencies

- **Blocks**: None
- **Blocked by**: None
- **Related**: E2E test improvements, Performance optimization initiatives

### Documentation References

- **Migration Brief**: [docs/react-chessboard-to-chessground-migration.md](../../../docs/react-chessboard-to-chessground-migration.md)
- **Project Architecture**: [docs/CORE.md](../../../docs/CORE.md)
- **Chess Components**: [src/shared/components/chess/README.md](../../../src/shared/components/chess/README.md)

### External Resources

- [Chessground Official Repository](https://github.com/lichess-org/chessground)
- [Chessground API Documentation](https://github.com/lichess-org/chessground/blob/master/src/api.ts)

## 💬 Implementation Notes for AI Assistants

When working on stories in this epic:

1. **Always reference the migration brief first**: [docs/react-chessboard-to-chessground-migration.md](../../../docs/react-chessboard-to-chessground-migration.md)
2. **Follow the ChessboardAdapter API design** specified in the migration brief
3. **Maintain TypeScript strict mode compliance**
4. **Use `"use client"` directive** - chessground manipulates DOM directly
5. **Test each story thoroughly** before proceeding to the next
6. **Keep existing E2E test structure** - minimize changes to test selectors

### Story Creation Pattern

Each story should:

- Reference this epic with `epic: #[epic-number]`
- Link to relevant sections in the migration brief
- Include specific acceptance criteria
- Provide code snippets or starting points where helpful

## 📈 Progress Tracking

**Epic Progress**: 0/15 stories completed (0%)

**Current Phase**: 🏗️ Phase 1: Foundation

**Next Action**: Create and assign Story #1 (Install chessground dependency)

---

_This epic follows the clean architecture principle of separating concerns and eliminating technical debt. Upon completion, our chess board implementation will be more maintainable, performant, and future-proof._
