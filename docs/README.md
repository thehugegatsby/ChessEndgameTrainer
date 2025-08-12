# Documentation Index

<!-- nav: root | tags: [navigation, docs] | updated: 2025-08-12 -->

This index provides structured navigation through all project documentation for efficient LLM assistance.

## Quick Start

- **First time here?** → [CLAUDE_QUICKSTART.md](../CLAUDE_QUICKSTART.md)
- **Project root guide** → [CLAUDE.md](../CLAUDE.md)

## Environment & Tooling

| Document                                                         | Purpose               | Key Info                           |
| ---------------------------------------------------------------- | --------------------- | ---------------------------------- |
| [WSL2_ENV.md](./WSL2_ENV.md)                                     | WSL environment rules | Command syntax, forbidden patterns |
| [tooling/mcp-tools.md](./tooling/mcp-tools.md)                   | MCP tool selection    | Hierarchy, decision tree           |
| [tooling/hooks-and-commands.md](./tooling/hooks-and-commands.md) | Hook configuration    | Debug, safety hooks                |

## Architecture

| Document                                                         | Purpose           | Key Info                           |
| ---------------------------------------------------------------- | ----------------- | ---------------------------------- |
| [SYSTEM_GUIDE.md](./SYSTEM_GUIDE.md)                             | System overview   | Zustand slices, services, patterns |
| [MOVE_HANDLING_ARCHITECTURE.md](./MOVE_HANDLING_ARCHITECTURE.md) | Move flow details | 533-line orchestrator breakdown    |
| [GLOSSARY.md](./GLOSSARY.md)                                     | Term definitions  | WDL, FEN, Slice, Orchestrator      |

## Development

| Document                                     | Purpose              | Key Info                  |
| -------------------------------------------- | -------------------- | ------------------------- |
| [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) | Test framework rules | Jest/Vitest, WSL commands |
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
