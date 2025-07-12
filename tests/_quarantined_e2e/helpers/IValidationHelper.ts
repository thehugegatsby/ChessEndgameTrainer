/**
 * Interface for ValidationHelper
 * Provides type definitions for validation utilities
 */

export interface IValidationHelper {
  validateFEN(fen: string): boolean;
  validateSAN(san: string): boolean;
  isMoveLegal(fen: string, move: string): boolean;
  coordinateToSAN(fen: string, coordinateMove: string): string | null;
  getLegalMoves(fen: string, square?: string): string[];
  isCheckmate(fen: string): boolean;
  isStalemate(fen: string): boolean;
  isDraw(fen: string): boolean;
  isInsufficientMaterial(fen: string): boolean;
  isInCheck(fen: string): boolean;
  getGameStatus(fen: string): {
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
    isInsufficientMaterial: boolean;
    isInCheck: boolean;
    isGameOver: boolean;
    turn: 'w' | 'b';
  } | null;
  validatePGN(pgn: string): boolean;
  pgnToFEN(pgn: string): string | null;
  getMovesFromPGN(pgn: string): string[];
}