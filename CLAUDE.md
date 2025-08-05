# ChessEndgameTrainer - AI Context

## Project Goal

A web-based training tool for chess players to master specific endgame scenarios by practicing against optimal moves provided by the Lichess Tablebase API.

## Tech Stack

- **Frontend**: Next.js 15.4.5, React 18.3, TypeScript 5.9.2
- **UI**: Tailwind CSS 4.1.11 (CSS-first config), Radix UI, react-chessboard 2.1.3
- **State**: Zustand 5.0.7 (Domain-Specific Slices Architecture)
- **Chess**: chess.js 1.0.0-beta.6
- **Backend**: Firebase 12.0.0 (Firestore, Auth)
- **Evaluation**: Lichess Tablebase API (7-piece endgames)
- **Testing**: Jest 29.7.0, React Testing Library 14.2.1
- **Environment**: Node.js 20+, PM2 process manager

## Project Structure

- `/pages` → Next.js pages (train/[id].tsx main)
- `/shared/components` → React UI components
- `/shared/hooks` → Business logic hooks
- `/shared/services` → External integrations (TablebaseService)
- `/shared/store` → Zustand state management (refactored to domain slices)
  - `/slices` → Domain-specific slices (Game, Training, Progress, UI, etc.)
  - `/orchestrators` → Cross-slice operations
  - `rootStore.ts` → Combined store with all slices
- `/shared/lib` → Core libraries
- `/shared/utils` → Utility functions
- `/shared/types` → TypeScript types
- `/tests` → Test suites (100% passing, 721+ tests)
- `/public` → Static assets

## Core Commands

```bash
npm run dev              # Dev server (port 3002)
npm test                 # Run tests
npm run lint            # ESLint
npm run build           # Production build
npm run analyze-code    # Run all code analysis
```

## Architecture Overview

@docs/ARCHITECTURE.md

## Coding Standards

@docs/STANDARDS.md

## Current Development Focus

@docs/CURRENT_FOCUS.md

## Important Notes

- **NO Chess Engine** - Only Tablebase API (removed Stockfish)
- **Clean Cut Migration** - All "engine" references renamed to "tablebase"
- **Simplified State** - analysisStatus replaces engineStatus + isEngineThinking
- **FEN Validation** - Always validate FEN before API calls or state updates

## Key Architecture Decisions

1. **Tablebase-Only**: No local chess engine, rely on Lichess API
2. **State Management**: Zustand with Domain-Specific Slices (Phase 8 Complete)
3. **Error Handling**: Centralized ErrorService with German user messages
4. **Performance**: LRU cache, debouncing (300ms), request deduplication
5. **Type Safety**: Branded types (ValidatedMove) with controlled factories

## Development Workflow

1. Read current issues in GitHub (not static MD files)
2. Check test coverage before changes
3. Use TypeScript strict mode (no `any`)
4. Follow naming conventions in @docs/STANDARDS.md
5. Update tests when changing functionality

## AI Programming Guidelines

### Before Making Changes

1. **Check** for `@deprecated` markers in code
2. **Keep** functions under 50 lines (extract helpers if needed)
3. **Use** Logger service, not console.log
4. **Avoid** `any` types - use proper TypeScript interfaces
5. **Follow** domain-slice architecture patterns
6. **Use** appropriate store hooks:
   - `useXxxState()` for reactive state
   - `useXxxActions()` for action-only components (no re-renders!)
   - `useXxxStore()` for [state, actions] tuple

### Critical Files to Understand

- `/shared/services/TablebaseService.ts` - Core service pattern
- `/shared/store/slices/types.ts` - All slice type definitions
- `/shared/store/rootStore.ts` - Combined store architecture
- `/shared/services/ErrorService.ts` - Error handling pattern
- `/shared/services/AnalysisService.ts` - Service composition example
- `/tests/helpers/validatedMoveFactory.ts` - Branded type test utilities
- `/shared/store/hooks/README.md` - NEW: State/Action hook pattern documentation

### Technical Debt Status (Phase 9 Complete!)

- ✅ **Store Refactoring**: Monolithic store.ts (1,298 lines) → domain slices ✅
- ✅ **Type Safety**: All TypeScript errors resolved (0 compilation errors) ✅
- ✅ **Test Coverage**: All 721+ tests passing ✅
- ✅ **Branded Types**: Clean ValidatedMove implementation ✅
- ✅ **Performance**: State/Action hook split prevents unnecessary re-renders ✅
- [ ] **Complex Functions**: `handlePlayerMove` (178 lines) still needs refactoring
- [ ] **Mixed Concerns**: Some components have E2E test code mixed in
- ✅ **TODOs**: All TODO comments resolved

### Best Practices for AI

- Always add JSDoc to exported functions
- Include usage examples in comments
- Follow existing patterns in the codebase
- Test your changes with `npm test`
- Check types with `npm run type-check`
