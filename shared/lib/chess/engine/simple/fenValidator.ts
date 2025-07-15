/**
 * FEN validation utility to prevent command injection attacks
 */

export interface FenValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

/**
 * Validates and sanitizes FEN strings to prevent UCI command injection
 * @param fen The FEN string to validate
 * @returns Validation result with sanitized FEN if valid
 */
export function validateAndSanitizeFen(fen: string): FenValidationResult {
  const errors: string[] = [];
  
  // Basic null/empty check
  if (!fen || typeof fen !== 'string') {
    errors.push('FEN must be a non-empty string');
    return { isValid: false, errors };
  }

  // Trim whitespace
  const trimmed = fen.trim();
  
  // Check for dangerous characters that could be used for injection
  const dangerousChars = /[;&|`$(){}[\]<>]/;
  if (dangerousChars.test(trimmed)) {
    errors.push('FEN contains invalid characters');
    return { isValid: false, errors };
  }

  // Basic FEN structure validation
  const fenRegex = /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[bw]\s[KQkq-]+\s[a-h1-8-]+\s\d+\s\d+$/;
  if (!fenRegex.test(trimmed)) {
    errors.push('Invalid FEN format');
    return { isValid: false, errors };
  }

  // Split into components for detailed validation
  const parts = trimmed.split(' ');
  if (parts.length !== 6) {
    errors.push('FEN must have exactly 6 space-separated parts');
    return { isValid: false, errors };
  }

  const [position, activeColor, castling, enPassant, halfmove, fullmove] = parts;

  // Validate position part
  const ranks = position.split('/');
  if (ranks.length !== 8) {
    errors.push('Position must have exactly 8 ranks');
    return { isValid: false, errors };
  }

  // Validate each rank
  for (let i = 0; i < ranks.length; i++) {
    const rank = ranks[i];
    if (!/^[rnbqkpRNBQKP1-8]+$/.test(rank)) {
      errors.push(`Invalid characters in rank ${i + 1}`);
      return { isValid: false, errors };
    }
    
    // Check that rank sums to 8 squares
    let squares = 0;
    for (const char of rank) {
      if (/[1-8]/.test(char)) {
        squares += parseInt(char);
      } else if (/[rnbqkpRNBQKP]/.test(char)) {
        squares += 1;
      }
    }
    if (squares !== 8) {
      errors.push(`Rank ${i + 1} doesn't sum to 8 squares`);
      return { isValid: false, errors };
    }
  }

  // Validate active color
  if (activeColor !== 'w' && activeColor !== 'b') {
    errors.push('Active color must be "w" or "b"');
    return { isValid: false, errors };
  }

  // Validate castling rights
  if (!/^[KQkq-]+$/.test(castling)) {
    errors.push('Invalid castling rights format');
    return { isValid: false, errors };
  }

  // Validate en passant square
  if (enPassant !== '-' && !/^[a-h][36]$/.test(enPassant)) {
    errors.push('Invalid en passant square');
    return { isValid: false, errors };
  }

  // Validate halfmove clock
  const halfmoveNum = parseInt(halfmove);
  if (isNaN(halfmoveNum) || halfmoveNum < 0 || halfmoveNum > 50) {
    errors.push('Invalid halfmove clock');
    return { isValid: false, errors };
  }

  // Validate fullmove number
  const fullmoveNum = parseInt(fullmove);
  if (isNaN(fullmoveNum) || fullmoveNum < 1) {
    errors.push('Invalid fullmove number');
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: trimmed
  };
}

/**
 * Quick validation for FEN strings (less thorough but faster)
 * @param fen The FEN string to validate
 * @returns True if FEN appears valid
 */
export function isValidFen(fen: string): boolean {
  return validateAndSanitizeFen(fen).isValid;
}