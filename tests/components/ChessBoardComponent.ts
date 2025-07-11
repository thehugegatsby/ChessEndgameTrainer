/**
 * ChessBoard Component Page Object
 * Handles interactions with the chess board UI
 */

import { Page, Locator } from '@playwright/test';

export class ChessBoardComponent {
  private container: Locator;

  constructor(page: Page, containerSelector = '[data-testid="chess-board"]') {
    this.container = page.locator(containerSelector);
  }

  /**
   * Make a move on the board
   */
  async makeMove(from: string, to: string): Promise<void> {
    const fromSquare = this.container.locator(`[data-square="${from}"]`);
    const toSquare = this.container.locator(`[data-square="${to}"]`);
    
    await fromSquare.click();
    await toSquare.click();
  }

  /**
   * Get the current FEN position
   */
  async getFEN(): Promise<string> {
    const fen = await this.container.getAttribute('data-fen');
    return fen || '';
  }

  /**
   * Check if a square has a piece
   */
  async hasPiece(square: string): Promise<boolean> {
    const squareElement = this.container.locator(`[data-square="${square}"]`);
    const piece = await squareElement.getAttribute('data-piece');
    return piece !== null && piece !== '';
  }

  /**
   * Get piece on a square
   */
  async getPiece(square: string): Promise<string | null> {
    const squareElement = this.container.locator(`[data-square="${square}"]`);
    return await squareElement.getAttribute('data-piece');
  }

  /**
   * Check if board is flipped
   */
  async isFlipped(): Promise<boolean> {
    const orientation = await this.container.getAttribute('data-orientation');
    return orientation === 'black';
  }

  /**
   * Wait for board to be ready
   */
  async waitForReady(): Promise<void> {
    await this.container.waitFor({ state: 'visible' });
  }

  /**
   * Get all legal moves for a square
   */
  async getLegalMoves(square: string): Promise<string[]> {
    const squareElement = this.container.locator(`[data-square="${square}"]`);
    await squareElement.hover();
    
    const legalMoves = await this.container.locator('[data-legal-move="true"]').all();
    const moves = [];
    
    for (const move of legalMoves) {
      const targetSquare = await move.getAttribute('data-square');
      if (targetSquare) {
        moves.push(targetSquare);
      }
    }
    
    return moves;
  }

  /**
   * Check if the game is over
   */
  async isGameOver(): Promise<boolean> {
    const gameStatus = await this.container.getAttribute('data-game-status');
    return gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw';
  }

  /**
   * Get the game result
   */
  async getGameResult(): Promise<string | null> {
    return await this.container.getAttribute('data-game-result');
  }
}