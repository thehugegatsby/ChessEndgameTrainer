# Chess Endgame Trainer 🎯

Modern chess endgame training with perfect Lichess tablebase analysis. Single-LLM experimental project for systematic endgame learning.

**Tech Stack**: React 19, TypeScript, Zustand, Next.js 15, Tailwind CSS | WSL2 Linux  
**📅 Last Updated:** 2025-08-18 - Store Architecture 100% Clean

## 🚀 Pipeline Modernization (2025-08-16)

✅ **Modernized GitHub Actions with Reusable Workflows**
- Vitest sharding for 40% faster test execution
- Vercel prebuilt deployments for zero rebuild time
- Environment protection with manual approval gates
- Unified CI/CD architecture with DRY principles

## ⚡ Quick Start

```bash
pnpm run dev              # Dev server (http://localhost:3002)
pnpm run build            # Production build
pnpm test                 # Run tests
pnpm run lint && pnpm tsc # Validation
```

## 🏗️ Architecture Overview

Zustand orchestrators manage training flow, Lichess Tablebase API provides perfect move analysis, React components display interactive chess board. Domain-specific slices (Game, Training, Tablebase, UI) with cross-slice orchestrators for complex operations.

## 📁 Key Directories

- `src/shared/store/orchestrators/` - Training logic and cross-slice operations
- `src/shared/services/` - API integrations (TablebaseService, ChessService)
- `src/shared/components/` - React UI components (Chessboard, Training)
- `src/tests/` - Feature-based testing (unit + E2E)
- `docs/` - Essential documentation (CORE.md, complex flows)

## 🎯 Key Design Decisions

**Tablebase-Only Strategy** (2025-08-10): External Lichess API instead of local chess engine for perfect endgame analysis. Simpler state management, always optimal moves.

**Zustand Domain Slices** (2025-08-18): Complete slice-based architecture using `/shared/store/slices/types.ts` - no legacy interfaces remain. 100% consistent store with domain-focused slices (Game, Training, Tablebase, UI).

**LLM-Only Development** (2025-08-16): Single Claude developer workflow, documentation optimized for AI context rather than human teams.

**WSL2 Testing Strategy** (2025-08-15): Feature-based test routing with performance guards and auto-detection for optimal CI/CD integration.

## 📋 Essential Documentation

**Core Architecture**: [`docs/CORE.md`](docs/CORE.md) - System overview and patterns  
**Complex Flows**: [`docs/orchestrators/handlePlayerMove/TABLEBASE_DATA_FLOW.md`](docs/orchestrators/handlePlayerMove/TABLEBASE_DATA_FLOW.md) - API integration details
