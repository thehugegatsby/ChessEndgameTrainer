/**
 * Test helper factory for creating Move objects compatible with chess.js
 */

import { Move, Color, PieceSymbol } from '../../shared/types/chess';
import type { Square as ChessJsSquare } from 'chess.js';

export interface CreateMoveOptions {
  from: string;
  to: string;
  color?: Color;
  piece?: PieceSymbol;
  captured?: PieceSymbol;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san?: string;
  before?: string;
  after?: string;
}

/**
 * Creates a complete Move object for testing
 */
export const createTestMove = (options: CreateMoveOptions): Move => {
  const {
    from,
    to,
    color = 'w',
    piece = 'p',
    captured,
    promotion,
    san,
    before = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    after = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
  } = options;

  // Generate flags based on move type
  let flags = '';
  if (captured) flags += 'c';
  if (promotion) flags += 'p';
  if (from === 'e1' && to === 'g1' && piece === 'k') flags += 'k'; // kingside castle
  if (from === 'e1' && to === 'c1' && piece === 'k') flags += 'q'; // queenside castle
  if (piece === 'p' && Math.abs(from.charCodeAt(1) - to.charCodeAt(1)) === 2) flags += 'b'; // big pawn
  if (!flags) flags = 'n'; // normal move

  const move: Move = {
    color,
    from: from as ChessJsSquare,
    to: to as ChessJsSquare,
    piece,
    captured,
    promotion,
    flags,
    san: san || generateSan(from, to, piece, captured),
    lan: `${from}${to}${promotion || ''}`,
    before,
    after,
    // Helper methods
    isCapture: () => !!captured,
    isPromotion: () => !!promotion,
    isEnPassant: () => flags.includes('e'),
    isKingsideCastle: () => flags.includes('k'),
    isQueensideCastle: () => flags.includes('q'),
    isBigPawn: () => flags.includes('b')
  };

  return move;
};

/**
 * Simple SAN generation for testing
 */
function generateSan(from: string, to: string, piece: PieceSymbol, captured?: PieceSymbol): string {
  if (piece === 'p') {
    if (captured) {
      return `${from[0]}x${to}`;
    }
    return to;
  }
  
  const pieceSymbol = piece.toUpperCase();
  if (captured) {
    return `${pieceSymbol}x${to}`;
  }
  return `${pieceSymbol}${to}`;
}

/**
 * Common test moves
 */
export const TEST_MOVES = {
  E2E4: createTestMove({ from: 'e2', to: 'e4', piece: 'p', san: 'e4' }),
  E2_E4: createTestMove({ from: 'e2', to: 'e4', piece: 'p', san: 'e4' }),
  E7_E5: createTestMove({ from: 'e7', to: 'e5', piece: 'p', color: 'b', san: 'e5' }),
  NG1_F3: createTestMove({ from: 'g1', to: 'f3', piece: 'n', san: 'Nf3' }),
  KINGSIDE_CASTLE: createTestMove({ 
    from: 'e1', 
    to: 'g1', 
    piece: 'k', 
    san: 'O-O' 
  }),
  CAPTURE: createTestMove({ 
    from: 'e4', 
    to: 'd5', 
    piece: 'p', 
    captured: 'p', 
    san: 'exd5' 
  }),
  PROMOTION: createTestMove({
    from: 'e7',
    to: 'e8',
    piece: 'p',
    promotion: 'q',
    san: 'e8=Q'
  }),
  PROMOTION_QUEEN: createTestMove({
    from: 'e7',
    to: 'e8',
    piece: 'p',
    promotion: 'q',
    san: 'e8=Q'
  }),
  ILLEGAL_MOVE: createTestMove({ from: 'a1', to: 'h8', piece: 'p', san: 'illegal' })
};