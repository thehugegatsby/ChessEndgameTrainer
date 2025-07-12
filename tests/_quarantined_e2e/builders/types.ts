/**
 * @fileoverview Common Types for Test Builders
 * @description Type-safe definitions for chess-related data structures
 * Uses chess.js branded types for consistency
 */

import type { Square } from 'chess.js';

/**
 * Import branded types from chess.js for consistency
 * Note: chess.js doesn't export FenString type, so we create a compatible one
 */
export type FenString = string;

/**
 * Branded type for chess moves in algebraic notation
 */
export type ChessMove = string & { readonly __brand: 'Move' };

/**
 * Type guard for FEN validation
 */
export function isFenString(value: string): value is FenString {
  // Basic FEN validation - can be enhanced
  const fenRegex = /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+ [wb] [KQkq-]+ [a-h1-8-]+ \d+ \d+$/;
  return fenRegex.test(value);
}

/**
 * Helper to create FEN string with validation
 */
export function createFen(value: string): FenString {
  if (!isFenString(value)) {
    throw new Error(`Invalid FEN notation: ${value}`);
  }
  return value;
}

/**
 * Chess piece colors
 */
export type Color = 'w' | 'b';

/**
 * Chess piece types
 */
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/**
 * Complete piece representation
 */
export interface Piece {
  type: PieceType;
  color: Color;
  square?: Square;
}

/**
 * Engine analysis result
 */
export interface EngineAnalysis {
  evaluation: number;
  bestMove: ChessMove;
  depth: number;
  timeMs: number;
  pv?: ChessMove[]; // Principal variation
}

/**
 * Game state representation
 */
export interface GameState {
  fen: FenString;
  turn: Color;
  moveHistory: ChessMove[];
  currentMoveIndex: number;
  evaluation?: number;
  engineAnalysis?: EngineAnalysis;
  isGameOver: boolean;
  result?: '1-0' | '0-1' | '1/2-1/2';
}

/**
 * Position configuration
 */
export interface Position {
  id?: number;
  fen: FenString;
  evaluation?: number;
  bestMove?: ChessMove;
  description?: string;
}

/**
 * Training session configuration
 */
export interface TrainingSession {
  id: string;
  name: string;
  positions: Position[];
  currentPositionIndex: number;
  settings: {
    timePerMove?: number;
    showEvaluation: boolean;
    showBestMove: boolean;
    allowTakebacks: boolean;
  };
  statistics?: {
    correctMoves: number;
    totalMoves: number;
    averageTimePerMove: number;
  };
}

/**
 * Default values for common scenarios
 */
export const DEFAULT_VALUES = {
  INITIAL_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' as FenString,
  EMPTY_FEN: '8/8/8/8/8/8/8/8 w - - 0 1' as FenString,
  OPPOSITION_FEN: '4k3/8/4K3/8/8/8/8/8 w - - 0 1' as FenString,
  BRIDGE_BUILDING_FEN: '8/8/8/8/3K4/8/3P4/3k4 w - - 0 1' as FenString,
} as const;