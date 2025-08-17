/**
 * @file Game State Service Interface
 * @module domains/game/services/GameStateServiceInterface
 * @description Interface for game state management and training completion logic
 */

/**
 * Game termination reason
 */
export type GameTerminationReason = 
  | 'checkmate' 
  | 'stalemate' 
  | 'insufficient-material'
  | 'fifty-move-rule'
  | 'threefold-repetition'
  | 'timeout'
  | 'resignation'
  | 'draw-agreement';

/**
 * Training completion result
 */
export interface TrainingCompletionResult {
  /**
   * Whether training was completed successfully
   */
  success: boolean;
  
  /**
   * Reason for completion
   */
  reason: GameTerminationReason;
  
  /**
   * Final game outcome
   */
  outcome: '1-0' | '0-1' | '1/2-1/2';
  
  /**
   * Whether the target outcome was achieved
   */
  targetAchieved: boolean;
  
  /**
   * Performance metrics
   */
  metrics: {
    /**
     * Number of moves made
     */
    moveCount: number;
    
    /**
     * Number of mistakes made
     */
    mistakes: number;
    
    /**
     * Number of hints used
     */
    hintsUsed: number;
    
    /**
     * Accuracy percentage
     */
    accuracy: number;
  };
}

/**
 * Current game state information
 */
export interface GameStateInfo {
  /**
   * Whose turn it is to move
   */
  turn: 'white' | 'black';
  
  /**
   * Whether the current player is in check
   */
  isCheck: boolean;
  
  /**
   * Whether the game is finished
   */
  isGameOver: boolean;
  
  /**
   * Whether it's checkmate
   */
  isCheckmate: boolean;
  
  /**
   * Whether it's stalemate
   */
  isStalemate: boolean;
  
  /**
   * Whether it's a draw
   */
  isDraw: boolean;
  
  /**
   * Reason for game termination (if game is over)
   */
  terminationReason?: GameTerminationReason;
  
  /**
   * Full move number
   */
  fullMoveNumber: number;
  
  /**
   * Half move clock (for fifty-move rule)
   */
  halfMoveClock: number;
}

/**
 * Interface for game state management service
 * 
 * Handles game state queries, training completion logic, and turn management.
 * Extracted from TrainingSlice to provide clean separation of concerns.
 */
export interface GameStateServiceInterface {
  /**
   * Gets the current game state information
   * 
   * @returns Current game state details
   */
  getGameState(): GameStateInfo;
  
  /**
   * Checks if the game is over
   * 
   * @returns Whether the game has ended
   */
  isGameOver(): boolean;
  
  /**
   * Checks if the current position is checkmate
   * 
   * @returns Whether the position is checkmate
   */
  isCheckmate(): boolean;
  
  /**
   * Checks if the current position is stalemate
   * 
   * @returns Whether the position is stalemate
   */
  isStalemate(): boolean;
  
  /**
   * Checks if the current position is a draw
   * 
   * @returns Whether the position is a draw
   */
  isDraw(): boolean;
  
  /**
   * Checks if the current player is in check
   * 
   * @returns Whether the current player is in check
   */
  isCheck(): boolean;
  
  /**
   * Gets whose turn it is to move
   * 
   * @returns Current player to move
   */
  getTurn(): 'white' | 'black';
  
  /**
   * Determines if it's the player's turn based on training configuration
   * 
   * @param colorToTrain - Color the player is training
   * @returns Whether it's the player's turn
   */
  isPlayerTurn(colorToTrain: 'white' | 'black'): boolean;
  
  /**
   * Gets the game termination reason
   * 
   * @returns Reason for game termination or null if game is ongoing
   */
  getTerminationReason(): GameTerminationReason | null;
  
  /**
   * Finalizes training session when game ends
   * 
   * @param reason - The reason the game ended
   * @param targetOutcome - Expected outcome for successful training
   * @param metrics - Performance metrics for the session
   * @returns Training completion result
   */
  finalizeTrainingSession(
    reason: GameTerminationReason,
    targetOutcome: '1-0' | '0-1' | '1/2-1/2',
    metrics: {
      moveCount: number;
      mistakes: number;
      hintsUsed: number;
      accuracy: number;
    }
  ): TrainingCompletionResult;
  
  /**
   * Checks if the training objective has been met
   * 
   * @param targetOutcome - Expected outcome for successful training
   * @returns Whether the training objective was achieved
   */
  isTrainingObjectiveMet(targetOutcome: '1-0' | '0-1' | '1/2-1/2'): boolean;
  
  /**
   * Gets the current game outcome
   * 
   * @returns Game outcome or null if game is ongoing
   */
  getGameOutcome(): '1-0' | '0-1' | '1/2-1/2' | null;
  
  /**
   * Resets the game state service to initial state
   */
  reset(): void;
}