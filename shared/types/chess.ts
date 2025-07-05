/**
 * Core chess domain types
 * Comprehensive type definitions for the chess training application
 */

import { Chess } from 'chess.js';

// Basic chess types
export type Square = string; // e.g., 'e4', 'a1'
export type Piece = 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
export type Color = 'w' | 'b';
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
// Move related types
export interface Move {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san?: string; // Standard Algebraic Notation
  lan?: string; // Long Algebraic Notation
}


// Position types
export interface Position {
  fen: string;
  board: (Piece | null)[][];
  turn: Color;
  castling: {
    w: { k: boolean; q: boolean };
    b: { k: boolean; q: boolean };
  };
  enPassant: Square | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

// Game state types

export interface GameStatus {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isThreefoldRepetition: boolean;
  isInsufficientMaterial: boolean;
  isFiftyMoveRule: boolean;
  isGameOver: boolean;
}

// Training specific types
export interface TrainingPosition {
  id: number;
  name: string;
  fen: string;
  targetSquares?: Square[];
  moveSequence?: Move[];
  hints?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

// Engine related types

// Validation types

// Chess.js instance type (for better typing)
export type ChessInstance = Chess;

// Utility types
export type FEN = string;
export type PGN = string; 