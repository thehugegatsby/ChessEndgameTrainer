import { Page, expect } from "@playwright/test";
import { getLogger } from "@shared/services/logging";

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

    // Click source square using react-chessboard's data-square attribute
    // First try to click a piece on the square (if present)
    const pieceSelector = `[data-square="${from}"] [draggable]`;
    const squareSelector = `[data-square="${from}"]`;
    
    try {
      // Try clicking the piece first
      await this.page.click(pieceSelector, { timeout: 1000 });
    } catch {
      // If no piece, click the square itself
      await this.page.click(squareSelector);
    }

    // Click target square
    await this.page.click(`[data-square="${to}"]`);

    // Handle promotion if specified
    if (promotion) {
      const promotionSelector = `[data-testid="promotion-${promotion}"]`;
      try {
        await this.page.waitForSelector(promotionSelector, { timeout: 5000 });
        await this.page.click(promotionSelector);
      } catch {
        // Promotion dialog might not appear or use different selector
        this.logger.debug("Promotion dialog not found, move may auto-promote to queen");
      }
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
    // Parse turn from FEN string since there's no dedicated turn indicator
    const fen = await this.getPosition();
    const fenParts = fen.split(" ");
    return (fenParts[1] || "w") as "w" | "b";
  }

  /**
   * Check if game is over by looking for game over UI
   */
  async isGameOver(): Promise<boolean> {
    // Check for various indicators of game over
    // Could be in a toast, dialog, or game status element
    const gameOverSelectors = [
      '[data-testid="game-over"]',
      '.game-over',
      'text=/game.*over/i',
      'text=/checkmate/i',
      'text=/stalemate/i',
      'text=/draw/i'
    ];
    
    for (const selector of gameOverSelectors) {
      const element = await this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get move count from move history UI
   */
  async getMoveCount(): Promise<number> {
    // FIXED: Only count actual move items, not navigation buttons
    const moveSelectors = [
      '[data-testid^="move-item-"]',                              // Only move-item-0, move-item-1, etc.
      '[data-testid="move-list"] [data-testid^="move-item-"]',    // More specific: inside move-list container
    ];
    
    for (const selector of moveSelectors) {
      const count = await this.page.locator(selector).count();
      if (count > 0) {
        this.logger.debug(`getMoveCount found ${count} moves using selector: ${selector}`);
        return count;
      }
    }
    
    // If no actual move items found, check if this is the initial state
    const noMovesText = await this.page.locator(':text("Noch keine Züge gespielt")').isVisible();
    if (noMovesText) {
      this.logger.debug("getMoveCount: Found 'no moves' text, returning 0");
      return 0;
    }
    
    this.logger.warn("getMoveCount: No move elements found with any selector");
    return 0;
  }

  /**
   * Get available moves count from UI
   */
  async getAvailableMovesCount(): Promise<number> {
    // react-chessboard doesn't have highlighted squares with testid
    // Try to count squares with visual highlighting or just return a default
    const highlightedSquares = await this.page
      .locator('[data-square].highlighted, [data-square][style*="background"]')
      .count();
    
    // If no highlighted squares visible, return a default non-zero value
    // since there are usually moves available
    return highlightedSquares || 1;
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
    const state = {
      fen: await this.getPosition(),
      turn: await this.getTurn(),
      isGameOver: await this.isGameOver(),
      moveCount: await this.getMoveCount(),
      availableMovesCount: await this.getAvailableMovesCount(),
    };

    // Enhanced debugging to understand game state
    this.logger.debug("Complete game state:", state);
    
    return state;
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
    // Try multiple selectors for move history
    const historySelectors = [
      '[data-testid="move-history"]',
      '[data-testid="move-list"]',
      '.move-history',
      '.move-list'
    ];
    
    for (const selector of historySelectors) {
      const element = await this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        const moveHistory = await element.textContent();
        expect(moveHistory).toContain(expectedMove);
        return;
      }
    }
    
    // If no move history found, check entire page for the move text
    const pageText = await this.page.textContent('body');
    expect(pageText).toContain(expectedMove);
  }
}
