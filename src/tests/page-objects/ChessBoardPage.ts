/**
 * Chess Board Page Object
 * Encapsulates all chess board interactions and validations
 */

import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 *
 */
export interface ChessMove {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/**
 *
 */
export interface BoardState {
  fen: string;
  turn: 'w' | 'b';
  moveCount: number;
  isGameOver: boolean;
  pgn: string;
}

export class ChessBoardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Locators
   */
  get board(): Locator {
    return this.page.locator('[data-testid="training-board"]');
  }

  /**
   *
   */
  get boardSquares(): Locator {
    return this.board.locator('[data-square]');
  }

  /**
   *
   */
  get positionTitle(): Locator {
    return this.page.locator('h1');
  }

  /**
   *
   */
  get positionDescription(): Locator {
    return this.page.locator('[data-testid="position-description"]');
  }

  /**
   *
   */
  get moveCounter(): Locator {
    return this.page.locator('[data-testid="move-counter"]');
  }

  /**
   *
   */
  get evaluationDisplay(): Locator {
    return this.page.locator('[data-testid="evaluation-display"]');
  }

  /**
   *
   */
  get resetButton(): Locator {
    return this.page.locator('[data-testid="reset-button"]');
  }

  /**
   *
   */
  get nextPositionButton(): Locator {
    return this.page.locator('[data-testid="next-position-button"]');
  }

  /**
   *
   */
  get previousPositionButton(): Locator {
    return this.page.locator('[data-testid="previous-position-button"]');
  }

  /**
   *
   */
  get hintButton(): Locator {
    return this.page.locator('[data-testid="hint-button"]');
  }

  /**
   *
   */
  get solutionButton(): Locator {
    return this.page.locator('[data-testid="solution-button"]');
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady(): Promise<void> {
    await this.board.waitFor({ state: 'visible' });
    await this.waitForFirebaseData();

    // Wait for board to have data-fen attribute
    await this.page.waitForFunction(() => {
      const board = document.querySelector('[data-testid="training-board"]');
      return board && board.getAttribute('data-fen');
    });
  }

  /**
   * Navigate to specific position
   * @param positionId
   */
  async navigateToPosition(positionId: number): Promise<void> {
    await this.navigate(`/train/${positionId}`);
    await this.waitForPageReady();
  }

  /**
   * Get current FEN
   */
  async getCurrentFEN(): Promise<string> {
    const fen = await this.board.getAttribute('data-fen');
    if (!fen) throw new Error('FEN not found on board');
    return fen;
  }

  /**
   * Get board state
   */
  async getBoardState(): Promise<BoardState> {
    // Use test API to get full board state
    const state = await this.page.evaluate(() => {
      return (window as any).__testApi?.getBoardState();
    });

    if (!state) {
      throw new Error('Test API not available. Make sure NEXT_PUBLIC_IS_E2E_TEST is set.');
    }

    return state;
  }

  /**
   * Make a move by dragging pieces
   * @param from
   * @param to
   */
  async makeMoveDragDrop(from: string, to: string): Promise<void> {
    const fromSquare = this.getSquareLocator(from);
    const toSquare = this.getSquareLocator(to);

    await fromSquare.dragTo(toSquare);

    // Wait for move animation
    await this.page.waitForTimeout(500);
  }

  /**
   * Make a move by clicking squares
   * @param from
   * @param to
   */
  async makeMoveClick(from: string, to: string): Promise<void> {
    const fromSquare = this.getSquareLocator(from);
    const toSquare = this.getSquareLocator(to);

    await fromSquare.click();
    await toSquare.click();

    // Wait for move animation
    await this.page.waitForTimeout(500);
  }

  /**
   * Make a move using the preferred method
   * @param move
   */
  async makeMove(move: ChessMove): Promise<void> {
    // Default to drag and drop as it's more realistic
    await this.makeMoveDragDrop(move.from, move.to);

    // Handle promotion if needed
    if (move.promotion) {
      await this.selectPromotion(move.promotion);
    }
  }

  /**
   * Select promotion piece
   * @param piece
   */
  async selectPromotion(piece: 'q' | 'r' | 'b' | 'n'): Promise<void> {
    const promotionDialog = this.page.locator('[data-testid="promotion-dialog"]');
    await promotionDialog.waitFor({ state: 'visible' });

    const pieceButton = promotionDialog.locator(`[data-piece="${piece}"]`);
    await pieceButton.click();

    await promotionDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Get square locator
   * @param square
   */
  private getSquareLocator(square: string): Locator {
    return this.board.locator(`[data-square="${square}"]`);
  }

  /**
   * Check if square has piece
   * @param square
   */
  async squareHasPiece(square: string): Promise<boolean> {
    const squareElement = this.getSquareLocator(square);
    const piece = await squareElement.locator('[data-piece]').count();
    return piece > 0;
  }

  /**
   * Get piece on square
   * @param square
   */
  async getPieceOnSquare(square: string): Promise<string | null> {
    const squareElement = this.getSquareLocator(square);
    const pieceElement = squareElement.locator('[data-piece]');

    if ((await pieceElement.count()) === 0) {
      return null;
    }

    return await pieceElement.getAttribute('data-piece');
  }

  /**
   * Reset position
   */
  async resetPosition(): Promise<void> {
    await this.resetButton.click();
    await this.page.waitForTimeout(500); // Wait for reset animation
  }

  /**
   * Navigate to next position
   */
  async goToNextPosition(): Promise<void> {
    const currentUrl = this.getCurrentUrl();
    await this.nextPositionButton.click();

    // Wait for URL to change
    await this.page.waitForFunction(url => window.location.href !== url, currentUrl);

    await this.waitForPageReady();
  }

  /**
   * Navigate to previous position
   */
  async goToPreviousPosition(): Promise<void> {
    const currentUrl = this.getCurrentUrl();
    await this.previousPositionButton.click();

    // Wait for URL to change
    await this.page.waitForFunction(url => window.location.href !== url, currentUrl);

    await this.waitForPageReady();
  }

  /**
   * Request hint
   */
  async requestHint(): Promise<string> {
    await this.hintButton.click();

    const hintModal = this.page.locator('[data-testid="hint-modal"]');
    await hintModal.waitFor({ state: 'visible' });

    const hintText = await hintModal.locator('[data-testid="hint-text"]').textContent();

    await hintModal.locator('[data-testid="close-hint"]').click();
    await hintModal.waitFor({ state: 'hidden' });

    return hintText || '';
  }

  /**
   * Show solution
   */
  async showSolution(): Promise<string[]> {
    await this.solutionButton.click();

    const solutionModal = this.page.locator('[data-testid="solution-modal"]');
    await solutionModal.waitFor({ state: 'visible' });

    const moves = await solutionModal.locator('[data-testid="solution-move"]').allTextContents();

    await solutionModal.locator('[data-testid="close-solution"]').click();
    await solutionModal.waitFor({ state: 'hidden' });

    return moves;
  }

  /**
   * Get current evaluation
   */
  async getCurrentEvaluation(): Promise<string> {
    return (await this.evaluationDisplay.textContent()) || '';
  }

  /**
   * Get move count
   */
  async getMoveCount(): Promise<number> {
    const text = (await this.moveCounter.textContent()) || '0';
    return parseInt(text, 10);
  }

  /**
   * Wait for tablebase to respond
   */
  async waitForTablebaseMove(): Promise<void> {
    const initialMoveCount = await this.getMoveCount();

    // Wait for move count to increase by 2 (player + tablebase)
    await this.page.waitForFunction(
      async expectedCount => {
        const counter = document.querySelector('[data-testid="move-counter"]');
        if (!counter) return false;
        const count = parseInt(counter.textContent || '0', 10);
        return count >= expectedCount;
      },
      initialMoveCount + 2,
      { timeout: 10000 }
    );

    // Additional wait for animation
    await this.page.waitForTimeout(500);
  }

  /**
   * Assert position loaded correctly
   * @param expectedTitle
   * @param expectedFEN
   */
  async assertPositionLoaded(expectedTitle: string, expectedFEN: string): Promise<void> {
    await expect(this.positionTitle).toHaveText(expectedTitle);

    const currentFEN = await this.getCurrentFEN();
    expect(currentFEN).toBe(expectedFEN);
  }

  /**
   * Assert move was successful
   * @param expectedFEN
   */
  async assertMoveSuccessful(expectedFEN: string): Promise<void> {
    const currentFEN = await this.getCurrentFEN();
    expect(currentFEN).toBe(expectedFEN);
  }

  /**
   * Take board screenshot for visual regression
   * @param _name
   */
  async takeBoardScreenshot(_name: string): Promise<Buffer> {
    return await this.board.screenshot({
      animations: 'disabled',
    });
  }
}
