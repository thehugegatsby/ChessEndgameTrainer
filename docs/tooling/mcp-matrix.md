# MCP Decision Matrix

<!-- nav: docs/README | tags: [mcp, decision-matrix] | updated: 2025-01-14 -->

## Quick Decision Guide

| Task | Primary Tool | When to Use | Example |
|------|-------------|------------|---------|
| **Find Code** | `mcp__claude-context__search_code` | Semantic search for concepts | `"authentication middleware"` |
| **Bug Hunt** | `mcp__zen__debug` | Step-by-step debugging | `"null pointer in move validation"` |
| **Complex Analysis** | `mcp__zen__thinkdeep` | Deep architectural problems | `"performance bottleneck analysis"` |
| **Code Review** | `mcp__zen__codereview` | Quality & security assessment | `"review ChessService"` |
| **Refactor** | `mcp__zen__refactor` | Simplify & improve code | `"decompose complex function"` |
| **Generate Tests** | `mcp__zen__testgen` | Create comprehensive tests | `"test UserManager class"` |
| **Security Audit** | `mcp__zen__secaudit` | OWASP & vulnerability check | `"check for XSS vulnerabilities"` |
| **Pre-commit** | `mcp__zen__precommit` | Validate changes | `"verify all changes"` |
| **Planning** | `mcp__zen__planner` | Multi-step implementation | `"implement OAuth2 auth"` |
| **Major Decision** | `mcp__zen__consensus` | Architecture debates | `"migrate to GraphQL?"` |
| **Code Analysis** | `mcp__zen__analyze` | Understand structure | `"analyze state management"` |
| **Trace Flow** | `mcp__zen__tracer` | Follow execution paths | `"trace move validation"` |
| **Browser Test** | `mcp__playwright__*` | E2E & UI testing | `"test chess move UI"` |
| **General Chat** | `mcp__zen__chat` | Open questions, brainstorming | `"pros/cons of SSR vs SSG"` |

## Decision Flow

```
1. Is it about finding existing code?
   YES → claude-context (semantic search)
   NO → Continue ↓

2. Is it browser/UI testing?
   YES → playwright tools
   NO → Continue ↓

3. Is it a bug or error?
   YES → zen:debug (simple) or zen:thinkdeep (complex)
   NO → Continue ↓

4. Is it a major architectural decision?
   YES → zen:consensus (get multiple perspectives)
   NO → Continue ↓

5. Does it need multi-step planning?
   YES → zen:planner
   NO → Continue ↓

6. Is it a specific dev task?
   YES → Use matching zen tool (see matrix above)
   NO → zen:chat (general purpose)
```

## Model Selection

| Complexity | Recommended Model | Use Case |
|------------|------------------|----------|
| **Simple** | `flash` / `gemini-2.5-flash` | Quick checks, formatting |
| **Standard** | `pro` / `gemini-2.5-pro` | Most development tasks |
| **Complex** | `o3` / `o4-mini` | Critical decisions, deep analysis |
| **Critical** | `claude-opus-4` via zen | Architecture, security audits |

## Tool Combinations

### Example: Complete Bug Fix
```
1. mcp__claude-context__search_code   # Find related code
2. mcp__zen__debug                    # Investigate issue
3. mcp__zen__testgen                  # Generate test for fix
4. mcp__zen__codereview              # Validate solution
```

### Example: Major Refactoring
```
1. mcp__zen__analyze                  # Understand current structure
2. mcp__zen__consensus                # Decide approach
3. mcp__zen__planner                  # Break down tasks
4. mcp__zen__refactor                 # Execute refactoring
5. mcp__zen__precommit               # Validate changes
```

### Example: E2E Test Creation
```
1. mcp__zen__testgen                  # Generate test scenarios
2. mcp__playwright__browser_navigate  # Implement browser tests
3. mcp__playwright__browser_snapshot  # Capture states
4. mcp__zen__codereview              # Review test quality
```

## Anti-Patterns ❌

- **DON'T** use consensus for minor decisions (variable names, formatting)
- **DON'T** use chat when a specific tool exists
- **DON'T** use playwright for API testing (use HTTP requests)
- **DON'T** use debug for simple syntax errors (just fix them)
- **DON'T** chain too many tools unnecessarily

## Best Practices ✅

- **DO** use the most specific tool available
- **DO** check indexing status before using claude-context
- **DO** use appropriate thinking modes (low/medium/high/max)
- **DO** combine tools for comprehensive workflows
- **DO** specify models explicitly for critical tasks