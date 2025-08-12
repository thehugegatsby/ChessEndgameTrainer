# MCP Tool Usage Guidelines

## Tool Hierarchy (Use in this order)

The tool selection follows a simple principle: from most specific and efficient to most general.

### 1️⃣ Documentation First

**Tool:** `mcp__ref__ref_search_documentation`  
**When:** ALWAYS before WebSearch  
**Token Impact:** 54 tokens vs 20k+ for WebSearch  
**Example:** "React Router v7 loader pattern"

### 2️⃣ Specific Workflows

| Keywords/Intent                  | Tool                   | Example                             |
| -------------------------------- | ---------------------- | ----------------------------------- |
| bug, error, exception, debug     | `mcp__zen__debug`      | "Test failing with null pointer"    |
| review, feedback, best practice  | `mcp__zen__codereview` | "Review this component"             |
| refactor, cleanup, simplify, DRY | `mcp__zen__refactor`   | "Function too long"                 |
| test, coverage, unit test, e2e   | `mcp__zen__testgen`    | "Write unit tests for ChessService" |
| security, vulnerability, OWASP   | `mcp__zen__secaudit`   | "Check for XSS vulnerabilities"     |
| pre-commit, validation           | `mcp__zen__precommit`  | "Validate changes before commit"    |

### 3️⃣ Complex Planning

#### `mcp__zen__planner`

**When:** Multi-step implementation tasks  
**Example:** "Implement user authentication with NextAuth"

#### `mcp__zen__consensus`

**MANDATORY for:**

- Architecture changes
- New libraries/dependencies
- Breaking API changes
- Database schema changes

**Example:** `mcp__zen__consensus "Migrate from Next.js to Vite" with gemini-pro and o3`

### 4️⃣ Analysis & Understanding

| Purpose           | Tool                  | When to Use                      |
| ----------------- | --------------------- | -------------------------------- |
| Code analysis     | `mcp__zen__analyze`   | Understanding codebase structure |
| Deep reasoning    | `mcp__zen__thinkdeep` | Complex architectural decisions  |
| Call flow tracing | `mcp__zen__tracer`    | Understanding execution paths    |

### 5️⃣ Fallback

**Tool:** `mcp__zen__chat`  
**When:** Open questions, brainstorming, or when no specific tool fits  
**Example:** "Pros and cons of SSR vs SSG?"

## Browser Automation

**Tool:** `mcp__playwright__*`  
**When:** UI testing, browser automation  
**Example:** "Test the login flow in the browser"

## Anti-Patterns (DON'T DO THIS)

❌ **DON'T** use `mcp__zen__consensus` for:

- Variable naming
- Code style decisions
- Minor refactoring

❌ **DON'T** use WebSearch before trying `mcp__ref__ref_search_documentation`

❌ **DON'T** use `mcp__zen__chat` when a specific workflow tool exists

## Token Optimization Strategy

1. **REF first:** Always try documentation search
2. **Specific tools:** Use workflow-specific tools over general chat
3. **Model selection:** Use appropriate model sizes (flash for simple, pro for complex)

## Quick Decision Tree

```
Is it about finding documentation?
  → YES: mcp__ref__ref_search_documentation
  → NO: Continue ↓

Is it a specific task (bug, refactor, test)?
  → YES: Use specific workflow tool (see table)
  → NO: Continue ↓

Is it a major decision needing consensus?
  → YES: mcp__zen__consensus
  → NO: Continue ↓

Is it complex multi-step work?
  → YES: mcp__zen__planner
  → NO: mcp__zen__chat
```
