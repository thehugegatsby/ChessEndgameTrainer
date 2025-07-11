# E2E Test Architecture

## Overview
The E2E test suite uses a clean Component Object Model architecture with ModernDriver as the lean orchestrator (442 lines).

## Core Components

### 1. ModernDriver (442 lines)
- **Role**: Lean orchestrator and facade
- **Responsibilities**: Component initialization, test lifecycle management
- **Key Features**: Built-in Test Bridge support, enhanced error handling with timing

### 2. UI Components
- **BoardComponent**: Chess board interactions (moves, piece locations)
- **MoveListComponent** (614 lines): Move history navigation and display
- **EvaluationPanel**: Engine evaluation and analysis display
- **NavigationControls**: Game navigation (first/last/prev/next)

### 3. Helper Services
- **GamePlayer**: Move execution and validation
- **ValidationHelper** (328 lines): Comprehensive chess rule validation
- **PuzzleSolver**: Automated puzzle solving logic
- **EngineAnalyzer**: Engine analysis and evaluation
- **TestBridgeWrapper**: Mock engine for deterministic testing

## Architecture Principles

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Delegation Pattern**: ModernDriver delegates to specialized components
3. **No Circular Dependencies**: Clean module boundaries
4. **Lazy Initialization**: Components created on-demand
5. **Error Context**: Custom error types with detailed context

## Best Practices

1. **Test Structure**:
   ```typescript
   const driver = new ModernDriver(page, { useTestBridge: true });
   await driver.visit('/train/1');
   await driver.makeMove('e2', 'e4');
   const state = await driver.getGameState();
   ```

2. **Component Access**:
   - Direct: `driver.board.getPosition()`
   - Orchestrated: `driver.makeMove()` (uses multiple components)

3. **Error Handling**: All errors include context for debugging

## Migration History
The architecture was successfully migrated from the monolithic AppDriver (1,889 lines) to the current component-based model in January 2025. This resulted in a 76% code reduction while maintaining all features.

For historical context, see: `docs/archive/2025-01-moderndriver-migration/`