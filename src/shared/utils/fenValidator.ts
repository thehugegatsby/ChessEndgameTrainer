/**
 * FEN validation using chess.js
 * Simple wrapper around chess.js for consistent FEN validation and normalization
 */

import { Chess } from 'chess.js';

/**
 * Result of FEN string validation
 * @interface FenValidationResult
 * @property {boolean} isValid - Whether the FEN string represents a valid chess position
 * @property {string} sanitized - Normalized FEN string (canonical form from chess.js)
 * @property {string[]} errors - Array of validation error messages if FEN is invalid
 */
export interface FenValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

/**
 * Validates and normalizes a FEN string using chess.js
 *
 * @param {string} fen - The FEN string to validate (Forsyth-Edwards Notation)
 * @returns {FenValidationResult} Validation result with normalized FEN
 *
 * @example
 * // Valid starting position
 * import { getLogger } from '@shared/services/logging/Logger';
 * const logger = getLogger();
 * const result = validateAndSanitizeFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
 * logger.info("Is valid:", result.isValid); // true
 * logger.info("Sanitized:", result.sanitized); // Normalized FEN from chess.js
 *
 * @example
 * // Invalid FEN (too many kings)
 * import { getLogger } from '@shared/services/logging/Logger';
 * const logger = getLogger();
 * const result = validateAndSanitizeFen("K7/K7/8/8/8/8/8/k7 w - - 0 1");
 * logger.warn("Is valid:", result.isValid); // false
 * logger.warn("Errors:", result.errors); // ["Invalid FEN: too many kings"]
 *
 * @remarks
 * This is a thin wrapper around chess.js validation. We use chess.js because:
 * - It provides comprehensive FEN validation including piece placement rules
 * - It normalizes FEN to canonical form (important for caching)
 * - It gives descriptive error messages for debugging
 *
 * @performance O(n) where n is FEN string length, typically <1ms
 */
export function validateAndSanitizeFen(fen: string): FenValidationResult {
  if (!fen || typeof fen !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      errors: ['FEN must be a valid string'],
    };
  }

  const trimmedFen = fen.trim();

  try {
    // chess.js constructor throws on invalid FEN
    const chess = new Chess(trimmedFen);

    // Return normalized FEN from chess.js
    return {
      isValid: true,
      sanitized: chess.fen(), // Normalized/canonical FEN
      errors: [],
    };
  } catch (error) {
    // chess.js provides descriptive error messages
    const errorMessage = error instanceof Error ? error.message : 'Invalid FEN';

    return {
      isValid: false,
      sanitized: trimmedFen, // Return trimmed input on failure
      errors: [errorMessage],
    };
  }
}
