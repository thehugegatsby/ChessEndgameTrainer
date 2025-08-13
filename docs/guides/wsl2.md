# WSL2 Environment Rules

<!-- nav: docs/README#environment | tags: [wsl, environment, critical] | updated: 2025-08-12 -->

## CRITICAL: WSL2 Environment

**THIS PROJECT RUNS IN WSL2 (Windows Subsystem for Linux)**

- Platform: Linux 6.6.87.2-microsoft-standard-WSL2
- Working Directory: /home/thehu/coolProjects/EndgameTrainer
- Package Manager: pnpm (NOT npm)

## WSL-Specific Command Rules

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

## Testing Commands

**Framework:** Jest for `src/shared/`, Vitest for `src/features/`

**WSL Critical:** Never use `--` with pnpm test

- ✅ `pnpm test path/to/test.tsx`
- ❌ `pnpm test -- --run path/to/test.tsx`

## Core Commands

```bash
pnpm run dev       # Development server
pnpm run build     # Production build
pnpm run lint      # ESLint + format
pnpm test          # Run all tests
pnpm tsc           # TypeScript check
```

## Validation Workflow

Before finalizing changes, run this sequence:

```bash
pnpm run lint     # 1. Lint and format
pnpm tsc          # 2. TypeScript check
pnpm test         # 3. Run tests
```

## Hook Safety

The project includes WSL safety hooks to prevent command crashes:

- See: [tooling/hooks-and-commands.md](./tooling/hooks-and-commands.md)
- Hook blocks dangerous Node.js + pipe combinations
- Manual validation required if hooks fail

## Permanent Constraints

- No engine code (removed Stockfish completely)
- No pipes with Node.js commands in WSL/VS Code
- Always use pnpm (not npm)
- Read-only file (chmod 444) for CLAUDE.md
