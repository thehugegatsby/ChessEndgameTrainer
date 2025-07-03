/**
 * FEN validation and sanitization utilities
 * Prevents injection attacks and ensures valid chess positions
 */

export interface FenValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

/**
 * Validates and sanitizes a FEN string
 */
export function validateAndSanitizeFen(fen: string): FenValidationResult {
  const errors: string[] = [];
  
  // Basic sanitization - remove potential dangerous characters
  let sanitized = fen.trim().replace(/[<>'"]/g, '');
  
  // Check for basic FEN structure
  const parts = sanitized.split(' ');
  
  if (parts.length !== 6) {
    errors.push('FEN must have exactly 6 parts separated by spaces');
    return { isValid: false, sanitized, errors };
  }
  
  const [position, activeColor, castling, enPassant, halfmove, fullmove] = parts;
  
  // Validate piece placement (position)
  if (!validatePiecePlacement(position)) {
    errors.push('Invalid piece placement');
  }
  
  // Validate active color
  if (!['w', 'b'].includes(activeColor)) {
    errors.push('Active color must be "w" or "b"');
  }
  
  // Validate castling availability
  if (!validateCastling(castling)) {
    errors.push('Invalid castling availability');
  }
  
  // Validate en passant target square
  if (!validateEnPassant(enPassant)) {
    errors.push('Invalid en passant target square');
  }
  
  // Validate halfmove clock
  if (!validateNumber(halfmove, 0, 100)) {
    errors.push('Invalid halfmove clock');
  }
  
  // Validate fullmove number
  if (!validateNumber(fullmove, 1, 9999)) {
    errors.push('Invalid fullmove number');
  }
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Validates piece placement part of FEN
 */
function validatePiecePlacement(position: string): boolean {
  const ranks = position.split('/');
  if (ranks.length !== 8) return false;
  
  for (const rank of ranks) {
    let squares = 0;
    for (const char of rank) {
      if (/[1-8]/.test(char)) {
        squares += parseInt(char);
      } else if (/[prnbqkPRNBQK]/.test(char)) {
        squares += 1;
      } else {
        return false; // Invalid character
      }
    }
    if (squares !== 8) return false;
  }
  
  return true;
}

/**
 * Validates castling availability
 */
function validateCastling(castling: string): boolean {
  if (castling === '-') return true;
  return /^[KQkq]*$/.test(castling) && castling.length <= 4;
}

/**
 * Validates en passant target square
 */
function validateEnPassant(enPassant: string): boolean {
  if (enPassant === '-') return true;
  return /^[a-h][36]$/.test(enPassant);
}

/**
 * Validates a number within range
 */
function validateNumber(value: string, min: number, max: number): boolean {
  const num = parseInt(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Quick validation for performance-critical paths
 */
export function isValidFenQuick(fen: string): boolean {
  if (!fen || typeof fen !== 'string') return false;
  if (fen.length < 10 || fen.length > 100) return false;
  
  const parts = fen.trim().split(' ');
  return parts.length === 6 && 
         parts[0].includes('/') && 
         ['w', 'b'].includes(parts[1]);
}