# EndgameTrainer Documentation

This documentation is optimized for LLM consumption and AI-assisted development using Claude Code on WSL/Windows environments.

## 📁 Documentation Structure

```
docs/
├── README.md                  # This file - overview and navigation
├── ARCHITECTURE.md           # High-level system architecture
├── DATA_FLOWS.md            # Critical data flow mappings
├── shared/                  # Mirror of /shared directory structure
│   ├── components/         # UI component documentation
│   ├── hooks/             # Hook patterns and usage
│   ├── lib/               # Core library documentation
│   ├── services/          # Service layer documentation
│   ├── store/             # State management patterns
│   └── types/             # Type system documentation
├── patterns/              # Reusable patterns catalog
│   ├── CLEAN_ARCHITECTURE.md
│   ├── EVALUATION_PIPELINE.md
│   ├── REACT_PATTERNS.md
│   └── ZUSTAND_PATTERNS.md
└── testing/               # Testing strategies and patterns
    └── TESTING_GUIDELINES.md
```

## 🎯 Documentation Purpose

**Target Audience**: LLMs (Claude Code, AI assistants)
**Environment**: WSL + VS Code + Windows
**Focus**: Code comprehension, pattern recognition, architectural understanding

## 🔍 Quick Navigation for LLMs

### Understanding the Codebase

- Start with [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
- Check [DATA_FLOWS.md](./DATA_FLOWS.md) for evaluation pipeline understanding
- Review [patterns/](./patterns/) for implementation patterns

### Service Documentation

- [shared/services/](./shared/services/) - Service layer patterns
- [shared/services/tablebase/](./shared/services/tablebase/) - Tablebase API integration
- [shared/lib/chess/](./shared/lib/chess/) - Chess utilities and validation

### Component Patterns

- [shared/components/](./shared/components/) - React component patterns
- [shared/hooks/](./shared/hooks/) - Hook implementation patterns
- [patterns/REACT_PATTERNS.md](./patterns/REACT_PATTERNS.md) - React best practices

### State Management

- [shared/store/](./shared/store/) - Zustand store patterns
- [patterns/ZUSTAND_PATTERNS.md](./patterns/ZUSTAND_PATTERNS.md) - State management patterns

## 🏗️ Architecture Principles

1. **Clean Architecture**: Service → Adapter → Provider layers
2. **Single Source of Truth**: Zustand store centralization
3. **Type Safety**: Strict TypeScript implementation
4. **Test Coverage**: Comprehensive testing strategy
5. **Performance**: Optimized evaluation pipeline

## 🔧 Development Context

- **Frontend**: Next.js 15.3.3 (App Router) + React 18.3 + TypeScript 5.3.3
- **Chess Evaluation**: Lichess Tablebase API only (no local engine)
- **State**: Zustand 5.0.7 (with migration complete)
- **Testing**: Jest 29.7.0 + React Testing Library 14.2.1 (577 unit tests) + Playwright (42 E2E tests)
- **Environment**: Node.js 20+ + WSL2 + VS Code + Windows

## 📊 Key Data Flows

1. **Evaluation Pipeline**: Position → Tablebase API → Service → UI
2. **State Management**: User Action → Store → Components
3. **Tablebase Flow**: Service → API Request → WDL Analysis → Display
4. **Move Quality**: WDL Before/After → Smart Evaluation → Quality Indicators

## 🎨 Pattern Catalogs

- [Clean Architecture Implementation](./patterns/CLEAN_ARCHITECTURE.md)
- [Evaluation Pipeline Patterns](./patterns/EVALUATION_PIPELINE.md)
- [React Component Patterns](./patterns/REACT_PATTERNS.md)
- [Zustand State Patterns](./patterns/ZUSTAND_PATTERNS.md)

## 🤖 How to Use This Documentation with an LLM

### Quick Start Recipes

**Adding a New Evaluation Provider:**

1. Read: [ARCHITECTURE.md](./ARCHITECTURE.md) + [patterns/CLEAN_ARCHITECTURE.md](./patterns/CLEAN_ARCHITECTURE.md)
2. Reference: [shared/services/tablebase/](./shared/services/tablebase/) for service patterns
3. Implement: Service → Adapter → Provider layers

**Understanding Data Flow:**

1. Start: [DATA_FLOWS.md](./DATA_FLOWS.md) for complete pipeline
2. Focus: [patterns/EVALUATION_PIPELINE.md](./patterns/EVALUATION_PIPELINE.md) for implementation
3. Debug: Use line numbers and file paths provided

**Adding New Component:**

1. Read: [shared/components/](./shared/components/) for patterns
2. Reference: [patterns/REACT_PATTERNS.md](./patterns/REACT_PATTERNS.md) (Phase 3)
3. Test: [testing/TESTING_GUIDELINES.md](./testing/TESTING_GUIDELINES.md)

### Context Loading Strategy

**For Architecture Changes:**

```
Provide LLM with:
- ARCHITECTURE.md (system overview)
- Specific service documentation from shared/services/
- Relevant pattern from patterns/
```

**For Bug Fixes:**

```
Provide LLM with:
- DATA_FLOWS.md (understand data flow)
- Specific component/service documentation
- TESTING_GUIDELINES.md for test patterns
```

**For New Features:**

```
Provide LLM with:
- ARCHITECTURE.md + patterns/CLEAN_ARCHITECTURE.md
- Relevant service documentation
- Component patterns from shared/components/
```

---

**Note**: This documentation follows LLM-optimized patterns for maximum AI comprehension and code navigation assistance.
