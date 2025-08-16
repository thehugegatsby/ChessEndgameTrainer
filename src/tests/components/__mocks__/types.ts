/**
 * @fileoverview Mock types for testing
 */

export interface Position {
  fen: string;
  turn: 'w' | 'b';
  moveNumber?: number;
}

export interface Piece {
  type: string;
  color: 'white' | 'black';
  square: string;
}

export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
}

export type FenString = string;
