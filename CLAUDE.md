# CLAUDE.md

<!-- nav: root | tags: [main, guide] | updated: 2025-08-13 -->

## 🎯 Projekt & Tech Stack

**Chess Endgame Trainer** - Modernes Trainingstool für Schach-Endspiele

**Tech Stack:** React 19, TypeScript, Zustand, Next.js 15, Tailwind CSS  
**Entwicklung:** 100% LLM-entwickelt | **Platform:** WSL2 Linux | **Bundle:** 288kB

## 🚧 Aktueller Fokus & Prioritäten

- **Jest→Vitest Migration:** ~25% abgeschlossen - **neue Tests NUR in Vitest**
- **Feature Architecture:** ✅ Komplett (Strangler Fig Pattern erfolgreich)
- **Bundle Optimierung:** 288kB halten bei neuen Features

**Details:** → [TEST_MIGRATION_STATUS.md](TEST_MIGRATION_STATUS.md) | [MERGE.md](MERGE.md)

## 🤖 LLM Golden Rules

**KRITISCH für WSL2:**
- ❌ `pnpm test -- --run file.test.tsx` (crashes)
- ❌ `pnpm build | grep error` (pipes crash)
- ✅ `pnpm test file.test.tsx` (direct paths)
- ✅ `pnpm run lint && pnpm tsc` (use && not |)

**Code Quality:**
- Tests sind Pflicht (neue Tests in Vitest)
- Keine `any` Types - strikte TypeScript Typisierung
- Error messages auf Deutsch für UI
- Imports: `@shared/` alias, nie relative Pfade

**Mehr:** → [docs/WSL2_ENV.md](docs/WSL2_ENV.md) | [config/linting/eslint.config.js](config/linting/eslint.config.js)

## ⚡ Core Commands

```bash
pnpm run dev       # Development server
pnpm run build     # Production build  
pnpm test          # Unit tests (Vitest)
pnpm run lint      # ESLint + format
pnpm tsc           # TypeScript check
```

**Validation Workflow:**
```bash
pnpm run lint && pnpm tsc && pnpm test
```

**Alle Commands:** → [docs/README.md](docs/README.md) | [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)

## 🔧 MCP Tools & Architecture

**Quick Reference:**
- **Bug/Debug:** `mcp__zen__debug`
- **Code Review:** `mcp__zen__codereview` 
- **Refactoring:** `mcp__zen__refactor`
- **Tests:** `mcp__zen__testgen`
- **Browser E2E:** `mcp__playwright__*`
- **Documentation:** `mcp__ref__ref_search_documentation`

**Architecture:** → [docs/SYSTEM_GUIDE.md](docs/SYSTEM_GUIDE.md) | [docs/tooling/mcp-overview.md](docs/tooling/mcp-overview.md)

---

_Für aktuelle Arbeitsnotizen: siehe [SCRATCHPAD.md](SCRATCHPAD.md)_