/**
 * MoveValidator - Handles complex move validation logic
 * 
 * This class encapsulates all move validation logic,
 * reducing the complexity of ChessService from 30 to target of 5.
 * Part of the Clean Architecture refactoring.
 */

import { Chess } from "chess.js";
import type { Move as ChessJsMove } from "chess.js";
import type { IMoveValidator, IChessEngine } from "../types/interfaces";

export default class MoveValidator implements IMoveValidator {
  /**
   * Validate a move without executing it
   */
  public validateMove(
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string,
    engine: IChessEngine
  ): boolean {
    try {
      // Create a temporary Chess instance for validation
      const tempChess = new Chess(engine.getFen());
      const result = tempChess.move(move);
      return result !== null;
    } catch {
      return false;
    }
  }

  /**
   * Validate a promotion move
   */
  public validatePromotion(
    from: string,
    to: string,
    piece: string,
    engine: IChessEngine
  ): boolean {
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }

    // Check if pawn is on 7th rank (for white) or 2nd rank (for black)
    const fromRank = from[1];
    const toRank = to[1];
    const turn = engine.turn();
    
    if (turn === 'w' && fromRank !== '7') return false;
    if (turn === 'b' && fromRank !== '2') return false;
    
    // Check if target rank is 8th (for white) or 1st (for black)
    if (turn === 'w' && toRank !== '8') return false;
    if (turn === 'b' && toRank !== '1') return false;
    
    // Validate promotion piece
    const validPieces = ['q', 'r', 'b', 'n'];
    if (!validPieces.includes(piece.toLowerCase())) {
      return false;
    }
    
    // Validate the actual move
    return this.validateMove({ from, to, promotion: piece.toLowerCase() }, engine);
  }

  /**
   * Validate castling move
   */
  public validateCastling(move: string, engine: IChessEngine): boolean {
    const castlingMoves = ['O-O', 'O-O-O', '0-0', '0-0-0'];
    
    if (!castlingMoves.includes(move)) {
      return false;
    }
    
    // Normalize notation
    const normalizedMove = move.replace(/0/g, 'O');
    
    // Check if castling is legal in current position
    const legalMoves = engine.moves() as string[];
    return legalMoves.includes(normalizedMove);
  }

  /**
   * Validate en passant capture
   */
  public validateEnPassant(from: string, to: string, engine: IChessEngine): boolean {
    if (!this.isValidSquare(from) || !this.isValidSquare(to)) {
      return false;
    }

    // Ensure we have valid 2-character squares
    if (from.length !== 2 || to.length !== 2) {
      return false;
    }

    const fromFile = from.charAt(0);
    const fromRank = parseInt(from.charAt(1), 10);
    const toFile = to.charAt(0);
    const toRank = parseInt(to.charAt(1), 10);
    const turn = engine.turn();
    
    // Check for NaN
    if (isNaN(fromRank) || isNaN(toRank)) {
      return false;
    }
    
    // Check if move is diagonal
    const fileDiff = Math.abs(fromFile.charCodeAt(0) - toFile.charCodeAt(0));
    if (fileDiff !== 1) return false;
    
    // Check if pawn is on correct rank for en passant
    if (turn === 'w' && fromRank !== 5) return false;
    if (turn === 'b' && fromRank !== 4) return false;
    
    // Check if target rank is correct
    if (turn === 'w' && toRank !== 6) return false;
    if (turn === 'b' && toRank !== 3) return false;
    
    // Check if there's a pawn at the source square
    const piece = engine.get(from);
    if (!piece || piece.type !== 'p' || piece.color !== turn) {
      return false;
    }
    
    // Check if target square is empty (en passant capture)
    const targetSquare = engine.get(to);
    if (targetSquare !== null) {
      return false;
    }
    
    // Validate the actual move
    return this.validateMove({ from, to }, engine);
  }

  /**
   * Check if a square notation is valid
   */
  public isValidSquare(square: string): boolean {
    return /^[a-h][1-8]$/.test(square);
  }

  /**
   * Check if there's a piece at the given square
   */
  public hasPieceAt(square: string, engine: IChessEngine): boolean {
    if (!this.isValidSquare(square)) {
      return false;
    }
    
    const piece = engine.get(square);
    return piece !== null;
  }

  /**
   * Get all legal moves from a square
   */
  public getLegalMoves(square: string, engine: IChessEngine): ChessJsMove[] {
    if (!this.isValidSquare(square)) {
      return [];
    }
    
    const moves = engine.moves({ square, verbose: true }) as ChessJsMove[];
    return moves;
  }
}