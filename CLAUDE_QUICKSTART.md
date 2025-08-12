# CLAUDE_QUICKSTART.md

<!-- nav: root | tags: [quickstart, critical] | updated: 2025-08-12 -->

## Essential Setup

**Platform:** WSL2 Linux  
**Package Manager:** pnpm (NOT npm)  
**Working Directory:** /home/thehu/coolProjects/EndgameTrainer

## Critical WSL Rules

❌ **NEVER use pipes with Node.js:**

```bash
pnpm test 2>&1 | tail     # CRASHES
pnpm test -- --run        # CRASHES
```

✅ **Use direct commands:**

```bash
pnpm test path/to/test.tsx  # OK
pnpm run lint && pnpm tsc   # OK
```

## Core Commands

```bash
pnpm run dev       # Development server
pnpm run build     # Production build
pnpm run lint      # ESLint + format
pnpm test          # Run all tests
pnpm tsc           # TypeScript check
```

## Validation Workflow

```bash
pnpm run lint && pnpm tsc && pnpm test
```

## MCP Tools

Use the right tool for the task:

- **Bug/Debug:** `mcp__zen__debug`
- **Refactor:** `mcp__zen__refactor`
- **Tests:** `mcp__zen__testgen`
- **Review:** `mcp__zen__codereview`

→ [Full MCP tool hierarchy](docs/tooling/mcp-tools.md)

## Critical Files

- `src/shared/store/rootStore.ts` - Main store
- `src/shared/services/ChessService.ts` - Chess logic
- `src/shared/store/orchestrators/handlePlayerMove/` - Move logic (533 lines)

## Architecture Quick Ref

- **State:** Zustand with domain slices (Game, Training, Tablebase, UI)
- **Services:** ChessService, TablebaseService
- **Imports:** Use `@shared/` alias, never relative paths
- **German:** Error messages in German

## Full Documentation

→ [CLAUDE.md](CLAUDE.md) - Complete reference  
→ [docs/README.md](docs/README.md) - Documentation index
