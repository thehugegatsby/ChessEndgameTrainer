# CLAUDE.md - Permanent AI Rules

## CRITICAL RULES

### Bash Commands

**NEVER use pipes (|) with Node.js commands in WSL/VS Code** - they cause tools to detect non-TTY mode and crash.

- ❌ Bad: `pnpm test 2>&1 | tail`
- ✅ Good: `pnpm test`

### Code Quality

**ALWAYS run linter and TypeScript after code changes** - prevents introducing errors:

```bash
pnpm run lint     # Fix linting errors
pnpm tsc          # Fix TypeScript errors
```

**NEVER modify this file** - it contains permanent rules only.  
_Temporary notes and current work: see SCRATCHPAD.md_

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

## Test Structure

- Jest: Legacy tests (unit/integration/services/store projects)
- Vitest: New features only (`src/features/`)
- Config: `config/testing/jest.config.ts` and `config/testing/vitest.config.ts`

## Permanent Constraints

- No engine code (removed Stockfish completely)
- No pipes with Node.js commands in WSL/VS Code
- Always use pnpm (not npm)
- Read-only file (chmod 444)

---

_For temporary notes and current work: see SCRATCHPAD.md_
