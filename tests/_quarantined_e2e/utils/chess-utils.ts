/**
 * @fileoverview Chess utilities for E2E tests
 * @description Pure functions for chess validation and parsing using chess.js
 * Uses Result<T, E> pattern for explicit error handling
 */

import { Chess } from 'chess.js';

/**
 * Result type for explicit error handling
 * Forces callers to handle both success and failure cases
 */
type Ok<T> = { isOk: true; value: T };
type Err<E> = { isOk: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ isOk: true, value });
export const err = <E>(error: E): Err<E> => ({ isOk: false, error });

/**
 * Validate FEN string using chess.js
 * @param fen - FEN notation string
 * @returns Result with validated FEN or error
 */
export function validateFEN(fen: string): Result<string, Error> {
  if (!fen || typeof fen !== 'string') {
    return err(new Error('FEN must be a non-empty string'));
  }
  
  try {
    const chess = new Chess(fen);
    return ok(chess.fen()); // Return normalized FEN
  } catch (error) {
    return err(new Error(`Invalid FEN: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * Check if a move is legal in a given position
 * @param fen - Current position as FEN
 * @param move - Move in various formats (SAN, UCI, or object)
 * @returns Result with move details or error
 */
export function isMoveLegal(
  fen: string,
  move: string | { from: string; to: string; promotion?: string }
): Result<{ from: string; to: string; san: string; lan: string }, Error> {
  const fenResult = validateFEN(fen);
  if (!fenResult.isOk) {
    return err(fenResult.error);
  }
  
  try {
    const chess = new Chess(fenResult.value);
    const result = chess.move(move);
    
    if (!result) {
      return err(new Error(`Illegal move: ${typeof move === 'string' ? move : `${move.from}-${move.to}`}`));
    }
    
    return ok({
      from: result.from,
      to: result.to,
      san: result.san,
      lan: result.lan
    });
  } catch (error) {
    return err(new Error(`Move validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * Parse move notation from various formats
 * Supports: e2e4, e2-e4, e2 e4, Nf3, etc.
 * @param move - Move notation
 * @returns Result with parsed move or error
 */
export function parseMoveNotation(move: string): Result<{ from: string; to: string }, Error> {
  if (!move || typeof move !== 'string') {
    return err(new Error('Move must be a non-empty string'));
  }
  
  // Clean the move
  const cleanMove = move.replace(/[\s-]/g, '');
  
  // Try UCI format (e2e4)
  const uciMatch = cleanMove.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);
  if (uciMatch) {
    return ok({
      from: uciMatch[1],
      to: uciMatch[2]
    });
  }
  
  // For SAN moves, we need a board position to parse correctly
  // This is a limitation - SAN parsing requires context
  return err(new Error(`Cannot parse move '${move}' without board context. Use isMoveLegal() for SAN moves.`));
}

/**
 * Get all legal moves for a position
 * @param fen - Position as FEN
 * @returns Result with array of legal moves or error
 */
export function getLegalMoves(fen: string): Result<string[], Error> {
  const fenResult = validateFEN(fen);
  if (!fenResult.isOk) {
    return err(fenResult.error);
  }
  
  try {
    const chess = new Chess(fenResult.value);
    const moves = chess.moves({ verbose: false });
    return ok(moves);
  } catch (error) {
    return err(new Error(`Failed to get legal moves: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * Check game status
 * @param fen - Position as FEN
 * @returns Result with game status or error
 */
export function getGameStatus(fen: string): Result<{
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  isInsufficientMaterial: boolean;
  isThreefoldRepetition: boolean;
}, Error> {
  const fenResult = validateFEN(fen);
  if (!fenResult.isOk) {
    return err(fenResult.error);
  }
  
  try {
    const chess = new Chess(fenResult.value);
    return ok({
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
      isInsufficientMaterial: chess.isInsufficientMaterial(),
      isThreefoldRepetition: chess.isThreefoldRepetition()
    });
  } catch (error) {
    return err(new Error(`Failed to get game status: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * Compare two FEN positions (ignoring move counts and clocks)
 * @param fen1 - First FEN
 * @param fen2 - Second FEN
 * @returns true if board positions are the same
 */
export function compareFENPositions(fen1: string, fen2: string): boolean {
  const extractPosition = (fen: string) => fen.split(' ')[0];
  return extractPosition(fen1) === extractPosition(fen2);
}