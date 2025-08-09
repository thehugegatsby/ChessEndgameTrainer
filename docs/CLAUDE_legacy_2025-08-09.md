# ChessEndgameTrainer - AI Working Memory

**Version:** 1.0.0  
**Last Updated:** 2025-01-09  
**Status:** ✅ Active Development

## Core Commands

```bash
npm run dev              # Development server (port 3002)
npm run build            # Production build
npm run lint             # ESLint + format
npm run analyze-code     # Code analysis
npm test                 # Jest test runner (ISSUE: needs config fix)
```

## Tech Stack (Current)

- **Framework:** Next.js 15.4.5 (App Router)
- **Language:** TypeScript 5.9.2
- **State:** Zustand 5.0.7 (domain-specific slices)
- **UI:** Tailwind CSS 4.1.11, Radix UI, react-chessboard 2.1.3
- **Chess:** chess.js 1.0.0-beta.6
- **Testing:** Jest 29.7.0 (config broken - no tests found)
- **API:** Lichess Tablebase (no local engine)

## Project Architecture

### Directory Structure

```
src/
├── app/              # Next.js App Router pages
├── shared/
│   ├── components/   # React UI components
│   ├── hooks/        # Business logic hooks
│   ├── services/     # External integrations
│   ├── store/        # Zustand state (domain slices)
│   │   ├── slices/   # gameSlice, trainingSlice, tablebaseSlice, uiSlice
│   │   └── orchestrators/ # Cross-slice operations
│   ├── types/        # TypeScript definitions
│   └── utils/        # Utility functions
```

### Active Zustand Slices

- `gameSlice.ts` - Chess game state, moves, position
- `trainingSlice.ts` - Training sessions, progress
- `tablebaseSlice.ts` - Lichess API evaluations
- `uiSlice.ts` - Interface state, modals, toasts

### Data Flow

User → React Component → Zustand Hook → Store Action → Service (ChessService/TablebaseService) → API → Store Update → UI Re-render

## Current Issues (CRITICAL)

1. **Test System Broken**: `npm test` shows "No tests found" despite claims of 721+ tests
2. **Architecture Drift**: Documentation claims don't match actual code
3. **Config Issues**: Jest configuration likely pointing to wrong paths

## Coding Conventions

- **State Management**: All business state in Zustand slices, no component state for shared data
- **File Naming**: PascalCase.tsx for components, camelCase.ts for utilities
- **Imports**: Use absolute paths with `@shared/` alias
- **API Calls**: Only through services (TablebaseService, ChessService)
- **Error Handling**: Use ErrorService for user messages (German)

## Key Services

- **ChessService**: Singleton managing chess.js instance, move validation
- **TablebaseService**: Lichess tablebase integration with caching
- **ErrorService**: Centralized error handling with German messages
- **Logger**: Logging service (avoid console.log)

## Critical Files

- `src/shared/store/rootStore.ts` - Main store configuration
- `src/shared/services/ChessService.ts` - Chess logic singleton
- `src/shared/services/TablebaseService.ts` - API integration
- `src/shared/store/orchestrators/handlePlayerMove/` - Main move logic (533 lines)

## Current Focus

**Goal**: Documentation restructuring for Claude Code optimization
**Status**: In progress - creating lean AI-focused documentation
**Next**: Fix test configuration to match actual codebase

## Archive & Deep Docs

For historical context and detailed explanations:

- `docs/ARCHITECTURE.md` - Detailed system design
- `docs/CURRENT_FOCUS.md` - Historical development phases
- `docs/STANDARDS.md` - Detailed coding standards
- `CHANGELOG.md` - Version history
- `UNIFIED_FIXTURE_PROPOSAL.md` - Test structure proposal

## Verification Commands

```bash
# Check architecture claims
find src -name "*.ts" | wc -l                    # TypeScript file count
find src/shared/store/slices -name "*.ts" | wc -l # Slice count
npm list --depth=0 | grep -E "(next|typescript|zustand)" # Version check
npm test 2>&1 | head -10                          # Test status
```

---

_This document is optimized for Claude Code AI consumption. For human-readable docs, see README.md_
