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

| Task                | Always Load | Path                                                                       |
| ------------------- | ----------- | -------------------------------------------------------------------------- |
| **Any Task**        | ✅          | [`docs/CORE.md`](docs/CORE.md) - Architecture                              |
| **Session Memory**  | ✅          | [`SCRATCHPAD.md`](SCRATCHPAD.md) - Context between sessions                |
| **Product Context** | →           | [`docs/VISION.md`](docs/VISION.md) - Product Vision                        |
| **Quality Tasks**   | →           | [`docs/AGENT_CONFIG.json`](docs/AGENT_CONFIG.json) - Standards & Workflows |
| Testing             | →           | [`docs/guides/testing.md`](docs/guides/testing.md)                         |
| MCP Tools           | →           | [`docs/tooling/mcp-matrix.md`](docs/tooling/mcp-matrix.md)                 |

## 🤖 LLM Protocol

Always load `CORE.md` first, then task-specific docs from table above. For MCP selection, see `mcp-matrix.md`. Use "use context7" for framework docs.

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
