# CLAUDE.md

<!-- nav: root | tags: [main, guide] | updated: 2025-08-12 -->

## Quick Start

**New to this project?** → [CLAUDE_QUICKSTART.md](CLAUDE_QUICKSTART.md)

## Essential Info

**Platform:** WSL2 Linux | **Package Manager:** pnpm | **Key Rule:** No pipes with Node.js

**WSL Safety:** → [docs/WSL2_ENV.md](docs/WSL2_ENV.md)  
**Documentation Index:** → [docs/README.md](docs/README.md)

## MCP Tools

Quick reference - use the right tool for the task:

- Documentation search: `mcp__ref__ref_search_documentation`
- Bug/debug: `mcp__zen__debug`
- Code review: `mcp__zen__codereview`
- Refactoring: `mcp__zen__refactor`
- Tests: `mcp__zen__testgen`
- Major decisions: `mcp__zen__consensus` (MANDATORY for architecture changes)

**Full decision tree and guidelines:** → [docs/tooling/mcp-tools.md](docs/tooling/mcp-tools.md)

## Architecture & Code Structure

Key rules:

- **State**: Zustand with domain slices (game, training, tablebase, ui)
- **Services**: ChessService, TablebaseService, ErrorService, Logger
- **Imports**: Use `@shared/` alias, never relative paths
- **German**: Error messages in German

**Full details:** → [docs/SYSTEM_GUIDE.md](docs/SYSTEM_GUIDE.md)

## Standard Validation Workflow

Before finalizing changes, run this sequence:

```bash
pnpm run lint     # 1. Lint and format
pnpm tsc          # 2. TypeScript check
pnpm test         # 3. Run tests
```

## Core Commands

```bash
pnpm run dev       # Development server
pnpm run build     # Production build
pnpm run lint      # ESLint + format
pnpm test          # Run all tests
pnpm tsc           # TypeScript check
```

## Critical Files

- `src/shared/store/rootStore.ts` - Main store
- `src/shared/services/ChessService.ts` - Chess logic singleton
- `src/shared/services/TablebaseService.ts` - Lichess API
- `src/shared/store/orchestrators/handlePlayerMove/` - Move logic (533 lines)

## Testing

**Framework:** Jest for `src/shared/`, Vitest for `src/features/`

**WSL Critical:** Never use `--` with pnpm test

- ✅ `pnpm test path/to/test.tsx`
- ❌ `pnpm test -- --run path/to/test.tsx`

**Full testing guidelines:** → [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)

## Permanent Constraints

- No engine code (removed Stockfish completely)
- No pipes with Node.js commands in WSL/VS Code
- Always use pnpm (not npm)
- Read-only file (chmod 444)

## Additional Documentation

- **Contributing & Git:** → [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- **Hooks & Commands:** → [docs/tooling/hooks-and-commands.md](docs/tooling/hooks-and-commands.md)
- **Move Logic Details:** → [docs/MOVE_HANDLING_ARCHITECTURE.md](docs/MOVE_HANDLING_ARCHITECTURE.md)

---

_For temporary notes and current work: see SCRATCHPAD.md_
