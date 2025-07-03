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
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

// Move related types
export interface Move {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san?: string; // Standard Algebraic Notation
  lan?: string; // Long Algebraic Notation
}

export interface DetailedMove extends Move {
  piece: Piece;
  captured?: Piece;
  flags: string;
  san: string;
  lan: string;
  before: string; // FEN before move
  after: string;  // FEN after move
}

// Position types
export interface Position {
  fen: string;
  board: BoardState;
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

export type BoardState = (Piece | null)[][];

export interface CastlingRights {
  w: { k: boolean; q: boolean };
  b: { k: boolean; q: boolean };
}

// Game state types
export interface GameState {
  position: Position;
  history: DetailedMove[];
  status: GameStatus;
  pgn: string;
}

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
export interface EngineMove {
  bestMove: string;
  ponder?: string;
  score: EngineScore;
  depth: number;
  nodes: number;
  time: number;
  pv: string[]; // Principal variation
}

export interface EngineScore {
  unit: 'cp' | 'mate';
  value: number;
}

// Validation types
export interface MoveValidation {
  isValid: boolean;
  isLegal: boolean;
  error?: string;
  suggestedMoves?: Move[];
}

// Chess.js instance type (for better typing)
export type ChessInstance = Chess;

// Utility types
export type MoveNotation = string; // e.g., 'e2e4', 'Nf3'
export type FEN = string;
export type PGN = string;

// Event types for chess interactions
export interface ChessMoveEvent {
  move: Move;
  position: Position;
  isPlayerMove: boolean;
  timestamp: number;
}

export interface ChessClickEvent {
  square: Square;
  piece?: Piece;
  possibleMoves?: Square[];
} 