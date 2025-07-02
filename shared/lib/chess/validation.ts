import { Chess } from 'chess.js';

export function isValidFen(fen: string): boolean {
  // Check for null/undefined
  if (!fen || typeof fen !== 'string') {
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
  if (fen !== trimmedFen || fen.includes('  ')) {
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
  if (castling !== '-') {
    const chars = castling.split('');
    if (new Set(chars).size !== chars.length) {
      return false;
    }
  }
  
  try {
    new Chess(fen);
    return true;
  } catch (error) {
    return false;
  }
}

export function validateFen(fen: string): { isValid: boolean; error?: string } {
  // Use the same validation logic as isValidFen
  if (!isValidFen(fen)) {
    return {
      isValid: false,
      error: 'Ungültiger FEN-String'
    };
  }
  
  try {
    new Chess(fen);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Ungültiger FEN-String'
    };
  }
} 