# GitHub Issue Guidelines - LLM Optimized

<!-- nav: tooling/github-guidelines | tags: [process, llm, claude] | updated: 2025-08-13 -->

**Purpose:** Guidelines optimized for Claude Code and LLM consumption to enable rapid understanding of issues, relationships, and priorities.

## 🎯 Core Principles

1. **LLM-First Design** - Structure for machine readability
2. **Predictable Patterns** - Consistent formatting for pattern recognition  
3. **Hierarchical Relationships** - Clear Epic → Phase → Task chains
4. **Mandatory Metadata** - Required fields in predictable locations
5. **Event Stream History** - Preserve chronological updates

## 📝 Issue Title Format

**Pattern:** `[TYPE] Scope: ConcisePascalCaseSummary [→ #parentId]`

### Examples:
```
[FEAT] Auth: AddOAuth2RefreshTokenSupport → #137
[BUG] API: FixTablebaseTimeoutError
[TEST] Migration: MigrateTrainingDomainTests → #137
[DOCS] Setup: UpdateInstallationInstructions
[CHORE] CI: UpgradeNodeVersionTo22
```

### Rules:
- **TYPE** (all-caps): `FEAT`, `BUG`, `DOCS`, `CHORE`, `TEST`, `RESEARCH`, `QUESTION`
- **Scope**: Subsystem/domain (max 2 words) - `Auth`, `API`, `UI`, `Chess`, `Training`
- **Summary**: 3-8 words, PascalCase, verb-first
- **Parent Reference**: Optional `→ #123` for Epic/Phase relationships

## 🏷️ Label Standards

**Namespace-based labels** - never use more than one label per namespace:

### Core Namespaces:
- `priority:P0|P1|P2|P3` (P0 = drop everything)
- `status:needs-spec|in-progress|blocked|review|done`  
- `size:S|M|L|XL` (story point proxy)
- `domain:chess|training|tablebase|ui|testing`
- `type:feat|bug|docs|chore|test|research`

### Special LLM Labels:
- `ai:good-first-issue` - Curated for autonomous agents
- `ai:needs-context` - Requires domain expertise
- `llm:claude-ready` - Fully structured for Claude Code

### Project-Specific:
- `vitest` - Testing framework migration
- `critical` - Blocking/urgent issues  
- `technical-debt` - Code quality improvements
- `scope:testing` - Testing domain changes

## 📋 Issue Template Structure

**Enhanced LLM-Optimized Template** - Based on AI consensus analysis (Gemini, O3, DeepSeek)

```markdown
---
# Core Metadata (REQUIRED)
spec_version: "1.0"
issue_type: feat|bug|docs|chore|test|research
priority: P0|P1|P2|P3
estimate: 1h|2h|4h|1d|2d|1w
epic_id: 137
phase: 1
blocks: []
blocked_by: []
related: []

# Enhanced LLM Metadata (NEW)
technical_complexity: low|medium|high
impact_score: 1-5
risk_level: low|medium|high
domain: chess|training|tablebase|ui|testing
component: frontend|backend|service|util|test
validation_type: automated|manual|user-testing
---

# Summary
<One-sentence statement of the problem or goal>

# LLM-Optimized Structured Data (NEW)
```yaml
acceptance_criteria:
  - id: AC1
    given: "<specific context>"
    when: "<user action>"
    then: "<expected result>"
    validation: automated|manual
    test_type: unit|integration|e2e

definition_of_done:
  code_implemented_and_reviewed: required
  tests_updated_added: required
  documentation_updated: required
  ci_pipeline_passes: required

dependencies:
  - type: epic|issue|external|service
    id: "789"
    description: "Blocking dependency"
    status: pending|in_progress|resolved
```

# Acceptance Criteria (Human-Readable)
- [ ] **AC1**: Given `<context>` when `<action>` then `<expected>`
- [ ] All existing tests continue to pass
- [ ] New tests added for changes

# Context & Business Impact
<Why this matters, error rates, business impact, user segments affected>

# Implementation Strategy
<Technical approach, code changes, risk mitigation>

# Definition of Done
- [ ] Code implemented and reviewed
- [ ] Tests updated/added  
- [ ] Documentation updated
- [ ] CI pipeline passes
```

## 🔗 Epic/Phase Relationship Pattern

For multi-phase projects like the Test Migration:

### Epic Issue:
```
[EPIC] Testing: MigrateFromJestToVitest
```

### Phase Issues:
```
[TEST] Migration: Phase1TrainingDomainTests → #137
[TEST] Migration: Phase2ChessDeduplication → #137  
[TEST] Migration: Phase3RemainingUnitTests → #137
[TEST] Migration: Phase4IntegrationE2E → #137
[TEST] Migration: Phase5FinalCleanup → #137
```

**Benefits for LLMs:**
- Instant recognition of Epic relationships
- Clear phase ordering (Phase1, Phase2, etc.)
- Consistent scope identification (Migration)
- Parent reference (`→ #137`) for dependency tracking

## 💬 Comment Discipline

**Status updates must use prefixes:**
- `UPDATE:` - Progress or information updates
- `BLOCKED:` - Now blocked by external dependency  
- `UNBLOCKED:` - Blocker resolved, can proceed
- `RESOLVED:` - Issue completed

**Example:**
```
UPDATE: Completed Phase 1 migration, found 15 duplicate tests
BLOCKED: Waiting for CI memory fix before proceeding with Phase 2  
UNBLOCKED: CI fixed, resuming Phase 2 migration
RESOLVED: All 77 tests migrated successfully to Vitest
```

## 🤖 LLM Benefits

This structure enables Claude Code to:

1. **Parse metadata** from YAML front-matter instantly
2. **Identify relationships** from title patterns (`→ #123`)
3. **Understand priority** from namespaced labels (`priority:P0`)
4. **Track progress** from checklist items (`- [ ]`)
5. **Follow history** from prefixed comments (`UPDATE:`)
6. **Generate code** based on structured acceptance criteria

## 🛠️ Implementation Checklist

- [ ] Create `.github/ISSUE_TEMPLATE/` directory
- [ ] Add issue templates for each TYPE
- [ ] Set up label namespaces via GitHub API
- [ ] Update existing issues #154-#158 to new format
- [ ] Document in CONTRIBUTING.md
- [ ] Configure GitHub Actions to validate YAML front-matter
- [ ] Train team on new conventions

## 📊 Migration of Current Issues

**Current Issues #154-#158** should be renamed to:

```
[TEST] Migration: Phase1TrainingDomainTests → #137
[TEST] Migration: Phase2ChessDeduplication → #137  
[TEST] Migration: Phase3RemainingUnitTests → #137
[TEST] Migration: Phase4IntegrationE2E → #137
[TEST] Migration: Phase5FinalCleanup → #137
```

This immediately shows:
- All are TEST type (testing work)
- All belong to Migration scope  
- Clear phase ordering (1-5)
- All relate to Epic #137
- Parseable by LLMs for dependency analysis

## 🎯 Success Metrics

- **LLM Comprehension**: Claude Code can instantly identify issue type, priority, relationships
- **Developer Velocity**: Faster issue triage and task assignment
- **Automation Ready**: Enable auto-labeling, release notes, PR generation
- **Maintainable Backlog**: Structured history that scales with project growth

---

*These guidelines optimize for both human clarity and machine readability, positioning the project for AI-assisted development workflows.*