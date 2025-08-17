/**
 * @file Move Service Interface
 * @module domains/game/services/MoveServiceInterface
 * @description Interface for move execution, validation, and history management
 * Following "Fat Service, Thin Slice" pattern with rich return types
 */

import type { ValidatedMove } from '@shared/types/chess';

/**
 * Rich result of a move attempt - contains all derived state
 * Following "Fat Service, Thin Slice" pattern
 */
export interface MakeMoveResult {
  /**
   * FEN position after the move (null if move failed)
   */
  newFen: string | null;
  
  /**
   * The executed move object (null if move failed)
   */
  move: ValidatedMove | null;
  
  /**
   * Updated PGN string after the move
   */
  pgn: string;
  
  /**
   * Whether the move results in checkmate
   */
  isCheckmate: boolean;
  
  /**
   * Whether the move results in stalemate
   */
  isStalemate: boolean;
  
  /**
   * Whether the move results in check
   */
  isCheck: boolean;
  
  /**
   * Whether the position is a draw
   */
  isDraw: boolean;
  
  /**
   * Whether the move is a capture
   */
  isCapture: boolean;
  
  /**
   * Whether the move is a promotion
   */
  isPromotion: boolean;
  
  /**
   * Whether the move is castling
   */
  isCastling: boolean;
  
  /**
   * Error message if move failed
   */
  error?: string;
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
 * Input type for moves - flexible to support different notations
 */
export interface MoveInput {
  from: string;
  to: string;
  promotion?: string;
}

/**
 * Interface for move management service
 * 
 * STATELESS service following "Fat Service, Thin Slice" pattern
 * Services handle complex logic, return rich data for simple slice updates
 */
export interface MoveServiceInterface {
  /**
   * Makes a user move with comprehensive result data
   * 
   * @param currentFen - Current position FEN
   * @param move - Move to make
   * @returns Rich result with all derived game state
   */
  makeUserMove(currentFen: string, move: MoveInput): MakeMoveResult;
}