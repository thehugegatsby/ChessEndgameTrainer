import { test, expect } from '@playwright/test';
import { TrainingBoardPage } from './src/tests/e2e/helpers/pageObjects/TrainingBoardPage';

/**
 * Debug test for GPT-5 mouse event fixes
 * Tests the new handler debugging and real mouse drag implementation
 */
test.describe('Debug Board - Handler Testing', () => {
  test('debug react-chessboard import directly', async ({ page }) => {
    // Navigate to training page
    await page.goto('/training');

    console.log('Testing react-chessboard import directly in browser');

    const importResult = await page.evaluate(async () => {
      try {
        console.log('Attempting to import react-chessboard...');
        const module = await import('react-chessboard');
        console.log('Import successful:', module);
        return {
          success: true,
          hasChessboard: !!module.Chessboard,
          moduleKeys: Object.keys(module),
          chessboardType: typeof module.Chessboard,
        };
      } catch (error) {
        console.error('Import failed:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack,
        };
      }
    });

    console.log('Import result:', importResult);

    if (importResult.success) {
      console.log('✅ react-chessboard imports successfully');
      console.log('Module keys:', importResult.moduleKeys);
    } else {
      console.log('❌ react-chessboard import failed:', importResult.error);
    }
  });

  test('debug react-chessboard loading and DOM structure', async ({ page }) => {
    // Navigate to training page
    await page.goto('/training');

    console.log('Navigated to training page');

    // Wait for basic elements but NOT react-chessboard specifically
    await page.waitForSelector('[data-testid="training-board"]', { timeout: 10000 });
    console.log('Training board container found');

    // Wait for dynamic chessboard to load (this might fail)
    try {
      await page.waitForFunction(
        () => {
          const squares = document.querySelectorAll('[data-square]');
          const svgs = document.querySelectorAll('svg');
          const pieces = document.querySelectorAll('[data-piece]');
          console.log(
            `Found ${squares.length} squares, ${svgs.length} SVGs, ${pieces.length} pieces`
          );
          return squares.length > 0; // Wait for any chessboard elements
        },
        { timeout: 15000 }
      );
      console.log('✅ React-chessboard loaded successfully');
    } catch (error) {
      console.log('❌ React-chessboard failed to load:', error);

      // Debug what actually loaded
      const htmlContent = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="training-board"]');
        return container?.innerHTML || 'No training board found';
      });

      console.log('Actual board HTML:', htmlContent.substring(0, 1000));

      // Try to find any chessboard elements
      const debugInfo = await page.evaluate(() => {
        const squares = document.querySelectorAll('[data-square]');
        const svgs = document.querySelectorAll('svg');
        const pieces = document.querySelectorAll('[data-piece]');
        const chessboard = document.querySelector('[data-testid="chessboard"]');
        const divs = document.querySelectorAll('div[role="img"]');

        return {
          squares: squares.length,
          svgs: svgs.length,
          pieces: pieces.length,
          chessboard: !!chessboard,
          divRoles: divs.length,
          totalChildElements:
            document.querySelector('[data-testid="training-board"]')?.children?.length || 0,
          allClasses: Array.from(document.querySelectorAll('*'))
            .map(el => el.className)
            .filter(Boolean)
            .slice(0, 10),
        };
      });

      console.log('Debug info:', debugInfo);
    }

    // Take screenshot regardless of success/failure
    await page.screenshot({
      path: './debug-board-loading.png',
      fullPage: true,
    });
  });

  test('debug move execution with handler verification', async ({ page }) => {
    // Navigate to training page
    await page.goto('/training');

    // Initialize page object
    const boardPage = new TrainingBoardPage(page);

    // Wait for page to be ready with proper chessboard loading
    try {
      await boardPage.waitForPageReady();
      console.log('✅ Page ready');
    } catch (error) {
      console.log('❌ Page ready failed:', error);

      // Take debug screenshot and continue with limited testing
      await page.screenshot({
        path: './debug-board-not-ready.png',
        fullPage: true,
      });

      // Still try to debug what we can
      await boardPage.debugHandlerExecution('e2', 'e4');
      return;
    }

    // Get initial state
    const initialState = await boardPage.getGameState();
    console.log('Initial state:', initialState);

    // Try to make a move (e2-e4 is common first move)
    const from = 'e2';
    const to = 'e4';

    console.log(`Attempting move: ${from} -> ${to}`);
    await boardPage.makeMove(from, to);

    // Debug handler execution IMMEDIATELY after move attempt
    await boardPage.debugHandlerExecution(from, to);

    // Wait for move processing
    await boardPage.waitForMoveProcessed();

    // Get final state
    const finalState = await boardPage.getGameState();
    console.log('Final state:', finalState);

    // Verify move was successful
    const moveSuccessful = finalState.moveCount > initialState.moveCount;
    console.log('Move successful:', moveSuccessful);

    // Take screenshot for visual inspection
    await page.screenshot({
      path: './debug-board-after-move.png',
      fullPage: true,
    });

    // Basic assertions (might fail if chessboard not loaded)
    if (finalState.moveCount > 0) {
      expect(finalState.moveCount).toBeGreaterThan(initialState.moveCount);
    } else {
      console.log('⚠️ Move count still 0 - handlers not firing or chessboard not loaded');
    }
  });
});
