/**
 * @fileoverview ChessEngine FEN Validation & Sanitization
 * @version 3.0.0 - Architectural Simplification
 * @description Consolidated FEN validation from InstanceManager + existing utilities
 * 
 * CONSOLIDATION STRATEGY:
 * - Absorbs InstanceManager.validateFen() patterns
 * - Reuses proven fenValidator.ts utilities
 * - Adds ChessEngine-specific validation requirements
 * - Mobile-optimized validation with performance considerations
 */

import { validateAndSanitizeFen, isValidFenQuick } from '../../../utils/fenValidator';
import type { FenValidationResult } from './interfaces';

// Re-export base validation functions for convenience
export { isValidFenQuick } from '../../../utils/fenValidator';

/**
 * Enhanced FEN validation for ChessEngine
 * Adds chess-specific validation beyond basic FEN structure
 * 
 * @param fen - FEN string to validate
 * @returns Validation result with enhanced chess logic checks
 */
export function validateChessEngineFen(fen: string): FenValidationResult {
  // Quick rejection for obviously invalid FENs (performance optimization)
  if (!isValidFenQuick(fen)) {
    return {
      isValid: false,
      sanitized: fen?.toString() || '',
      errors: ['FEN fails basic structure validation']
    };
  }
  
  // Use existing comprehensive validation
  const baseResult = validateAndSanitizeFen(fen);
  
  if (!baseResult.isValid) {
    return baseResult;
  }
  
  // Additional chess logic validation
  const chessErrors: string[] = [];
  
  try {
    // Validate chess-specific rules
    validateChessLogic(baseResult.sanitized, chessErrors);
  } catch (error) {
    chessErrors.push(`Chess validation error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return {
    isValid: baseResult.isValid && chessErrors.length === 0,
    sanitized: baseResult.sanitized,
    errors: [...baseResult.errors, ...chessErrors]
  };
}

/**
 * Validate chess-specific logic rules
 * Checks that go beyond FEN format validation
 * 
 * @param fen - Sanitized FEN string
 * @param errors - Array to collect validation errors
 */
function validateChessLogic(fen: string, errors: string[]): void {
  const [position, activeColor, castling, enPassant] = fen.split(' ');
  
  // Count kings - must have exactly 2
  const kingCount = (position.match(/[Kk]/g) || []).length;
  if (kingCount !== 2) {
    errors.push(`Invalid king count: ${kingCount} (must be exactly 2)`);
  }
  
  // Check king colors
  const whiteKings = (position.match(/K/g) || []).length;
  const blackKings = (position.match(/k/g) || []).length;
  
  if (whiteKings !== 1) {
    errors.push(`Invalid white king count: ${whiteKings} (must be exactly 1)`);
  }
  
  if (blackKings !== 1) {
    errors.push(`Invalid black king count: ${blackKings} (must be exactly 1)`);
  }
  
  // Validate pawn placement - cannot be on rank 1 or 8
  if (validatePawnPlacement(position, errors)) {
    // Only validate promotion if pawn placement is valid
    validatePromotionLogic(position, errors);
  }
  
  // Validate castling rights consistency
  validateCastlingConsistency(position, castling, errors);
  
  // Validate en passant consistency
  validateEnPassantConsistency(position, activeColor, enPassant, errors);
}

/**
 * Validate pawn placement rules
 * Pawns cannot be on rank 1 (index 7) or rank 8 (index 0)
 * 
 * @param position - Board position string
 * @param errors - Array to collect validation errors
 * @returns true if pawn placement is valid
 */
function validatePawnPlacement(position: string, errors: string[]): boolean {
  const ranks = position.split('/');
  
  // Check rank 8 (first rank in FEN) - no pawns allowed
  if (/[Pp]/.test(ranks[0])) {
    errors.push('Pawns cannot be placed on rank 8');
    return false;
  }
  
  // Check rank 1 (last rank in FEN) - no pawns allowed
  if (/[Pp]/.test(ranks[7])) {
    errors.push('Pawns cannot be placed on rank 1');
    return false;
  }
  
  return true;
}

/**
 * Validate that excessive material suggests promotion occurred
 * Check for reasonable piece counts
 * 
 * @param position - Board position string
 * @param errors - Array to collect validation errors
 */
function validatePromotionLogic(position: string, errors: string[]): void {
  // Count pieces by type
  const pieces = {
    whiteQueens: (position.match(/Q/g) || []).length,
    blackQueens: (position.match(/q/g) || []).length,
    whiteRooks: (position.match(/R/g) || []).length,
    blackRooks: (position.match(/r/g) || []).length,
    whiteBishops: (position.match(/B/g) || []).length,
    blackBishops: (position.match(/b/g) || []).length,
    whiteKnights: (position.match(/N/g) || []).length,
    blackKnights: (position.match(/n/g) || []).length,
    whitePawns: (position.match(/P/g) || []).length,
    blackPawns: (position.match(/p/g) || []).length
  };
  
  // Check for reasonable maximums (allowing for promotions)
  const maxQueens = 9;  // 1 original + 8 promoted pawns
  const maxRooks = 10;  // 2 original + 8 promoted pawns
  const maxBishops = 10; // 2 original + 8 promoted pawns
  const maxKnights = 10; // 2 original + 8 promoted pawns
  const maxPawns = 8;   // Original limit
  
  if (pieces.whiteQueens > maxQueens) {
    errors.push(`Too many white queens: ${pieces.whiteQueens} (max ${maxQueens})`);
  }
  if (pieces.blackQueens > maxQueens) {
    errors.push(`Too many black queens: ${pieces.blackQueens} (max ${maxQueens})`);
  }
  if (pieces.whiteRooks > maxRooks) {
    errors.push(`Too many white rooks: ${pieces.whiteRooks} (max ${maxRooks})`);
  }
  if (pieces.blackRooks > maxRooks) {
    errors.push(`Too many black rooks: ${pieces.blackRooks} (max ${maxRooks})`);
  }
  if (pieces.whiteBishops > maxBishops) {
    errors.push(`Too many white bishops: ${pieces.whiteBishops} (max ${maxBishops})`);
  }
  if (pieces.blackBishops > maxBishops) {
    errors.push(`Too many black bishops: ${pieces.blackBishops} (max ${maxBishops})`);
  }
  if (pieces.whiteKnights > maxKnights) {
    errors.push(`Too many white knights: ${pieces.whiteKnights} (max ${maxKnights})`);
  }
  if (pieces.blackKnights > maxKnights) {
    errors.push(`Too many black knights: ${pieces.blackKnights} (max ${maxKnights})`);
  }
  if (pieces.whitePawns > maxPawns) {
    errors.push(`Too many white pawns: ${pieces.whitePawns} (max ${maxPawns})`);
  }
  if (pieces.blackPawns > maxPawns) {
    errors.push(`Too many black pawns: ${pieces.blackPawns} (max ${maxPawns})`);
  }
}

/**
 * Validate castling rights consistency with piece positions
 * Castling rights should only exist if king and rooks are in starting positions
 * 
 * @param position - Board position string
 * @param castling - Castling rights string
 * @param errors - Array to collect validation errors
 */
function validateCastlingConsistency(position: string, castling: string, errors: string[]): void {
  if (castling === '-') return; // No castling rights to validate
  
  const ranks = position.split('/');
  const rank1 = ranks[7]; // White's back rank
  const rank8 = ranks[0]; // Black's back rank
  
  // Helper to check if castling rights match piece positions
  const checkCastlingRight = (
    right: string, 
    rank: string, 
    kingPos: number, 
    rookPos: number, 
    kingPiece: string, 
    rookPiece: string,
    side: string,
    castlingSide: string
  ) => {
    if (castling.includes(right)) {
      // Expand rank to actual pieces (handle numbers)
      const expandedRank = expandRankString(rank);
      
      if (expandedRank[kingPos] !== kingPiece) {
        errors.push(`${side} king not in starting position for ${castlingSide} castling`);
      }
      if (expandedRank[rookPos] !== rookPiece) {
        errors.push(`${side} rook not in starting position for ${castlingSide} castling`);
      }
    }
  };
  
  // Check white castling rights
  checkCastlingRight('K', rank1, 4, 7, 'K', 'R', 'White', 'kingside');
  checkCastlingRight('Q', rank1, 4, 0, 'K', 'R', 'White', 'queenside');
  
  // Check black castling rights
  checkCastlingRight('k', rank8, 4, 7, 'k', 'r', 'Black', 'kingside');
  checkCastlingRight('q', rank8, 4, 0, 'k', 'r', 'Black', 'queenside');
}

/**
 * Validate en passant target square consistency
 * En passant should only be possible if there's a pawn that could have moved two squares
 * 
 * @param position - Board position string
 * @param activeColor - Active player color
 * @param enPassant - En passant target square
 * @param errors - Array to collect validation errors
 */
function validateEnPassantConsistency(
  position: string, 
  activeColor: string, 
  enPassant: string, 
  errors: string[]
): void {
  if (enPassant === '-') return; // No en passant to validate
  
  const file = enPassant[0];
  const rank = enPassant[1];
  const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
  
  const ranks = position.split('/');
  
  if (activeColor === 'w' && rank === '6') {
    // White can capture en passant on rank 6, so black pawn should be on rank 5 (index 3)
    const rank5 = expandRankString(ranks[3]);
    if (rank5[fileIndex] !== 'p') {
      errors.push(`En passant target ${enPassant} invalid: no black pawn on ${file}5`);
    }
  } else if (activeColor === 'b' && rank === '3') {
    // Black can capture en passant on rank 3, so white pawn should be on rank 4 (index 4)
    const rank4 = expandRankString(ranks[4]);
    if (rank4[fileIndex] !== 'P') {
      errors.push(`En passant target ${enPassant} invalid: no white pawn on ${file}4`);
    }
  } else {
    errors.push(`En passant target ${enPassant} invalid for active color ${activeColor}`);
  }
}

/**
 * Expand rank string from FEN notation to actual piece array
 * Converts numbers to empty squares for easier indexing
 * 
 * @param rankString - Single rank from FEN position
 * @returns Array of 8 pieces/empty squares
 */
function expandRankString(rankString: string): string[] {
  const pieces: string[] = [];
  
  for (const char of rankString) {
    if (/[1-8]/.test(char)) {
      // Add empty squares
      const emptySquares = parseInt(char);
      for (let i = 0; i < emptySquares; i++) {
        pieces.push(' '); // Use space for empty squares
      }
    } else {
      // Add piece
      pieces.push(char);
    }
  }
  
  return pieces;
}

/**
 * Validate FEN with Chess.js for ultimate verification
 * Fallback validation using Chess.js library
 * 
 * @param fen - FEN string to validate
 * @returns true if Chess.js can load the position
 */
export function validateWithChessJS(fen: string): boolean {
  try {
    // Dynamic import to avoid circular dependencies
    const { Chess } = require('chess.js');
    const chess = new Chess();
    chess.load(fen);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Comprehensive validation that combines all validation methods
 * Use this for critical validation paths where accuracy is paramount
 * 
 * @param fen - FEN string to validate
 * @returns Enhanced validation result
 */
export function validateComprehensive(fen: string): FenValidationResult & { chessJsValid: boolean } {
  const result = validateChessEngineFen(fen);
  
  // Only run Chess.js validation if basic validation passes
  const chessJsValid = result.isValid ? validateWithChessJS(result.sanitized) : false;
  
  if (result.isValid && !chessJsValid) {
    result.errors.push('Position invalid according to Chess.js library');
    result.isValid = false;
  }
  
  return {
    ...result,
    chessJsValid
  };
}

/**
 * Quick validation for performance-critical paths
 * Minimal validation with maximum performance
 * 
 * @param fen - FEN string to validate
 * @returns true if FEN passes quick validation
 */
export function isValidChessEngineFen(fen: string): boolean {
  return isValidFenQuick(fen) && validateChessEngineFen(fen).isValid;
}