/**
 * @file ChessService - Singleton service for chess game logic
 * @module services/ChessService
 *
 * @description
 * Encapsulates Chess.js instance as a singleton service to avoid
 * Immer/WritableDraft conflicts while maintaining clean separation
 * of concerns. Provides event-driven updates for store synchronization.
 */

import { Chess, type Move as ChessJsMove } from "chess.js";
import type { ValidatedMove } from "@shared/types/chess";
import { createValidatedMove } from "@shared/types/chess";
import { getLogger } from "./logging";
import { CACHE_SIZES } from "@/shared/constants/cache";
import { FEN, ARRAY_INDICES } from "@/shared/constants/chess.constants";

const logger = getLogger().setContext("ChessService");

/**
 * Game state payload for events
 */
export interface GameStatePayload {
  fen: string;
  pgn: string;
  moveHistory: ValidatedMove[];
  currentMoveIndex: number;
  isGameOver: boolean;
  gameResult: string | null;
}

/**
 * Event types emitted by ChessService
 */
export type ChessServiceEvent =
  | {
      type: "stateUpdate";
      payload: GameStatePayload;
      source: "move" | "reset" | "undo" | "redo" | "load";
    }
  | { type: "error"; payload: { error: Error; move?: ValidatedMove | string; message: string } };

/**
 * Listener function type for ChessService events
 */
export type ChessServiceListener = (event: ChessServiceEvent) => void;

/**
 * Chess game service - singleton pattern
 * Manages Chess.js instance outside of Zustand/Immer state
 */
class ChessService {
  private chess: Chess;
  private listeners = new Set<ChessServiceListener>();
  private moveHistory: ValidatedMove[] = [];
  private currentMoveIndex = ARRAY_INDICES.INITIAL_MOVE_INDEX;
  private fenCache = new Map<string, string>(); // LRU cache for FEN strings (not Chess instances!)
  private readonly MAX_CACHE_SIZE = CACHE_SIZES.MEDIUM;
  private initialFen: string = FEN.STARTING_POSITION; // Store initial position

  /**
   * Convert German piece notation to chess.js format
   * Handles both uppercase and lowercase German notation
   * @param notation - German piece notation (D, T, L, S) or English (Q, R, B, N, q, r, b, n)
   * @returns chess.js compatible piece notation (q, r, b, n) or original if already valid
   */
  private normalizePromotionPiece(notation: string | undefined): string | undefined {
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
    
    return germanToChessJs[notation] || notation;
  }

  constructor() {
    this.chess = new Chess();
  }

  /**
   * Subscribe to chess service events
   */
  subscribe(listener: ChessServiceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: ChessServiceEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error in ChessService listener: ${errorMessage}`, {
          errorType: error ? error.constructor.name : 'unknown',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    });
  }

  /**
   * Build complete game state payload for events
   */
  private buildStatePayload(): GameStatePayload {
    return {
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      // Only include moves up to the current index (for proper undo behavior)
      moveHistory: this.moveHistory.slice(0, this.currentMoveIndex + 1),
      currentMoveIndex: this.currentMoveIndex,
      isGameOver: this.chess.isGameOver(),
      gameResult: this.getGameResult(),
    };
  }

  /**
   * Initialize with a FEN position
   */
  initialize(fen: string): boolean {
    try {

      // Check cache first (storing normalized FEN strings, not Chess instances)
      const cachedFen = this.fenCache.get(fen);
      if (cachedFen) {
        this.chess = new Chess(cachedFen);
        // Using cached FEN
      } else {
        this.chess = new Chess(fen);
        // Cache the normalized FEN
        this.updateCache(fen, this.chess.fen());
        // Created new Chess instance
      }

      // CRITICAL: Store the initial FEN for reset operations
      this.initialFen = this.chess.fen();
      this.moveHistory = [];
      this.currentMoveIndex = -1;

      // ChessService initialized

      this.emit({
        type: "stateUpdate",
        payload: this.buildStatePayload(),
        source: "load",
      });

      // State update emitted to listeners
      return true;
    } catch (error) {
      // Emit error event for initialization failures
      this.emit({
        type: "error",
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          // Omit move property instead of setting to undefined for exactOptionalPropertyTypes
          message: "Ungültige FEN-Position",
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize with FEN: ${errorMessage}`, { fen, errorType: error ? error.constructor.name : 'unknown' });
      return false;
    }
  }

  /**
   * Make a move
   */
  move(
    move:
      | ChessJsMove
      | { from: string; to: string; promotion?: string }
      | string,
  ): ValidatedMove | null {
    try {
      const fenBefore = this.chess.fen();

      // Normalize promotion piece if move is an object with promotion
      let normalizedMove = move;
      if (typeof move === 'object' && move !== null && 'promotion' in move && move.promotion) {
        // Create type adapter for promotion handling with exactOptionalPropertyTypes
        const normalizedPromotion = this.normalizePromotionPiece(move.promotion);
        normalizedMove = {
          ...move,
        };
        if (normalizedPromotion) {
          normalizedMove.promotion = normalizedPromotion;
        }
      } else if (typeof move === 'string') {
        // Handle string notation with German piece letters
        
        // First check if it's a regular move with German piece notation (e.g., "Dh5", "Ta4")
        const germanPieceRegex = /^([DTLS])([a-h]?[1-8]?[x]?)([a-h][1-8])([+#])?$/;
        const germanMatch = move.match(germanPieceRegex);
        if (germanMatch && germanMatch.length >= 4) {
          // Convert German piece notation to English
          const germanToEnglish: Record<string, string> = {
            'D': 'Q', // Dame -> Queen
            'T': 'R', // Turm -> Rook
            'L': 'B', // Läufer -> Bishop
            'S': 'N', // Springer -> Knight
          };
          // When regex matches, these groups are guaranteed to exist (but group 2 can be empty string)
          const [, piece = '', middle = '', target = '', suffix = ''] = germanMatch;
          if (piece && target && germanToEnglish[piece]) {
            normalizedMove = germanToEnglish[piece] + middle + target + suffix;
          }
        } else {
          // Try different promotion formats: "e7e8D", "e7-e8D", "e8D", "e8=D"
          
          // Format 1: "e7e8D" or "e7-e8D" (from-to-promotion with optional dash)
          let promotionMatch = move.match(/^([a-h][1-8])-?([a-h][1-8])([DTLSQRBN])$/i);
          if (promotionMatch && promotionMatch[3]) {
            const normalizedPromotion = this.normalizePromotionPiece(promotionMatch[3]);
            // Convert to object format for chess.js - make sure promotion is a string
            normalizedMove = {
              from: promotionMatch[1],
              to: promotionMatch[2],
              promotion: normalizedPromotion as string
            } as { from: string; to: string; promotion?: string };
          } else {
            // Format 2: "e8D" or "e8=D" (SAN notation with German piece)
            promotionMatch = move.match(/^([a-h][1-8])=?([DTLSQRBN])$/i);
            if (promotionMatch && promotionMatch[2]) {
              const normalizedPromotion = this.normalizePromotionPiece(promotionMatch[2]);
              normalizedMove = `${promotionMatch[1]  }=${  (normalizedPromotion || '').toUpperCase()}`;
            }
          }
        }
      }

      const result = this.chess.move(normalizedMove);

      if (!result) {
        // Emit error event for invalid moves
        logger.warn("Invalid move attempted", {
          move,
          fenBefore,
        });

        this.emit({
          type: "error",
          payload: {
            error: new Error("Invalid move"),
            move: typeof move === 'string' ? move : `${move.from}-${move.to}`,
            message: "Ungültiger Zug",
          },
        });
        return null;
      }

      const fenAfter = this.chess.fen();
      const validatedMove = createValidatedMove(result, fenBefore, fenAfter);

      // Truncate history if we're not at the end
      this.moveHistory = this.moveHistory.slice(0, this.currentMoveIndex + 1);
      this.moveHistory.push(validatedMove);
      this.currentMoveIndex = this.moveHistory.length - 1;

      this.emit({
        type: "stateUpdate",
        payload: this.buildStatePayload(),
        source: "move",
      });

      return validatedMove;
    } catch (error) {
      // Emit error event for exceptions
      this.emit({
        type: "error",
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          move: typeof move === 'string' ? move : `${move.from}-${move.to}`,
          message: "Fehler beim Ausführen des Zuges",
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error making move: ${errorMessage}`, { move, errorType: error ? error.constructor.name : 'unknown' });
      return null;
    }
  }

  /**
   * Undo last move
   */
  undo(): boolean {
    if (this.currentMoveIndex < 0) {
      // Emit error event for no moves to undo
      this.emit({
        type: "error",
        payload: {
          error: new Error("No moves to undo"),
          // Omit move property for exactOptionalPropertyTypes compatibility
          message: "Keine Züge zum Rückgängigmachen",
        },
      });
      logger.warn("No moves to undo");
      return false;
    }

    try {
      const targetIndex = this.currentMoveIndex - 1;
      const targetFen =
        targetIndex >= 0
          ? this.moveHistory[targetIndex]?.fenAfter
          : this.moveHistory[0]?.fenBefore;

      this.chess = new Chess(targetFen);
      this.currentMoveIndex = targetIndex;

      this.emit({
        type: "stateUpdate",
        payload: this.buildStatePayload(),
        source: "undo",
      });

      return true;
    } catch (error) {
      // Emit error event for undo failures
      this.emit({
        type: "error",
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          // Omit move property for exactOptionalPropertyTypes compatibility
          message: "Fehler beim Rückgängigmachen",
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to undo move: ${errorMessage}`, { errorType: error ? error.constructor.name : 'unknown' });
      return false;
    }
  }

  /**
   * Redo previously undone move
   */
  redo(): boolean {
    if (this.currentMoveIndex >= this.moveHistory.length - 1) {
      // Emit error event for no moves to redo
      this.emit({
        type: "error",
        payload: {
          error: new Error("No moves to redo"),
          // Omit move property for exactOptionalPropertyTypes compatibility
          message: "Keine Züge zum Wiederherstellen",
        },
      });
      logger.warn("No moves to redo");
      return false;
    }

    try {
      const targetIndex = this.currentMoveIndex + 1;
      const targetMove = this.moveHistory[targetIndex];
      if (!targetMove) {
        logger.warn("No move found at target index");
        return false;
      }
      const targetFen = targetMove.fenAfter;

      this.chess = new Chess(targetFen);
      this.currentMoveIndex = targetIndex;

      this.emit({
        type: "stateUpdate",
        payload: this.buildStatePayload(),
        source: "redo",
      });

      return true;
    } catch (error) {
      // Emit error event for redo failures
      this.emit({
        type: "error",
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          // Omit move property for exactOptionalPropertyTypes compatibility
          message: "Fehler beim Wiederherstellen",
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to redo move: ${errorMessage}`, { errorType: error ? error.constructor.name : 'unknown' });
      return false;
    }
  }

  /**
   * Reset to starting position
   */
  reset(): void {
    // Use the stored initial FEN instead of default starting position
    this.chess = new Chess(this.initialFen);
    this.moveHistory = [];
    this.currentMoveIndex = -1;

    this.emit({
      type: "stateUpdate",
      payload: this.buildStatePayload(),
      source: "reset",
    });

  }

  /**
   * Get current FEN
   */
  getFen(): string {
    return this.chess.fen();
  }

  /**
   * Get current PGN
   */
  getPgn(): string {
    return this.chess.pgn();
  }

  /**
   * Get move history
   */
  getMoveHistory(): ValidatedMove[] {
    return [...this.moveHistory];
  }

  /**
   * Get current move index
   */
  getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Check if in check
   */
  isCheck(): boolean {
    return this.chess.isCheck();
  }

  /**
   * Check if checkmate
   */
  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Check if stalemate
   */
  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  /**
   * Check if draw
   */
  isDraw(): boolean {
    return this.chess.isDraw();
  }

  /**
   * Get whose turn it is
   */
  turn(): "w" | "b" {
    return this.chess.turn();
  }

  /**
   * Get legal moves for a square
   */
  moves(options?: {
    square?: string;
    verbose?: boolean;
  }): string[] | ChessJsMove[] {
    if (!options) {
      return this.chess.moves();
    }
    
    // Handle chess.js type requirements
    const chessOptions: { square?: string; verbose?: boolean } = {};
    if (options.verbose !== undefined) {
      chessOptions.verbose = options.verbose;
    }
    if (options.square && /^[a-h][1-8]$/.test(options.square)) {
      chessOptions.square = options.square as 'a1'; // Type assertion after validation
    }
    
    return this.chess.moves(chessOptions);
  }

  /**
   * Helper: Validate move object has valid squares
   */
  private validateMoveObject(move: { from: string; to: string; promotion?: string }, currentFen: string): boolean {
    const { from, to } = move;
    const squareRegex = /^[a-h][1-8]$/;
    
    // Basic square format validation
    if (!squareRegex.test(from) || !squareRegex.test(to)) {
      return false;
    }
    
    // Check if source square has a piece
    const tempChess = new Chess(currentFen);
    const isValidSquare = (square: string): square is 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8' | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8' | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' | 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8' | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' | 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8' => {
      return /^[a-h][1-8]$/.test(square);
    };
    
    if (!isValidSquare(from)) {
      return false;
    }
    
    const piece = tempChess.get(from);
    return piece !== null;
  }

  /**
   * Helper: Normalize German piece notation
   */
  private normalizeGermanNotation(move: string): string {
    const germanPieceRegex = /^([DTLS])([a-h]?[1-8]?[x]?)([a-h][1-8])([+#])?$/;
    const germanMatch = move.match(germanPieceRegex);
    
    if (germanMatch && germanMatch.length >= 4) {
      const germanToEnglish: Record<string, string> = {
        'D': 'Q', // Dame -> Queen
        'T': 'R', // Turm -> Rook
        'L': 'B', // Läufer -> Bishop
        'S': 'N', // Springer -> Knight
      };
      const [, piece = '', middle = '', target = '', suffix = ''] = germanMatch;
      if (piece && target && germanToEnglish[piece]) {
        return germanToEnglish[piece] + middle + target + suffix;
      }
    }
    return move;
  }

  /**
   * Helper: Handle promotion notation
   */
  private handlePromotionNotation(move: string): string | { from: string; to: string; promotion?: string } {
    // Format 1: "e7e8D" or "e7-e8D" (from-to-promotion with optional dash)
    let promotionMatch = move.match(/^([a-h][1-8])-?([a-h][1-8])([DTLSQRBN])$/i);
    if (promotionMatch && promotionMatch[1] && promotionMatch[2] && promotionMatch[3]) {
      const normalizedPromotion = this.normalizePromotionPiece(promotionMatch[3]);
      return {
        from: promotionMatch[1],
        to: promotionMatch[2],
        promotion: normalizedPromotion as string
      };
    }
    
    // Format 2: "e8D" or "e8=D" (SAN notation with German piece)
    promotionMatch = move.match(/^([a-h][1-8])=?([DTLSQRBN])$/i);
    if (promotionMatch && promotionMatch[1] && promotionMatch[2]) {
      const normalizedPromotion = this.normalizePromotionPiece(promotionMatch[2]);
      return `${promotionMatch[1]}=${(normalizedPromotion || '').toUpperCase()}`;
    }
    
    return move;
  }

  /**
   * Validate a move without making it
   */
  validateMove(
    move:
      | ChessJsMove
      | { from: string; to: string; promotion?: string }
      | string,
  ): boolean {
    try {
      const currentFen = this.chess.fen();

      // Validate move object format
      if (typeof move === 'object' && move !== null && 'from' in move && 'to' in move) {
        if (!this.validateMoveObject(move as { from: string; to: string; promotion?: string }, currentFen)) {
          return false;
        }
      }

      // Normalize the move
      let normalizedMove = move;
      if (typeof move === 'object' && move !== null && 'promotion' in move && move.promotion) {
        const normalizedPromotion = this.normalizePromotionPiece(move.promotion);
        normalizedMove = { ...move };
        if (normalizedPromotion) {
          normalizedMove.promotion = normalizedPromotion;
        }
      } else if (typeof move === 'string') {
        // Try German notation first
        const germanNormalized = this.normalizeGermanNotation(move);
        if (germanNormalized !== move) {
          normalizedMove = germanNormalized;
        } else {
          // Try promotion notation
          normalizedMove = this.handlePromotionNotation(move);
        }
      }

      // Create a temporary chess instance to test the move
      const tempChess = new Chess(currentFen);
      const result = tempChess.move(normalizedMove);

      // Debug log for promotion moves
      if (typeof move === 'object' && move !== null && 'promotion' in move) {
        logger.info(`Promotion move validation`, {
          originalMove: JSON.stringify(move),
          normalizedMove: typeof normalizedMove === 'object' ? JSON.stringify(normalizedMove) : normalizedMove,
          result: result ? 'valid' : 'invalid',
          currentFen: currentFen
        });
      }

      // Validation result determined
      return result !== null;
    } catch (error) {
      // Enhanced error logging to debug E2E issues
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`ChessService.validateMove error: ${errorMessage}`, { 
        errorType: error ? error.constructor.name : 'unknown',
        move: typeof move === 'object' ? JSON.stringify(move) : String(move),
        moveType: typeof move,
        currentFen: this.chess.fen(),
        stack: errorStack
      });
      return false;
    }
  }

  /**
   * Get game result
   */
  getGameResult(): string | null {
    if (!this.chess.isGameOver()) return null;

    if (this.chess.isCheckmate()) {
      return this.chess.turn() === "w" ? "0-1" : "1-0";
    }

    return "1/2-1/2"; // Draw
  }

  /**
   * Load from PGN
   */
  loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);

      // Rebuild move history from PGN
      const moves = this.chess.history({ verbose: true });
      this.chess = new Chess(); // Reset to start
      this.moveHistory = [];

      for (const move of moves) {
        const fenBefore = this.chess.fen();
        this.chess.move(move);
        const fenAfter = this.chess.fen();
        const validatedMove = createValidatedMove(move, fenBefore, fenAfter);
        this.moveHistory.push(validatedMove);
      }

      this.currentMoveIndex = this.moveHistory.length - 1;

      this.emit({
        type: "stateUpdate",
        payload: this.buildStatePayload(),
        source: "load",
      });

      return true;
    } catch (error) {
      // Emit error event for PGN loading failures
      this.emit({
        type: "error",
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          // Omit move property for exactOptionalPropertyTypes compatibility
          message: "Ungültiges PGN-Format",
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to load PGN: ${errorMessage}`, { errorType: error ? error.constructor.name : 'unknown' });
      return false;
    }
  }

  /**
   * Update FEN cache with true LRU eviction
   */
  private updateCache(key: string, normalizedFen: string): void {
    // If key exists, delete it first to move to end (LRU behavior)
    if (this.fenCache.has(key)) {
      this.fenCache.delete(key);
    }

    // Check if we need to evict
    if (this.fenCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry (first in map) - true LRU since we move accessed items to end
      const firstKey = this.fenCache.keys().next().value;
      if (firstKey !== undefined) {
        this.fenCache.delete(firstKey);
      }
    }

    // Add to end of map (most recently used)
    this.fenCache.set(key, normalizedFen);
  }

  /**
   * Go to specific move in history
   */
  goToMove(moveIndex: number): boolean {
    if (moveIndex < -1 || moveIndex >= this.moveHistory.length) {
      // Emit error event for invalid index
      this.emit({
        type: "error",
        payload: {
          error: new Error(`Invalid move index: ${moveIndex}`),
          // Omit move property for exactOptionalPropertyTypes compatibility
          message: `Ungültiger Zugindex: ${moveIndex}`,
        },
      });
      logger.warn("Invalid move index", { moveIndex });
      return false;
    }

    try {
      const targetFen =
        moveIndex === -1
          ? this.moveHistory[0]?.fenBefore || this.initialFen
          : this.moveHistory[moveIndex]?.fenAfter;

      this.chess = new Chess(targetFen);
      this.currentMoveIndex = moveIndex;

      this.emit({
        type: "stateUpdate",
        payload: this.buildStatePayload(),
        source: "load",
      });

      return true;
    } catch (error) {
      // Emit error event for navigation failures
      this.emit({
        type: "error",
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          // Omit move property for exactOptionalPropertyTypes compatibility
          message: "Fehler beim Navigieren zum Zug",
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to go to move: ${errorMessage}`, { moveIndex, errorType: error ? error.constructor.name : 'unknown' });
      return false;
    }
  }
}

// Export singleton instance
export const chessService = new ChessService();

// Also export class for testing purposes
export { ChessService };
