/**
 * FEN validation using chess.js
 * Simple wrapper around chess.js for consistent FEN validation and normalization
 */

import { Chess } from "chess.js";

/**
 *
 */
export interface FenValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

/**
 * Validates and normalizes a FEN string using chess.js
 * @param fen The FEN string to validate
 * @returns Validation result with normalized FEN
 */
export function validateAndSanitizeFen(fen: string): FenValidationResult {
  if (!fen || typeof fen !== "string") {
    return {
      isValid: false,
      sanitized: "",
      errors: ["FEN must be a valid string"],
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
    const errorMessage = error instanceof Error ? error.message : "Invalid FEN";

    return {
      isValid: false,
      sanitized: trimmedFen, // Return trimmed input on failure
      errors: [errorMessage],
    };
  }
}
