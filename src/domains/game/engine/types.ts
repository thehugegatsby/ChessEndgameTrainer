/**
 * @file Game Engine Types
 * @description Type definitions for the chess game engine
 */

import type { Square, Move as ChessJsMove } from 'chess.js';

/**
 * Chess game logic interface for abstracting chess.js
 * Provides mobile-compatible abstraction layer for game rules and mechanics
 */
export interface ChessGameLogicInterface {
  // Position Management
  loadFen(fen: string): boolean;
  getFen(): string;
  
  // Move Operations
  makeMove(move: MoveInput): ChessJsMove | null;
  validateMove(move: MoveInput): boolean;
  getValidMoves(square?: Square): ChessJsMove[];
  isMoveLegal(move: MoveInput): boolean;
  
  // Game Status
  isGameOver(): boolean;
  isCheckmate(): boolean;
  isStalemate(): boolean;
  isDraw(): boolean;
  isCheck(): boolean;
  getTurn(): 'w' | 'b';
  
  // History
  undo(): ChessJsMove | null;
  getHistory(): ChessJsMove[];
  
  // German Notation Support (Note: parseGermanMove is private implementation detail)
}

/**
 * Move input types supporting various formats
 */
export type MoveInput = 
  | string                                    // SAN notation: "e4", "Nf3", "O-O"
  | { from: Square; to: Square; promotion?: string }  // Object notation
  | ChessJsMove;                             // Full chess.js move

/**
 * Game position with metadata
 */
export interface GamePosition {
  fen: string;
  turn: 'w' | 'b';
  moveHistory: ChessJsMove[];
  gameStatus: {
    isGameOver: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
    isCheck: boolean;
    gameResult: string | null;
  };
}

/**
 * German and English promotion piece mapping
 * Maps both German and English piece notation to chess.js format
 */
export const PIECE_NOTATION_MAP = {
  // German notation
  'D': 'q', 'd': 'q', // Dame (Queen)
  'T': 'r', 't': 'r', // Turm (Rook)
  'L': 'b', 'l': 'b', // Läufer (Bishop)  
  'S': 'n', 's': 'n', // Springer (Knight)
  // English notation
  'Q': 'q', 'q': 'q', // Queen
  'R': 'r', 'r': 'r', // Rook
  'B': 'b', 'b': 'b', // Bishop
  'N': 'n', 'n': 'n', // Knight
} as const;

/**
 * Legacy alias for backwards compatibility
 * @deprecated Use PIECE_NOTATION_MAP instead
 */
export const GERMAN_PIECES = {
  'D': 'q', // Dame (Queen)
  'd': 'q',
  'T': 'r', // Turm (Rook)
  't': 'r',
  'L': 'b', // Läufer (Bishop)
  'l': 'b',
  'S': 'n', // Springer (Knight)
  's': 'n',
} as const;