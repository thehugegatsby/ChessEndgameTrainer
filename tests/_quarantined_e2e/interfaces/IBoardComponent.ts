/**
 * @fileoverview IBoardComponent Interface - Contract for Board Component
 * @description Defines the public API for chess board interactions
 */

/**
 * Interface for Board Component
 * Handles chess board visualization and piece movements
 */
export interface IBoardComponent {
  /**
   * Get current board position as FEN
   * @returns FEN string
   */
  getPosition(): Promise<string>;
  
  /**
   * Wait for a specific position to appear
   * @param expectedFen - Expected FEN position
   */
  waitForPosition(expectedFen: string): Promise<void>;
  
  /**
   * Make a move on the board
   * @param from - Source square
   * @param to - Target square
   * @returns Success result with move details
   */
  makeMove(from: string, to: string): Promise<{
    success: boolean;
    move?: string;
    errors?: Array<{ reason: string }>;
  }>;
  
  /**
   * Check if a square is highlighted
   * @param square - Square to check
   * @returns True if highlighted
   */
  isSquareHighlighted(square: string): Promise<boolean>;
  
  /**
   * Get highlighted squares
   * @returns Array of highlighted squares
   */
  getHighlightedSquares(): Promise<string[]>;
}