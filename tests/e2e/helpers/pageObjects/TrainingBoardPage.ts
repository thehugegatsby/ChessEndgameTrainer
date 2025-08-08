import { Page, expect } from "@playwright/test";
import { getLogger } from "@shared/services/Logger";

/**
 * Page Object Model for TrainingBoard E2E testing
 *
 * Replaces invasive window attachment pattern with standard DOM interaction.
 * Uses data-testid attributes and UI element queries for reliable test automation.
 */
export class TrainingBoardPage {
  private logger = getLogger().setContext("TrainingBoardPage");

  constructor(private page: Page) {}

  /**
   * Execute a chess move by clicking board squares
   *
   * @param from - Source square (e.g., "e2")
   * @param to - Target square (e.g., "e4")
   * @param promotion - Optional promotion piece ("q", "r", "b", "n")
   */
  async makeMove(from: string, to: string, promotion?: string): Promise<void> {
    this.logger.debug("Making move via DOM interaction", {
      from,
      to,
      promotion,
    });

    // Click source square
    await this.page.click(`[data-testid="square-${from}"]`);

    // Click target square
    await this.page.click(`[data-testid="square-${to}"]`);

    // Handle promotion if specified
    if (promotion) {
      const promotionSelector = `[data-testid="promotion-${promotion}"]`;
      await this.page.waitForSelector(promotionSelector, { timeout: 5000 });
      await this.page.click(promotionSelector);
    }

    // Wait for move animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Get current board position via DOM attributes
   */
  async getPosition(): Promise<string> {
    const fenAttribute = await this.page.getAttribute(
      '[data-testid="training-board"]',
      "data-fen",
    );

    if (!fenAttribute) {
      throw new Error(
        "Board FEN not found in DOM - ensure data-fen attribute is set on training-board",
      );
    }

    return fenAttribute;
  }

  /**
   * Get current turn from UI
   */
  async getTurn(): Promise<"w" | "b"> {
    const turnText = await this.page.textContent(
      '[data-testid="current-turn"]',
    );
    return turnText?.includes("White") || turnText?.includes("Weiß")
      ? "w"
      : "b";
  }

  /**
   * Check if game is over by looking for game over UI
   */
  async isGameOver(): Promise<boolean> {
    const gameOverElement = await this.page.locator(
      '[data-testid="game-over"]',
    );
    return await gameOverElement.isVisible().catch(() => false);
  }

  /**
   * Get move count from move history UI
   */
  async getMoveCount(): Promise<number> {
    const moveElements = await this.page
      .locator('[data-testid="move-item"]')
      .count();
    return moveElements;
  }

  /**
   * Get available moves count from UI
   */
  async getAvailableMovesCount(): Promise<number> {
    // Try to get from a move counter display, or count highlighted squares
    const highlightedSquares = await this.page
      .locator('[data-testid^="square-"].highlighted')
      .count();
    return highlightedSquares;
  }

  /**
   * Wait for board to be ready and interactive
   */
  async waitForBoardReady(): Promise<void> {
    await this.page.waitForSelector('[data-testid="training-board"]', {
      timeout: 10000,
    });

    // Wait for board to finish loading
    await this.page.waitForFunction(
      () => {
        const boardElement = document.querySelector(
          '[data-testid="training-board"]',
        );
        return boardElement && !boardElement.classList.contains("loading");
      },
      { timeout: 10000 },
    );
  }

  /**
   * Get comprehensive game state by reading from UI elements
   *
   * This replaces the window.e2e_getGameState() function
   */
  async getGameState(): Promise<{
    fen: string;
    turn: "w" | "b";
    isGameOver: boolean;
    moveCount: number;
    availableMovesCount: number;
  }> {
    return {
      fen: await this.getPosition(),
      turn: await this.getTurn(),
      isGameOver: await this.isGameOver(),
      moveCount: await this.getMoveCount(),
      availableMovesCount: await this.getAvailableMovesCount(),
    };
  }

  /**
   * Execute a move and validate it was successful
   *
   * @param from - Source square
   * @param to - Target square
   * @param promotion - Optional promotion piece
   * @returns Promise<boolean> - true if move was successful
   */
  async makeMoveWithValidation(
    from: string,
    to: string,
    promotion?: string,
  ): Promise<boolean> {
    const initialState = await this.getGameState();

    try {
      await this.makeMove(from, to, promotion);

      // Wait for state to update
      await this.page.waitForTimeout(500);

      const newState = await this.getGameState();

      // Validate that move count increased (indicating successful move)
      const moveSuccessful = newState.moveCount > initialState.moveCount;

      this.logger.debug("Move validation result", {
        from,
        to,
        promotion,
        initialMoveCount: initialState.moveCount,
        newMoveCount: newState.moveCount,
        successful: moveSuccessful,
      });

      return moveSuccessful;
    } catch (error) {
      this.logger.error("Move execution failed", error as Error, {
        from,
        to,
        promotion,
      });
      return false;
    }
  }

  /**
   * Wait for specific FEN position to be reached
   * @param expectedFen
   * @param timeout
   */
  async waitForPosition(
    expectedFen: string,
    timeout: number = 10000,
  ): Promise<void> {
    await this.page.waitForFunction(
      (fen) => {
        const boardElement = document.querySelector(
          '[data-testid="training-board"]',
        );
        return boardElement?.getAttribute("data-fen") === fen;
      },
      expectedFen,
      { timeout },
    );
  }

  /**
   * Assert that a specific move was made by checking move history
   * @param expectedMove
   */
  async assertMoveInHistory(expectedMove: string): Promise<void> {
    const moveHistory = await this.page.textContent(
      '[data-testid="move-history"]',
    );
    expect(moveHistory).toContain(expectedMove);
  }
}
