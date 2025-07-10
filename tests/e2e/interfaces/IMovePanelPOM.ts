/**
 * @fileoverview IMovePanelPOM Interface - Contract for Move Panel Page Object Model
 * @description Defines the public API for move navigation and state management
 */

/**
 * Move representation
 */
export interface Move {
  san: string;
  moveNumber: number;
  color: 'w' | 'b';
}

/**
 * Navigation state information
 */
export interface NavigationState {
  isAtStart: boolean;
  isAtEnd: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

/**
 * Interface for Move Panel Page Object Model
 * Encapsulates all move navigation and state management functionality
 */
export interface IMovePanelPOM {
  // Navigation Actions
  /**
   * Navigate to a specific move by index
   * @param moveNumber - 0-based move index
   */
  gotoMove(moveNumber: number): Promise<void>;
  
  /**
   * Navigate to the start of the game
   */
  goToStart(): Promise<void>;
  
  /**
   * Navigate to the end of the game
   */
  goToEnd(): Promise<void>;
  
  /**
   * Go back one move
   */
  goBack(): Promise<void>;
  
  /**
   * Go forward one move
   */
  goForward(): Promise<void>;
  
  // State Queries
  /**
   * Get all moves in the current game
   * @returns Array of moves
   */
  getMoves(): Promise<Move[]>;
  
  /**
   * Get the total number of moves
   * @returns Move count
   */
  getMoveCount(): Promise<number>;
  
  /**
   * Get the current move index
   * @returns Current index (0-based)
   */
  getCurrentMoveIndex(): Promise<number>;
  
  /**
   * Get total number of moves (alias for getMoveCount)
   * @returns Total moves
   */
  getTotalMoves(): Promise<number>;
  
  /**
   * Get navigation state information
   * @returns Navigation state
   */
  getNavigationState(): Promise<NavigationState>;
  
  // UI Interactions
  /**
   * Click on a move in the move list
   * @param moveIndex - Index of move to click
   */
  clickMove(moveIndex: number): Promise<void>;
  
  /**
   * Wait for the move count to reach expected value
   * @param expectedCount - Expected move count
   */
  waitForMoveCount(expectedCount: number): Promise<void>;
}