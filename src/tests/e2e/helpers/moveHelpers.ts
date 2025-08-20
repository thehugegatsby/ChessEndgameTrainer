/**
 * E2E Test Helpers for Chess Move Operations
 *
 * Provides reliable state-based waiting for moves instead of fixed timeouts.
 * Uses the application's e2e_getGameState() and e2e_makeMove() APIs for robust testing.
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 *
 */
type GameState = {
  fen: string;
  moveCount: number;
  turn: "w" | "b";
  pgn: string;
  isGameOver: boolean;
  lastMove?: {
    from: string;
    to: string;
    san: string;
  };
};

/**
 *
 */
type MoveOptions = {
  expectedFen?: string;
  timeout?: number;
  allowRejection?: boolean; // If true, doesn't throw on move error dialog
};

/**
 * Waits for the E2E test API to be available
 * @param page Playwright page object
 * @param timeout Maximum wait time in ms
 */
async function waitForTestApi(
  page: Page,
  timeout: number = 10000,
): Promise<void> {
  console.log("Waiting for window.__testApi to be available...");
  await page.waitForFunction(
    () => {
      // Debug logging in browser context
      if (typeof (window as any).__testApi === "undefined") {
        console.log("DEBUG: window.__testApi is undefined");
        return false;
      }
      
      const testApi = (window as any).__testApi;
      const hasRequiredMethods = (
        typeof testApi.makeMove === "function" &&
        typeof testApi.setTurnState === "function" &&
        typeof testApi.getGameState === "function"
      );
      
      console.log("DEBUG: window.__testApi available, hasRequiredMethods:", hasRequiredMethods);
      return hasRequiredMethods;
    },
    {},
    { timeout, polling: 100 },
  );
  console.log("window.__testApi is now available.");
}

/**
 * Performs a move using the direct API without validation (bypasses turn checks)
 * @param page Playwright page object
 * @param move Move in standard notation (e.g., "e2-e4" or "Nf3")
 * @param options Configuration options
 * @returns Promise resolving when move is confirmed or rejecting on error
 */
export async function performMoveWithoutValidation(
  page: Page,
  move: string,
  options: MoveOptions = {},
): Promise<{ success: boolean; finalState: GameState; errorMessage?: string }> {
  const { expectedFen, timeout = 5000, allowRejection = false } = options;
  const errorSelector = '[data-testid="move-error-dialog"]';

  // 0. Wait for test API to be available
  try {
    await waitForTestApi(page, 10000);
  } catch (error) {
    throw new Error(
      "E2E test API not available - TrainingBoard component may not have mounted yet",
    );
  }

  // 1. Get initial state before the move
  const initialState = (await page.evaluate(() =>
    (window as any).e2e_getGameState(),
  )) as GameState;
  if (!initialState || typeof initialState.moveCount !== "number") {
    throw new Error("Could not get initial game state from e2e_getGameState()");
  }

  // 2. Perform the move using the direct API (bypasses validation)
  const moveResult = await page.evaluate(async (moveString) => {
    return await (window as any).__testApi.makeMove(moveString);
  }, move);

  console.log(`[E2E] Direct move ${move} API result:`, moveResult);

  // 2a. Check if API rejected the move immediately (API-level failures)
  if (moveResult && moveResult.success === false) {
    const finalState = (await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    )) as GameState;

    return {
      success: false,
      finalState,
      errorMessage: `Direct API rejected move: ${moveResult.error || "Unknown error"}`,
    };
  }

  // 3. Wait for either success or failure condition
  const successCondition = page.waitForFunction(
    ({ initial, expected }) => {
      const state = (window as any).e2e_getGameState();
      if (!state) return false;

      // If FEN is provided, it's the source of truth
      if (expected) {
        return state.fen === expected;
      }

      // Otherwise, check for move count increment
      return state.moveCount > initial.moveCount;
    },
    { initial: initialState, expected: expectedFen },
    { polling: 100, timeout },
  );

  const failureCondition = page
    .waitForSelector(errorSelector, {
      state: "visible",
      timeout: Math.min(timeout, 2000), // Error dialogs should appear quickly
    })
    .catch(() => null); // Don't throw if no error dialog appears

  try {
    await Promise.race([successCondition, failureCondition]);

    // Check if error dialog appeared
    const errorElement = page.locator(errorSelector);
    const hasError = await errorElement.isVisible();

    if (hasError) {
      const errorText = await errorElement.textContent();
      const errorMessage = `Direct move rejected: "${errorText}"`;

      if (!allowRejection) {
        throw new Error(errorMessage);
      }

      return {
        success: false,
        finalState: await page.evaluate(() =>
          (window as any).e2e_getGameState(),
        ),
        errorMessage,
      };
    }

    // Success case - get final state
    const finalState = (await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    )) as GameState;

    // Validate expected FEN if provided
    if (expectedFen && finalState.fen !== expectedFen) {
      throw new Error(
        `Expected FEN "${expectedFen}" but got "${finalState.fen}"`,
      );
    }

    console.log(
      `[E2E] Direct move ${move} completed successfully. Move count: ${initialState.moveCount} → ${finalState.moveCount}`,
    );

    return {
      success: true,
      finalState,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
      throw new Error(
        `Timeout: Direct move "${move}" did not complete within ${timeout}ms. Initial state: ${initialState.fen}`,
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Performs a move using the e2e_makeMove API and waits for state confirmation
 * @param page Playwright page object
 * @param move Move in standard notation (e.g., "e2-e4" or "Nf3")
 * @param options Configuration options
 * @returns Promise resolving when move is confirmed or rejecting on error
 */
export async function performMoveAndWait(
  page: Page,
  move: string,
  options: MoveOptions = {},
): Promise<{ success: boolean; finalState: GameState; errorMessage?: string }> {
  const { expectedFen, timeout = 5000, allowRejection = false } = options;
  const errorSelector = '[data-testid="move-error-dialog"]';

  // 0. Wait for test API to be available
  try {
    await waitForTestApi(page, 10000);
  } catch (error) {
    throw new Error(
      "E2E test API not available - TrainingBoard component may not have mounted yet",
    );
  }

  // 1. Get initial state before the move
  const initialState = (await page.evaluate(() =>
    (window as any).e2e_getGameState(),
  )) as GameState;
  if (!initialState || typeof initialState.moveCount !== "number") {
    throw new Error("Could not get initial game state from e2e_getGameState()");
  }

  // 2. Perform the move using the API
  const moveResult = await page.evaluate(async (moveString) => {
    return await (window as any).e2e_makeMove(moveString);
  }, move);

  console.log(`[E2E] Move ${move} API result:`, moveResult);

  // 2a. Check if API rejected the move immediately (API-level failures)
  if (moveResult && moveResult.success === false) {
    const finalState = (await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    )) as GameState;

    return {
      success: false,
      finalState,
      errorMessage: `API rejected move: ${moveResult.error || "Unknown error"}`,
    };
  }

  // 3. Wait for either success or failure condition
  const successCondition = page.waitForFunction(
    ({ initial, expected }) => {
      const state = (window as any).e2e_getGameState();
      if (!state) return false;

      // If FEN is provided, it's the source of truth
      if (expected) {
        return state.fen === expected;
      }

      // Otherwise, check for move count increment
      return state.moveCount > initial.moveCount;
    },
    { initial: initialState, expected: expectedFen },
    { polling: 100, timeout },
  );

  const failureCondition = page
    .waitForSelector(errorSelector, {
      state: "visible",
      timeout: Math.min(timeout, 2000), // Error dialogs should appear quickly
    })
    .catch(() => null); // Don't throw if no error dialog appears

  try {
    await Promise.race([successCondition, failureCondition]);

    // Check if error dialog appeared
    const errorElement = page.locator(errorSelector);
    const hasError = await errorElement.isVisible();

    if (hasError) {
      const errorText = await errorElement.textContent();
      const errorMessage = `Move rejected: "${errorText}"`;

      if (!allowRejection) {
        throw new Error(errorMessage);
      }

      return {
        success: false,
        finalState: await page.evaluate(() =>
          (window as any).e2e_getGameState(),
        ),
        errorMessage,
      };
    }

    // Success case - get final state
    const finalState = (await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    )) as GameState;

    // Validate expected FEN if provided
    if (expectedFen && finalState.fen !== expectedFen) {
      throw new Error(
        `Expected FEN "${expectedFen}" but got "${finalState.fen}"`,
      );
    }

    console.log(
      `[E2E] Move ${move} completed successfully. Move count: ${initialState.moveCount} → ${finalState.moveCount}`,
    );

    return {
      success: true,
      finalState,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
      throw new Error(
        `Timeout: Move "${move}" did not complete within ${timeout}ms. Initial state: ${initialState.fen}`,
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Performs a move by clicking squares and waits for state confirmation
 * Useful when you need to test UI interaction specifically
 * @param page Playwright page object
 * @param from Source square (e.g., "e2")
 * @param to Destination square (e.g., "e4")
 * @param options Configuration options
 */
export async function performClickMoveAndWait(
  page: Page,
  from: string,
  to: string,
  options: MoveOptions = {},
): Promise<{ success: boolean; finalState: GameState; errorMessage?: string }> {
  const { expectedFen, timeout = 5000, allowRejection = false } = options;
  const errorSelector = '[data-testid="move-error-dialog"]';

  // 0. Wait for test API to be available
  try {
    await waitForTestApi(page, 10000);
  } catch (error) {
    throw new Error(
      "E2E test API not available - TrainingBoard component may not have mounted yet",
    );
  }

  // 1. Get initial state
  const initialState = (await page.evaluate(() =>
    (window as any).e2e_getGameState(),
  )) as GameState;
  if (!initialState) {
    throw new Error("Could not get initial game state");
  }

  // 2. Verify squares exist
  const fromSquare = page.locator(`[data-square="${from}"]`);
  const toSquare = page.locator(`[data-square="${to}"]`);

  await expect(fromSquare).toBeVisible({ timeout: 2000 });
  await expect(toSquare).toBeVisible({ timeout: 2000 });

  // 3. Perform click move
  await fromSquare.click();
  await toSquare.click();

  // 4. Wait for state change or error (same logic as performMoveAndWait)
  const successCondition = page.waitForFunction(
    ({ initial, expected }) => {
      const state = (window as any).e2e_getGameState();
      if (!state) return false;

      if (expected) {
        return state.fen === expected;
      }

      return state.moveCount > initial.moveCount;
    },
    { initial: initialState, expected: expectedFen },
    { polling: 100, timeout },
  );

  const failureCondition = page
    .waitForSelector(errorSelector, {
      state: "visible",
      timeout: Math.min(timeout, 2000),
    })
    .catch(() => null);

  try {
    await Promise.race([successCondition, failureCondition]);

    const errorElement = page.locator(errorSelector);
    const hasError = await errorElement.isVisible();

    if (hasError) {
      const errorText = await errorElement.textContent();
      const errorMessage = `Click move ${from}-${to} rejected: "${errorText}"`;

      if (!allowRejection) {
        throw new Error(errorMessage);
      }

      return {
        success: false,
        finalState: await page.evaluate(() =>
          (window as any).e2e_getGameState(),
        ),
        errorMessage,
      };
    }

    const finalState = (await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    )) as GameState;

    if (expectedFen && finalState.fen !== expectedFen) {
      throw new Error(
        `Expected FEN "${expectedFen}" but got "${finalState.fen}"`,
      );
    }

    console.log(`[E2E] Click move ${from}-${to} completed successfully`);

    return {
      success: true,
      finalState,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.includes("timeout")) {
      throw new Error(
        `Timeout: Click move ${from}-${to} did not complete within ${timeout}ms`,
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Waits for a specific game state condition to be met
 * @param page Playwright page object
 * @param condition Function that returns true when condition is met
 * @param timeout Maximum wait time in ms
 */
export async function waitForGameState(
  page: Page,
  condition: (state: GameState) => boolean,
  timeout: number = 5000,
): Promise<GameState> {
  // Wait for test API to be available first
  await waitForTestApi(page, 10000);

  await page.waitForFunction(
    (conditionStr) => {
      const state = (window as any).e2e_getGameState();
      if (!state) return false;

      // Evaluate the condition function
      const conditionFn = new Function("state", `return ${conditionStr}`);
      return conditionFn(state);
    },
    condition.toString(),
    { timeout, polling: 100 },
  );

  return (await page.evaluate(() =>
    (window as any).e2e_getGameState(),
  )) as GameState;
}

/**
 * Waits for the error dialog to disappear (useful after dismissing errors)
 * @param page Playwright page object
 * @param timeout Maximum wait time
 */
export async function waitForErrorDialogToDismiss(
  page: Page,
  timeout: number = 3000,
): Promise<void> {
  const errorSelector = '[data-testid="move-error-dialog"]';
  await page.waitForSelector(errorSelector, {
    state: "hidden",
    timeout,
  });
}

/**
 * Dismisses move error dialog by clicking the dismiss button
 * @param page Playwright page object
 */
export async function dismissMoveErrorDialog(page: Page): Promise<void> {
  // Look for common dismiss button patterns
  const dismissSelectors = [
    '[data-testid="dismiss-error"]',
    'button:has-text("Zug zurücknehmen")',
    'button:has-text("OK")',
    'button:has-text("Schließen")',
    '[aria-label="Close"]',
  ];

  for (const selector of dismissSelectors) {
    const button = page.locator(selector);
    if (await button.isVisible()) {
      await button.click();
      await waitForErrorDialogToDismiss(page);
      return;
    }
  }

  throw new Error("Could not find dismiss button for move error dialog");
}

/**
 * Makes a player move with validation (for error dialogs) and then fixes the turn state
 * This allows player moves to go through the full validation pipeline while ensuring
 * the next player move can be made without turn validation issues.
 * 
 * @param page Playwright page object
 * @param move Move in standard notation (e.g., "e2-e4" or "Nf3")
 * @param options Configuration options
 * @returns Promise resolving when move is complete and turn state is fixed
 */
export async function makePlayerMoveAndFixTurn(
  page: Page,
  move: string,
  options: MoveOptions = {},
): Promise<{ success: boolean; finalState: GameState; errorMessage?: string }> {
  console.log(`👤 Player validated move: ${move}`);
  
  // 0. Ensure test API is available
  await waitForTestApi(page, 10000);
  
  // 1. Execute move WITH validation (triggers error dialogs if needed)
  const result = await performMoveAndWait(page, move, options);
  
  // 2. If move was successful, fix turn state for next player move
  if (result.success) {
    await page.evaluate(() => {
      (window as any).__testApi.setTurnState(true);
    });
    console.log(`🔧 Turn state fixed - player can move again`);
  }
  
  return result;
}

/**
 * Makes an opponent move using the new direct API (bypassing all validation)
 * This is the preferred method for opponent moves in E2E tests as it uses the
 * new commitMoveToTraining function and handles turn state correctly.
 * 
 * @param page Playwright page object
 * @param move Move in standard notation (e.g., "e2-e4" or "Nf3")
 * @param options Configuration options
 * @returns Promise resolving when move is complete
 */
export async function makeOpponentMove(
  page: Page,
  move: string,
  options: MoveOptions = {},
): Promise<{ success: boolean; finalState: GameState; errorMessage?: string }> {
  const { expectedFen, timeout = 5000, allowRejection = false } = options;
  const errorSelector = '[data-testid="move-error-dialog"]';

  console.log(`🤖 Opponent direct move: ${move}`);
  
  // 0. Wait for test API to be available
  try {
    await waitForTestApi(page, 10000);
  } catch (error) {
    throw new Error(
      "E2E test API not available - TrainingBoard component may not have mounted yet",
    );
  }

  // 1. Get initial state before the move
  const initialState = (await page.evaluate(() =>
    (window as any).e2e_getGameState(),
  )) as GameState;
  if (!initialState || typeof initialState.moveCount !== "number") {
    throw new Error("Could not get initial game state from e2e_getGameState()");
  }

  // 2. Perform the move using the new direct API
  const moveResult = await page.evaluate(async (moveString) => {
    return await (window as any).__testApi.makeDirectMove(moveString);
  }, move);

  console.log(`[E2E] Opponent move ${move} API result:`, moveResult);

  // 2a. Check if API rejected the move immediately (API-level failures)
  if (moveResult && moveResult.success === false) {
    const finalState = (await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    )) as GameState;

    return {
      success: false,
      finalState,
      errorMessage: `Direct API rejected move: ${moveResult.error || "Unknown error"}`,
    };
  }

  // 3. Wait for either success or failure condition
  const successCondition = page.waitForFunction(
    ({ initial, expected }) => {
      const state = (window as any).e2e_getGameState();
      if (!state) return false;

      // If FEN is provided, it's the source of truth
      if (expected) {
        return state.fen === expected;
      }

      // Otherwise, check for move count increment
      return state.moveCount > initial.moveCount;
    },
    { initial: initialState, expected: expectedFen },
    { polling: 100, timeout },
  );

  const failureCondition = page
    .waitForSelector(errorSelector, {
      state: "visible",
      timeout: Math.min(timeout, 2000), // Error dialogs should appear quickly
    })
    .catch(() => null); // Don't throw if no error dialog appears

  try {
    await Promise.race([successCondition, failureCondition]);

    // Check if error dialog appeared (shouldn't happen with direct moves, but just in case)
    const errorElement = page.locator(errorSelector);
    const hasError = await errorElement.isVisible();

    if (hasError) {
      const errorText = await errorElement.textContent();
      const errorMessage = `Opponent move rejected: "${errorText}"`;

      if (!allowRejection) {
        throw new Error(errorMessage);
      }

      return {
        success: false,
        finalState: await page.evaluate(() =>
          (window as any).e2e_getGameState(),
        ),
        errorMessage,
      };
    }

    // Success case - get final state
    const finalState = (await page.evaluate(() =>
      (window as any).e2e_getGameState(),
    )) as GameState;

    // Validate expected FEN if provided
    if (expectedFen && finalState.fen !== expectedFen) {
      throw new Error(
        `Expected FEN "${expectedFen}" but got "${finalState.fen}"`,
      );
    }

    console.log(
      `[E2E] Opponent move ${move} completed successfully. Move count: ${initialState.moveCount} → ${finalState.moveCount}`,
    );

    return {
      success: true,
      finalState,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
      throw new Error(
        `Timeout: Opponent move "${move}" did not complete within ${timeout}ms. Initial state: ${initialState.fen}`,
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}
