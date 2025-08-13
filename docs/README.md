# Documentation Index

<!-- nav: root | tags: [navigation, docs] | updated: 2025-08-12 -->

This index provides structured navigation through all project documentation for efficient LLM assistance.

## Quick Start

- **First time here?** → [CLAUDE.md](../CLAUDE.md)
- **Core Architecture** → [CORE.md](./CORE.md)

## Environment & Tooling

| Document                                                           | Purpose               | Key Info                           |
| ------------------------------------------------------------------ | --------------------- | ---------------------------------- |
| [guides/wsl2.md](./guides/wsl2.md)                                 | WSL environment rules | Command syntax, forbidden patterns |
| [tooling/mcp-overview.md](./tooling/mcp-overview.md)               | MCP tool selection    | Hierarchy, decision tree           |
| [tooling/hooks-and-commands.md](./tooling/hooks-and-commands.md)   | Hook configuration    | Debug, safety hooks                |
| [tooling/GITHUB_ISSUE_GUIDELINES.md](./tooling/GITHUB_ISSUE_GUIDELINES.md) | GitHub issue standards | LLM-optimized templates, naming    |

## Architecture

| Document                                                         | Purpose           | Key Info                           |
| ---------------------------------------------------------------- | ----------------- | ---------------------------------- |
| [CORE.md](./CORE.md)                                             | System overview   | Consolidated architecture guide    |
| [SYSTEM_GUIDE.md](./SYSTEM_GUIDE.md)                             | Detailed patterns | Implementation patterns, examples  |
| [MOVE_HANDLING_ARCHITECTURE.md](./MOVE_HANDLING_ARCHITECTURE.md) | Move flow details | 533-line orchestrator breakdown    |
| [GLOSSARY.md](./GLOSSARY.md)                                     | Term definitions  | WDL, FEN, Slice, Orchestrator      |

## Development

| Document                                     | Purpose              | Key Info                  |
| -------------------------------------------- | -------------------- | ------------------------- |
| [guides/testing.md](./guides/testing.md)     | Test framework rules | Vitest, WSL commands      |
| [CONTRIBUTING.md](./CONTRIBUTING.md)         | Git workflow         | Branch naming, PR format  |

## Specialized Guides

| Directory                          | Purpose                       |
| ---------------------------------- | ----------------------------- |
| [archive/](./archive/)             | Historical documentation      |
| [adr/](./adr/)                     | Architecture decision records |
| [checklists/](./checklists/)       | Maintenance checklists        |
| [orchestrators/](./orchestrators/) | Orchestrator-specific docs    |
| [services/](./services/)           | Service-specific docs         |

## Quick Reference

**Critical Files:**

- `src/shared/store/rootStore.ts` - Main store
- `src/shared/services/ChessService.ts` - Chess logic singleton
- `src/shared/store/orchestrators/handlePlayerMove/` - Move logic (533 lines)

**Core Commands:**

```bash
pnpm run dev       # Development server
pnpm run build     # Production build
pnpm run lint      # ESLint + format
pnpm test          # Run all tests
pnpm tsc           # TypeScript check
```

**Validation Workflow:**

```bash
pnpm run lint && pnpm tsc && pnpm test
```
