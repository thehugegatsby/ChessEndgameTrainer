# CLAUDE.md

## CRITICAL: WSL2 Environment

**THIS PROJECT RUNS IN WSL2 (Windows Subsystem for Linux)**

- Platform: Linux 6.6.87.2-microsoft-standard-WSL2
- Working Directory: /home/thehu/coolProjects/EndgameTrainer
- Package Manager: pnpm (NOT npm)

### WSL-Specific Command Rules

**DO NOT use these patterns - they crash in WSL:**

- ❌ `pnpm test -- --run path/to/test.tsx`
- ❌ `pnpm test 2>&1 | tail`
- ❌ `npm run build | grep error`
- ❌ Any Node.js command with pipes (`|`) or stderr redirect (`2>&1`)

**DO use these patterns instead:**

- ✅ `pnpm test path/to/test.tsx` (direct path)
- ✅ `pnpm test` (run all)
- ✅ `pnpm run build` (no pipes)
- ✅ `pnpm run lint && pnpm tsc` (use && not pipes)

## MCP Tools

Quick reference - use the right tool for the task:

- Documentation search: `mcp__ref__ref_search_documentation`
- Bug/debug: `mcp__zen__debug`
- Code review: `mcp__zen__codereview`
- Refactoring: `mcp__zen__refactor`
- Tests: `mcp__zen__testgen`
- Major decisions: `mcp__zen__consensus` (MANDATORY for architecture changes)

**Full decision tree and guidelines:** @docs/claude/mcp-tools.md

## Architecture & Code Structure

Key rules:

- **State**: Zustand with domain slices (game, training, tablebase, ui)
- **Services**: ChessService, TablebaseService, ErrorService, Logger
- **Imports**: Use `@shared/` alias, never relative paths
- **German**: Error messages in German

**Full details:** @docs/SYSTEM_GUIDE.md

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

**Full testing guidelines:** @docs/TESTING_STRATEGY.md

## Permanent Constraints

- No engine code (removed Stockfish completely)
- No pipes with Node.js commands in WSL/VS Code
- Always use pnpm (not npm)
- Read-only file (chmod 444)

## Additional Documentation

- **Contributing & Git:** @docs/CONTRIBUTING.md
- **Hooks & Commands:** @docs/claude/hooks-and-commands.md
- **Move Logic Details:** @docs/MOVE_HANDLING_ARCHITECTURE.md

---

_For temporary notes and current work: see SCRATCHPAD.md_
