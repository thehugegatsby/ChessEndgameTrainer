# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation restructuring with INDEX.md for better navigation
- Path validation for Worker security to prevent path traversal attacks
- Comprehensive FEN validation system to prevent XSS vulnerabilities
- Firestore database migration infrastructure for cloud storage support
- Enhanced UI layout with improved spacing and visual hierarchy
- Modular ScenarioEngine components with performance optimizations

### Changed
- Refactored evaluationHelpers.ts into focused, modular components
- Split ScenarioEngine into smaller, more maintainable modules
- Updated sidebar width for better desktop experience (w-[22rem])

### Fixed
- Resolved infinite loop issue in TrainingBoardZustand component
- Fixed Lichess analysis URL to include complete move history
- Restored move evaluation symbols with comprehensive test coverage
- Fixed React production build errors (React not defined)

### Removed
- Obsolete StockfishEngine classes that were no longer in use
- Unused scripts from the scripts directory

### Security
- Implemented comprehensive FEN string validation and sanitization
- Added Worker path validation to prevent directory traversal
- Enhanced input validation across all user-facing components

## [1.0.0] - 2025-07-08

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

For a complete list of changes, please refer to the [git commit history](https://github.com/YOUR_USERNAME/ChessEndgameTrainer/commits/main).