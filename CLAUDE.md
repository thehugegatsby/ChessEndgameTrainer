# CLAUDE.md

**Chess Endgame Trainer** - React 19, TypeScript, Zustand, Next.js 15, Tailwind CSS 3.4 | WSL2 Linux

## ⚡ Quick Start

```bash
pnpm run dev              # Dev server (MCP auto-starts)
pnpm run build            # Production
pnpm test file.test.tsx   # Single test (auto-detects feature)
pnpm test:chess           # Test chess-core feature only
pnpm test                 # All tests (warns if >100 files)
pnpm run lint && pnpm tsc # Validation
```

## 🔧 WSL2 Critical

- ✅ `pnpm test file.test.tsx` → Auto-detects WSL2, sets optimal config
- ✅ Performance guard → Warns before running >100 tests
- ✅ Feature routing → Auto-detects chess-core/tablebase/training
- ❌ `cmd | grep` → ✅ `cmd && cmd2` (no pipes)
- 📦 CI-Fix: `vite-tsconfig-paths` resolves modules

## 📚 Core Documentation

**Essential**: [`docs/CORE.md`](docs/CORE.md) - Architecture overview
**Complex Flows**: [`docs/orchestrators/handlePlayerMove/TABLEBASE_DATA_FLOW.md`](docs/orchestrators/handlePlayerMove/TABLEBASE_DATA_FLOW.md) - API integration

## 🤖 MCP Servers Active

- **zen**: AI workflows (debug, refactor, test, analyze)
- **playwright**: Browser automation & E2E testing
- **claude-context**: Semantic code search
- **context7**: Live framework docs (`use context7` in prompts)

## 🚀 Code Standards

- **Tests**: Vitest with ES6 imports (new only)
- **Types**: No `any` - always typed
- **UI Errors**: German (`"Ungültiger Zug"`)
- **Imports**: Use `@shared/` aliases

## 📸 Screenshot Integration

When I type "ss" in a message, automatically run `~/.local/bin/lastshot` and use the Read tool to display my latest screenshot.

**Setup**: The `lastshot` script finds the latest screenshot from Windows and creates a symlink in `./tmp/` for easy access.
