/**
 * @file chess-logic.ts
 * @description Pure chess functions for game logic
 * 
 * This module implements pure functions for chess logic operations,
 * eliminating the need for stateful services and event systems.
 * Replaces stateful service with pure functional approach
 */

import { Chess, type Move as ChessJsMove, type Square } from 'chess.js';

export interface MoveResult {
  newFen: string;
  move: ChessJsMove;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isCheck: boolean;
  gameResult: string | null;
}

export interface GameStatus {
  isGameOver: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isCheck: boolean;
  gameResult: string | null;
  turn: 'w' | 'b';
}

export interface PositionUpdateResult {
  newFen: string;
  status: GameStatus;
}

/**
 * Gets the current turn from a FEN string
 * @param fen - FEN position string
 * @returns 'w' for white's turn, 'b' for black's turn
 */
export const turn = (fen: string): 'w' | 'b' => {
  const parts = fen.split(' ');
  return parts[1] as 'w' | 'b';
};

/**
 * Helper: Normalize German promotion pieces to chess.js format
 * @param notation - Promotion piece notation (D,T,L,S or Q,R,B,N)
 * @returns Normalized chess.js promotion notation (q,r,b,n)
 */
function normalizePromotionPiece(notation: string | undefined): string | undefined {
  if (!notation) return undefined;
  
  // Map German piece names to chess.js format
  const germanToChessJs: Record<string, string> = {
    'D': 'q', // Dame (Queen)
    'd': 'q',
    'T': 'r', // Turm (Rook)
    't': 'r',
    'L': 'b', // Läufer (Bishop)
    'l': 'b',
    'S': 'n', // Springer (Knight)
    's': 'n',
    // Also support English notation
    'Q': 'q',
    'q': 'q',
    'R': 'r',
    'r': 'r',
    'B': 'b',
    'b': 'b',
    'N': 'n',
    'n': 'n',
  };
  
  return germanToChessJs[notation] || notation.toLowerCase();
}

/**
 * Helper: Normalize moves with German promotion notation
 */
function normalizeGermanMove(move: string | { from: string; to: string; promotion?: string }): string | { from: string; to: string; promotion?: string } {
  // Handle object format with promotion
  if (typeof move === 'object' && move !== null && 'promotion' in move && move.promotion) {
    const normalizedPromotion = normalizePromotionPiece(move.promotion);
    return {
      ...move,
      ...(normalizedPromotion && { promotion: normalizedPromotion })
    };
  }

  // Handle string format with German promotion notation
  if (typeof move === 'string') {
    // Format 1: "e7e8D" or "e7-e8D" (from-to-promotion with optional dash)
    let promotionMatch = move.match(/^([a-h][1-8])-?([a-h][1-8])([DTLSQRBN])$/i);
    if (promotionMatch && promotionMatch[1] && promotionMatch[2] && promotionMatch[3]) {
      const normalizedPromotion = normalizePromotionPiece(promotionMatch[3]);
      return {
        from: promotionMatch[1],
        to: promotionMatch[2],
        ...(normalizedPromotion && { promotion: normalizedPromotion })
      };
    }
    
    // Format 2: "e8D" or "e8=D" (SAN notation with German piece)
    promotionMatch = move.match(/^([a-h][1-8])=?([DTLSQRBN])$/i);
    if (promotionMatch && promotionMatch[2]) {
      const normalizedPromotion = normalizePromotionPiece(promotionMatch[2]);
      return `${promotionMatch[1]}=${(normalizedPromotion || '').toUpperCase()}`;
    }
  }
  
  return move;
}

/**
 * Pure function: Make a move on a chess position
 * @param fen - Current position in FEN notation
 * @param move - Move to make (string or object format)
 * @returns MoveResult or null if move is invalid
 */
export function makeMove(fen: string, move: string | { from: string; to: string; promotion?: string }): MoveResult | null {
  try {
    const chess = new Chess(fen);
    const normalizedMove = normalizeGermanMove(move);
    const result = chess.move(normalizedMove);
    
    if (!result) {
      return null;
    }

    return {
      newFen: chess.fen(),
      move: result,
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isCheck: chess.isCheck(),
      gameResult: getGameResult(chess)
    };
  } catch {
    return null;
  }
}

/**
 * Pure function: Validate if a move is legal
 * @param fen - Current position in FEN notation
 * @param move - Move to validate
 * @returns true if move is legal, false otherwise
 */
export function validateMove(fen: string, move: string | { from: string; to: string; promotion?: string }): boolean {
  try {
    const chess = new Chess(fen);
    const normalizedMove = normalizeGermanMove(move);
    return chess.move(normalizedMove) !== null;
  } catch {
    return false;
  }
}

/**
 * Pure function: Parse and validate move notation, returning full move object
 * @param fen - Current position in FEN notation
 * @param moveNotation - Move notation (e.g., "e4", "Nf3", "e2-e4", "e7e8D")
 * @returns ChessJsMove object if valid, null if invalid or illegal
 * 
 * @example
 * parseMove(startingFen, "e4") // Returns {from: "e2", to: "e4", san: "e4", ...}
 * parseMove(startingFen, "e2-e4") // Returns {from: "e2", to: "e4", san: "e4", ...}
 * parseMove(startingFen, "invalid") // Returns null
 */
export function parseMove(fen: string, moveNotation: string): ChessJsMove | null {
  try {
    const chess = new Chess(fen);
    
    // Handle coordinate notation (e2-e4 format)
    if (moveNotation.includes('-')) {
      const parts = moveNotation.split('-');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const [from, to] = parts;
        const moveObj = { from, to, promotion: 'q' }; // Default promotion to queen
        const normalizedMove = normalizeGermanMove(moveObj);
        return chess.move(normalizedMove);
      }
    }
    
    // Handle SAN notation (e4, Nf3, O-O) and German promotion notation
    const normalizedMove = normalizeGermanMove(moveNotation);
    return chess.move(normalizedMove);
    
  } catch {
    return null;
  }
}

/**
 * Pure function: Get all possible moves for current position
 * @param fen - Current position in FEN notation
 * @param square - Optional: specific square to get moves for
 * @returns Array of possible moves
 */
export function getPossibleMoves(fen: string, square?: Square): ChessJsMove[] {
  try {
    const chess = new Chess(fen);
    if (square) {
      return chess.moves({ square, verbose: true }) as ChessJsMove[];
    }
    return chess.moves({ verbose: true }) as ChessJsMove[];
  } catch {
    return [];
  }
}

/**
 * Pure function: Get current game status
 * @param fen - Current position in FEN notation
 * @returns GameStatus object or null if invalid FEN
 */
export function getGameStatus(fen: string): GameStatus | null {
  try {
    const chess = new Chess(fen);
    return {
      isGameOver: chess.isGameOver(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      isCheck: chess.isCheck(),
      gameResult: getGameResult(chess),
      turn: chess.turn()
    };
  } catch {
    return null;
  }
}

/**
 * Pure function: Check if FEN string is valid
 * @param fen - FEN string to validate
 * @returns true if valid, false otherwise
 */
export function isValidFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure function: Load PGN and get final position
 * @param pgn - PGN string
 * @returns Final FEN position or null if invalid PGN
 */
export function loadPgn(pgn: string): string | null {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    return chess.fen();
  } catch {
    return null;
  }
}

/**
 * Pure function: Get PGN from move history
 * @param moves - Array of moves in SAN notation
 * @param startingFen - Optional starting position (defaults to standard starting position)
 * @returns PGN string or null if invalid moves
 */
export function generatePgn(moves: string[], startingFen?: string): string | null {
  try {
    const chess = new Chess(startingFen);
    
    for (const move of moves) {
      if (!chess.move(move)) {
        return null;
      }
    }
    
    return chess.pgn();
  } catch {
    return null;
  }
}

/**
 * Pure function: Undo moves and return position with status
 * @param fen - Current position
 * @param moves - Number of moves to undo
 * @returns Position update result or null
 */
export function undoMoves(fen: string, moves: number = 1): PositionUpdateResult | null {
  if (moves <= 0) {
    return null;
  }
  
  try {
    const chess = new Chess(fen);
    
    for (let i = 0; i < moves; i++) {
      if (!chess.undo()) {
        return null;
      }
    }
    
    const newFen = chess.fen();
    const status = getGameStatus(newFen);
    if (!status) return null;

    return {
      newFen,
      status
    };
  } catch {
    return null;
  }
}

/**
 * Helper function: Get game result string
 * @param chess - Chess.js instance
 * @returns Game result string or null if game not over
 */
function getGameResult(chess: Chess): string | null {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? '0-1' : '1-0';
  }
  if (chess.isDraw() || chess.isStalemate()) {
    return '1/2-1/2';
  }
  return null;
}

/**
 * Pure function: Navigate to specific move in history
 * @param moves - Array of moves to replay
 * @param targetIndex - Target move index (-1 for starting position)
 * @param startingFen - Starting position (defaults to standard starting position)
 * @returns Position update result or null
 */
export function goToMove(moves: string[], targetIndex: number, startingFen?: string): PositionUpdateResult | null {
  try {
    const chess = new Chess(startingFen);
    
    // Play moves up to target index
    for (let i = 0; i <= targetIndex; i++) {
      if (i >= moves.length) break;
      const move = moves[i];
      if (!move || !chess.move(move)) {
        return null;
      }
    }
    
    const newFen = chess.fen();
    const status = getGameStatus(newFen);
    if (!status) return null;

    return {
      newFen,
      status
    };
  } catch {
    return null;
  }
}

/**
 * Pure function: Replay moves from move history to get position at specific index
 * @param moveHistory - Array of move objects with san notation
 * @param targetIndex - Target move index
 * @param startingFen - Starting position
 * @returns Position update result or null
 */
export function replayToIndex(moveHistory: Array<{san: string}>, targetIndex: number, startingFen?: string): PositionUpdateResult | null {
  const moves = moveHistory.slice(0, targetIndex + 1).map(m => m.san);
  return goToMove(moves, targetIndex, startingFen);
}


/**
 * Pure function: Get FEN string for current position
 * @param fen - Current position in FEN notation
 * @returns FEN string
 */
export function getFen(fen: string): string {
  return fen;
}


/**
 * Pure function: Check if game is over
 * @param fen - Current position in FEN notation
 * @returns true if game is over, false otherwise
 */
export function isGameOver(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isGameOver();
  } catch {
    return false;
  }
}

/**
 * Pure function: Check if position is checkmate
 * @param fen - Current position in FEN notation
 * @returns true if checkmate, false otherwise
 */
export function isCheckmate(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isCheckmate();
  } catch {
    return false;
  }
}

/**
 * Pure function: Check if position is stalemate
 * @param fen - Current position in FEN notation
 * @returns true if stalemate, false otherwise
 */
export function isStalemate(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isStalemate();
  } catch {
    return false;
  }
}

/**
 * Pure function: Check if position is draw
 * @param fen - Current position in FEN notation  
 * @returns true if draw, false otherwise
 */
export function isDraw(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isDraw();
  } catch {
    return false;
  }
}

/**
 * Pure function: Check if position is in check
 * @param fen - Current position in FEN notation
 * @returns true if in check, false otherwise
 */
export function isCheck(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isCheck();
  } catch {
    return false;
  }
}

/**
 * Pure function: Get PGN from move history
 * @param pgn - PGN string to return (passthrough for compatibility)
 * @returns PGN string
 */
export function getPgn(pgn: string): string {
  return pgn;
}

/**
 * Pure function: Get move history from PGN
 * @param pgn - PGN string
 * @returns Array of move objects
 */
export function getMoveHistory(pgn: string): Array<{san: string}> {
  if (!pgn) return [];
  
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    return chess.history({ verbose: true }).map(move => ({ san: move.san }));
  } catch {
    return [];
  }
}