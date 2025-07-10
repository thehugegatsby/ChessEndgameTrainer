/**
 * Validation Helper for E2E Tests
 * Provides common validation utilities for chess-related operations
 */

import { Chess } from 'chess.js';

export class ValidationHelper {
  /**
   * Validate FEN notation
   * Basic validation without full chess rules
   */
  static validateFEN(fen: string): boolean {
    if (!fen || typeof fen !== 'string') return false;
    
    const parts = fen.trim().split(/\s+/);
    
    // FEN should have at least 4 parts (position, active color, castling, en passant)
    if (parts.length < 4) return false;
    
    // Validate position part (8 ranks separated by '/')
    const position = parts[0];
    const ranks = position.split('/');
    if (ranks.length !== 8) return false;
    
    // Validate each rank
    for (const rank of ranks) {
      let squareCount = 0;
      for (const char of rank) {
        if (/[1-8]/.test(char)) {
          squareCount += parseInt(char, 10);
        } else if (/[pnbrqkPNBRQK]/.test(char)) {
          squareCount += 1;
        } else {
          return false; // Invalid character
        }
      }
      if (squareCount !== 8) return false; // Each rank must have 8 squares
    }
    
    // Validate active color
    if (!/^[wb]$/.test(parts[1])) return false;
    
    // Validate castling availability
    if (!/^(-|[KQkq]+)$/.test(parts[2])) return false;
    
    // Validate en passant square
    if (!/^(-|[a-h][36])$/.test(parts[3])) return false;
    
    return true;
  }

  /**
   * Validate Standard Algebraic Notation (SAN) for chess moves
   * @param san - Move in SAN notation (e.g., 'e4', 'Nf3', 'O-O', 'Qxd5+')
   * @returns true if valid SAN notation
   */
  static validateSAN(san: string): boolean {
    if (!san || typeof san !== 'string') return false;
    
    // Remove check/checkmate symbols for validation
    const cleanSan = san.replace(/[+#]$/, '');
    
    // Castling
    if (/^(O-O|O-O-O)$/.test(cleanSan)) return true;
    
    // Pawn moves: [file]?[capture]?[destination][promotion]?
    // e.g., e4, exd5, e8=Q
    const pawnMove = /^([a-h]?x?[a-h][1-8](=[QRBN])?)$/;
    if (pawnMove.test(cleanSan)) return true;
    
    // Piece moves: [KQRBN][file]?[rank]?[capture]?[destination]
    // e.g., Nf3, Nxf3, Ngf3, N5f3, Ng5f3
    const pieceMove = /^[KQRBN][a-h]?[1-8]?x?[a-h][1-8]$/;
    if (pieceMove.test(cleanSan)) return true;
    
    return false;
  }

  /**
   * Check if a move is legal in the given position
   * @param fen - Current position in FEN notation
   * @param move - Move in coordinate notation (e.g., 'e2e4') or SAN (e.g., 'e4')
   * @returns true if the move is legal
   */
  static isMoveLegal(fen: string, move: string): boolean {
    try {
      // Validate FEN first
      if (!this.validateFEN(fen)) return false;
      
      const chess = new Chess(fen);
      
      // Try coordinate notation first (e.g., 'e2e4')
      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);
        const promotion = move.length > 4 ? move[4] : undefined;
        
        const moveResult = chess.move({ 
          from, 
          to, 
          promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined 
        });
        
        return moveResult !== null;
      }
      
      // Try SAN notation (e.g., 'e4', 'Nf3')
      if (this.validateSAN(move)) {
        const moveResult = chess.move(move);
        return moveResult !== null;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Convert coordinate notation to SAN
   * @param fen - Current position in FEN notation
   * @param coordinateMove - Move in coordinate notation (e.g., 'e2e4')
   * @returns SAN notation or null if invalid
   */
  static coordinateToSAN(fen: string, coordinateMove: string): string | null {
    try {
      if (!this.validateFEN(fen)) return null;
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(coordinateMove)) return null;
      
      const chess = new Chess(fen);
      const from = coordinateMove.substring(0, 2);
      const to = coordinateMove.substring(2, 4);
      const promotion = coordinateMove.length > 4 ? coordinateMove[4] : undefined;
      
      const move = chess.move({ 
        from, 
        to, 
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined 
      });
      
      return move ? move.san : null;
    } catch {
      return null;
    }
  }

  /**
   * Get all legal moves from a position
   * @param fen - Current position in FEN notation
   * @param square - Optional: only get moves from this square
   * @returns Array of legal moves in SAN notation
   */
  static getLegalMoves(fen: string, square?: string): string[] {
    try {
      if (!this.validateFEN(fen)) return [];
      
      const chess = new Chess(fen);
      const moves = square 
        ? chess.moves({ square: square as any, verbose: false })
        : chess.moves({ verbose: false });
      
      return moves;
    } catch {
      return [];
    }
  }

  /**
   * Check if the position is checkmate
   * @param fen - Current position in FEN notation
   * @returns true if position is checkmate
   */
  static isCheckmate(fen: string): boolean {
    try {
      if (!this.validateFEN(fen)) return false;
      const chess = new Chess(fen);
      return chess.isCheckmate();
    } catch {
      return false;
    }
  }

  /**
   * Check if the position is stalemate
   * @param fen - Current position in FEN notation
   * @returns true if position is stalemate
   */
  static isStalemate(fen: string): boolean {
    try {
      if (!this.validateFEN(fen)) return false;
      const chess = new Chess(fen);
      return chess.isStalemate();
    } catch {
      return false;
    }
  }

  /**
   * Check if the position is a draw
   * @param fen - Current position in FEN notation
   * @returns true if position is drawn (stalemate, insufficient material, threefold repetition, or 50-move rule)
   */
  static isDraw(fen: string): boolean {
    try {
      if (!this.validateFEN(fen)) return false;
      const chess = new Chess(fen);
      return chess.isDraw();
    } catch {
      return false;
    }
  }

  /**
   * Check if the position has insufficient material for checkmate
   * @param fen - Current position in FEN notation
   * @returns true if neither side can checkmate
   */
  static isInsufficientMaterial(fen: string): boolean {
    try {
      if (!this.validateFEN(fen)) return false;
      const chess = new Chess(fen);
      return chess.isInsufficientMaterial();
    } catch {
      return false;
    }
  }

  /**
   * Check if the current side is in check
   * @param fen - Current position in FEN notation
   * @returns true if the side to move is in check
   */
  static isInCheck(fen: string): boolean {
    try {
      if (!this.validateFEN(fen)) return false;
      const chess = new Chess(fen);
      return chess.inCheck();
    } catch {
      return false;
    }
  }

  /**
   * Get the game status
   * @param fen - Current position in FEN notation
   * @returns Object with detailed game status
   */
  static getGameStatus(fen: string): {
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
    isInsufficientMaterial: boolean;
    isInCheck: boolean;
    isGameOver: boolean;
    turn: 'w' | 'b';
  } | null {
    try {
      if (!this.validateFEN(fen)) return null;
      const chess = new Chess(fen);
      
      return {
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
        isDraw: chess.isDraw(),
        isInsufficientMaterial: chess.isInsufficientMaterial(),
        isInCheck: chess.inCheck(),
        isGameOver: chess.isGameOver(),
        turn: chess.turn()
      };
    } catch {
      return null;
    }
  }

  /**
   * Validate PGN (Portable Game Notation) string
   * @param pgn - PGN string to validate
   * @returns true if valid PGN
   */
  static validatePGN(pgn: string): boolean {
    try {
      if (!pgn || typeof pgn !== 'string') return false;
      
      const chess = new Chess();
      const result = chess.loadPgn(pgn);
      
      // chess.js returns true if PGN was loaded successfully
      return result;
    } catch {
      return false;
    }
  }

  /**
   * Convert PGN to FEN
   * @param pgn - PGN string
   * @returns FEN string of final position or null if invalid
   */
  static pgnToFEN(pgn: string): string | null {
    try {
      if (!this.validatePGN(pgn)) return null;
      
      const chess = new Chess();
      chess.loadPgn(pgn);
      return chess.fen();
    } catch {
      return null;
    }
  }

  /**
   * Get all moves from PGN
   * @param pgn - PGN string
   * @returns Array of moves in SAN notation or empty array if invalid
   */
  static getMovesFromPGN(pgn: string): string[] {
    try {
      if (!this.validatePGN(pgn)) return [];
      
      const chess = new Chess();
      chess.loadPgn(pgn);
      return chess.history();
    } catch {
      return [];
    }
  }
}