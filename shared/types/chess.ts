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
  // Analysis data for post-game review
  evalBefore?: number; // WDL evaluation before move (-2 to 2)
  evalAfter?: number; // WDL evaluation after move (-2 to 2)
  bestMoveSan?: string; // Best move in algebraic notation
  moveQuality?: "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
  dtzBefore?: number | null; // Distance to zeroing before move
  dtzAfter?: number | null; // Distance to zeroing after move
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

/**
 * Type-safe factory for creating ValidatedMove from chess.js Move
 *
 * @param chessMove - Move result from chess.js
 * @param fenBefore - FEN string before the move
 * @param fenAfter - FEN string after the move
 * @returns Type-safe ValidatedMove with all required properties
 *
 * @example
 * ```typescript
 * const chessMove = game.move('e4');
 * const validatedMove = createValidatedMove(chessMove, game.fen(), gameCopy.fen());
 * ```
 */
export function createValidatedMove(
  chessMove: import("chess.js").Move,
  fenBefore: string,
  fenAfter: string,
): ValidatedMove {
  const domainMove: Move = {
    color: chessMove.color,
    from: chessMove.from,
    to: chessMove.to,
    piece: chessMove.piece,
    captured: chessMove.captured,
    promotion: chessMove.promotion as "q" | "r" | "b" | "n" | undefined,
    flags: chessMove.flags,
    san: chessMove.san,
    lan: chessMove.lan,
    fenBefore,
    fenAfter,
    timestamp: Date.now(),

    // Helper methods
    isCapture: () => !!chessMove.captured,
    isPromotion: () => !!chessMove.promotion,
    isEnPassant: () => chessMove.flags.includes("e"),
    isKingsideCastle: () => chessMove.flags.includes("k"),
    isQueensideCastle: () => chessMove.flags.includes("q"),
    isBigPawn: () => chessMove.flags.includes("b"),
  };

  return domainMove as ValidatedMove;
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
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
}

// Analysis related types

// Validation types

// Chess.js instance type (for better typing)
export type ChessInstance = Chess;

// Utility types
export type FEN = string;
export type PGN = string;
