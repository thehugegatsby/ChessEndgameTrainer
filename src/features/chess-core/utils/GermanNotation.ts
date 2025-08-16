/**
 * GermanNotation - Utility for converting between German and English chess notation
 *
 * This utility handles the conversion of chess piece notation between
 * German (D/T/L/S) and English (Q/R/B/N) formats.
 * Part of the Clean Architecture refactoring.
 */

import type { IGermanNotation } from '../types/interfaces';

export default class GermanNotation implements IGermanNotation {
  // Mapping from German to chess.js format
  private static readonly GERMAN_TO_CHESS: Record<string, string> = {
    D: 'q', // Dame (Queen)
    d: 'q',
    T: 'r', // Turm (Rook)
    t: 'r',
    L: 'b', // Läufer (Bishop)
    l: 'b',
    S: 'n', // Springer (Knight)
    s: 'n',
    // Also support English notation as pass-through
    Q: 'q',
    q: 'q',
    R: 'r',
    r: 'r',
    B: 'b',
    b: 'b',
    N: 'n',
    n: 'n',
  };

  // Mapping from chess.js format to German
  private static readonly CHESS_TO_GERMAN: Record<string, string> = {
    q: 'D', // Queen -> Dame
    r: 'T', // Rook -> Turm
    b: 'L', // Bishop -> Läufer
    n: 'S', // Knight -> Springer
    p: 'B', // Pawn -> Bauer (rarely used in notation)
    k: 'K', // King -> König (rarely used in notation)
  };

  /**
   * Convert German piece notation to chess.js format
   */
  public toChessJs(piece: string): string | undefined {
    if (!piece || piece.length !== 1) {
      return undefined;
    }
    return GermanNotation.GERMAN_TO_CHESS[piece];
  }

  /**
   * Convert chess.js format to German notation
   */
  public toGerman(piece: string): string | undefined {
    if (!piece || piece.length !== 1) {
      return undefined;
    }
    const lowerPiece = piece.toLowerCase();
    return GermanNotation.CHESS_TO_GERMAN[lowerPiece];
  }

  /**
   * Convert a move string with German notation to chess.js format
   * Examples: "e8D" -> "e8=Q", "e7e8D" -> {from: "e7", to: "e8", promotion: "q"}
   */
  public normalizeMove(
    move: string
  ): string | { from: string; to: string; promotion?: string } | undefined {
    // Format 1: "e7e8D" or "e7-e8D" (from-to notation with German piece)
    let promotionMatch = move.match(/^([a-h][1-8])-?([a-h][1-8])([DTLSQRBN])$/i);
    if (promotionMatch && promotionMatch[3]) {
      const normalizedPromotion = this.toChessJs(promotionMatch[3]);
      if (normalizedPromotion && promotionMatch[1] && promotionMatch[2]) {
        return {
          from: promotionMatch[1],
          to: promotionMatch[2],
          promotion: normalizedPromotion,
        };
      }
    }

    // Format 2: "e8D" or "e8=D" (SAN notation with German piece)
    promotionMatch = move.match(/^([a-h][1-8])=?([DTLSQRBN])$/i);
    if (promotionMatch && promotionMatch[2]) {
      const normalizedPromotion = this.toChessJs(promotionMatch[2]);
      if (normalizedPromotion) {
        // Return in SAN format for chess.js
        return `${promotionMatch[1]}=${normalizedPromotion.toUpperCase()}`;
      }
    }

    // No German notation found, return undefined
    return undefined;
  }

  /**
   * Check if a string contains German piece notation
   */
  public hasGermanNotation(move: string): boolean {
    // Only check for German-specific letters (D, T, L, S)
    // Exclude Q, R, B, N which are English
    return /[DTLS]/i.test(move) && !/[QRBN]/i.test(move);
  }

  /**
   * Convert SAN notation from chess.js to German format
   * Example: "Nf3" -> "Sf3", "e8=Q" -> "e8=D"
   */
  public sanToGerman(san: string): string {
    let result = san;

    // Replace piece letters at the beginning
    const pieceMatch = san.match(/^([NBRQK])/);
    if (pieceMatch && pieceMatch[1]) {
      const germanPiece = this.toGerman(pieceMatch[1].toLowerCase());
      if (germanPiece) {
        result = result.replace(pieceMatch[1], germanPiece);
      }
    }

    // Replace promotion pieces
    const promotionMatch = san.match(/=([NBRQ])$/);
    if (promotionMatch && promotionMatch[1]) {
      const germanPiece = this.toGerman(promotionMatch[1].toLowerCase());
      if (germanPiece) {
        result = result.replace(`=${promotionMatch[1]}`, `=${germanPiece}`);
      }
    }

    return result;
  }

  /**
   * Convert German SAN to chess.js format
   * Example: "Sf3" -> "Nf3", "e8=D" -> "e8=Q"
   */
  public germanToSan(germanSan: string): string {
    let result = germanSan;

    // Replace German piece letters at the beginning
    const pieceMatch = germanSan.match(/^([DTLS])/i);
    if (pieceMatch && pieceMatch[1]) {
      const chessPiece = this.toChessJs(pieceMatch[1]);
      if (chessPiece) {
        result = result.replace(pieceMatch[1], chessPiece.toUpperCase());
      }
    }

    // Replace promotion pieces
    const promotionMatch = germanSan.match(/=([DTLS])$/i);
    if (promotionMatch && promotionMatch[1]) {
      const chessPiece = this.toChessJs(promotionMatch[1]);
      if (chessPiece) {
        result = result.replace(`=${promotionMatch[1]}`, `=${chessPiece.toUpperCase()}`);
      }
    }

    return result;
  }
}
