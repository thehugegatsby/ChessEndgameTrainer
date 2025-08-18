/**
 * Chess Piece Validation & Normalization with Zod
 * 
 * This module provides runtime validation and normalization for chess piece data
 * coming from external sources (react-chessboard, FEN parsing, network, etc.)
 * 
 * Key principle: Normalize at boundaries, trust types internally
 */

import { z } from 'zod';

// ============================================================================
// CANONICAL INTERNAL TYPES
// ============================================================================

/**
 * Standard chess piece codes (12 total)
 * Format: [color][piece] where color = w|b, piece = K|Q|R|B|N|P
 */
export const PIECE_CODES = [
  'wK', 'wQ', 'wR', 'wB', 'wN', 'wP',
  'bK', 'bQ', 'bR', 'bB', 'bN', 'bP',
] as const;

export type PieceCode = typeof PIECE_CODES[number];
export type Color = 'w' | 'b';
export type PieceKind = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

/**
 * Canonical internal piece representation
 * All internal code should use this format exclusively
 */
export interface ChessPiece {
  readonly code: PieceCode;
  readonly color: Color;
  readonly kind: PieceKind;
}

/**
 * Chess square notation (a1-h8)
 */
export const SQUARES = [
  'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
  'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8',
  'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8',
  'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8',
  'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8',
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8',
  'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8',
] as const;

export type Square = typeof SQUARES[number];

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

/**
 * Valid piece code schema (runtime validation)
 */
export const PieceCodeSchema = z.enum(PIECE_CODES);

/**
 * Valid square schema (runtime validation)
 */
export const SquareSchema = z.enum(SQUARES);

/**
 * External piece formats that we might receive from react-chessboard or other sources
 * These represent the various ways external libraries send piece data
 */
export const ExternalPieceSchema = z.union([
  // Format 1: Direct string "wK", "bQ", etc.
  PieceCodeSchema,
  
  // Format 2: Object with pieceType property { pieceType: "wK" }
  z.object({
    pieceType: PieceCodeSchema
  }),
  
  // Format 3: Object with type property { type: "wK" }
  z.object({
    type: PieceCodeSchema
  }),
  
  // Format 4: Object with code property { code: "wK" }
  z.object({
    code: PieceCodeSchema
  }),
  
  // Format 5: null/undefined (empty square)
  z.null(),
  z.undefined()
]);

/**
 * Schema for square click events from react-chessboard
 */
export const SquareClickEventSchema = z.object({
  piece: ExternalPieceSchema,
  square: SquareSchema
});

/**
 * Schema for piece drop events from react-chessboard
 */
export const PieceDropEventSchema = z.object({
  sourceSquare: SquareSchema,
  targetSquare: SquareSchema,
  piece: PieceCodeSchema  // onPieceDrop always gets string format
});

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize external piece data to canonical internal format
 * 
 * @param input - Unknown external piece data
 * @returns Normalized ChessPiece or null for empty squares
 * @throws ZodError if input is invalid
 */
export function normalizePieceData(input: unknown): ChessPiece | null {
  const parsed = ExternalPieceSchema.parse(input);
  
  if (parsed === null || parsed === undefined) {
    return null;
  }
  
  let code: PieceCode;
  
  if (typeof parsed === 'string') {
    code = parsed;
  } else if ('pieceType' in parsed) {
    code = parsed.pieceType;
  } else if ('type' in parsed) {
    code = parsed.type;
  } else if ('code' in parsed) {
    code = parsed.code;
  } else {
    // This should never happen due to Zod validation, but TypeScript safety
    throw new Error(`Unexpected piece format: ${JSON.stringify(parsed)}`);
  }
  
  return {
    code,
    color: code[0] as Color,
    kind: code[1] as PieceKind
  };
}

/**
 * Safe version of normalizePieceData that returns Result type instead of throwing
 * Use this in UI code where you want to handle errors gracefully
 */
export function tryNormalizePieceData(input: unknown): 
  | { ok: true; value: ChessPiece | null }
  | { ok: false; error: z.ZodError } {
  
  const result = ExternalPieceSchema.safeParse(input);
  
  if (!result.success) {
    return { ok: false, error: result.error };
  }
  
  try {
    const normalized = normalizePieceData(input);
    return { ok: true, value: normalized };
  } catch (error) {
    // This should not happen if Zod validation passed, but safety net
    return { 
      ok: false, 
      error: new z.ZodError([{
        code: 'custom',
        message: `Normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        path: []
      }])
    };
  }
}

/**
 * Validate and normalize square click event data
 */
export function normalizeSquareClickEvent(input: unknown): {
  piece: ChessPiece | null;
  square: Square;
} {
  const parsed = SquareClickEventSchema.parse(input);
  return {
    piece: normalizePieceData(parsed.piece),
    square: parsed.square
  };
}

/**
 * Validate and normalize piece drop event data
 */
export function normalizePieceDropEvent(input: unknown): {
  sourceSquare: Square;
  targetSquare: Square;
  piece: ChessPiece;
} {
  const parsed = PieceDropEventSchema.parse(input);
  const piece = normalizePieceData(parsed.piece);
  
  if (!piece) {
    throw new Error('Piece drop event cannot have null piece');
  }
  
  return {
    sourceSquare: parsed.sourceSquare,
    targetSquare: parsed.targetSquare,
    piece
  };
}

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

/**
 * Type guard to check if a value is a valid piece code
 */
export function isPieceCode(value: unknown): value is PieceCode {
  return PieceCodeSchema.safeParse(value).success;
}

/**
 * Type guard to check if a value is a valid square
 */
export function isSquare(value: unknown): value is Square {
  return SquareSchema.safeParse(value).success;
}

/**
 * Type guard to check if a value is a normalized ChessPiece
 */
export function isChessPiece(value: unknown): value is ChessPiece {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'color' in value &&
    'kind' in value &&
    isPieceCode((value as Record<string, unknown>)['code'])
  );
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy PieceType for backward compatibility
 * @deprecated Use ChessPiece instead
 */
export type PieceType = PieceCode;

/**
 * Convert legacy PieceType to ChessPiece
 * @deprecated Use normalizePieceData instead
 */
export function legacyPieceTypeToChessPiece(pieceType: PieceType | null): ChessPiece | null {
  return pieceType ? normalizePieceData(pieceType) : null;
}