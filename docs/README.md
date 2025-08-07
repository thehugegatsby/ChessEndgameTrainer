# EndgameTrainer Documentation

**🎉 Phase 8 Store Refactoring Complete!** This documentation reflects the new domain-specific slices architecture.

This documentation is optimized for LLM consumption and AI-assisted development using Claude Code on WSL/Windows environments.

## 📁 Documentation Structure

```
docs/
├── README.md              # This file - overview and navigation
├── ARCHITECTURE.md        # High-level system architecture
├── CURRENT_FOCUS.md       # Current development priorities
├── STANDARDS.md           # Coding standards and conventions
├── checklists/            # Development checklists
├── patterns/              # Reusable patterns catalog
│   ├── REACT_PATTERNS.md
│   └── ZUSTAND_PATTERNS.md
├── shared/                # Codebase structure documentation
│   ├── README.md
│   ├── services/
│   │   └── tablebase/
│   └── [subdirectories]
├── technical-debt/        # Technical debt tracking
│   └── TODO_TECH_DEBT.md
└── testing/               # Testing strategies
    ├── INTEGRATION_TESTING.md
    └── TESTING_GUIDELINES.md
```

## 🎯 Documentation Purpose

**Target Audience**: LLMs (Claude Code, AI assistants)
**Environment**: WSL + VS Code + Windows
**Focus**: Code comprehension, pattern recognition, architectural understanding

## 🔍 Quick Navigation for LLMs

### Understanding the Codebase

- Start with [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
- Check [CURRENT_FOCUS.md](./CURRENT_FOCUS.md) for active development priorities
- Review [patterns/](./patterns/) for implementation patterns
- See [shared/README.md](./shared/README.md) for codebase structure

### Service Documentation

- TablebaseService.ts - Main tablebase integration (Lichess API)
- MoveStrategyService.ts - Move selection strategies (DTM, DTZ, WDL)
- ErrorService.ts - Centralized error handling with German messages

### Component Patterns

- [shared/components/](./shared/components/) - React component patterns
- [shared/hooks/](./shared/hooks/) - Hook implementation patterns
- [patterns/REACT_PATTERNS.md](./patterns/REACT_PATTERNS.md) - React best practices

### State Management

- [shared/store/](./shared/store/) - Domain-specific slices architecture (Phase 8!)
- [patterns/ZUSTAND_PATTERNS.md](./patterns/ZUSTAND_PATTERNS.md) - State management patterns
- **NEW**: `rootStore.ts` - Combined store with all domain slices
- **NEW**: `slices/` - Individual domain slices (GameSlice, TrainingSlice, etc.)
- **NEW**: `orchestrators/` - Cross-slice operations

## 🏗️ Architecture Principles

1. **Clean Architecture**: Service → Adapter → Provider layers
2. **Single Source of Truth**: Zustand store centralization
3. **Type Safety**: Strict TypeScript implementation
4. **Test Coverage**: Comprehensive testing strategy
5. **Performance**: Optimized evaluation pipeline

## 🔧 Development Context

- **Frontend**: Next.js 15.4.5 (App Router) + React 18.3 + TypeScript 5.9.2
- **Chess Evaluation**: Lichess Tablebase API only (no local engine)
- **State**: Zustand 5.0.7 with Domain-Specific Slices Architecture (Phase 8 Complete!)
- **Testing**: Jest 29.7.0 + React Testing Library 14.2.1 + Playwright (721+ tests passing)
- **Environment**: Node.js 20+ + WSL2 + VS Code + Windows

## 📊 Key Data Flows

1. **Tablebase Evaluation**: Position → TablebaseService → Lichess API → UI
2. **State Management**: User Action → Zustand Store → Components
3. **Move Analysis**: Current Position → Tablebase Lookup → Move Quality Assessment
4. **Training Flow**: User Move → Validation → Tablebase Response → Feedback

## 🎨 Pattern Catalogs

- [React Component Patterns](./patterns/REACT_PATTERNS.md)
- [Zustand State Patterns](./patterns/ZUSTAND_PATTERNS.md)
- Testing Patterns in [testing/TESTING_GUIDELINES.md](./testing/TESTING_GUIDELINES.md)

## 🤖 How to Use This Documentation with an LLM

### Quick Start Recipes

**Adding a New Evaluation Provider:**

1. Read: [ARCHITECTURE.md](./ARCHITECTURE.md) + [patterns/CLEAN_ARCHITECTURE.md](./patterns/CLEAN_ARCHITECTURE.md)
2. Reference: [shared/services/tablebase/](./shared/services/tablebase/) for service patterns
3. Implement: Service → Adapter → Provider layers

**Understanding Data Flow:**

1. Start: [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
2. Focus: TablebaseService.ts for API integration details
3. Debug: Use analysisStatus state field for flow tracking

**Adding New Component:**

1. Read: [shared/components/](./shared/components/) for patterns
2. Reference: [patterns/REACT_PATTERNS.md](./patterns/REACT_PATTERNS.md) (Phase 3)
3. Test: [testing/TESTING_GUIDELINES.md](./testing/TESTING_GUIDELINES.md)

### Context Loading Strategy

**For Architecture Changes:**

```
Provide LLM with:
- ARCHITECTURE.md (system overview)
- TablebaseService.ts (main service implementation)
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
