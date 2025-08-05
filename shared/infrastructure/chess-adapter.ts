/**
 * Chess Adapter - Clean Architecture Implementation
 *
 * Anti-Corruption Layer zwischen chess.js Library und unserer Domain.
 * Implementiert das Adapter Pattern für saubere Trennung von Domain und Infrastructure.
 *
 * Architektur-Prinzipien:
 * 1. Domain Types bleiben unberührt von Library-Details
 * 2. Error-First Validation für ungültige Library-Daten
 * 3. Klare Trennung: Domain ↔ Adapter ↔ Library
 * 4. Library-Austausch ohne Domain-Änderungen möglich
 */

import { Move as ChessJsMove } from "chess.js";
import {
  Move as DomainMove,
  Color,
  Square,
  PieceSymbol,
  ValidatedMove,
} from "../types/chess";
import { getLogger } from "../services/logging";

const logger = getLogger();

/**
 * Valid promotion pieces according to chess rules
 */
const VALID_PROMOTION_PIECES = ["q", "r", "b", "n"] as const;
type ValidPromotionPiece = (typeof VALID_PROMOTION_PIECES)[number];

/**
 * Validates if a piece symbol represents a valid promotion piece
 */
function isValidPromotionPiece(piece: string): piece is ValidPromotionPiece {
  return VALID_PROMOTION_PIECES.includes(piece as ValidPromotionPiece);
}

/**
 * Validates if a piece symbol is valid according to our domain rules
 */
function isValidPieceSymbol(piece: string): piece is PieceSymbol {
  return ["p", "n", "b", "r", "q", "k"].includes(piece);
}

/**
 * Validates if a color is valid according to our domain rules
 */
function isValidColor(color: string): color is Color {
  return color === "w" || color === "b";
}

/**
 * Converts Domain Move to chess.js Move format
 *
 * This is generally safe since DomainMove is a subset of ChessJsMove
 * with stricter constraints.
 */
export function toLibraryMove(move: DomainMove): ChessJsMove {
  logger.debug("Converting domain move to library format", {
    from: move.from,
    to: move.to,
    san: move.san,
  });

  // Convert domain move to library format
  // Map fenBefore/fenAfter to before/after for chess.js compatibility
  const libraryMove = {
    ...move,
    before: move.fenBefore,
    after: move.fenAfter,
  } as ChessJsMove;

  return libraryMove;
}

/**
 * Converts chess.js Move to Domain Move format
 *
 * This is the critical validation layer. Any invalid data from the library
 * will be caught here before it enters our domain.
 *
 * Error-First Strategy: Fail fast on invalid data to prevent silent bugs.
 */
export function fromLibraryMove(libraryMove: ChessJsMove): ValidatedMove {
  logger.debug("Converting library move to domain format", {
    from: libraryMove.from,
    to: libraryMove.to,
    san: libraryMove.san,
    promotion: libraryMove.promotion,
  });

  // Validate required fields exist
  if (!libraryMove.from || !libraryMove.to || !libraryMove.san) {
    throw new ChessAdapterError("Missing required move fields", {
      move: libraryMove,
      missingFields: ["from", "to", "san"],
    });
  }

  // Validate color
  if (!isValidColor(libraryMove.color)) {
    throw new ChessAdapterError(`Invalid move color: ${libraryMove.color}`, {
      move: libraryMove,
      invalidField: "color",
    });
  }

  // Validate piece
  if (!isValidPieceSymbol(libraryMove.piece)) {
    throw new ChessAdapterError(`Invalid piece symbol: ${libraryMove.piece}`, {
      move: libraryMove,
      invalidField: "piece",
    });
  }

  // Validate captured piece (if present)
  if (libraryMove.captured && !isValidPieceSymbol(libraryMove.captured)) {
    throw new ChessAdapterError(
      `Invalid captured piece: ${libraryMove.captured}`,
      { move: libraryMove, invalidField: "captured" },
    );
  }

  // CRITICAL VALIDATION: Promotion piece must be valid according to chess rules
  if (libraryMove.promotion && !isValidPromotionPiece(libraryMove.promotion)) {
    // This should theoretically never happen with a correct chess library,
    // but we fail fast to catch any library bugs or unexpected behavior
    throw new ChessAdapterError(
      `Invalid promotion piece: ${libraryMove.promotion}. Only q, r, b, n are allowed.`,
      {
        move: libraryMove,
        invalidField: "promotion",
        validPromotions: VALID_PROMOTION_PIECES,
      },
    );
  }

  // Safe to cast after validation - all constraints are met
  const domainMove: ValidatedMove = {
    color: libraryMove.color,
    from: libraryMove.from as Square,
    to: libraryMove.to as Square,
    piece: libraryMove.piece as PieceSymbol,
    captured: libraryMove.captured as PieceSymbol | undefined,
    promotion: libraryMove.promotion as ValidPromotionPiece | undefined,
    flags: libraryMove.flags || "",
    san: libraryMove.san,
    lan: libraryMove.lan || "",
    fenBefore: libraryMove.before || "",
    fenAfter: libraryMove.after || "",
    // Helper methods - these will be added by the chess.js library when needed
    isCapture: () => !!(libraryMove as any).captured,
    isPromotion: () => !!(libraryMove as any).promotion,
    isEnPassant: () => (libraryMove as any).flags?.includes("e") || false,
    isKingsideCastle: () => (libraryMove as any).flags?.includes("k") || false,
    isQueensideCastle: () => (libraryMove as any).flags?.includes("q") || false,
    isBigPawn: () => (libraryMove as any).flags?.includes("b") || false,
  } as ValidatedMove;

  logger.debug("Successfully converted library move to domain move", {
    domainMove: {
      from: domainMove.from,
      to: domainMove.to,
      san: domainMove.san,
      promotion: domainMove.promotion,
    },
  });

  return domainMove;
}

/**
 * Converts an array of library moves to domain moves
 * Provides better error context when processing multiple moves
 */
export function fromLibraryMoves(libraryMoves: ChessJsMove[]): ValidatedMove[] {
  return libraryMoves.map((move, index) => {
    try {
      return fromLibraryMove(move);
    } catch (error) {
      if (error instanceof ChessAdapterError) {
        // Create a new error with enhanced context since context is readonly
        throw new ChessAdapterError(error.message, {
          ...error.context,
          moveIndex: index,
          totalMoves: libraryMoves.length,
        });
      }
      throw error;
    }
  });
}

/**
 * Custom error class for chess adapter validation failures
 * Provides rich context for debugging
 */
export class ChessAdapterError extends Error {
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = "ChessAdapterError";
    this.context = context;

    // Log error for monitoring/debugging
    logger.error("Chess adapter validation failed", {
      error: message,
      context: context,
    });
  }
}

/**
 * Type guards for external validation
 */
export const ChessAdapter = {
  isValidPromotionPiece,
  isValidPieceSymbol,
  isValidColor,
  VALID_PROMOTION_PIECES,
} as const;
