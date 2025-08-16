---
name: 'Enhanced LLM-Optimized Issue'
about: 'Issue template optimized for autonomous LLM processing with structured metadata'
title: '[TYPE] Scope: ConcisePascalCaseSummary [→ #parentId]'
labels: ['llm-task']
assignees: []
---

---

# Core Metadata (REQUIRED)

spec_version: "1.1"
issue_type: feat
priority: P2
estimate: 4h
epic_id:
phase:
blocks: []
blocked_by: []
related: []

# Enhanced LLM Metadata

technical_complexity: medium
impact_score: 3
risk_level: low
domain:
component: frontend
validation_type: automated

---

# Summary

<One-sentence statement of the problem or goal>

# Context & Business Impact

<Why this matters, error rates, business impact, user segments affected>

<!-- LLM_EXECUTION_CONTEXT_START -->

```json
{
  "schema_version": "1.1",
  "task_type": "bugfix|feature|refactor|cleanup|docs",
  "repo": "thehugegatsby/ChessEndgameTrainer",
  "branch": "main",
  "code_refs": [
    {
      "path": "src/path/to/file.ts",
      "start_line": 42,
      "end_line": 88,
      "context": "Brief description of relevant code section",
      "context_hash": "optional-sha256-for-validation"
    }
  ],
  "commands": {
    "setup": ["pnpm install"],
    "test": ["pnpm test", "pnpm run lint", "pnpm tsc"],
    "validation": ["pnpm run build"]
  },
  "allowed_actions": ["read_files", "edit_code", "create_tests", "run_commands", "create_files"],
  "change_budget": {
    "max_files": 5,
    "max_total_lines": 200,
    "max_new_files": 2
  },
  "acceptance_criteria": [
    "Specific measurable outcome 1",
    "CLI command 'xyz' returns expected output",
    "Tests pass: pnpm test path/to/test.spec.ts"
  ],
  "test_plan": [
    "Add unit test at: tests/path/to/feature.test.ts",
    "Verify integration with: existing functionality X"
  ],
  "security_constraints": [
    "No secrets in code",
    "No external network calls",
    "No modification of sensitive files"
  ],
  "restricted_files": [".env*", "package.json", "next.config.js"],
  "non_goals": ["Refactoring unrelated modules", "Performance optimizations outside scope"],
  "expected_outputs": [
    "PR with title: 'feat: implement feature X'",
    "Documentation updated in: docs/path/to/doc.md"
  ],
  "validation_checklist": [
    "TypeScript compiles without errors",
    "All existing tests continue to pass",
    "New functionality has test coverage"
  ],
  "approvers": ["@team/maintainers"],
  "timeout_minutes": 45,
  "dry_run": true,
  "pii_included": false
}
```

<!-- LLM_EXECUTION_CONTEXT_END -->

# Human-Readable Acceptance Criteria

- [ ] **AC1**: Given `<context>` when `<action>` then `<expected>`
- [ ] All existing tests continue to pass
- [ ] New tests added for changes
- [ ] TypeScript compilation succeeds
- [ ] Documentation updated if needed

# Implementation Strategy

<Technical approach, architectural considerations, risk mitigation>

## File Changes Required

- **Modify**: `src/path/to/existing/file.ts` - reason for change
- **Create**: `src/path/to/new/file.ts` - purpose of new file
- **Test**: `tests/path/to/test.spec.ts` - test coverage plan

## Commands for Verification

```bash
# Setup
pnpm install

# Development
pnpm run dev

# Testing
pnpm test path/to/specific/test.spec.ts
pnpm run lint
pnpm tsc

# Validation
pnpm run build
```

## Risk Assessment

- **Risk Level**: Low/Medium/High
- **Rollback Strategy**: git checkout, specific files to revert
- **Dependencies**: Other issues, PRs, or external factors

# Definition of Done

- [ ] Code implemented and reviewed
- [ ] Tests updated/added with >80% coverage
- [ ] Documentation updated
- [ ] CI pipeline passes
- [ ] Performance impact assessed
- [ ] Security review completed (if applicable)

---

## 🤖 LLM Processing Instructions

### Validation Requirements

1. **Parse JSON block** between `LLM_EXECUTION_CONTEXT_START/END` markers
2. **Verify file paths** exist in repository before modification
3. **Check change budget** - respect max_files and max_total_lines limits
4. **Run commands** in specified order for setup/test/validation
5. **Follow security constraints** - never modify restricted_files

### Execution Workflow

1. **Read Context**: Parse code_refs for understanding current implementation
2. **Plan Changes**: Design solution within change_budget constraints
3. **Implement**: Make code changes respecting allowed_actions
4. **Test**: Run test_plan and validation_checklist
5. **Document**: Update expected_outputs (docs, comments)
6. **Verify**: Ensure all acceptance_criteria are met

### Safety Guardrails

- **NEVER** commit secrets, API keys, or PII
- **ALWAYS** run dry_run=true first for validation
- **RESPECT** restricted_files - these are read-only
- **VALIDATE** all changes against security_constraints
- **REQUIRE** human approval for high-risk changes

### Error Handling

- If validation fails, comment with specific error details
- If change_budget exceeded, request scope reduction
- If security constraints violated, halt execution
- If timeout_minutes exceeded, save progress and request extension

---

**Template Version**: 1.1  
**Last Updated**: 2025-08-16  
**Optimized for**: Claude Code, GPT-5, Gemini-2.5-Pro
