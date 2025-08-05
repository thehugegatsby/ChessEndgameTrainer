/**
 * @file Chess position validation utilities
 * @module lib/chess/validation
 *
 * @description
 * Provides comprehensive FEN (Forsyth-Edwards Notation) validation utilities
 * for chess positions. Combines syntactic validation with chess rule validation
 * to ensure positions are both well-formed and legal according to chess rules.
 *
 * @remarks
 * Key validation features:
 * - Syntactic FEN structure validation (6 parts, proper format)
 * - Chess rule validation using chess.js library
 * - Piece count limits and promotion scenario validation
 * - King presence and castling rights validation
 * - Character encoding and whitespace validation
 *
 * The validation is performed in two stages:
 * 1. Fast syntactic checks to catch obvious errors
 * 2. Chess.js library validation for comprehensive rule checking
 */

import { Chess } from "chess.js";
import { CHESS } from "../../constants";

/**
 * Validates a FEN string for correctness
 *
 * @param {string} fen - The FEN string to validate
 * @returns {boolean} True if the FEN is valid, false otherwise
 *
 * @description
 * Performs comprehensive validation of a FEN string including syntactic
 * structure checks and chess rule validation. Uses a two-stage approach
 * for efficient validation with early rejection of malformed strings.
 *
 * @remarks
 * Validation checks performed:
 * - Null/undefined/empty string checks
 * - Correct number of FEN parts (exactly 6)
 * - Proper character encoding (no special chars or non-ASCII)
 * - Castling rights format validation
 * - Piece count limits and king presence
 * - Promotion scenario validation
 * - Final chess.js rule validation
 *
 * @example
 * ```typescript
 * // Valid starting position
 * isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') // true
 *
 * // Invalid: missing parts
 * isValidFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR') // false
 *
 * // Invalid: impossible piece count
 * isValidFen('QQQQQQQQ/8/8/8/8/8/8/qqqqqqqq w - - 0 1') // false
 * ```
 */
export function isValidFen(fen: string): boolean {
  // Check for null/undefined
  if (!fen || typeof fen !== "string") {
    return false;
  }

  // Trim and check for empty string
  const trimmedFen = fen.trim();
  if (!trimmedFen) {
    return false;
  }

  // Check for correct number of parts (should be exactly 6)
  const parts = trimmedFen.split(/\s+/);
  if (parts.length !== 6) {
    return false;
  }

  // Check for extra spaces
  if (fen !== trimmedFen || fen.includes("  ")) {
    return false;
  }

  // Check for special characters and non-ASCII
  if (!/^[a-zA-Z0-9\/\-\s]+$/.test(fen)) {
    return false;
  }

  // Check castling availability part (should only contain K, Q, k, q, or -)
  const castling = parts[2];
  if (!/^(-|[KQkq]+)$/.test(castling)) {
    return false;
  }

  // Check for duplicate castling rights
  if (castling !== "-") {
    const chars = castling.split("");
    if (new Set(chars).size !== chars.length) {
      return false;
    }
  }

  // Additional chess logic validation before chess.js
  // Check piece counts to prevent impossible positions
  const boardPart = parts[0];
  const pieceCounts = {
    K: 0,
    Q: 0,
    R: 0,
    B: 0,
    N: 0,
    P: 0,
    k: 0,
    q: 0,
    r: 0,
    b: 0,
    n: 0,
    p: 0,
  };

  for (const char of boardPart) {
    if (pieceCounts.hasOwnProperty(char)) {
      pieceCounts[char as keyof typeof pieceCounts]++;
    }
  }

  // Each side must have exactly one king
  if (pieceCounts.K !== 1 || pieceCounts.k !== 1) {
    return false;
  }

  // Check for reasonable piece limits (standard chess has max 16 pieces per side)
  const whitePieces =
    pieceCounts.K +
    pieceCounts.Q +
    pieceCounts.R +
    pieceCounts.B +
    pieceCounts.N +
    pieceCounts.P;
  const blackPieces =
    pieceCounts.k +
    pieceCounts.q +
    pieceCounts.r +
    pieceCounts.b +
    pieceCounts.n +
    pieceCounts.p;

  if (
    whitePieces > CHESS.MAX_PIECES_PER_SIDE ||
    blackPieces > CHESS.MAX_PIECES_PER_SIDE
  ) {
    return false;
  }

  // Check for too many pawns (max 8 per side)
  if (
    pieceCounts.P > CHESS.MAX_PAWNS_PER_SIDE ||
    pieceCounts.p > CHESS.MAX_PAWNS_PER_SIDE
  ) {
    return false;
  }

  // Check for reasonable promotion scenarios
  // If more than starting pieces of any type, pawns must have been promoted
  const whiteStarting = CHESS.STARTING_PIECES.WHITE;
  const blackStarting = CHESS.STARTING_PIECES.BLACK;

  const whitePromotions =
    Math.max(0, pieceCounts.Q - whiteStarting.Q) +
    Math.max(0, pieceCounts.R - whiteStarting.R) +
    Math.max(0, pieceCounts.B - whiteStarting.B) +
    Math.max(0, pieceCounts.N - whiteStarting.N);

  const blackPromotions =
    Math.max(0, pieceCounts.q - blackStarting.q) +
    Math.max(0, pieceCounts.r - blackStarting.r) +
    Math.max(0, pieceCounts.b - blackStarting.b) +
    Math.max(0, pieceCounts.n - blackStarting.n);

  // Pawns available for promotion = starting pawns - current pawns
  const whitePawnsForPromotion = whiteStarting.P - pieceCounts.P;
  const blackPawnsForPromotion = blackStarting.p - pieceCounts.p;

  // Can't have more promotions than pawns that could have been promoted
  if (
    whitePromotions > whitePawnsForPromotion ||
    blackPromotions > blackPawnsForPromotion
  ) {
    return false;
  }

  try {
    new Chess(fen);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates a FEN string and returns detailed validation result
 *
 * @param {string} fen - The FEN string to validate
 * @returns {{ isValid: boolean; error?: string }} Validation result with optional error message
 *
 * @description
 * Extended validation function that provides detailed error information
 * when validation fails. Uses the same validation logic as isValidFen
 * but returns structured result with German error messages for user display.
 *
 * @example
 * ```typescript
 * // Valid position
 * const result1 = validateFen('rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4');
 * // { isValid: true }
 *
 * // Invalid position
 * const result2 = validateFen('invalid-fen');
 * // { isValid: false, error: 'Ungültiger FEN-String' }
 * ```
 */
export function validateFen(fen: string): { isValid: boolean; error?: string } {
  // Use the same validation logic as isValidFen
  if (!isValidFen(fen)) {
    return {
      isValid: false,
      error: "Ungültiger FEN-String",
    };
  }

  try {
    new Chess(fen);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Ungültiger FEN-String",
    };
  }
}
