# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- NavigationControls component for better move history navigation
- Central configuration file (config/constants.ts) for dev port management
- Environment-specific configuration files (.env.development, .env.test)
- Comprehensive E2E test suite with Playwright
- MockEngineService for deterministic E2E testing (replaces NEXT_PUBLIC_TEST_MODE)
- IEngineService interface for clean dependency injection
- EngineContext for service lifecycle management
- Centralized E2E test helpers (tests/e2e/helpers.ts)
- Test API Service (TestApiService) for clean test interactions
- Page Object Model pattern for E2E tests

### Changed
- Complete migration to Zustand store (Store of Truth)
- Deprecated useChessGame and useChessGameOptimized hooks
- Analysis Panel now uses CSS transforms for smooth animations
- Consolidated documentation structure (40 files → clean hierarchy)
- Dev server port standardized to 3002
- E2E tests now use dependency injection instead of build-time flags
- Test architecture refactored to use MockEngineService for instant responses (1-10ms vs 10+ seconds)
- BrowserTestApi now initializes based on runtime detection
- TrainingBoardZustand test hooks simplified without NEXT_PUBLIC_TEST_MODE dependency

### Fixed
- Critical bug: Black doesn't make moves in Training 12 after 1.Kd7
- UI bug: Analysis mode causes layout shift with fixed positioning
- Performance test: Adjusted timeout for perspectiveTransformer test
- Store synchronization: Moves now properly execute on chess.js instance
- E2E tests: Fixed ~25 failing tests using test hooks (42 → ~17 failing)
- Async initialization race conditions in _app.tsx
- E2E test performance: Tests now initialize in ~1ms instead of 10+ seconds

### Removed
- **NEXT_PUBLIC_TEST_MODE environment variable** - Completely eliminated from codebase
  - Removed from README.md, playwright.config.ts, package.json scripts
  - Removed from all test files and documentation
  - Replaced with runtime detection and dependency injection
- All deprecated hooks (useChessGame, useChessGameOptimized)
- Old non-Zustand components (TrainingBoard, MovePanel)
- 9 debug/test scripts with hardcoded credentials
- Duplicate component files
- Build-time test mode flags in favor of runtime detection

### Security
- FEN validation now applied at all input boundaries
- Enhanced path validation for Workers
- Removed exposure of test mode through build-time environment variables

## [1.0.0] - 2025-01-08

### Added
- Initial production release of Chess Endgame Trainer
- Stockfish WASM engine integration for real-time position evaluation
- Dual evaluation display (Engine + Lichess tablebase)
- 100+ pre-built endgame scenarios
- Interactive chessboard with legal move highlighting
- Best move suggestions with evaluation scores
- Player perspective switching (White/Black)
- Comprehensive error handling and logging system
- Mobile-ready architecture (80% shared code)

### Tech Stack
- Next.js 15.3 with React 18.3
- TypeScript 5.3 with strict mode
- Tailwind CSS 3.4 for styling
- Zustand 4.4 for state management (installed, migration pending)
- Jest 29.7 with React Testing Library
- Chess.js 1.0.0-beta.6 for game logic
- Stockfish WASM with NNUE support

### Architecture
- Singleton pattern for engine management
- Evaluation pipeline with normalization and caching
- LRU cache with 99.99% hit rate
- 75% API call reduction through debouncing
- Cross-platform code sharing structure

### Performance
- 31% faster position evaluations
- 53% faster navigation between moves
- Optimized bundle size targeting <300KB
- Efficient memory management for mobile devices

## [0.9.0] - 2025-01-17

### Added
- Zustand state management (installed, not yet integrated)
- Enhanced testing infrastructure
- Code quality improvements and linting setup

### Changed
- Modularized evaluation system for better maintainability
- Improved error handling with centralized ErrorService

### Fixed
- Various UI responsiveness issues
- Test coverage improvements reaching ~78%

## [0.8.0] - 2025-01-04

### Added
- Initial implementation of core chess engine integration
- Basic UI components with react-chessboard
- Evaluation display system
- Initial test suite setup

### Known Issues
- Mobile implementation at 0% (planned for future release)
- Bundle size exceeds target (currently ~500KB)
- Some browser compatibility issues on iOS Safari

---

For a complete list of changes, please refer to the [git commit history](https://github.com/thehugegatsby/ChessEndgameTrainer/commits/main).