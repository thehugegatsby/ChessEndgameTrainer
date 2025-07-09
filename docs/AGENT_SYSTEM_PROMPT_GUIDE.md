# Agent System Prompt Guide

## Overview

The ChessEndgameTrainer project uses a **hybrid system prompt architecture** that combines human-readable context with machine-enforceable rules. This guide explains how to use and maintain this system.

## System Components

### 1. CLAUDE.md (Human Context)
- **Purpose**: Provides high-level context, architectural principles, and the "why" behind decisions
- **Format**: Markdown for easy human reading and editing
- **Content**: Project overview, tech stack, key decisions, architectural patterns
- **Location**: `/CLAUDE.md`

### 2. AGENT_CONFIG.json (Machine Rules)
- **Purpose**: Strict, machine-enforceable rules, quality gates, and automation workflows
- **Format**: Structured JSON for programmatic validation and enforcement
- **Content**: Quality metrics, workflow steps, documentation triggers, code conventions
- **Location**: `/AGENT_CONFIG.json`

## How They Work Together

```
┌─────────────────┐     ┌──────────────────┐
│   CLAUDE.md     │ ←→  │ AGENT_CONFIG.json│
├─────────────────┤     ├──────────────────┤
│ Context & Why   │     │ Rules & What     │
│ Principles      │     │ Quality Gates    │
│ Architecture    │     │ Workflows        │
│ Best Practices  │     │ Automation       │
└─────────────────┘     └──────────────────┘
         ↓                        ↓
         └────────────┬───────────┘
                      ↓
              AI Agent Instructions
```

## Usage Instructions

### For AI Assistants

1. **Start of Session**: Always read both `CLAUDE.md` and `AGENT_CONFIG.json`
2. **During Work**: Follow the mandatory workflow steps in AGENT_CONFIG.json
3. **Quality Checks**: Enforce all quality gates defined in the config
4. **Documentation**: Update docs according to the triggers specified

### For Developers

1. **Adding New Rules**: Update AGENT_CONFIG.json and run validation
2. **Changing Principles**: Update CLAUDE.md and explain rationale
3. **Validation**: Run `npm run validate:agent-config` to check syntax

## Configuration Structure

### AGENT_CONFIG.json Sections

#### 1. Meta Information
```json
{
  "meta": {
    "version": "1.0.0",
    "project": "ChessEndgameTrainer",
    "description": "..."
  }
}
```

#### 2. Quality Gates
Enforces measurable quality standards:
- Test coverage minimums
- Bundle size limits
- Performance metrics
- Code quality rules

#### 3. Documentation Maintenance
Defines when and what documentation must be updated:
- Immediate update triggers
- Required documentation files
- Quality standards for docs

#### 4. Execution Workflow
Mandatory steps for any implementation:
1. CONTEXT_REFRESH
2. PRE_IMPLEMENTATION_CHECK
3. IMPLEMENTATION
4. TESTING_GATE
5. DOCUMENTATION_UPDATE
6. FINAL_VERIFICATION

#### 5. Code Conventions
Language-specific and general coding standards:
- TypeScript rules
- React patterns
- Testing conventions
- General practices

#### 6. Testing Requirements
Specific requirements for different test types:
- Unit test coverage targets
- Integration test scenarios
- E2E test performance goals
- Performance benchmarks

#### 7. Security Requirements
Security-related enforcement rules:
- Input validation requirements
- Dependency vulnerability limits
- Runtime security policies

## Maintenance Guide

### Updating Quality Gates

When project metrics improve, update the gates:

```json
// Before
"test_coverage": {
  "business_logic_minimum": 78
}

// After (when coverage improves)
"test_coverage": {
  "business_logic_minimum": 85
}
```

### Adding New Workflow Steps

To add a new mandatory step:

1. Update `execution_workflow.mandatory_steps` array
2. Ensure step numbers remain sequential
3. Include: name, actions, validation
4. Update CLAUDE.md workflow section

### Creating Documentation Triggers

For new event types that should trigger documentation:

```json
{
  "event": "performance_optimization",
  "required_updates": [
    "docs/ARCHITECTURE.md - Document optimization",
    "CHANGELOG.md - Note performance improvements"
  ]
}
```

## Validation

### Manual Validation
```bash
node scripts/validate-agent-config.js
```

### Automated Validation (npm script)
```bash
npm run validate:agent-config
```

### What Gets Validated
- JSON syntax correctness
- Required sections present
- Value ranges (e.g., percentages 0-100)
- Sequential workflow steps
- Current project alignment

## Best Practices

### 1. Keep Both Files in Sync
- When updating principles in CLAUDE.md, check if rules in AGENT_CONFIG.json need updates
- When adding automation rules, ensure CLAUDE.md explains the rationale

### 2. Start Small, Expand Gradually
- Begin with critical quality gates
- Add more rules as patterns emerge
- Don't over-engineer upfront

### 3. Version Control
- Update version in meta section for major changes
- Document changes in CHANGELOG.md
- Keep history of why rules were added/changed

### 4. Regular Reviews
- Monthly review of quality gates against actual metrics
- Quarterly review of workflow effectiveness
- Annual review of overall system architecture

## Common Patterns

### Pattern 1: Feature Development
1. AI reads both files
2. Checks TODO.md for priorities
3. Follows 6-step workflow
4. Updates triggered documentation
5. Validates against quality gates

### Pattern 2: Bug Fix
1. Minimal context refresh
2. Focus on testing gate
3. Update CHANGELOG.md
4. Security check if relevant

### Pattern 3: Documentation Update
1. Check documentation triggers
2. Update all related files
3. Maintain cross-references
4. Update last-modified dates

## Troubleshooting

### Issue: Validation Fails
- Check JSON syntax with a JSON validator
- Ensure all required fields are present
- Verify value types match expected types

### Issue: Conflicting Instructions
- AGENT_CONFIG.json rules take precedence
- CLAUDE.md provides context for interpretation
- When in doubt, choose the stricter interpretation

### Issue: Missing Documentation Updates
- Check immediate_update_triggers section
- Verify event type matches defined triggers
- Ensure all files in required_updates exist

## Migration from Simple System

If migrating from a simple CLAUDE.md-only system:

1. Extract measurable rules → AGENT_CONFIG.json
2. Extract workflows → execution_workflow
3. Extract quality requirements → quality_gates
4. Keep context and explanations → CLAUDE.md
5. Add cross-references between files
6. Validate and test the new structure

## Future Enhancements

Potential improvements to consider:
- Automated enforcement via Git hooks
- CI/CD integration for validation
- Dynamic rule updates based on metrics
- Multi-project template system
- Visual workflow designer

---

*Last Updated: 2025-01-09*

For questions or improvements to this system, please open an issue or submit a PR.