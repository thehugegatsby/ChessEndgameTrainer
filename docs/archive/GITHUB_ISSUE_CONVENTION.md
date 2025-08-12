# GitHub Issue Convention for ChessEndgameTrainer

## 🎯 Unified Convention for LLM-Optimized Issues

This document defines the complete convention for GitHub issues in the ChessEndgameTrainer project, optimized for both human understanding and LLM processing.

## 📋 Table of Contents

1. [Title Naming Convention](#title-naming-convention)
2. [Label System](#label-system)
3. [Content Structure](#content-structure)
4. [Migration Guidelines](#migration-guidelines)
5. [Examples](#examples)

## 1. Title Naming Convention

### Format

```
type(scope): clear descriptive title
```

### Allowed Types

- `feat` - New feature or enhancement
- `fix` - Bug fix or correction
- `refactor` - Code improvement without functionality change
- `docs` - Documentation updates
- `test` - Test additions or improvements
- `chore` - Maintenance tasks (dependencies, build, etc.)
- `perf` - Performance improvements

### Allowed Scopes

- `engine` - Chess engine and UCI related code
- `ui` - User interface components and styling
- `api` - API endpoints and data services
- `firestore` - Database and data management
- `constants` - Configuration and constants
- `auth` - Authentication and authorization
- `cache` - Caching logic and configuration
- `tablebase` - Endgame tablebase integration
- `testing` - Test infrastructure and tools
- `ci` - Continuous integration and deployment

### Title Rules

- Use lowercase for type and scope
- Use imperative mood for description ("add feature" not "adds feature")
- No period at the end
- Keep under 72 characters total
- Be specific and descriptive

### Examples

✅ **Good:**

- `feat(ui): add principal variation display to chess board`
- `fix(engine): resolve evaluation race condition in stockfish`
- `refactor(constants): extract magic numbers into named constants`
- `docs(api): update authentication endpoints documentation`

❌ **Bad:**

- `🔥 Missing positions in Firestore` (emoji, unclear scope)
- `[CRITICAL] Fix the cache` (priority in title, vague)
- `Phase 1: Design Test Architecture` (phase naming, unclear type)

## 2. Label System

### Required Labels (All Issues)

Every issue must have exactly one label from each category:

#### Type Labels

- `type/feature` - New functionality
- `type/bug` - Bug fixes
- `type/refactor` - Code improvements
- `type/docs` - Documentation
- `type/test` - Testing
- `type/chore` - Maintenance

#### Scope Labels

- `scope/engine` - Chess engine code
- `scope/ui` - User interface
- `scope/api` - Backend/API
- `scope/constants` - Configuration
- `scope/auth` - Authentication
- `scope/cache` - Caching
- `scope/tablebase` - Tablebase integration

#### Priority Labels

- `priority:critical` - Immediate attention required
- `priority:high` - Should be addressed soon
- `priority:medium` - Normal development cycle
- `priority:low` - Can be addressed when time permits

#### Effort Labels

- `effort/s` - Small (1-2 files, simple changes)
- `effort/m` - Medium (multiple files, moderate complexity)
- `effort/l` - Large (complex changes, many areas)

### Special Labels

#### LLM Processing

- `llm-ready` - Issue is structured for LLM processing
- `status/in-progress-llm` - Currently being processed by LLM
- `status/review-needed` - LLM completed work, human review needed

#### Legacy Labels (Being Phased Out)

- `bug`, `enhancement`, `documentation` → Use `type/*` instead
- `critical`, `ui`, `testing` → Use structured labels instead

## 3. Content Structure

### Required Sections (Use Emoji Headers)

#### 🎯 Task Overview

- **Goal**: One sentence describing what needs to be done
- **Impact**: Priority level and brief reasoning

#### 🎖️ Machine-Verifiable Success Criteria

- Checkboxes with specific, testable outcomes
- Include exact verification commands
- Must be measurable and unambiguous

#### 📍 Exact File Locations

- List all files with absolute paths from project root
- Include line numbers for specific changes
- Use code blocks for clarity

#### 🔧 Code Changes Required

- Before/after code examples
- Use diff format with file paths
- Show context around changes

#### 📁 New/Updated Files

- Specify new files to create
- Include complete file structures
- Show TypeScript typing with `as const`

#### 🚫 Constraints & No-Gos

- Clear list of what NOT to change
- API contracts to preserve
- Performance requirements to maintain

#### ✅ Verification Commands

- Exact npm commands to verify completion
- Specific test patterns
- Build and lint checks

#### 🎯 Business Context

- Why this change matters
- User impact explanation
- Technical rationale

### Optional Sections

- 🖼️ **Visual Examples** (for UI changes)
- 🧪 **Testing Strategy** (for complex features)
- 📊 **Performance Requirements** (for optimization tasks)

## 4. Migration Guidelines

### For Existing Issues

1. **Title Migration**:

   ```bash
   # Old format
   🔥 Missing positions in Firestore (9, 10, 11)

   # New format
   fix(firestore): add missing endgame positions 9, 10, and 11
   ```

2. **Label Migration**:
   - Remove old format labels (`bug`, `critical`, etc.)
   - Add structured labels (`type/bug`, `priority:critical`, `scope/firestore`, `effort/s`)
   - Add `llm-ready` if issue follows new structure

3. **Content Migration**:
   - Add missing emoji headers
   - Convert to machine-verifiable criteria
   - Add specific file paths and commands
   - Include business context

### Batch Migration Script

```bash
# Update all issues in repository
gh issue list --limit 100 --json number,title,labels | \
  jq -r '.[] | "\(.number) \(.title)"' | \
  while read issue; do
    # Apply new convention
    # (Implementation depends on specific needs)
  done
```

## 5. Examples

### Complete Example: Magic Number Extraction

```markdown
# refactor(constants): extract cache configuration magic numbers

## 🎯 Task Overview

**Goal**: Extract hardcoded cache configuration values into named constants for consistency and maintainability.
**Impact**: MEDIUM - Improves maintainability but not critical functionality.

## 🎖️ Machine-Verifiable Success Criteria

- [ ] All cache configuration values use named constants from single source
- [ ] `npm run lint` passes without warnings
- [ ] `npm run build` succeeds without errors
- [ ] Search for `200`, `1000`, `300000` returns zero matches in cache contexts
- [ ] `npm test -- --testPathPattern=cache` passes all cache tests

## 📍 Exact File Locations
```

shared/lib/chess/engine/engineInstance.ts:25
shared/utils/lruCache.ts:12
shared/services/caching/memoryCache.ts:23

````

## 🔧 Code Changes Required

### Before (engineInstance.ts:25):
```typescript
const DEFAULT_CACHE_SIZE = 200;
````

### After:

```typescript
import { CACHE_CONSTANTS } from "@shared/constants/cacheConstants";
const DEFAULT_CACHE_SIZE = CACHE_CONSTANTS.ENGINE_CACHE_SIZE;
```

## 📁 New Constants File

**Path**: `shared/constants/cacheConstants.ts`

```typescript
export const CACHE_CONSTANTS = {
  ENGINE_CACHE_SIZE: 200,
  DEFAULT_LRU_SIZE: 100,
  MEMORY_CACHE_SIZE: 1000,
  TTL_DEFAULT_MS: 300000,
} as const;
```

## 🚫 Constraints & No-Gos

- Do NOT change cache algorithms or eviction policies
- Do NOT modify test files (handled separately)
- Do NOT change any logic beyond constant extraction

## ✅ Verification Commands

```bash
npm test -- --testPathPattern=cache
npm run lint
npm run build
grep -r "200\|1000\|300000" shared/ --include="*.ts" --exclude="*constants*"
```

## 🎯 Business Context

Cache configuration centralization enables easier performance tuning across environments and prevents inconsistencies that could cause memory issues in production.

```

**Labels**: `type/refactor`, `scope/constants`, `priority:medium`, `effort/s`, `llm-ready`

## 6. Enforcement

### Automated Checks
- GitHub Action to validate issue title format
- Label requirement validation
- Content structure verification

### Review Process
- All new issues must follow this convention
- Existing issues updated during active work
- Regular audits for compliance

## 7. Benefits

### For LLMs
- Consistent parsing patterns
- Clear success criteria
- Unambiguous file specifications
- Precise verification steps

### For Humans
- Better organization and searchability
- Clear expectations and deliverables
- Consistent quality standards
- Faster issue understanding

### For Project
- Improved automation capabilities
- Better tracking and metrics
- Consistent development workflow
- Higher code quality

---

**Last Updated**: 2025-01-14
**Next Review**: 2025-02-14

This convention is mandatory for all new issues and should be applied to existing issues during active development.
```
