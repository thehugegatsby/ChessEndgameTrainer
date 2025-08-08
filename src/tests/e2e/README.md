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
import { test } from "@playwright/test";
import { SequenceRunner, expectation } from "../helpers/sequenceRunner";

test("My chess scenario", async ({ page }) => {
  const runner = new SequenceRunner(page);

  await runner.executeSequence({
    name: "Basic Checkmate",
    moves: ["Qd1-h5", "Ng8-f6", "Qh5-f7#"],
    expectations: [expectation.successToast("Checkmate!", 2)],
  });
});
```

### Using Predefined Scenarios

```typescript
import { promotionScenarios } from "./promotionScenarios";

test("Promotion test", async ({ page }) => {
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
import { expectation } from "../helpers/sequenceRunner";

const expectations = [
  expectation.successToast("Great move!", 0), // After 1st move
  expectation.errorToast("Invalid move", 2), // After 3rd move
  expectation.storeState("training.isSuccess", true), // At end
  expectation.trainingSuccess(), // At end
  expectation.modalOpen("completion"), // At end
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
  type: "toast" | "evaluation" | "modal" | "store" | "completion";
  moveIndex?: number; // When to check (0-indexed, undefined = end)
  data: {
    // Toast expectations
    message?: string; // Text to find (partial match)
    toastType?: "success" | "error" | "info" | "warning";

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
expectation.storeState("ui.currentModal", "completion");
expectation.storeState("training.isSuccess", true);
expectation.storeState("game.moveHistory.length", 5);

// Check array contents
expectation.storeState("ui.toasts.0.type", "success");
```

## Debugging

### Debug Failed Tests

```typescript
test("Debug test", async ({ page }) => {
  const runner = new SequenceRunner(page);

  try {
    await runner.executeSequence(myScenario);
  } catch (error) {
    // Get current state for debugging
    const storeState = await runner.getStoreState();
    const gameState = await runner.getGameState();

    console.log("Store toasts:", storeState.ui?.toasts);
    console.log("Training state:", storeState.training);
    console.log("Current position:", gameState.fen);

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
├── helpers/
│   └── sequenceRunner.ts              # Core framework
├── scenarios/
│   ├── promotionScenarios.ts          # Promotion test scenarios
│   └── genericScenarioTest.spec.ts    # Example test implementation
└── domains/                           # Legacy individual tests
    └── pawn-promotion.spec.ts         # Original promotion test
```

## Creating New Scenarios

### Step 1: Define Your Scenario

Create a new file in `scenarios/` (e.g., `endgameScenarios.ts`):

```typescript
import { SequenceConfig, expectation } from "../helpers/sequenceRunner";

export const basicCheckmate: SequenceConfig = {
  name: "Basic Back Rank Mate",
  description: "Tests recognition of back rank checkmate patterns",
  moves: [
    "Ra1-a8",
    "Kb8-c7",
    "Ra8-a7", // Checkmate sequence
  ],
  expectations: [
    expectation.successToast("Checkmate!", 2),
    expectation.modalOpen("completion"),
  ],
};

export const endgameScenarios = {
  basicCheckmate,
};
```

### Step 2: Create Test File

Create a corresponding test file (e.g., `endgameTests.spec.ts`):

```typescript
import { test } from "@playwright/test";
import { SequenceRunner } from "../helpers/sequenceRunner";
import { endgameScenarios } from "./endgameScenarios";

test.describe("Endgame Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/train/1");
    await page.waitForSelector('[data-testid="training-board"]');
    await page.waitForFunction(
      () => typeof (window as any).e2e_makeMove === "function",
    );
  });

  test("Basic checkmate recognition", async ({ page }) => {
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

### 3. Debugging Tips

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
