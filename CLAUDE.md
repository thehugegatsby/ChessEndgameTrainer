# CLAUDE.md

**Chess Endgame Trainer** - React 19, TypeScript, Zustand, Next.js 15 | WSL2 Linux | 288kB Bundle

## 🎯 Core Instructions

**IMMER ZUERST:** → [docs/CORE.md](docs/CORE.md) lesen (Architektur, Zustand, Services)

**WSL2 Critical:**
- ✅ `pnpm test file.test.tsx` → **AUTO-REDIRECTS** zu `pnpm run test:vitest:file file.test.tsx` 
- ✅ Alternative: `pnpm run test:file file.test.tsx` (kürzer)
- ✅ Backup: `pnpm run test:original` (alle Tests)
- ❌ `cmd | grep` → ✅ `cmd && cmd2`

**Smart Test System:**
Das `pnpm test` Command ist jetzt intelligent und leitet automatisch um:
- `pnpm test file.test.tsx` → Nur diese Datei 
- `pnpm test` → Alle Tests

**Code Standards:**
- Neue Tests in Vitest | Keine `any` Types | UI-Errors auf Deutsch | `@shared/` imports

**Test Migration Strategy (2025-01-13):**
- ✅ NEUE Tests: ES6 imports verwenden (`import` statt `require`)
- ⚠️ ALTE Tests: Nicht anfassen (require bleibt bis größeres Refactoring)
- 📦 CI-Fix: `vite-tsconfig-paths` löst Module Resolution

## ⚡ Commands

```bash
pnpm run dev              # Dev server (MCP auto-starts)
pnpm run build            # Production  
pnpm test                 # Vitest
pnpm run lint && pnpm tsc # Validation
```

## 🔧 MCP Organization

**Aktive MCP-Server:**
- **zen**: AI-Assistant Tools (chat, debug, analyze, refactor, etc.)
- **playwright**: Browser Automation & Testing
- **claude-context**: Codebase Indexing & Semantic Search

**Local Development:**
- MCP servers configured in `.mcp.json` (project-scoped)
- Personal settings in `.claude/settings.local.json` (gitignored)
- Start with `pnpm run dev` (MCP auto-configured)

**Test Environment:**
- Zen test server: `~/mcp-servers/zen-test-server/`
- Shared/centralized for integration testing

**Setup für neue Entwickler:**
```bash
git clone <repo>
cd EndgameTrainer
cp .claude/settings.local.example .claude/settings.local.json
pnpm install
pnpm run dev
```

## 📁 Documentation Router

| Zweck | Pfad | Wann laden |
|-------|------|------------|
| **Architektur** | [docs/CORE.md](docs/CORE.md) | IMMER |
| Testing | [docs/guides/testing.md](docs/guides/testing.md) | Bei Test-Tasks |
| WSL2 Env | [docs/guides/wsl2.md](docs/guides/wsl2.md) | Bei Env-Problemen |
| MCP Tools | [docs/tooling/](docs/tooling/) | Bei Tool-Auswahl |

## 🔧 Troubleshooting Quick Reference

### Common Issues
- **vitest unhandled promise rejection** → [Async Patterns](docs/troubleshooting/vitest-async-patterns.md)
- **WSL test command failures** → [WSL2 Environment](docs/guides/wsl2.md#testing-commands)
- **Module resolution errors** → [Testing Guide](docs/guides/testing.md#module-resolution)

## ⛔ IGNORE These Files

```
docs/.archive/*    # Alte Prozess-Notizen
CHANGELOG.md       # Nicht relevant für Code
*.REPORT.md        # Veraltete Analysen
```