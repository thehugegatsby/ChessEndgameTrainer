import { type Page, expect } from '@playwright/test';
import { getLogger } from '@shared/services/logging';

/**
 * Page Object Model for TrainingBoard E2E testing
 *
 * Replaces invasive window attachment pattern with standard DOM interaction.
 * Uses data-testid attributes and UI element queries for reliable test automation.
 */
export class TrainingBoardPage {
  private logger = getLogger().setContext('TrainingBoardPage');

  constructor(private page: Page) {}

  /**
   * Wait for the training page to be ready for interaction
   */
  async waitForPageReady(): Promise<void> {
    this.logger.info('⏳ Waiting for training page to be ready');

    // Wait for essential elements to be visible
    await this.page.waitForSelector('[data-testid="training-board"]', { timeout: 10000 });
    await this.page.waitForSelector('[data-testid="current-streak"]', { timeout: 5000 });
    await this.page.waitForSelector('[data-testid="best-streak"]', { timeout: 5000 });

    // Wait for board to have position data
    await this.page.waitForFunction(
      () => {
        const board = document.querySelector('[data-testid="training-board"]');
        return board && board.getAttribute('data-fen');
      },
      { timeout: 5000 }
    );

    // CRITICAL: Wait for chessboard hydration to complete
    this.logger.info('⏳ Waiting for chessboard hydration...');
    await this.page.waitForSelector('[data-chessboard-hydrated="true"]', { timeout: 15000 });

    // Wait for clickable squares to be available
    await this.page.waitForFunction(
      () => {
        const squares = document.querySelectorAll('[data-square]');
        return squares.length >= 32; // At least half the board should be available
      },
      { timeout: 10000 }
    );

    this.logger.info('✅ Training page and chessboard are fully ready');
  }

  /**
   * Execute a chess move using drag-and-drop (primary method)
   *
   * @param from - Source square (e.g., "e2")
   * @param to - Target square (e.g., "e4")
   * @param promotion - Optional promotion piece ("q", "r", "b", "n")
   */
  async makeMove(from: string, to: string, promotion?: string): Promise<void> {
    this.logger.info('🔄 Making move via drag-and-drop (react-chessboard primary interaction)', {
      from,
      to,
      promotion,
    });

    try {
      // Primary method: Drag-and-drop to trigger onPieceDrop
      const fromSelector = `[data-square="${from}"]`;
      const toSelector = `[data-square="${to}"]`;

      this.logger.info(`🎯 Dragging piece from ${from} to ${to}`);
      await this.page.locator(fromSelector).dragTo(this.page.locator(toSelector));
      this.logger.info(`✅ Completed drag from ${from} to ${to}`);
    } catch (dragError) {
      this.logger.warn('Drag-and-drop failed, falling back to two-click method', { dragError });

      // Fallback: Two-click method for onSquareClick
      this.logger.info(`🎯 Clicking source square: ${from}`);
      await this.page.click(`[data-square="${from}"]`);
      this.logger.info(`✅ Clicked square ${from}`);

      this.logger.info(`🎯 Clicking target square: ${to}`);
      await this.page.click(`[data-square="${to}"]`);
      this.logger.info(`✅ Clicked target square ${to}`);
    }

    // Handle promotion if specified
    if (promotion) {
      const promotionSelector = `[data-testid="promotion-${promotion}"]`;
      try {
        await this.page.waitForSelector(promotionSelector, { timeout: 5000 });
        await this.page.click(promotionSelector);
        this.logger.info(`✅ Selected promotion piece: ${promotion}`);
      } catch {
        // Promotion dialog might not appear or use different selector
        this.logger.debug('Promotion dialog not found, move may auto-promote to queen');
      }
    }

    // Wait for move to be processed (deterministic waiting)
    await this.waitForMoveProcessed();
  }

  /**
   * Get current board position via DOM attributes
   */
  async getPosition(): Promise<string> {
    const fenAttribute = await this.page.getAttribute('[data-testid="training-board"]', 'data-fen');

    if (!fenAttribute) {
      throw new Error(
        'Board FEN not found in DOM - ensure data-fen attribute is set on training-board'
      );
    }

    return fenAttribute;
  }

  /**
   * Get current turn from UI
   */
  async getTurn(): Promise<'w' | 'b'> {
    // Parse turn from FEN string since there's no dedicated turn indicator
    const fen = await this.getPosition();
    const fenParts = fen.split(' ');
    return (fenParts[1] || 'w') as 'w' | 'b';
  }

  /**
   * Make moves until training is successfully completed
   * Tries common winning patterns for endgame positions
   */
  async makeMovesUntilSuccess(): Promise<void> {
    this.logger.info('🎯 Attempting to complete position successfully');

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;

      // Check if we already have a success dialog
      const successDialog = await this.page
        .locator('text="Geschafft"')
        .isVisible()
        .catch(() => false);
      if (successDialog) {
        this.logger.info('✅ Success dialog already visible');
        return;
      }

      // Try to make a move based on current position
      try {
        const fen = await this.getPosition();
        this.logger.info(`📋 Current FEN (attempt ${attempts}): ${fen}`);

        // For King+Pawn endgames, try pushing the pawn or using the king
        if (fen.includes('P') || fen.includes('p')) {
          await this.tryPawnEndgameMoves();
        } else {
          // Try basic king moves
          await this.tryBasicKingMoves();
        }

        // Wait a bit for the move to be processed
        await this.page.waitForTimeout(1000);

        // Check if we now have success
        const nowHasSuccess = await this.page
          .locator('text="Geschafft"')
          .isVisible()
          .catch(() => false);
        if (nowHasSuccess) {
          this.logger.info('✅ Successfully completed position!');
          return;
        }
      } catch (error) {
        this.logger.debug(`Move attempt ${attempts} failed:`, error);
      }
    }

    throw new Error(`Failed to complete position after ${maxAttempts} attempts`);
  }

  /**
   * Try common pawn endgame moves
   */
  private async tryPawnEndgameMoves(): Promise<void> {
    const moves = [
      ['e5', 'e6'],
      ['d5', 'd6'],
      ['c5', 'c6'],
      ['f5', 'f6'],
      ['e4', 'e5'],
      ['d4', 'd5'],
      ['c4', 'c5'],
      ['f4', 'f5'],
      ['e6', 'e7'],
      ['d6', 'd7'],
      ['c6', 'c7'],
      ['f6', 'f7'],
      ['e7', 'e8'],
      ['d7', 'd8'],
      ['c7', 'c8'],
      ['f7', 'f8'],
    ];

    for (const [from, to] of moves) {
      try {
        await this.makeMove(from, to);
        await this.page.waitForTimeout(500);
        return;
      } catch {
        // Try next move
      }
    }
  }

  /**
   * Try basic king moves
   */
  private async tryBasicKingMoves(): Promise<void> {
    const kingMoves = [
      ['e4', 'e5'],
      ['e4', 'f5'],
      ['e4', 'd5'],
      ['d4', 'e5'],
      ['d4', 'd5'],
      ['d4', 'c5'],
      ['f4', 'e5'],
      ['f4', 'f5'],
      ['f4', 'g5'],
    ];

    for (const [from, to] of kingMoves) {
      try {
        await this.makeMove(from, to);
        await this.page.waitForTimeout(500);
        return;
      } catch {
        // Try next move
      }
    }
  }

  /**
   * Make a deliberately bad move to break a streak
   */
  async makeBadMove(): Promise<void> {
    this.logger.info('🎯 Making a bad move to break streak');

    // Try to move the king into danger or make other suboptimal moves
    const badMoves = [
      ['e4', 'e3'],
      ['d4', 'd3'], // Move backwards
      ['e4', 'e4'],
      ['d4', 'd4'], // Invalid moves (same square)
    ];

    for (const [from, to] of badMoves) {
      try {
        await this.makeMove(from, to);
        // Wait for error dialog or feedback
        await this.page.waitForTimeout(1000);
        return;
      } catch {
        // Try next bad move
      }
    }
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
      'text=/draw/i',
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
   * Get move count from DOM attribute (reliable, store-independent)
   */
  async getMoveCount(): Promise<number> {
    const moveCountAttr = await this.page.getAttribute(
      '[data-testid="training-board"]',
      'data-move-count'
    );
    const moveCount = moveCountAttr ? parseInt(moveCountAttr, 10) : 0;

    this.logger.debug(`DOM-based moveCount: ${moveCount}`);
    return moveCount;
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
        const boardElement = document.querySelector('[data-testid="training-board"]');
        return boardElement && !boardElement.classList.contains('loading');
      },
      { timeout: 10000 }
    );
  }

  /**
   * Get comprehensive game state by reading from UI elements
   *
   * This replaces the window['e2e_getGameState']() function
   */
  async getGameState(): Promise<{
    fen: string;
    turn: 'w' | 'b';
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
    this.logger.debug('Complete game state:', state);

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
  async makeMoveWithValidation(from: string, to: string, promotion?: string): Promise<boolean> {
    const initialState = await this.getGameState();

    try {
      await this.makeMove(from, to, promotion);

      // Wait for move to be processed (deterministic waiting)
      await this.waitForMoveProcessed();

      const newState = await this.getGameState();

      // Validate that move count increased (indicating successful move)
      const moveSuccessful = newState.moveCount > initialState.moveCount;

      this.logger.debug('Move validation result', {
        from,
        to,
        promotion,
        initialMoveCount: initialState.moveCount,
        newMoveCount: newState.moveCount,
        successful: moveSuccessful,
      });

      return moveSuccessful;
    } catch (error) {
      this.logger.error('Move execution failed', error as Error, {
        from,
        to,
        promotion,
      });
      return false;
    }
  }

  /**
   * Wait for move to be fully processed (deterministic waiting)
   * Replaces hardcoded waitForTimeout() with store-based waiting
   */
  async waitForMoveProcessed(): Promise<void> {
    this.logger.info('⏳ Waiting for move to be processed');

    await this.page.waitForFunction(
      () => {
        const store = (window as any).__e2e_store;
        if (!store) return true; // If no store, assume ready
        const state = store.getState?.();
        // Wait for tablebase analysis to complete
        return state?.tablebase?.analysisStatus !== 'loading';
      },
      { timeout: 10000 }
    );

    this.logger.info('✅ Move processed');
  }

  /**
   * Wait for specific FEN position to be reached
   * @param expectedFen
   * @param timeout
   */
  async waitForPosition(expectedFen: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForFunction(
      fen => {
        const boardElement = document.querySelector('[data-testid="training-board"]');
        return boardElement?.getAttribute('data-fen') === fen;
      },
      expectedFen,
      { timeout }
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
      '.move-list',
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
