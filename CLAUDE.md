# CLAUDE.md

**Chess Endgame Trainer** - React 19, TypeScript, Zustand, Next.js 15 | WSL2 Linux | 288kB Bundle

## 🎯 Core Instructions

**IMMER ZUERST:** → [docs/CORE.md](docs/CORE.md) lesen (Architektur, Zustand, Services)

**WSL2 Critical:**
- ❌ `pnpm test -- file.test.tsx` → ✅ `pnpm test file.test.tsx`
- ❌ `cmd | grep` → ✅ `cmd && cmd2`

**Code Standards:**
- Neue Tests in Vitest | Keine `any` Types | UI-Errors auf Deutsch | `@shared/` imports

**Test Migration Strategy (2025-01-13):**
- ✅ NEUE Tests: ES6 imports verwenden (`import` statt `require`)
- ⚠️ ALTE Tests: Nicht anfassen (require bleibt bis größeres Refactoring)
- 📦 CI-Fix: `vite-tsconfig-paths` löst Module Resolution

## ⚡ Commands

```bash
pnpm run dev       # Dev server
pnpm run build     # Production  
pnpm test          # Vitest
pnpm run lint && pnpm tsc  # Validation
```

## 📁 Documentation Router

| Zweck | Pfad | Wann laden |
|-------|------|------------|
| **Architektur** | [docs/CORE.md](docs/CORE.md) | IMMER |
| Testing | [docs/guides/testing.md](docs/guides/testing.md) | Bei Test-Tasks |
| WSL2 Env | [docs/guides/wsl2.md](docs/guides/wsl2.md) | Bei Env-Problemen |
| MCP Tools | [docs/tooling/](docs/tooling/) | Bei Tool-Auswahl |

## ⛔ IGNORE These Files

```
docs/.archive/*    # Alte Prozess-Notizen
CHANGELOG.md       # Nicht relevant für Code
*.REPORT.md        # Veraltete Analysen
```