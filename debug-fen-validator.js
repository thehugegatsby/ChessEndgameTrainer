// Debug script to test FEN validation behavior
// Testing the exact FEN mismatch issue

function validatePiecePlacement(position) {
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

function validateCastling(castling) {
  if (castling === '-') return true;
  return /^[KQkq]*$/.test(castling) && castling.length <= 4;
}

function validateEnPassant(enPassant) {
  if (enPassant === '-') return true;
  return /^[a-h][36]$/.test(enPassant);
}

function validateNumber(value, min, max) {
  const num = parseInt(value);
  return !isNaN(num) && num >= min && num <= max;
}

function validateAndSanitizeFen(fen) {
  const errors = [];
  
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

console.log('=== TESTING VALIDATEANDSANITIZEFEN ===');

const testCases = [
  '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',  // Expected: K+P vs K
  '4k3/8/4K3/8/8/8/8/8 w - - 0 1',     // Actual: K vs K
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'  // Standard starting
];

testCases.forEach((fen, index) => {
  console.log(`\n--- Test Case ${index + 1} ---`);
  console.log('Input FEN:', fen);
  
  const result = validateAndSanitizeFen(fen);
  console.log('Is Valid:', result.isValid);
  console.log('Sanitized:', result.sanitized);
  console.log('Errors:', result.errors);
  
  // Check if sanitized differs from input
  if (result.sanitized !== fen) {
    console.log('*** SANITIZATION CHANGED FEN! ***');
    console.log('Original:', fen);
    console.log('Sanitized:', result.sanitized);
  }
});