# E2E Test Framework Documentation

This directory contains a generic E2E testing framework for chess move sequences, designed to make it easy to test complex chess scenarios with various expectations.

## Overview

The framework consists of three main parts:

1. **SequenceRunner** (`helpers/sequenceRunner.ts`) - Core execution engine
2. **Scenario Definitions** (`scenarios/`) - Test scenario configurations
3. **Test Files** (`scenarios/*.spec.ts`) - Playwright test implementations

## Quick Start

### Basic Usage

```typescript
import { test } from '@playwright/test';
import { SequenceRunner, expectation } from '../helpers/sequenceRunner';

test('My chess scenario', async ({ page }) => {
  const runner = new SequenceRunner(page);

  await runner.executeSequence({
    name: 'Basic Checkmate',
    moves: ['Qd1-h5', 'Ng8-f6', 'Qh5-f7#'],
    expectations: [expectation.successToast('Checkmate!', 2)],
  });
});
```

### Using Predefined Scenarios

```typescript
import { promotionScenarios } from './promotionScenarios';

test('Promotion test', async ({ page }) => {
  const runner = new SequenceRunner(page);
  await runner.executeSequence(promotionScenarios.promotionToWin);
});
```

## Architecture

### SequenceRunner Class

The main class that executes move sequences and verifies expectations.

**Key Methods:**

- `executeSequence(config)` - Run a complete test scenario
- `getStoreState()` - Get current Zustand store state for debugging
- `getGameState()` - Get current chess game state for debugging

### Expectation Types

The framework supports 5 types of expectations:

1. **Toast** - Verify toast messages appear
2. **Evaluation** - Verify chess position evaluations (TODO)
3. **Modal** - Verify modal open/close state
4. **Store** - Verify Zustand store state changes
5. **Completion** - Verify training completion status

### Helper Functions

Use the `expectation` object to create common expectations:

```typescript
import { expectation } from '../helpers/sequenceRunner';

const expectations = [
  expectation.successToast('Great move!', 0), // After 1st move
  expectation.errorToast('Invalid move', 2), // After 3rd move
  expectation.storeState('training.isSuccess', true), // At end
  expectation.trainingSuccess(), // At end
  expectation.modalOpen('completion'), // At end
  expectation.modalClosed(5), // After 6th move
];
```

## Configuration Interface

### SequenceConfig

```typescript
interface SequenceConfig {
  name: string; // Human-readable test name
  description?: string; // Detailed description
  moves: string[]; // Chess moves in coordinate notation
  expectations: Expectation[]; // What to verify
  setup?: {
    startFen?: string; // Custom starting position
    mockTablebase?: boolean; // Mock API for winning positions
  };
}
```

### Expectation Interface

```typescript
interface Expectation {
  type: 'toast' | 'evaluation' | 'modal' | 'store' | 'completion';
  moveIndex?: number; // When to check (0-indexed, undefined = end)
  data: {
    // Toast expectations
    message?: string; // Text to find (partial match)
    toastType?: 'success' | 'error' | 'info' | 'warning';

    // Store expectations
    storePath?: string; // Dot notation (e.g., 'training.isSuccess')
    expectedValue?: unknown; // Expected value

    // Modal expectations
    modalType?: string; // Modal identifier
    modalOpen?: boolean; // Open (true) or closed (false)

    // Completion expectations
    isSuccess?: boolean; // Training success state
    completionStatus?: string; // Completion status string

    // General
    timeout?: number; // Custom timeout (default: 5000ms)
  };
}
```

## Move Notation

Use coordinate notation for moves:

- **Regular moves**: `"e2-e4"`, `"Ng1-f3"`, `"Qd1-h5"`
- **Promotion**: `"e7-e8=Q"`, `"a7-a8=R"`, `"h2-h1=N"`
- **Castling**: `"e1-g1"` (kingside), `"e1-c1"` (queenside)

## Examples

### Simple Toast Test

```typescript
{
  name: "Success Message Test",
  moves: ["e2-e4"],
  expectations: [
    expectation.successToast("Good opening!", 0)
  ]
}
```

### Complex Multi-Expectation Test

```typescript
{
  name: "Promotion with Multiple Checks",
  moves: ["e6-d6", "e8-f7", "d6-d7", "f7-f8", "e5-e6", "f8-g8", "e6-e7", "g8-f7", "e7-e8=Q"],
  expectations: [
    expectation.successToast("Good move!", 0),              // After Kd6
    expectation.storeState("game.turn", "b", 0),           // Black's turn after Kd6
    expectation.successToast("Promotion!", 8),             // After e8=Q
    expectation.trainingSuccess(),                         // Training completes
    expectation.modalOpen("completion")                    // Completion modal opens
  ],
  setup: {
    startFen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    mockTablebase: true
  }
}
```

### Store State Testing

```typescript
// Check nested store properties
expectation.storeState('ui.currentModal', 'completion');
expectation.storeState('training.isSuccess', true);
expectation.storeState('game.moveHistory.length', 5);

// Check array contents
expectation.storeState('ui.toasts.0.type', 'success');
```

## Debugging

### Debug Failed Tests

```typescript
test('Debug test', async ({ page }) => {
  const runner = new SequenceRunner(page);

  try {
    await runner.executeSequence(myScenario);
  } catch (error) {
    // Get current state for debugging
    const storeState = await runner.getStoreState();
    const gameState = await runner.getGameState();

    console.log('Store toasts:', storeState.ui?.toasts);
    console.log('Training state:', storeState.training);
    console.log('Current position:', gameState.fen);

    throw error; // Re-throw to fail test
  }
});
```

### Console Output

The framework provides detailed console output:

```
🎯 Executing sequence: Pawn Promotion Auto-Win
📋 Description: King and pawn endgame where promotion leads to automatic win detection
🏁 Playing 9 moves...
Making move 1/9: e6-d6
Making move 2/9: e8-f7
...
🔍 Checking expectation after move 9: toast
✅ Toast expectation met: Umwandlung (success)
✅ Sequence "Pawn Promotion Auto-Win" completed successfully
```

## File Structure

```
tests/e2e/
├── README.md                           # This documentation
├── core/                               # Core E2E tests
│   ├── simple-chess-v5.spec.ts        # React-chessboard v5 testing (click-to-move)
│   ├── pawn-promotion.spec.ts          # Pawn promotion testing
│   ├── error-recovery.spec.ts          # Error dialog and recovery testing
│   └── smoke-workflow.spec.ts          # Basic workflow testing
├── domains/                            # Feature-specific tests
│   ├── weiterspielen-bug-proof.spec.ts # "Weiterspielen" feature tests
│   ├── weiterspielen-feature.spec.ts   # "Weiterspielen" feature tests
│   └── weiterspielen-simple-test.spec.ts # "Weiterspielen" simple tests
├── helpers/                            # Test utilities
│   ├── DebugHelper.ts                  # Debug utilities
│   └── moveHelpers.ts                  # Move execution helpers
├── page-objects/                       # Page object models
│   ├── ChessboardPage.ts               # Chessboard interactions
│   └── TrainingPage.ts                 # Training page interactions
└── config/                             # Test configuration
    └── TestConfig.ts                   # Test constants and settings
```

Note: SimpleChessTest component is now located at `src/app/simple-chess-test/page.tsx`

## Creating New Scenarios

### Step 1: Define Your Scenario

Create a new file in `scenarios/` (e.g., `endgameScenarios.ts`):

```typescript
import { SequenceConfig, expectation } from '../helpers/sequenceRunner';

export const basicCheckmate: SequenceConfig = {
  name: 'Basic Back Rank Mate',
  description: 'Tests recognition of back rank checkmate patterns',
  moves: [
    'Ra1-a8',
    'Kb8-c7',
    'Ra8-a7', // Checkmate sequence
  ],
  expectations: [expectation.successToast('Checkmate!', 2), expectation.modalOpen('completion')],
};

export const endgameScenarios = {
  basicCheckmate,
};
```

### Step 2: Create Test File

Create a corresponding test file (e.g., `endgameTests.spec.ts`):

```typescript
import { test } from '@playwright/test';
import { SequenceRunner } from '../helpers/sequenceRunner';
import { endgameScenarios } from './endgameScenarios';

test.describe('Endgame Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/train/1');
    await page.waitForSelector('[data-testid="training-board"]');
    await page.waitForFunction(() => typeof (window as any).e2e_makeMove === 'function');
  });

  test('Basic checkmate recognition', async ({ page }) => {
    const runner = new SequenceRunner(page);
    await runner.executeSequence(endgameScenarios.basicCheckmate);
  });
});
```

## Best Practices

### 1. Naming Conventions

- **Scenarios**: Use descriptive camelCase names (`promotionToWin`, `basicCheckmate`)
- **Test descriptions**: Use clear, specific descriptions
- **Move comments**: Add chess notation comments for clarity

### 2. Expectation Timing

- Use `moveIndex` for immediate feedback expectations
- Use final expectations (no `moveIndex`) for end-of-sequence checks
- Allow adequate timeouts for complex UI updates

### 3. react-chessboard v5 Migration & Testing

#### Click-to-Move for E2E Tests

With react-chessboard v5, **click-to-move** is the recommended approach for E2E testing instead of drag-and-drop:

```typescript
// ✅ Recommended: Click-to-move (v5 native support)
await page.click('[data-square="e6"]');  // Select piece
await page.click('[data-square="f6"]');  // Move to target

// ❌ Avoid: Drag-and-drop (unreliable in E2E tests)
await page.locator('[data-square="e6"]').dragTo('[data-square="f6"]');
```

**Why click-to-move is better for E2E:**
- ✅ Native react-chessboard v5 support via `onSquareClick`
- ✅ More reliable than drag-and-drop in automated tests
- ✅ Tests actual user interaction patterns
- ✅ No timing issues with drag gestures

#### Implementation Example

**Component Setup:**
```typescript
// Add onSquareClick handler to your Chessboard component
<Chessboard
  options={{
    position: gamePosition,
    onPieceDrop: onPieceDrop,        // Keep for drag support
    onSquareClick: onSquareClick,    // Add for click-to-move
    allowDragging: true,
    id: 'chess-board'
  }}
/>
```

**Handler Implementation:**
```typescript
const onSquareClick = useCallback(({ square }: { square: string }) => {
  if (selectedSquare === null) {
    setSelectedSquare(square);  // First click: select
  } else if (selectedSquare === square) {
    setSelectedSquare(null);    // Same square: deselect
  } else {
    // Second click: attempt move
    const move = chess.move({ from: selectedSquare, to: square });
    if (move) {
      updatePosition();
      setSelectedSquare(null);
    } else {
      setSelectedSquare(square); // Invalid move: select new square
    }
  }
}, [selectedSquare, chess]);
```

**E2E Test Pattern:**
```typescript
test('Multi-move sequence with click-to-move', async ({ page }) => {
  // Navigate and wait for board
  await page.goto('/simple-chess-test');
  await page.waitForSelector('[data-testid="chess-board"]');
  
  // Execute move sequence: Kf6, Kf8, Kg6
  const moves = [
    { from: 'e6', to: 'f6', desc: 'Kf6' },
    { from: 'e8', to: 'f8', desc: 'Kf8' }, 
    { from: 'f6', to: 'g6', desc: 'Kg6' }
  ];
  
  for (const move of moves) {
    console.log(`🔄 ${move.desc} (${move.from}→${move.to})`);
    await page.click(`[data-square="${move.from}"]`);
    await page.waitForTimeout(200);
    await page.click(`[data-square="${move.to}"]`);
    await page.waitForTimeout(500);
    
    // Verify FEN change
    const newFen = await page.getAttribute('[data-testid="chess-board"]', 'data-fen');
    expect(newFen).not.toBe(previousFen);
  }
});
```

#### v5 API Changes Summary

Key changes from react-chessboard v4 to v5 affecting E2E tests:

- **New**: `onSquareClick` handler for click-to-move support
- **Changed**: `onPieceDrop` signature now includes `piece` object parameter
- **Removed**: Built-in promotion dialogs (handle externally)
- **Renamed**: Various props simplified (e.g., `arePiecesDraggable` → `allowDragging`)

For complete migration details, see: https://github.com/clariity/react-chessboard/blob/main/docs/G_UpgradeToV5.mdx

### 4. Debugging Tips

- Start with simple scenarios and build complexity gradually
- Use console output to understand execution flow
- Add debug expectations to verify intermediate state
- Use `getStoreState()` and `getGameState()` for troubleshooting

### 4. Test Organization

- Group related scenarios in the same file
- Use descriptive test names that match scenario names
- Include setup/teardown for consistent test environment

## Common Patterns

### Testing Error Conditions

```typescript
{
  name: "Invalid Move Test",
  moves: ["e2-e5"], // Invalid move
  expectations: [
    expectation.errorToast("Invalid move", 0)
  ]
}
```

### Testing State Transitions

```typescript
{
  name: "Turn Management",
  moves: ["e2-e4", "e7-e5"],
  expectations: [
    expectation.storeState("game.turn", "b", 0), // Black's turn after e4
    expectation.storeState("game.turn", "w", 1)  // White's turn after e5
  ]
}
```

### Testing UI Interactions

```typescript
{
  name: "Modal Workflow",
  moves: ["checkmate-sequence"],
  expectations: [
    expectation.modalOpen("completion", 2),      // Modal opens
    expectation.storeState("ui.currentModal", "completion"), // Verified in store
    expectation.trainingSuccess()                // Training marked complete
  ]
}
```

This framework makes it easy to create comprehensive, maintainable E2E tests for complex chess scenarios. The declarative configuration approach keeps tests readable while the powerful expectation system ensures thorough verification of application behavior.
