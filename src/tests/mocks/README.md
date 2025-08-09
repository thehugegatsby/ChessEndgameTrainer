# Mock Factory System Documentation

## Overview

The Mock Factory System provides a centralized, type-safe approach to creating and managing test mocks in the EndgameTrainer codebase. It solves common testing problems like memory leaks, inconsistent mocking, and state pollution between tests.

## Architecture

```
MockManager (Singleton)
    ├── ChessServiceMockFactory
    ├── TablebaseServiceMockFactory
    ├── ZustandStoreMockFactory
    └── MSWServerMockFactory
```

## Quick Start

### Basic Usage

```typescript
import { mockManager } from "@tests/mocks/MockManager";

describe("MyComponent", () => {
  let chessService;
  let store;

  beforeEach(() => {
    // Create fresh mocks for each test
    chessService = mockManager.chessService.create();
    store = mockManager.zustandStore.create();
  });

  it("should handle move", () => {
    // Use the mocked service
    chessService.move.mockReturnValue({ san: "e4" });

    // Test your component
    expect(chessService.move).toHaveBeenCalled();
  });
});
```

### With Custom Overrides

```typescript
beforeEach(() => {
  // Create mock with specific behavior
  chessService = mockManager.chessService.create({
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    validMoves: ["e5", "d5", "Nf6"],
    isGameOver: false,
  });
});
```

## Mock Factories

### ChessServiceMockFactory

Mocks the chess game logic service.

```typescript
const chessService = mockManager.chessService.create({
  fen: "starting position",
  moveHistory: [],
  validMoves: ["e4", "d4"],
  moveResults: new Map([["e2-e4", { san: "e4", from: "e2", to: "e4" }]]),
});

// Helper methods
mockManager.chessService.setupPosition("CHECKMATE_POSITION");
mockManager.chessService.simulateMoves(["e4", "e5", "Nf3"]);
```

### TablebaseServiceMockFactory

Mocks the Lichess tablebase API service.

```typescript
const tablebaseService = mockManager.tablebaseService.create({
  shouldFail: false,
  responseDelay: 100, // Simulate network latency
  positionResults: new Map([
    ["fen1", { category: "win", dtm: 5 }],
    ["fen2", { category: "draw", dtm: 0 }],
  ]),
});

// Helper methods
mockManager.tablebaseService.setupWinningPosition(fen, dtm);
mockManager.tablebaseService.setupDrawingPosition(fen);
mockManager.tablebaseService.simulateOutage();
```

### ZustandStoreMockFactory

Creates isolated Zustand store instances for testing.

```typescript
const { store, getState, setState } = mockManager.zustandStore.create({
  game: {
    currentFen: "custom fen",
    moveHistory: [],
  },
  training: {
    isPlayerTurn: true,
    mistakeCount: 0,
  },
});

// Helper methods
mockManager.zustandStore.updateSlice("game", { isGameFinished: true });
const gameState = mockManager.zustandStore.getSliceState("game");
await mockManager.zustandStore.waitForStateUpdate();
```

### MSWServerMockFactory

Manages Mock Service Worker for API mocking.

```typescript
const mswServer = mockManager.mswServer.create({
  handlers: [
    rest.get("/api/endpoint", (req, res, ctx) => {
      return res(ctx.json({ data: "mocked" }));
    }),
  ],
});

// Helper methods
mockManager.mswServer.mockTablebaseSuccess(fen, result);
mockManager.mswServer.mockTablebaseError(500, "Server error");
mockManager.mswServer.mockNetworkTimeout("/api/endpoint", 5000);
mockManager.mswServer.mockRateLimit();
```

## Testing Patterns

### Unit Tests

Isolate components by mocking all dependencies:

```typescript
describe("useGameLogic Hook", () => {
  beforeEach(() => {
    const chessService = mockManager.chessService.create({
      validMoves: ["e4"],
      isGameOver: false,
    });

    const store = mockManager.zustandStore.create({
      game: { currentFen: "starting position" },
    });
  });

  it("validates moves correctly", () => {
    // Test with fully mocked dependencies
  });
});
```

### Integration Tests

Use real implementations internally, mock external boundaries:

```typescript
describe("GameBoard Integration", () => {
  beforeEach(() => {
    // Only mock external API calls
    mockManager.mswServer.create();
    mockManager.mswServer.mockTablebaseSuccess(fen, result);

    // Let internal services work together
  });

  it("displays tablebase evaluation", async () => {
    // Test with real store and chess service
  });
});
```

### Full Environment Tests

Create a complete mock environment:

```typescript
beforeEach(() => {
  const env = mockManager.createFullEnvironment({
    chessService: { isGameOver: false },
    zustandStore: { game: { currentFen: "test position" } },
  });

  // Use env.chessService, env.store, etc.
});
```

## Automatic Cleanup

The mock system automatically cleans up after each test via `global-test-cleanup.ts`:

- Resets all mock instances
- Clears mock function calls
- Removes event listeners
- Resets store state
- Closes MSW server connections

No manual cleanup needed in test files!

## Debugging

### Enable Debug Mode

```bash
DEBUG_MOCKS=true npm test
```

This will:

- Log cleanup verification after each test
- Show active mock instances
- Report any cleanup issues

### Check Active Mocks

```typescript
if (mockManager.hasActiveMocks()) {
  console.log("Active mocks:", mockManager.getActiveMockNames());
}
```

## Best Practices

1. **Always create mocks in beforeEach**: Ensures test isolation
2. **Use type-safe overrides**: Let TypeScript catch mock mismatches
3. **Prefer helper methods**: Use `setupPosition()` instead of manual mock configuration
4. **Mock at the right level**: Unit tests mock everything, integration tests mock boundaries
5. **Don't cleanup manually**: The system handles it automatically

## Migration Guide

### Old Pattern

```typescript
// Manual mock with potential leaks
jest.mock("@shared/services/ChessService");
const mockChessService = {
  move: jest.fn(),
  // ... manual mock setup
};

afterEach(() => {
  // Easy to forget cleanup
  jest.clearAllMocks();
});
```

### New Pattern

```typescript
// Automatic, type-safe mocking
import { mockManager } from "@tests/mocks/MockManager";

beforeEach(() => {
  const chessService = mockManager.chessService.create();
  // Cleanup happens automatically!
});
```

## Troubleshooting

### "Mock has not been created"

- Ensure you call `.create()` in `beforeEach`, not in the test body
- Check that you're not accessing the mock before creation

### State pollution between tests

- Verify `global-test-cleanup.ts` is in `setupFilesAfterEnv`
- Check for any manual mock creation outside the factory system

### Memory leaks still occurring

- Look for event listeners not using the mock factories
- Check for timers created outside mock control
- Enable `DEBUG_MOCKS=true` to identify cleanup issues

## Contributing

When adding new services to mock:

1. Create a new factory extending `BaseMockFactory`
2. Add it to `MockManager`
3. Implement `_createDefaultMock()` with sensible defaults
4. Add helper methods for common scenarios
5. Document usage patterns in this README
