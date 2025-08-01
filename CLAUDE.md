# ChessEndgameTrainer - AI Context

## Project Goal

A web-based training tool for chess players to master specific endgame scenarios by practicing against optimal moves provided by the Lichess Tablebase API.

## Tech Stack

- **Frontend**: Next.js 15.3.3, React 18.3, TypeScript 5.3.3
- **UI**: Tailwind CSS 3.4.1, Radix UI, react-chessboard 2.1.3
- **State**: Zustand 4.5.0 (Single Source of Truth)
- **Chess**: chess.js 1.0.0-beta.6
- **Evaluation**: Lichess Tablebase API (7-piece endgames)
- **Testing**: Jest 29.7.0, React Testing Library 14.2.1
- **Environment**: Node.js 20+

## Project Structure

- `/pages` → Next.js pages (train/[id].tsx main)
- `/shared/components` → React UI components
- `/shared/hooks` → Business logic hooks
- `/shared/services` → External integrations (TablebaseService)
- `/shared/store` → Zustand state management
- `/shared/lib` → Core libraries
- `/shared/utils` → Utility functions
- `/shared/types` → TypeScript types
- `/tests` → Test suites
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
2. **State Management**: Zustand as Single Source of Truth
3. **Error Handling**: Centralized ErrorService with German user messages
4. **Performance**: LRU cache, debouncing (300ms), request deduplication

## Development Workflow

1. Read current issues in GitHub (not static MD files)
2. Check test coverage before changes
3. Use TypeScript strict mode (no `any`)
4. Follow naming conventions in @docs/STANDARDS.md
5. Update tests when changing functionality
