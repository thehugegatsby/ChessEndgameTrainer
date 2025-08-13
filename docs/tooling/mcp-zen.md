# MCP Zen Tools

<!-- nav: docs/tooling/mcp-overview | tags: [mcp, zen] | updated: 2025-08-13 -->

## Overview

The Zen MCP server provides specialized AI-powered development workflows for debugging, refactoring, testing, and architectural decisions.

## Workflow Tools

### Debugging & Problem Solving

#### `mcp__zen__debug`

**When:** Bug hunting, error analysis, performance issues  
**Example:** "Test failing with null pointer exception"  
**Process:** Step-by-step investigation with evidence gathering

#### `mcp__zen__thinkdeep`

**When:** Complex architectural problems requiring deep analysis  
**Example:** "Analyze performance bottleneck in move validation"  
**Process:** Multi-stage investigation with hypothesis testing

### Code Quality

#### `mcp__zen__codereview`

**When:** Code review, best practices, quality assessment  
**Example:** "Review the ChessService implementation"  
**Process:** Systematic review with issue identification

#### `mcp__zen__refactor`

**When:** Code cleanup, simplification, DRY principles  
**Example:** "This function is too long and complex"  
**Process:** Identifies code smells and improvement opportunities

### Testing

#### `mcp__zen__testgen`

**When:** Generate tests, improve coverage  
**Example:** "Write unit tests for ChessService"  
**Process:** Analyzes code paths and generates comprehensive tests

### Security

#### `mcp__zen__secaudit`

**When:** Security review, vulnerability assessment  
**Example:** "Check for XSS vulnerabilities"  
**Process:** OWASP-based security analysis

#### `mcp__zen__precommit`

**When:** Pre-commit validation, change review  
**Example:** "Validate all changes before commit"  
**Process:** Comprehensive change analysis

## Planning Tools

### `mcp__zen__planner` {#planning}

**When:** Multi-step implementation tasks  
**Example:** "Implement user authentication with NextAuth"  
**Features:**

- Sequential planning with revision capability
- Branch exploration for alternatives
- Dynamic step adjustment

### `mcp__zen__consensus` {#consensus}

**MANDATORY for:**

- Architecture changes
- New libraries/dependencies
- Breaking API changes
- Database schema changes

**Example:**

```
mcp__zen__consensus "Should we migrate from Next.js to Vite?"
with models: gemini-pro (for), o3 (against)
```

## Analysis Tools

### `mcp__zen__analyze`

**When:** Understanding codebase structure  
**Example:** "Analyze the state management architecture"  
**Output:** Comprehensive analysis with actionable insights

### `mcp__zen__tracer`

**When:** Tracing execution flow and call chains  
**Example:** "Trace how moves are validated"  
**Modes:**

- `precision`: Method execution flow
- `dependencies`: Structural relationships

## General Purpose

### `mcp__zen__chat` {#chat}

**When:** Open questions, brainstorming, no specific tool fits  
**Example:** "What are the pros and cons of SSR vs SSG?"  
**Note:** Use specific tools when available

## Model Selection

- **Simple tasks:** Use `flash` or `gemini-2.5-flash`
- **Complex analysis:** Use `pro` or `gemini-2.5-pro`
- **Critical decisions:** Use `o3` or `claude-opus-4`

## Workflow Examples

### Example 1: Debugging a Test Failure

```
1. Use mcp__zen__debug to investigate
2. Step through the failure systematically
3. Gather evidence from logs and code
4. Identify root cause
5. Propose fix
```

### Example 2: Major Refactoring

```
1. Use mcp__zen__analyze to understand current structure
2. Use mcp__zen__consensus for approach decision
3. Use mcp__zen__planner to break down tasks
4. Use mcp__zen__refactor for implementation
5. Use mcp__zen__codereview for validation
```
