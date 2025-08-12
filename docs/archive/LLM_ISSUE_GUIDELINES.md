# LLM-Optimized GitHub Issue Guidelines

## Table of Contents

1. [Introduction](#introduction)
2. [Issue Structure Overview](#issue-structure-overview)
3. [Section-by-Section Guide](#section-by-section-guide)
4. [Best Practices](#best-practices)
5. [Code Diff Standards](#code-diff-standards)
6. [Verification Patterns](#verification-patterns)
7. [Examples](#examples)
8. [Common Pitfalls](#common-pitfalls)
9. [Project-Specific Integration](#project-specific-integration)
10. [Constraint Definition](#constraint-definition)
11. [Business Context Writing](#business-context-writing)

## Introduction

Large Language Models (LLMs) process information differently than humans. This guide outlines how to structure GitHub issues to maximize LLM comprehension, reduce ambiguity, and ensure successful task completion.

### Why LLM-Optimized Issues Matter

- **Reduced Ambiguity**: Clear structure prevents misinterpretation
- **Faster Processing**: Well-formatted issues reduce back-and-forth
- **Better Outcomes**: Precise instructions lead to accurate implementations
- **Consistency**: Standardized format ensures predictable results

## Issue Structure Overview

````markdown
# [Type]: [Clear, Action-Oriented Title]

## Task Overview

[1-2 sentences describing the task and its purpose]

## Machine-Verifiable Success Criteria

- [ ] Criterion 1 (with specific test command)
- [ ] Criterion 2 (with specific file verification)
- [ ] Criterion 3 (with specific behavior verification)

## Technical Implementation Details

### Files to Modify

- `path/to/file1.ts` - Brief description of changes
- `path/to/file2.tsx` - Brief description of changes

### Expected Code Changes

```typescript
// Before (if applicable)
const oldCode = "example";

// After
const newCode = "improved example";
```
````

## Verification Commands

```bash
npm test -- --testNamePattern="specific test"
npm run lint
npm run build
```

## Business Context

[Why this change matters, user impact, technical rationale]

## Constraints

- DO NOT modify: `file1.ts`, `file2.tsx`
- MUST maintain: Existing API contracts
- AVOID: Breaking changes to public interfaces

## Additional Notes

[Any edge cases, gotchas, or special considerations]

```

## Section-by-Section Guide

### 1. Title Format
```

[Type]: [Clear, Action-Oriented Title]

````

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code improvement without functionality change
- `docs`: Documentation updates
- `test`: Test additions/improvements
- `perf`: Performance improvements
- `style`: Code formatting/style changes

**Examples:**
- ✅ `feat: Add principal variation display to chess board`
- ✅ `fix: Resolve tablebase evaluation race condition`
- ✅ `refactor: Extract chess move validation logic`
- ❌ `Update the chess thing` (vague)
- ❌ `Fix bug` (no specificity)

### 2. Task Overview
A concise 1-2 sentence summary that answers:
- What needs to be done?
- Why is it important?

**Examples:**
- ✅ "Implement move quality indicators to show WDL-based evaluation from tablebase, improving user learning experience."
- ✅ "Fix race condition in tablebase evaluation that causes inconsistent position assessments when moves are played rapidly."
- ❌ "Make the chess board better" (too vague)
- ❌ "There's a problem with the engine that needs fixing" (lacks specificity)

### 3. Machine-Verifiable Success Criteria
Each criterion must be:
- **Specific**: Clear, unambiguous requirement
- **Measurable**: Can be verified programmatically
- **Actionable**: Tells exactly what to check

**Format:**
```markdown
- [ ] [Specific outcome] verified by [exact command/check]
- [ ] [Specific behavior] confirmed in [specific file/location]
- [ ] [Performance/quality metric] meets [exact threshold]
````

**Examples:**

```markdown
- [ ] Principal variation component renders correctly verified by `npm test -- PrincipalVariationDisplay`
- [ ] Tablebase evaluation updates reflect in UI within 300ms verified by performance tests
- [ ] TypeScript compilation succeeds verified by `npm run build`
- [ ] All existing tests pass verified by `npm test`
- [ ] Code coverage remains above 78% verified by `npm run test:coverage`
```

### 4. Technical Implementation Details

#### Files to Modify

List every file that needs changes with brief descriptions:

```markdown
### Files to Modify

- `shared/components/ChessBoard/ChessBoard.tsx` - Add PV display integration
- `shared/hooks/useChessGame.ts` - Add PV state management
- `shared/lib/tablebase/types.ts` - Add tablebase-related type definitions
- `tests/components/ChessBoard/ChessBoard.test.tsx` - Add PV display tests
```

#### Expected Code Changes

Show before/after code snippets for critical changes:

```typescript
// Before: shared/hooks/useChessGame.ts
const [evaluation, setEvaluation] = useState<number | null>(null);

// After: shared/hooks/useChessGame.ts
const [evaluation, setEvaluation] = useState<EngineEvaluation | null>(null);
```

### 5. Verification Commands

Provide exact commands to verify the implementation:

```bash
# Run specific tests
npm test -- --testNamePattern="PrincipalVariation"

# Check TypeScript compilation
npm run build

# Verify linting
npm run lint

# Run full test suite
npm test

# Check code coverage
npm run test:coverage
```

### 6. Business Context

Explain the broader impact and reasoning:

```markdown
## Business Context

This enhancement improves the educational value of the chess trainer by showing users the optimal move sequence calculated by the tablebase API. This helps users understand not just the best move, but the reasoning behind it, accelerating their learning process. The implementation aligns with our goal of creating an AI-powered learning experience.
```

### 7. Constraints

Clearly define what should NOT be changed:

```markdown
## Constraints

- DO NOT modify: `shared/lib/engine/Engine.ts` (singleton pattern must remain)
- MUST maintain: Existing `useChessGame` hook API for backward compatibility
- AVOID: Adding new dependencies without prior approval
- PRESERVE: Current performance benchmarks (evaluation < 300ms)
```

## Best Practices

### 1. Use Absolute Paths

Always use absolute paths from project root:

- ✅ `shared/components/ChessBoard/ChessBoard.tsx`
- ❌ `./ChessBoard.tsx` or `../components/ChessBoard.tsx`

### 2. Be Specific About Testing

Instead of "add tests," specify:

- ✅ "Add unit tests for move parsing in `tests/lib/tablebase/move-parser.test.ts`"
- ✅ "Add integration tests for PV display in `tests/components/ChessBoard/ChessBoard.test.tsx`"

### 3. Include Error Scenarios

Always consider and document error cases:

```markdown
- [ ] Engine evaluation errors are handled gracefully verified by error boundary tests
- [ ] Invalid FEN positions trigger appropriate error messages
- [ ] Network failures don't crash the application
```

### 4. Reference Existing Code Patterns

Point to similar implementations in the codebase:

```markdown
Follow the same error handling pattern used in `shared/services/TablebaseService.ts`
```

## Code Diff Standards

### 1. Format for Maximum LLM Comprehension

**Use clear before/after sections:**

```typescript
// File: shared/types/chess.ts
// Before:
export interface EngineEvaluation {
  score: number;
  depth: number;
}

// After:
export interface EngineEvaluation {
  score: number;
  depth: number;
  principalVariation?: string[];
  nodes?: number;
}
```

### 2. Show Context Around Changes

Include surrounding code for context:

```typescript
// File: shared/hooks/useChessGame.ts
// Context: Around line 45

const evaluatePosition = async (fen: string) => {
  try {
    // Before:
    const evaluation = await engine.evaluate(fen);
    setEvaluation(evaluation.score);

    // After:
    const evaluation = await engine.evaluate(fen);
    setEvaluation(evaluation);
  } catch (error) {
    ErrorService.logError("Position evaluation", error);
  }
};
```

### 3. Use Consistent Formatting

- Always use the same comment style (`// Before:`, `// After:`)
- Include file paths as comments
- Show line numbers or function context when helpful

## Verification Patterns

### 1. Test Command Patterns

```bash
# Specific feature tests
npm test -- --testNamePattern="PrincipalVariation"

# File-specific tests
npm test -- shared/components/ChessBoard/ChessBoard.test.tsx

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance
```

### 2. Build Verification

```bash
# TypeScript compilation
npm run build

# Development server startup
npm run dev

# Production build
npm run build && npm start
```

### 3. Code Quality Checks

```bash
# Linting
npm run lint

# Code coverage
npm run test:coverage

# Bundle size analysis
npm run analyze
```

## Examples

### Example 1: Well-Structured Issue

````markdown
# feat: Add principal variation display to chess training interface

## Task Overview

Implement a principal variation (PV) display component that shows the best move sequence calculated by the tablebase API, helping users understand the reasoning behind tablebase recommendations.

## Machine-Verifiable Success Criteria

- [ ] PrincipalVariationDisplay component renders correctly verified by `npm test -- PrincipalVariationDisplay`
- [ ] PV updates when engine evaluation changes verified by integration tests
- [ ] PV moves are clickable and preview positions verified by user interaction tests
- [ ] TypeScript compilation succeeds verified by `npm run build`
- [ ] Code coverage remains above 78% verified by `npm run test:coverage`

## Technical Implementation Details

### Files to Modify

- `shared/components/PrincipalVariationDisplay/PrincipalVariationDisplay.tsx` - New component
- `shared/components/PrincipalVariationDisplay/PrincipalVariationDisplay.test.tsx` - Component tests
- `shared/components/ChessBoard/ChessBoard.tsx` - Integrate PV display
- `shared/hooks/useChessGame.ts` - Add PV state management
- `shared/lib/tablebase/types.ts` - Add tablebase-related types

### Expected Code Changes

```typescript
// File: shared/hooks/useChessGame.ts
// Before:
const [evaluation, setEvaluation] = useState<number | null>(null);

// After:
const [evaluation, setEvaluation] = useState<EngineEvaluation | null>(null);
```
````

## Verification Commands

```bash
npm test -- --testNamePattern="PrincipalVariation"
npm run build
npm run lint
npm test
```

## Business Context

This enhancement improves the educational value by showing users the optimal move sequence, helping them understand strategic thinking and improve their endgame skills.

## Constraints

- DO NOT modify: `shared/services/TablebaseService.ts` (singleton pattern)
- MUST maintain: Existing `useChessGame` hook API
- AVOID: Adding new dependencies
- PRESERVE: Current performance benchmarks

````

### Example 2: Poorly Structured Issue

```markdown
# Fix the chess thing

## Description
The chess board has some issues that need to be fixed. Make it work better.

## Tasks
- Fix the problems
- Make it faster
- Add some tests

## Notes
This is important for users.
````

**Problems with this issue:**

- Vague title and description
- No specific success criteria
- No technical details
- No verification commands
- No business context
- No constraints defined

## Common Pitfalls

### 1. Vague Success Criteria

❌ "Component should work correctly"
✅ "Component renders without errors verified by `npm test -- ComponentName`"

### 2. Missing File Paths

❌ "Update the chess component"
✅ "Update `shared/components/ChessBoard/ChessBoard.tsx`"

### 3. Unclear Verification

❌ "Test the changes"
✅ "Verify changes with `npm test -- --testNamePattern="ChessBoard"`"

### 4. No Business Context

❌ Just technical requirements
✅ Explain why the change matters to users

### 5. Ignoring Constraints

❌ No mention of what shouldn't be changed
✅ Clear list of files/APIs to preserve

### 6. Ambiguous Technical Details

❌ "Improve the performance"
✅ "Reduce evaluation time from 500ms to <300ms"

## Project-Specific Integration

### ChessEndgameTrainer Commands

```bash
# Development
npm run dev              # Start dev server (port 3002)
npm run dev:config       # Dev server with central config

# Testing
npm test                 # Run all tests (951 tests)
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:performance # Performance tests
npm run test:coverage    # Coverage report

# Code Quality
npm run lint            # ESLint
npm run build           # Production build
npm run analyze-code    # Code analysis
npm run check-duplicates # Find duplicates
```

### File Structure Patterns

```
shared/
├── components/         # React components
│   └── [Component]/
│       ├── [Component].tsx
│       └── [Component].test.tsx
├── hooks/             # Custom React hooks
├── lib/               # Core libraries
│   └── tablebase/     # Chess tablebase logic
├── services/          # Platform services
├── utils/             # Utility functions
└── types/             # TypeScript definitions
```

### Testing Patterns

```typescript
// Test file naming
ComponentName.test.tsx      # Component tests
hookName.test.ts           # Hook tests
serviceName.test.ts        # Service tests

// Test structure
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should behavior', () => {
      // Test implementation
    });
  });
});
```

## Constraint Definition

### What NOT to Change

#### Core Architecture

- `shared/services/TablebaseService.ts` - Singleton pattern
- `shared/stores/` - Zustand store structure
- `shared/services/` - Service layer interfaces

#### Performance Requirements

- Tablebase evaluation: <300ms
- Bundle size: <300KB per route
- Memory usage: <20MB per worker

#### API Contracts

- Hook return types
- Component prop interfaces
- Service method signatures

#### Example Constraint Format

```markdown
## Constraints

- DO NOT modify: `shared/services/TablebaseService.ts` (singleton pattern must remain)
- MUST maintain: Existing `useChessGame` hook API for backward compatibility
- AVOID: Adding dependencies without approval
- PRESERVE: Current performance benchmarks (evaluation < 300ms)
- RESPECT: Existing error handling patterns in services
```

## Business Context Writing

### Elements to Include

#### 1. User Impact

Explain how the change affects end users:

```markdown
This improvement reduces the time users wait for tablebase analysis from 500ms to <300ms, creating a more responsive training experience.
```

#### 2. Technical Rationale

Justify the technical approach:

```markdown
Using Web Workers for tablebase evaluation prevents UI blocking while maintaining the singleton pattern required for memory efficiency.
```

#### 3. Learning Goals

For educational features, explain the pedagogical benefit:

```markdown
The principal variation display helps users understand not just the best move, but the strategic thinking behind it, accelerating their endgame learning.
```

#### 4. System Health

Describe how the change improves the overall system:

```markdown
This refactoring reduces code duplication and improves maintainability, making future chess tablebase enhancements easier to implement.
```

### Business Context Template

```markdown
## Business Context

**User Impact**: [How this affects user experience]
**Technical Rationale**: [Why this approach was chosen]
**Learning Goals**: [Educational benefits, if applicable]
**System Health**: [How this improves the codebase]
**Alignment**: [How this supports project goals]
```

## Conclusion

Well-structured, LLM-optimized issues lead to:

- Faster development cycles
- More accurate implementations
- Fewer back-and-forth clarifications
- Better code quality
- Consistent project standards

Always prioritize clarity and specificity over brevity. The extra time spent crafting a detailed issue pays dividends in implementation quality and speed.

## Related Documentation

- [AGENT_CONFIG.json](../AGENT_CONFIG.json) - Automation rules and quality gates
- [CLAUDE.md](../CLAUDE.md) - AI assistant context and architecture
- [GitHub Issues](https://github.com/thehugegatsby/ChessEndgameTrainer/issues) - Current sprint priorities
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) - System design details
- [docs/TESTING.md](TESTING.md) - Testing strategy and guidelines
