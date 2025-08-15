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

## 📚 Load Documentation

| Task | Always Load | Path |
|------|------------|------|
| **Any Task** | ✅ | [`docs/CORE.md`](docs/CORE.md) - Architecture |
| Testing | → | [`docs/guides/testing.md`](docs/guides/testing.md) |
| WSL2 Issues | → | [`docs/guides/wsl2.md`](docs/guides/wsl2.md) |
| MCP Tools | → | [`docs/tooling/mcp-matrix.md`](docs/tooling/mcp-matrix.md) |
| All Docs | → | [`docs/README.md`](docs/README.md) - Navigation Hub |

## 🤖 MCP Servers Active

- **zen**: AI workflows (debug, refactor, test, analyze)
- **playwright**: Browser automation & E2E testing
- **claude-context**: Semantic code search
- **context7**: Live framework docs (`use context7` in prompts)

## 📝 LLM Workflow

1. **ALWAYS**: Load `docs/CORE.md` first
2. **TASK-SPECIFIC**: Load relevant guide from table above
3. **MCP SELECTION**: Check `docs/tooling/mcp-matrix.md`
4. **LIVE DOCS**: Add "use context7" for React/Next.js docs

## 🚀 Code Standards

- **Tests**: Vitest with ES6 imports (new only)
- **Types**: No `any` - always typed
- **UI Errors**: German (`"Ungültiger Zug"`)
- **Imports**: Use `@shared/` aliases

## 📸 Screenshot Integration

When I type "ss" in a message, automatically run `~/.local/bin/lastshot` and use the Read tool to display my latest screenshot.

**Setup**: The `lastshot` script finds the latest screenshot from Windows and creates a symlink in `./tmp/` for easy access.