---
name: LLM-Optimized Task
about: Systematic code improvement task optimized for LLM consumption
title: "type(scope): brief descriptive title"
labels: llm-ready
assignees: ""
---

<!--
🤖 LLM-OPTIMIZED ISSUE TEMPLATE

This template is designed to create issues that are optimally structured for LLM consumption and processing.
Follow the format below to ensure your issue can be efficiently processed by AI assistants.

KEY PRINCIPLES:
- Use clear, structured sections with emoji headers
- Provide machine-verifiable success criteria
- Include specific examples and patterns
- Structure acceptance criteria as actionable items
- Use consistent formatting throughout
-->

## 🎯 Task Overview

<!--
INSTRUCTION: Provide a clear, concise description of what needs to be done.
Good: "Extract magic numbers from chess engine configuration into named constants"
Bad: "Fix the numbers in the code"
-->

**Brief Description:**
[One sentence describing the task]

**Scope:**
[Specify which files, modules, or areas of code are affected]

**Context:**
[Explain why this task is needed and how it fits into the broader project]

## 🎖️ Machine-Verifiable Success Criteria

<!--
INSTRUCTION: List specific, testable criteria that can be automatically verified.
Use checkboxes for each criterion. Include commands that can verify success.

GOOD EXAMPLES:
- [ ] All magic numbers > 100 in `/shared/lib/engine/` are extracted to constants
- [ ] All tests pass: `npm test`
- [ ] No new TypeScript errors: `npm run build`

BAD EXAMPLES:
- [ ] Code looks better
- [ ] Numbers are more readable
-->

- [ ] **Criterion 1:** [Specific, measurable outcome]
  - **Verification:** `command to verify`
- [ ] **Criterion 2:** [Specific, measurable outcome]
  - **Verification:** `command to verify`
- [ ] **Criterion 3:** [Specific, measurable outcome]
  - **Verification:** `command to verify`

## 📋 Detailed Requirements

### Target Patterns

<!--
INSTRUCTION: Specify exactly what patterns to look for in the code.
Use code blocks with syntax highlighting for clarity.
-->

**Find these patterns:**

```typescript
// Pattern 1: Magic numbers in configuration
const config = {
  cacheSize: 200, // ← Extract this
  timeout: 7000, // ← Extract this
  maxPieces: 7, // ← Extract this
};

// Pattern 2: Hardcoded thresholds
if (wdl > 0.95) {
  // ← Extract this
  // logic
}
```

**Replace with:**

```typescript
// Extracted constants
const TABLEBASE_CONFIG = {
  DEFAULT_CACHE_SIZE: 200,
  DEFAULT_TIMEOUT_MS: 7000,
  MAX_PIECES: 7,
} as const;

const WDL_THRESHOLDS = {
  WINNING_THRESHOLD: 0.95,
} as const;

// Updated usage
const config = {
  cacheSize: TABLEBASE_CONFIG.DEFAULT_CACHE_SIZE,
  timeout: TABLEBASE_CONFIG.DEFAULT_TIMEOUT_MS,
  maxPieces: TABLEBASE_CONFIG.MAX_PIECES,
};

if (wdl > WDL_THRESHOLDS.WINNING_THRESHOLD) {
  // logic
}
```

### Exclusion Criteria

<!--
INSTRUCTION: Specify what NOT to change to prevent over-extraction.
-->

**Do NOT extract:**

- Single-use values that are self-explanatory (e.g., `array.length - 1`)
- Standard constants (e.g., `0`, `1`, `true`, `false`)
- Values that are context-dependent and don't represent domain concepts
- Test-specific values unless they're reused across multiple tests

### File Scope

<!--
INSTRUCTION: List specific files or directories to process.
Use glob patterns where appropriate.
-->

**Target Files:**

- `shared/services/TablebaseService.ts`
- `shared/services/MoveStrategyService.ts`
- `shared/hooks/useTrainingGame.ts`
- `shared/hooks/usePositionAnalysis.ts`
- `shared/store/**/*.ts`

**Exclude Files:**

- `tests/**/*` (unless constants are reused)
- `*.test.ts` files
- `node_modules/**/*`

## 🔧 Implementation Guidelines

### Naming Conventions

<!--
INSTRUCTION: Specify how constants should be named for consistency.
-->

```typescript
// Use SCREAMING_SNAKE_CASE for constants
const TABLEBASE_DEFAULTS = {
  MAX_PIECES: 7,
  TIMEOUT_MS: 7000,
  CACHE_SIZE: 200,
} as const;

// Group related constants logically
const TRAINING_CONFIG = {
  DEBOUNCE_MS: 300,
  MAX_MOVE_HISTORY: 100,
  DEFAULT_THEME: "dark",
} as const;
```

### File Organization

<!--
INSTRUCTION: Specify where constants should be placed.
-->

1. **Create/Update:** `shared/constants/index.ts`
2. **Group by domain:** Tablebase, Training, UI, Store, etc.
3. **Export pattern:**
   ```typescript
   export const TABLEBASE_CONFIG = { ... } as const;
   export const TRAINING_CONFIG = { ... } as const;
   ```

### Code Quality Requirements

<!--
INSTRUCTION: Specify quality standards for the changes.
-->

- All constants must be typed with `as const`
- JSDoc comments required for non-obvious constants
- Group constants logically by domain/feature
- Maintain existing code functionality (no behavior changes)
- Follow existing project TypeScript style

## 📝 Expected Deliverables

### Code Changes

<!--
INSTRUCTION: Structure expected outputs as a checklist.
-->

- [ ] **Constants File:** Updated `shared/constants/index.ts` with extracted constants
- [ ] **Refactored Files:** All target files updated to use new constants
- [ ] **Import Updates:** Proper imports added to all modified files
- [ ] **Documentation:** JSDoc comments for complex constants

### Quality Assurance

<!--
INSTRUCTION: List verification steps that must be completed.
-->

- [ ] **Tests Pass:** All existing tests continue to pass
- [ ] **Type Safety:** No new TypeScript errors introduced
- [ ] **Build Success:** Production build completes without errors
- [ ] **Lint Clean:** No new linting errors
- [ ] **No Regressions:** Application behavior unchanged

## 🧪 Testing Requirements

### Verification Commands

<!--
INSTRUCTION: Provide exact commands to verify the changes.
-->

```bash
# Run all tests
npm test

# Check TypeScript compilation
npm run build

# Run linting
npm run lint

# Check for circular dependencies
npm run check-circular-deps

# Verify no duplicate constants
npm run check-duplicates
```

### Manual Testing

<!--
INSTRUCTION: Specify any manual testing needed.
-->

- [ ] Tablebase queries work as expected
- [ ] Training flow functions correctly
- [ ] UI responds normally to user interactions
- [ ] Performance remains consistent

## 💡 Examples

### Good Extraction Example

<!--
INSTRUCTION: Show a complete before/after example.
-->

**Before:**

```typescript
// shared/services/TablebaseService.ts
export class TablebaseService {
  private cache = new LRUCache(200);
  private timeout = 7000;

  async getEvaluation(fen: string) {
    if (this.cache.size > 200) {
      this.cache.clear();
    }
    // ...
  }
}
```

**After:**

```typescript
// shared/constants/index.ts
export const TABLEBASE_CONFIG = {
  DEFAULT_CACHE_SIZE: 200,
  DEFAULT_TIMEOUT_MS: 7000,
  MAX_PIECES: 7,
} as const;

// shared/services/TablebaseService.ts
import { TABLEBASE_CONFIG } from "../constants";

export class TablebaseService {
  private cache = new LRUCache(TABLEBASE_CONFIG.DEFAULT_CACHE_SIZE);
  private timeout = TABLEBASE_CONFIG.DEFAULT_TIMEOUT_MS;

  async getEvaluation(fen: string) {
    if (this.cache.size > TABLEBASE_CONFIG.DEFAULT_CACHE_SIZE) {
      this.cache.clear();
    }
    // ...
  }
}
```

### Bad Extraction Example

<!--
INSTRUCTION: Show what NOT to do.
-->

**❌ Don't extract obvious or single-use values:**

```typescript
// DON'T DO THIS
const ARRAY_OPERATIONS = {
  LAST_INDEX_OFFSET: 1, // for array.length - 1
  ZERO: 0, // obvious value
  TRUE: true, // standard boolean
} as const;

// DON'T DO THIS
for (let i = ARRAY_OPERATIONS.ZERO; i < array.length; i++) {
  // ...
}
```

## 📊 Acceptance Criteria Checklist

<!--
INSTRUCTION: Comprehensive checklist for issue completion.
Use this as the final verification before marking the issue as complete.
-->

### Code Quality

- [ ] All magic numbers meeting criteria have been extracted
- [ ] Constants are properly typed with `as const`
- [ ] Naming follows project conventions
- [ ] No duplicate constants created
- [ ] JSDoc comments added where needed

### Technical Verification

- [ ] All tests pass: `npm test`
- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] No new linting errors: `npm run lint`
- [ ] No circular dependencies introduced
- [ ] Bundle size not significantly increased

### Functionality

- [ ] Application behavior unchanged
- [ ] Performance characteristics maintained
- [ ] No breaking changes to public APIs
- [ ] Error handling remains intact

### Documentation

- [ ] Constants file properly documented
- [ ] Complex constants have explanatory comments
- [ ] Import statements are clean and organized
- [ ] Code follows existing project patterns

## 🔍 Review Guidelines

### For Code Reviewers

<!--
INSTRUCTION: Guidelines for reviewing LLM-generated changes.
-->

**Focus Areas:**

1. **Constant Grouping:** Are constants logically organized?
2. **Naming Consistency:** Do names follow project conventions?
3. **Value Accuracy:** Are extracted values correct?
4. **Import Cleanliness:** Are imports organized properly?
5. **No Over-extraction:** Were obvious values left alone?

**Review Commands:**

```bash
# Check diff impact
git diff --stat

# Verify test coverage maintained
npm run test:coverage

# Check for accidental changes
git diff --name-only | grep -v constants
```

### Common Issues to Check

- [ ] Constants not properly typed
- [ ] Over-extraction of obvious values
- [ ] Missing imports in modified files
- [ ] Incorrect constant values
- [ ] Poor constant grouping/organization

---

<!--
🤖 END OF TEMPLATE

This template ensures:
1. Clear, structured information for LLM processing
2. Machine-verifiable success criteria
3. Comprehensive examples and guidelines
4. Consistent formatting and organization
5. Quality assurance checkpoints

When creating issues using this template:
- Fill out ALL sections completely
- Use specific, measurable criteria
- Provide clear examples
- Include verification commands
- Structure acceptance criteria as actionable items
-->
