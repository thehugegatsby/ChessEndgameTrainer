# Issue Validation Checklist

## 📋 Enhanced Issue Format Requirements

This checklist ensures all issues follow the enhanced format for LLM-friendly processing and machine-verifiable success criteria.

### Required Sections Checklist

#### ✅ Core Sections (All Required)

- [ ] **🎯 Task Overview** - Clear, actionable description
- [ ] **🎖️ Machine-Verifiable Success Criteria** - Specific, testable conditions
- [ ] **🔍 Current State Analysis** - Baseline analysis with evidence
- [ ] **📋 Implementation Plan** - Step-by-step breakdown
- [ ] **🧪 Validation & Testing** - Specific test requirements
- [ ] **📚 Documentation Requirements** - What docs need updating
- [ ] **⚖️ Constraints & Considerations** - Limits and edge cases
- [ ] **🔗 Related Issues & Dependencies** - Cross-references

#### ✅ Content Quality Criteria

##### Task Overview Requirements

- [ ] Specific file paths mentioned (absolute paths preferred)
- [ ] Exact line numbers or code snippets provided
- [ ] Clear problem statement with context
- [ ] Business impact clearly stated
- [ ] References to existing constants/patterns

##### Machine-Verifiable Success Criteria

- [ ] All criteria are testable (can be verified by automation)
- [ ] Specific file paths for verification
- [ ] Exact command outputs expected
- [ ] Measurable outcomes (numbers, percentages, etc.)
- [ ] Before/after diff format when applicable

##### Current State Analysis

- [ ] Code snippets showing current implementation
- [ ] Exact file locations (with line numbers)
- [ ] Current metrics/measurements
- [ ] Evidence of the problem (error messages, logs, etc.)
- [ ] Impact assessment with data

##### Implementation Plan

- [ ] Numbered steps with specific actions
- [ ] File paths for each change
- [ ] Code diff format for changes
- [ ] Dependencies clearly identified
- [ ] Estimated effort per step

##### Validation & Testing

- [ ] Specific npm commands to run
- [ ] Expected test outcomes
- [ ] Verification steps with exact commands
- [ ] Rollback procedures if needed
- [ ] Performance impact validation

##### Documentation Requirements

- [ ] Specific files that need updating
- [ ] Exact sections to modify
- [ ] CHANGELOG.md entry format
- [ ] Code comment requirements
- [ ] README updates if needed

##### Constraints & Considerations

- [ ] Performance implications quantified
- [ ] Breaking change assessment
- [ ] Backward compatibility requirements
- [ ] Mobile/desktop compatibility
- [ ] Bundle size impact

### LLM-Friendliness Indicators

#### ✅ Machine-Readable Format

- [ ] Consistent heading hierarchy (H1, H2, H3)
- [ ] Code blocks with proper syntax highlighting
- [ ] Structured lists with clear hierarchy
- [ ] Standardized emoji indicators
- [ ] Consistent terminology throughout

#### ✅ Diff Format Standards

```diff
- // Old code (line 42)
- const MAGIC_NUMBER = 300;
+ // New code (line 42)
+ const DEBOUNCE_DELAY = 300; // 300ms debounce for user inputs
```

#### ✅ Command Examples

```bash
# Verification command
npm test -- --testNamePattern="debounce"

# Expected output
✅ All tests passing
✅ No magic numbers found in specified files
```

#### ✅ Clear Constraints

- Bundle size: Current 155KB → Target <160KB (+5KB max)
- Performance: No regression in evaluation speed
- Breaking changes: None allowed
- TypeScript: Strict mode compliance required

### Project-Specific Requirements

#### ✅ Chess Endgame Trainer Standards

- [ ] References to `/shared/constants/index.ts` for magic numbers
- [ ] Follows Clean Architecture patterns
- [ ] Maintains Zustand store as single source of truth
- [ ] Uses existing TypeScript strict mode
- [ ] Preserves test coverage ≥78%
- [ ] Respects 300KB bundle size limit

#### ✅ File Structure Compliance

- [ ] Constants added to appropriate section in `/shared/constants/index.ts`
- [ ] TypeScript interfaces defined in `/shared/types/`
- [ ] Tests in `/tests/unit/` with proper naming
- [ ] Documentation in `/docs/` if architectural change

#### ✅ NPM Command Requirements

- [ ] `npm test` - All tests must pass
- [ ] `npm run lint` - No ESLint errors
- [ ] `npm run build` - Build must succeed
- [ ] `npm run analyze-code` - Code analysis clean
- [ ] `npm run test:coverage` - Coverage maintained

#### ✅ Git & Version Control

- [ ] Branch names follow pattern: `fix/magic-numbers-issue-XX`
- [ ] Commit messages reference issue number
- [ ] CHANGELOG.md updated in [Unreleased] section
- [ ] No direct commits to main branch

### Common Issues & Fixes

#### ❌ Vague Success Criteria

```markdown
❌ BAD: "Remove all magic numbers"
✅ GOOD: "Replace hardcoded value `300` on line 42 of useDebounce.ts with DEBOUNCE_DELAY from constants"
```

#### ❌ Missing File Paths

```markdown
❌ BAD: "Update the debounce logic"
✅ GOOD: "Update `/shared/hooks/useDebounce.ts` line 42"
```

#### ❌ Non-Testable Criteria

```markdown
❌ BAD: "Code should be more maintainable"
✅ GOOD: "ESLint rule no-magic-numbers should pass with 0 violations"
```

#### ❌ Unclear Validation Steps

```markdown
❌ BAD: "Test the changes"
✅ GOOD: "Run `npm test -- --testNamePattern='debounce'` and verify all 15 tests pass"
```

### Magic Number Issue-Specific Validation

#### ✅ Constants File Structure

- [ ] Added to appropriate section (UI, ENGINE, PERFORMANCE, etc.)
- [ ] Follows existing naming convention (UPPER_SNAKE_CASE)
- [ ] Includes descriptive comment
- [ ] Maintains type safety with `as const`
- [ ] Exported in type utilities section

#### ✅ Usage Pattern Validation

- [ ] All imports use absolute paths: `import { CONSTANTS } from '@/shared/constants'`
- [ ] No direct numeric literals in business logic
- [ ] Consistent usage across similar use cases
- [ ] No breaking changes to existing APIs

#### ✅ Test Coverage Requirements

- [ ] Unit tests verify constant values
- [ ] Integration tests validate behavior
- [ ] Edge case testing for boundary values
- [ ] Performance tests if applicable

## 📊 Compliance Scoring

### Issue Quality Score (Total: 100 points)

- **Required Sections**: 40 points (8 sections × 5 points each)
- **Content Quality**: 30 points (detailed, specific, actionable)
- **LLM-Friendliness**: 20 points (machine-readable, standardized)
- **Project Compliance**: 10 points (follows project patterns)

### Minimum Passing Score: 85/100

### Automatic Disqualification Criteria

- Missing any required section
- Vague or untestable success criteria
- No specific file paths provided
- No validation commands specified
- Breaking changes without proper documentation

## 🔄 Review Process

### Self-Review Checklist

1. [ ] Read issue aloud - does it make sense?
2. [ ] Could someone else implement this without asking questions?
3. [ ] Are all success criteria objectively verifiable?
4. [ ] Would this pass automated validation?
5. [ ] Does it follow the project's existing patterns?

### Peer Review Focus

- Clarity and completeness of requirements
- Testability of success criteria
- Alignment with project architecture
- Potential for automation
- Documentation completeness

---

_Last Updated: 2025-07-14_
_Version: 1.0.0_
_Project: Chess Endgame Trainer_
