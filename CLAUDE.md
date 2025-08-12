# CLAUDE.md

## CRITICAL: Environment Constraints

### Bash in WSL

```bash
# ❌ NEVER - crashes when piping
pnpm test 2>&1 | tail

# ✅ ALWAYS - run directly
pnpm test
```

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

## Architecture Rules

- **State**: Zustand slices only (gameSlice, trainingSlice, tablebaseSlice, uiSlice)
- **Services**: ChessService (singleton), TablebaseService, ErrorService, Logger
- **Files**: PascalCase.tsx for components, camelCase.ts for utilities
- **Imports**: Use `@shared/` alias, never relative paths
- **German**: Error messages in German (ErrorService)

## Critical Files

- `src/shared/store/rootStore.ts` - Main store
- `src/shared/services/ChessService.ts` - Chess logic singleton
- `src/shared/services/TablebaseService.ts` - Lichess API
- `src/shared/store/orchestrators/handlePlayerMove/` - Move logic (533 lines)

## MCP Tools

Use specialized tools for complex tasks. See @docs/claude/mcp-tools.md

**Golden Rules:**

1. ALWAYS search docs first: `mcp__ref__ref_search_documentation`
2. Use specific workflows: Bug → `mcp__zen__debug`, Review → `mcp__zen__codereview`
3. GET CONSENSUS on: Architecture, new dependencies, breaking changes → `mcp__zen__consensus`

## Testing

See @docs/claude/testing.md for comprehensive testing guidelines and patterns.

## Permanent Constraints

- No engine code (removed Stockfish completely)
- No pipes with Node.js commands in WSL/VS Code
- Always use pnpm (not npm)
- Read-only file (chmod 444)

---

_For temporary notes and current work: see SCRATCHPAD.md_
