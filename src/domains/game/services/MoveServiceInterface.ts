/**
 * @file Move Service Interface
 * @module domains/game/services/MoveServiceInterface
 * @description Interface for move execution, validation, and history management
 */

import type { ValidatedMove } from '@shared/types/chess';

/**
 * Result of a move attempt
 */
export interface MoveResult {
  /**
   * Whether the move was successful
   */
  success: boolean;
  
  /**
   * The validated move object (if successful)
   */
  move?: ValidatedMove;
  
  /**
   * FEN position after the move
   */
  fenAfter?: string;
  
  /**
   * Error message (if unsuccessful)
   */
  error?: string;
  
  /**
   * Whether the move results in check
   */
  isCheck?: boolean;
  
  /**
   * Whether the move results in checkmate
   */
  isCheckmate?: boolean;
  
  /**
   * Whether the move results in stalemate
   */
  isStalemate?: boolean;
}

/**
 * Move validation result
 */
export interface MoveValidationResult {
  /**
   * Whether the move is legal
   */
  isLegal: boolean;
  
  /**
   * Error message if move is illegal
   */
  error?: string;
  
  /**
   * Move in SAN notation (if legal)
   */
  san?: string;
}

/**
 * Interface for move management service
 * 
 * Handles move execution, validation, and move history management.
 * Extracted from TrainingSlice to provide clean separation of concerns.
 */
export interface MoveServiceInterface {
  /**
   * Makes a move on the current position
   * 
   * @param move - Move to make (UCI, SAN, or move object)
   * @returns Promise resolving to move result
   */
  makeMove(move: string | object): Promise<MoveResult>;
  
  /**
   * Validates a move without executing it
   * 
   * @param move - Move to validate (UCI, SAN, or move object)
   * @returns Promise resolving to validation result
   */
  validateMove(move: string | object): Promise<MoveValidationResult>;
  
  /**
   * Gets all legal moves in the current position
   * 
   * @returns Array of legal moves in SAN notation
   */
  getLegalMoves(): string[];
  
  /**
   * Gets move history for the current game
   * 
   * @returns Array of validated moves
   */
  getMoveHistory(): ValidatedMove[];
  
  /**
   * Adds a move to the training history
   * 
   * @param move - Validated move with training metadata
   */
  addTrainingMove(move: ValidatedMove): void;
  
  /**
   * Clears the move history
   */
  clearMoveHistory(): void;
  
  /**
   * Undoes the last move
   * 
   * @returns Whether undo was successful
   */
  undoLastMove(): boolean;
  
  /**
   * Gets the last move made
   * 
   * @returns Last validated move or null
   */
  getLastMove(): ValidatedMove | null;
  
  /**
   * Checks if a move is a capture
   * 
   * @param move - Move to check
   * @returns Whether the move is a capture
   */
  isCapture(move: string | ValidatedMove): boolean;
  
  /**
   * Checks if a move is a promotion
   * 
   * @param move - Move to check
   * @returns Whether the move is a promotion
   */
  isPromotion(move: string | ValidatedMove): boolean;
  
  /**
   * Gets the piece type that was promoted to (if applicable)
   * 
   * @param move - Move to check
   * @returns Promoted piece type or null
   */
  getPromotionPiece(move: string | ValidatedMove): string | null;
  
  /**
   * Resets the move service to initial state
   */
  reset(): void;
}