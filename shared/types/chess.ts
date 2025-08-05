/**
 * Core chess domain types
 * Comprehensive type definitions for the chess training application
 */

import {
  Chess,
  Square as ChessJsSquare,
  PieceSymbol as ChessJsPieceSymbol,
} from "chess.js";

// Basic chess types
export type Square = ChessJsSquare; // Use chess.js Square type directly
export type PieceSymbol = ChessJsPieceSymbol; // Use chess.js PieceSymbol type
export type Piece =
  | "p"
  | "n"
  | "b"
  | "r"
  | "q"
  | "k"
  | "P"
  | "N"
  | "B"
  | "R"
  | "Q"
  | "K"; // Keep for FEN/display purposes
export type Color = "w" | "b";
export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
// Move related types - Clean Domain Types
export interface Move {
  color: Color;
  from: Square;
  to: Square;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  promotion?: "q" | "r" | "b" | "n"; // Strict: only valid promotion pieces
  flags: string;
  san: string;
  lan: string;
  fenBefore: string;
  fenAfter: string;
  timestamp?: number;
  // Helper methods (available on chess.js Move instances)
  isCapture: () => boolean;
  isPromotion: () => boolean;
  isEnPassant: () => boolean;
  isKingsideCastle: () => boolean;
  isQueensideCastle: () => boolean;
  isBigPawn: () => boolean;
}

// Brand Types for additional type safety
declare const __domainMoveBrand: unique symbol;
export type DomainMove = Move & { readonly [__domainMoveBrand]: true };

declare const __validatedMoveBrand: unique symbol;
export type ValidatedMove = DomainMove & {
  readonly [__validatedMoveBrand]: true;
};

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
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
}

// Engine related types

// Validation types

// Chess.js instance type (for better typing)
export type ChessInstance = Chess;

// Utility types
export type FEN = string;
export type PGN = string;
