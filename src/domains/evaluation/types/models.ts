/**
 * Tablebase Models - Domain Value Objects
 *
 * These are the concrete implementations and utility types
 * used throughout the tablebase feature.
 */

import type { TablebaseOutcome } from './interfaces';
import type { TablebaseError } from './interfaces';

/**
 * Zod schema for API response validation
 * Ensures runtime type safety for external data
 */
import { z } from 'zod';

// API Move Schema
export const TablebaseApiMoveSchema = z.object({
  uci: z.string(),
  san: z.string(),
  wdl: z.number(),
  dtz: z.number().nullable(),
  dtm: z.number().nullable().optional(),
  category: z.string(),
});

// API Response Schema
export const TablebaseApiResponseSchema = z.object({
  wdl: z.number(),
  dtz: z.number().nullable(),
  dtm: z.number().nullable().optional(),
  category: z.string(),
  moves: z.array(TablebaseApiMoveSchema),
});

/**
 * FEN validation utilities
 */
export const FenUtils = {
  /**
   * Check if a FEN string is valid
   * @param fen - FEN string to validate
   * @returns true if valid
   */
  isValid(fen: string): boolean {
    const parts = fen.split(' ');

    // Basic FEN must have at least 2 parts (position and turn)
    if (parts.length < 2) return false;

    // Check turn indicator
    const turn = parts[1];
    if (!turn || !['w', 'b'].includes(turn)) return false;

    // Check piece placement (simplified validation)
    const position = parts[0];
    if (!position) return false;

    const ranks = position.split('/');
    if (ranks.length !== 8) return false;

    return true;
  },

  /**
   * Extract the player to move from FEN
   * @param fen - FEN string
   * @returns 'w' for white, 'b' for black
   */
  getActiveColor(fen: string): 'w' | 'b' {
    const parts = fen.split(' ');
    return parts[1] as 'w' | 'b';
  },

  /**
   * Check if Black is to move
   * @param fen - FEN string
   * @returns true if Black's turn
   */
  isBlackToMove(fen: string): boolean {
    return this.getActiveColor(fen) === 'b';
  },

  /**
   * Count pieces in a FEN position
   * @param fen - FEN string
   * @returns Number of pieces on the board
   */
  countPieces(fen: string): number {
    const position = fen.split(' ')[0];
    if (!position) return 0;
    return position.replace(/[^a-zA-Z]/g, '').length;
  },
};

/**
 * WDL (Win/Draw/Loss) conversion utilities
 */
export const WdlUtils = {
  /**
   * Convert numeric WDL to outcome
   * @param wdl - Numeric WDL value
   * @returns Outcome category
   */
  toOutcome(wdl: number): TablebaseOutcome {
    if (wdl > 0) return 'win';
    if (wdl < 0) return 'loss';
    return 'draw';
  },

  /**
   * Invert WDL for perspective change
   * @param wdl - Original WDL value
   * @returns Inverted WDL
   */
  invert(wdl: number): number {
    return -wdl;
  },
};

/**
 * Configuration constants
 */
export const TablebaseConfig = {
  /** Maximum pieces for tablebase lookup (Lichess limit) */
  MAX_PIECES: 7,

  /** Default number of moves to return */
  DEFAULT_MOVE_LIMIT: 3,

  /** API base URL */
  API_BASE_URL: 'https://tablebase.lichess.ovh/standard',

  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT: 5000,

  /** Maximum retry attempts */
  MAX_RETRIES: 3,

  /** Exponential backoff base delay in ms */
  BACKOFF_BASE_DELAY: 1000,
} as const;

/**
 * Type guards for runtime type checking
 */
export const TypeGuards = {
  /**
   * Check if a value is a valid outcome
   */
  isOutcome(value: unknown): value is TablebaseOutcome {
    return typeof value === 'string' && ['win', 'draw', 'loss'].includes(value);
  },

  /**
   * Check if an error is a TablebaseError
   */
  isTablebaseError(error: unknown): error is TablebaseError {
    return error instanceof Error && error.name === 'TablebaseError';
  },
};
