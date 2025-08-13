# MCP Tools Overview

<!-- nav: docs/README#environment | tags: [mcp, overview] | updated: 2025-08-13 -->

## Available MCP Servers

| Server         | Purpose                                             | Documentation                          |
| -------------- | --------------------------------------------------- | -------------------------------------- |
| **Zen**        | Development workflows (debug, refactor, test, etc.) | [mcp-zen.md](mcp-zen.md)               |
| **Playwright** | Browser automation & E2E testing                    | [mcp-playwright.md](mcp-playwright.md) |
| **REF**        | Documentation search                                | [mcp-ref.md](mcp-ref.md)               |

## Quick Decision Tree

```
Is it about finding documentation?
  → YES: mcp__ref__ref_search_documentation → [mcp-ref.md](mcp-ref.md)
  → NO: Continue ↓

Is it browser/UI testing?
  → YES: mcp__playwright__* → [mcp-playwright.md](mcp-playwright.md)
  → NO: Continue ↓

Is it a specific dev task (bug, refactor, test)?
  → YES: Use Zen workflow tool → [mcp-zen.md](mcp-zen.md)
  → NO: Continue ↓

Is it a major decision needing consensus?
  → YES: mcp__zen__consensus → [mcp-zen.md](mcp-zen.md#consensus)
  → NO: Continue ↓

Is it complex multi-step work?
  → YES: mcp__zen__planner → [mcp-zen.md](mcp-zen.md#planning)
  → NO: mcp__zen__chat → [mcp-zen.md](mcp-zen.md#chat)
```

## Tool Selection Principles

1. **Most specific first** - Use the tool designed for your exact task
2. **Token efficiency** - REF (54 tokens) vs WebSearch (20k+ tokens)
3. **Workflow over chat** - Specific tools provide better structure
4. **Model sizing** - Flash for simple, Pro for complex

## Anti-Patterns (DON'T DO THIS)

❌ **DON'T** use `mcp__zen__consensus` for minor decisions (variable names, code style)  
❌ **DON'T** use WebSearch before trying `mcp__ref__ref_search_documentation`  
❌ **DON'T** use `mcp__zen__chat` when a specific workflow tool exists  
❌ **DON'T** use Playwright for API testing (use direct HTTP requests instead)
