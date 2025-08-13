---
name: Standard Issue
about: LLM-optimized issue template with structured metadata
title: "[TYPE] Scope: ConcisePascalCaseSummary [→ #parentId]"
labels: []
assignees: []
---

---
# Core Metadata (REQUIRED)
spec_version: "1.0"
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

# LLM-Optimized Structured Data
```yaml
acceptance_criteria:
  - id: AC1
    given: "<specific context>"
    when: "<user action>"
    then: "<expected result>"
    validation: automated
    test_type: unit

definition_of_done:
  code_implemented_and_reviewed: required
  tests_updated_added: required
  documentation_updated: required
  ci_pipeline_passes: required

dependencies:
  - type: epic
    id: ""
    description: ""
    status: pending
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