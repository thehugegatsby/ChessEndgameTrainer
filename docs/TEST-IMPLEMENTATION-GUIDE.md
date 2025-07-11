# Test Implementation Guide

## Quick Start

### 1. Writing Your First Test

```typescript
import { test, expect } from '../fixtures/test-fixtures';
import { TrainingPage } from '../pages/TrainingPage';
import { PositionFactory } from '../factories/PositionFactory';

test('user completes endgame training', async ({ page, testApi }) => {
  // Setup test data
  const position = await testApi.createPosition(
    PositionFactory.createEndgame({
      name: 'Basic King and Pawn'
    })
  );
  
  // Navigate and interact
  const trainingPage = new TrainingPage(page);
  await trainingPage.navigate();
  await trainingPage.selectPosition(position.id);
  
  // Play moves
  await trainingPage.chessBoard.makeMove({ from: 'e2', to: 'e4' });
  
  // Assert outcome
  const state = await testApi.getGameState();
  expect(state.fen).toContain('e4');
});
```

### 2. Creating a New Page Object

```typescript
// pages/AnalysisPage.ts
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ChessBoardComponent } from '../components/ChessBoardComponent';

export class AnalysisPage extends BasePage {
  public readonly chessBoard: ChessBoardComponent;
  
  constructor(page: Page) {
    super(page);
    this.chessBoard = new ChessBoardComponent(page);
  }
  
  async navigate(): Promise<void> {
    await this.page.goto('/analysis');
    await this.waitForPageLoad();
  }
  
  async importPGN(pgn: string): Promise<void> {
    await this.page.click('[data-testid="import-button"]');
    await this.page.fill('[data-testid="pgn-input"]', pgn);
    await this.page.click('[data-testid="confirm-import"]');
  }
  
  async getEvaluation(): Promise<string> {
    return await this.page.textContent('[data-testid="evaluation"]');
  }
}
```

### 3. Using Test Factories

```typescript
test('multiple users share position', async ({ testApi }) => {
  // Create test users
  const users = [
    UserFactory.create({ displayName: 'Alice' }),
    UserFactory.create({ displayName: 'Bob' })
  ];
  
  // Create shared position
  const position = PositionFactory.createEndgame({
    difficulty: 'advanced',
    sharedWith: users.map(u => u.uid)
  });
  
  // Test sharing functionality
  for (const user of users) {
    await testApi.authenticateAs(user);
    const positions = await testApi.getUserPositions();
    expect(positions).toContainEqual(expect.objectContaining({
      id: position.id
    }));
  }
});
```

## Common Test Scenarios

### 1. Authentication Flow

```typescript
test.describe('Authentication', () => {
  test('new user registration', async ({ page, testApi }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    const newUser = UserFactory.create();
    await authPage.register(newUser);
    
    // Verify user created
    const dbUser = await testApi.getUser(newUser.email);
    expect(dbUser).toBeDefined();
    expect(dbUser.displayName).toBe(newUser.displayName);
  });
  
  test('login with existing user', async ({ page, testApi, testUser }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    await authPage.login(testUser.email, 'password123');
    
    // Verify logged in
    await expect(page.locator('[data-testid="user-menu"]')).toContainText(testUser.displayName);
  });
});
```

### 2. Chess Game Interaction

```typescript
test.describe('Chess Gameplay', () => {
  test('complete chess game', async ({ page, testApi }) => {
    const trainingPage = new TrainingPage(page);
    await trainingPage.navigate();
    
    // Setup position
    await testApi.setGameState({
      fen: '8/8/8/8/4K3/8/5k2/8 w - - 0 1',
      turn: 'white'
    });
    
    // Play winning sequence
    const moves = [
      { from: 'e4', to: 'd5' },
      { from: 'f2', to: 'e3' },
      { from: 'd5', to: 'c6' }
    ];
    
    for (const move of moves) {
      await trainingPage.chessBoard.makeMove(move);
      await trainingPage.waitForEngineResponse();
    }
    
    // Verify game state
    const finalState = await testApi.getGameState();
    expect(finalState.isCheckmate).toBe(true);
  });
});
```

### 3. Error Handling

```typescript
test.describe('Error Scenarios', () => {
  test('handles network failures gracefully', async ({ page }) => {
    const trainingPage = new TrainingPage(page);
    const faultInjector = new FaultInjector(page);
    
    // Inject network failure
    await faultInjector.inject({
      type: 'network-error',
      target: /api\/engine/,
      probability: 1
    });
    
    await trainingPage.navigate();
    await trainingPage.chessBoard.makeMove({ from: 'e2', to: 'e4' });
    
    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeEnabled();
    
    // Clear fault and retry
    await faultInjector.clear();
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });
});
```

### 4. Visual Regression

```typescript
test.describe('Visual Consistency', () => {
  test('chess board appearance', async ({ page }) => {
    const visualTester = new VisualTester(page);
    const trainingPage = new TrainingPage(page);
    
    await trainingPage.navigate();
    
    // Test different states
    await visualTester.snapshot({
      name: 'board-initial-position',
      fullPage: false,
      clip: await trainingPage.chessBoard.getBoundingBox()
    });
    
    // After move
    await trainingPage.chessBoard.makeMove({ from: 'e2', to: 'e4' });
    await visualTester.snapshot({
      name: 'board-after-e4',
      maxDiffPixels: 100
    });
    
    // Highlighted squares
    await trainingPage.chessBoard.highlightSquares(['d5', 'f5']);
    await visualTester.snapshot({
      name: 'board-with-highlights'
    });
  });
});
```

### 5. Performance Testing

```typescript
test.describe('Performance', () => {
  test('page load performance', async ({ page }) => {
    const perfTester = new PerformanceTester(page);
    
    const metrics = await perfTester.measurePageLoad('/train/1');
    
    // Assert performance budgets
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.fcp).toBeLessThan(1500); // FCP < 1.5s
    expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
    
    // Generate report
    const report = await perfTester.generateReport();
    console.log(report);
  });
  
  test('chess move performance', async ({ page }) => {
    const perfTester = new PerformanceTester(page);
    const trainingPage = new TrainingPage(page);
    
    await trainingPage.navigate();
    
    // Measure move performance
    const moveDuration = await perfTester.measureAction('chess-move', async () => {
      await trainingPage.chessBoard.makeMove({ from: 'e2', to: 'e4' });
    });
    
    expect(moveDuration).toBeLessThan(100); // Move completes in < 100ms
  });
});
```

### 6. Accessibility Testing

```typescript
test.describe('Accessibility', () => {
  test('chess board accessibility', async ({ page }) => {
    const a11yTester = new A11yTester(page);
    const trainingPage = new TrainingPage(page);
    
    await trainingPage.navigate();
    
    // Check entire page
    await a11yTester.runCommonTests();
    
    // Check keyboard navigation
    await a11yTester.checkKeyboardNavigation([
      '[data-testid="chess-board"]',
      '[data-testid="move-history"]',
      '[data-testid="game-controls"]'
    ]);
    
    // Check specific WCAG criteria
    await a11yTester.check({
      includedImpacts: ['critical', 'serious'],
      rules: {
        'color-contrast': { enabled: true },
        'focus-visible': { enabled: true }
      }
    });
  });
});
```

### 7. Data-Driven Testing

```typescript
const endgameScenarios = [
  { name: 'K+P vs K', fen: '8/8/8/8/4K3/8/4P3/4k3 w - - 0 1', expectedMoves: 8 },
  { name: 'K+R vs K', fen: '8/8/8/8/4K3/8/4R3/4k3 w - - 0 1', expectedMoves: 16 },
  { name: 'K+Q vs K', fen: '8/8/8/8/4K3/8/4Q3/4k3 w - - 0 1', expectedMoves: 10 }
];

endgameScenarios.forEach(scenario => {
  test(`solves ${scenario.name} endgame`, async ({ page, testApi }) => {
    const trainingPage = new TrainingPage(page);
    
    // Setup position
    await testApi.setGameState({
      fen: scenario.fen,
      turn: 'white'
    });
    
    await trainingPage.navigate();
    await trainingPage.solveWithEngine();
    
    // Verify solution
    const moveCount = await trainingPage.getMoveCount();
    expect(moveCount).toBeLessThanOrEqual(scenario.expectedMoves);
  });
});
```

### 8. Chaos Testing

```typescript
test.describe('Resilience', () => {
  test('survives chaos monkey', async ({ page, testApi }) => {
    const chaos = new ChaosMonkey(page);
    const trainingPage = new TrainingPage(page);
    
    // Start chaos
    chaos.start({
      faults: [
        { type: 'network-error', probability: 0.1 },
        { type: 'timeout', probability: 0.05, duration: 1000 },
        { type: 'data-corruption', probability: 0.02 }
      ],
      intervalMs: 500,
      maxSimultaneous: 2
    });
    
    // Try to complete training session
    await trainingPage.navigate();
    
    let completed = false;
    for (let i = 0; i < 10; i++) {
      try {
        await trainingPage.chessBoard.makeMove({ from: 'e2', to: 'e4' });
        await trainingPage.waitForEngineResponse();
        completed = true;
        break;
      } catch (error) {
        // Retry on failure
        await page.reload();
      }
    }
    
    expect(completed).toBe(true);
    await chaos.stop();
  });
});
```

## Advanced Patterns

### 1. Custom Fixtures

```typescript
// fixtures/game-fixtures.ts
export const gameTest = test.extend<{
  gameWithPosition: { game: ChessGame; position: EndgamePosition };
}>({
  gameWithPosition: async ({ testApi }, use) => {
    // Setup
    const position = await testApi.createPosition(
      PositionFactory.createEndgame()
    );
    const game = new ChessGame();
    game.loadFEN(position.fen);
    
    // Use in test
    await use({ game, position });
    
    // Cleanup
    await testApi.deletePosition(position.id);
  }
});

// Usage
gameTest('analyze position', async ({ gameWithPosition, page }) => {
  const { game, position } = gameWithPosition;
  // Test implementation
});
```

### 2. Test Helpers

```typescript
// helpers/chess-helpers.ts
export async function playMoveSequence(
  page: TrainingPage,
  moves: string[]
): Promise<void> {
  for (const move of moves) {
    const [from, to] = move.split('-');
    await page.chessBoard.makeMove({ from, to });
    await page.waitForEngineResponse();
  }
}

export async function verifyBoardPosition(
  page: TrainingPage,
  expectedPosition: Record<string, string>
): Promise<void> {
  for (const [square, piece] of Object.entries(expectedPosition)) {
    const actualPiece = await page.chessBoard.getPieceAt(square);
    expect(actualPiece).toBe(piece);
  }
}
```

### 3. Test Utilities

```typescript
// utils/test-utils.ts
export class TestUtils {
  static async waitForCondition(
    fn: () => Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await fn()) return;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Condition not met within timeout');
  }
  
  static async retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries reached');
  }
}
```

### 4. Test Tags Usage

```typescript
// Tagged test suite
taggedDescribe('Premium Features', [TestTags.PREMIUM, TestTags.P1], () => {
  taggedTest('advanced analysis', [TestTags.SLOW], async ({ page }) => {
    // Premium feature test
  });
  
  conditionalTest('beta feature', {
    environment: 'staging',
    tags: [TestTags.BETA]
  }, async ({ page }) => {
    // Beta feature test
  });
});

// Run specific tags
// npx playwright test --grep "@smoke"
// npx playwright test --grep "@p0|@p1"
// npx playwright test --grep-invert "@slow"
```

## Best Practices Checklist

### Before Writing Tests
- [ ] Check if similar test already exists
- [ ] Review existing Page Objects
- [ ] Plan test data requirements
- [ ] Consider visual/a11y/performance aspects
- [ ] Define success criteria

### During Test Implementation
- [ ] Use Page Objects for all interactions
- [ ] Use factories for test data
- [ ] Add meaningful test descriptions
- [ ] Handle async operations properly
- [ ] Clean up test data

### After Writing Tests
- [ ] Run tests locally
- [ ] Check for flakiness (run 10x)
- [ ] Add appropriate tags
- [ ] Update documentation
- [ ] Review with team

## Debugging Tips

### 1. Use Playwright Inspector
```bash
# Debug specific test
npx playwright test --debug tests/e2e/chess/board.spec.ts

# Use UI mode
npx playwright test --ui
```

### 2. Add Test Steps
```typescript
test('complex flow', async ({ page }) => {
  await test.step('Setup game', async () => {
    // Setup code
  });
  
  await test.step('Play opening', async () => {
    // Opening moves
  });
  
  await test.step('Verify position', async () => {
    // Assertions
  });
});
```

### 3. Capture Debug Info
```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // Capture additional debug info
    const gameState = await page.evaluate(() => window.gameState);
    await testInfo.attach('game-state', {
      body: JSON.stringify(gameState, null, 2),
      contentType: 'application/json'
    });
  }
});
```

## Common Pitfalls

### 1. Not Using Page Objects
```typescript
// ❌ Bad
await page.click('.chess-square[data-square="e2"]');

// ✅ Good
await trainingPage.chessBoard.makeMove({ from: 'e2', to: 'e4' });
```

### 2. Hardcoded Wait Times
```typescript
// ❌ Bad
await page.waitForTimeout(3000);

// ✅ Good
await trainingPage.waitForEngineResponse();
```

### 3. Assertions in Page Objects
```typescript
// ❌ Bad (in Page Object)
async verifyMoveValid(move: Move) {
  expect(await this.isValidMove(move)).toBe(true);
}

// ✅ Good (in test)
const isValid = await page.isValidMove(move);
expect(isValid).toBe(true);
```

### 4. Not Cleaning Up
```typescript
// ❌ Bad
test('creates data', async ({ testApi }) => {
  await testApi.createUser(userData);
  // Test ends without cleanup
});

// ✅ Good
test('creates data', async ({ testApi }) => {
  const user = await testApi.createUser(userData);
  // Test logic
  await testApi.deleteUser(user.id);
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://martinfowler.com/bliki/PageObject.html)
- [Test Data Builders](https://www.natpryce.com/articles/000714.html)
- [Visual Testing Best Practices](https://applitools.com/blog/visual-testing-best-practices/)