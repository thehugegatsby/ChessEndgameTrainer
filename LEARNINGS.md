# LEARNINGS

<!-- AI-generated learnings from development sessions -->

## About This File

This file contains AI-documented learnings captured during development. Each entry represents an important insight, pattern, or solution discovered while working on the Chess Endgame Trainer.

**Structure:** Newest entries at the top, each with metadata and context.

---

## Entry Template

```yaml
---
date: YYYY-MM-DD HH:MM
category: [Architecture | Bug Fix | Performance | Testing | Security | Pattern]
tags: [relevant, tags]
commit: [git hash if applicable]
files: [affected files]
confidence: [high | medium | low]
---

### Discovery
[What was discovered or learned]

### Context
[Why this is important, what problem it solved]

### Implementation
[How it was applied or should be applied]

### Future Considerations
[What to watch out for, related areas to check]
```

---

## Learnings Log

### 2025-08-13: MCP Tool Documentation Structure

```yaml
---
date: 2025-08-13 15:30
category: Architecture
tags: [documentation, mcp, ai-tools]
files: [docs/tooling/mcp-*.md]
confidence: high
---
```

### Discovery
Separating MCP tool documentation into individual files per server (mcp-zen.md, mcp-playwright.md, mcp-ref.md) significantly improves AI comprehension and reduces token usage compared to a monolithic file.

### Context
Previously, all MCP tools were documented in a single mcp-tools.md file. As the number of tools grew, this became unwieldy and made it harder for AI to find specific tool documentation efficiently.

### Implementation
- Created mcp-overview.md with decision tree
- Separated each MCP server into its own file
- Maintained links between files for navigation
- Preserved the quick decision tree in overview

### Future Considerations
- Apply same pattern to other growing documentation files
- Consider automatic index generation for large doc sets
- Monitor if further subdivision needed as tools expand

---

### 2025-08-13: AI-Focused README Pattern

```yaml
---
date: 2025-08-13 14:00
category: Pattern
tags: [documentation, ai-optimization, readability]
files: [src/shared/*/README.md]
confidence: high
---
```

### Discovery
Brief, AI-focused README files in source folders dramatically improve code comprehension without human overhead. Key insight: These READMEs should be written FOR AI consumption, not humans.

### Context
LLMs benefit from explicit architectural context at the point of code exploration. Traditional documentation often sits too far from the code or contains too much human-oriented explanation.

### Implementation
- Created minimal READMEs in key folders (services/, store/, components/)
- Used bullet points and technical language
- Included links to detailed docs
- Focused on: purpose, patterns, key files

### Future Considerations
- Automate README updates when architecture changes
- Consider similar patterns for test directories
- May need versioning if patterns diverge significantly

---

### 2025-08-12: Playwright MCP for Chess Testing

```yaml
---
date: 2025-08-12 16:45
category: Testing
tags: [e2e, playwright, chess, mcp]
files: [docs/tooling/mcp-playwright.md]
confidence: medium
---
```

### Discovery
Playwright MCP's accessibility tree approach is superior to screenshot-based testing for chess applications. Board squares can be reliably targeted with data attributes like `[data-square='e4']`.

### Context
Traditional visual testing of chess boards is fragile due to piece animations, hover effects, and theme variations. Accessibility-based testing provides stable element targeting.

### Implementation
- Use data-square attributes for board interaction
- Leverage browser_evaluate to check Zustand store state
- Combine browser_snapshot for structure, browser_evaluate for state verification

### Future Considerations
- Build helper functions for common chess moves
- Consider recording baseline games for regression testing
- May need custom wait strategies for animation completion

---

## Categories

- **Architecture**: Structural decisions and patterns
- **Bug Fix**: Solutions to specific issues
- **Performance**: Optimization discoveries
- **Testing**: Test strategies and tools
- **Security**: Security-related findings
- **Pattern**: Reusable patterns and practices

## How to Add Entries

1. Use the template above
2. Place new entries at the top
3. Be specific about files and commits
4. Include concrete examples when possible
5. Link to related documentation

## Synthesis Documents

Periodically, learnings are synthesized into:
- [BEST_PRACTICES.md](BEST_PRACTICES.md) - Consolidated practices
- [docs/SYSTEM_GUIDE.md](docs/SYSTEM_GUIDE.md) - Architectural decisions