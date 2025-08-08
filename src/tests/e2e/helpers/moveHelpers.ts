/**
 * E2E Test Helpers for Chess Move Operations
 *
 * Provides reliable state-based waiting for moves instead of fixed timeouts.
 * Uses Page Object Model for DOM-based testing.
 */

import { Page, expect } from "@playwright/test";
import { TrainingBoardPage } from "./pageObjects/TrainingBoardPage";

/**
 * Game state interface for compatibility
 */
type GameState = {
  fen: string;
  moveCount: number;
  turn: "w" | "b";
  isGameOver: boolean;
  availableMovesCount: number;
};

/**
 * Move options for testing
 */
type MoveOptions = {
  expectedFen?: string;
  timeout?: number;
  allowRejection?: boolean; // If true, doesn't throw on move error dialog
};

/**
 * @deprecated - Use TrainingBoardPage.makeMoveWithValidation() instead
 * Performs a move using DOM interaction and waits for state confirmation
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
  const boardPage = new TrainingBoardPage(page);

  // 0. Wait for board to be ready
  await boardPage.waitForBoardReady();

  // 1. Get initial state before the move
  const initialState = await boardPage.getGameState();
  if (!initialState || typeof initialState.moveCount !== "number") {
    throw new Error("Could not get initial game state from board");
  }

  // 2. Parse move and perform via DOM interaction
  const [from, to] = move.split("-");
  if (!from || !to) {
    throw new Error(`Invalid move format: ${move}. Expected format: "e2-e4"`);
  }

  const moveResult = await boardPage.makeMoveWithValidation(from, to);
  console.log(`[E2E] Move ${move} DOM result:`, moveResult);

  // Get final state
  const finalState = await boardPage.getGameState();

  if (!moveResult) {
    return {
      success: false,
      finalState,
      errorMessage: `Move failed via DOM interaction`,
    };
  }

  // Check for error dialog if move was rejected
  const errorElement = page.locator(errorSelector);
  const hasError = await errorElement.isVisible().catch(() => false);

  if (hasError && !allowRejection) {
    const errorText = await errorElement.textContent();
    throw new Error(`Move rejected: "${errorText}"`);
  }

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
}

/**
 * @deprecated - Use TrainingBoardPage.makeMove() instead
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
  const boardPage = new TrainingBoardPage(page);

  // Use the Page Object Model method
  return performMoveAndWait(page, `${from}-${to}`, options);
}

/**
 * @deprecated - Use TrainingBoardPage.getGameState() instead
 * Waits for specific game state conditions to be met
 * @param page Playwright page object
 * @param conditions Object with expected state conditions OR callback function
 * @param timeout Maximum wait time
 */
export async function waitForGameState(
  page: Page,
  conditions: Partial<GameState> | ((state: GameState) => boolean),
  timeout: number = 5000,
): Promise<GameState> {
  const boardPage = new TrainingBoardPage(page);

  // Poll until conditions are met
  let attempts = 0;
  const maxAttempts = Math.floor(timeout / 100);

  while (attempts < maxAttempts) {
    const state = await boardPage.getGameState();

    let conditionsMet = false;

    if (typeof conditions === "function") {
      // Callback function for custom logic
      conditionsMet = conditions(state);
    } else {
      // Object with expected values
      conditionsMet = true;
      for (const [key, expectedValue] of Object.entries(conditions)) {
        if (state[key as keyof GameState] !== expectedValue) {
          conditionsMet = false;
          break;
        }
      }
    }

    if (conditionsMet) {
      return state;
    }

    await page.waitForTimeout(100);
    attempts++;
  }

  throw new Error(`Game state conditions not met within ${timeout}ms`);
}

/**
 * @deprecated - Use Page Object Model error handling instead
 * Dismisses move error dialog by clicking appropriate button
 * @param page Playwright page object
 * @param action Action to take ('continue', 'takeback', 'restart')
 */
export async function dismissMoveErrorDialog(
  page: Page,
  action: "continue" | "takeback" | "restart" = "continue",
): Promise<void> {
  const errorDialog = page.locator('[data-testid="move-error-dialog"]');
  await errorDialog.waitFor({ state: "visible", timeout: 5000 });

  let buttonSelector: string;
  switch (action) {
    case "continue":
      buttonSelector = '[data-testid="move-error-continue"]';
      break;
    case "takeback":
      buttonSelector = '[data-testid="move-error-takeback"]';
      break;
    case "restart":
      buttonSelector = '[data-testid="move-error-restart"]';
      break;
  }

  await page.click(buttonSelector);

  // Wait for dialog to close
  await errorDialog.waitFor({ state: "hidden", timeout: 2000 });
}
