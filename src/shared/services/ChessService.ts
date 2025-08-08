/**
 * @file ChessService - Singleton service for chess game logic
 * @module services/ChessService
 *
 * @description
 * Encapsulates Chess.js instance as a singleton service to avoid
 * Immer/WritableDraft conflicts while maintaining clean separation
 * of concerns. Provides event-driven updates for store synchronization.
 */

import { Chess, Move as ChessJsMove } from "chess.js";
import type { ValidatedMove } from "@shared/types/chess";
import { createValidatedMove } from "@shared/types/chess";
import { getLogger } from "./logging";

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
  | { type: "error"; payload: { error: Error; move?: any; message: string } };

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
  private currentMoveIndex = -1;
  private fenCache = new Map<string, string>(); // LRU cache for FEN strings (not Chess instances!)
  private readonly MAX_CACHE_SIZE = 100;
  private initialFen: string =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Store initial position

  constructor() {
    this.chess = new Chess();
    logger.debug("ChessService initialized");
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
        logger.error("Error in ChessService listener", { error });
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
      // logger.debug("ChessService.initialize called", { fen });

      // Check cache first (storing normalized FEN strings, not Chess instances)
      if (this.fenCache.has(fen)) {
        const cachedFen = this.fenCache.get(fen)!;
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
          move: undefined,
          message: "Ungültige FEN-Position",
        },
      });
      logger.error("Failed to initialize with FEN", { fen, error });
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
      // logger.debug("ChessService.move called", { move, fenBefore });

      const result = this.chess.move(move);

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
            move,
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
          move,
          message: "Fehler beim Ausführen des Zuges",
        },
      });
      logger.error("Error making move", { move, error });
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
          move: undefined,
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
          ? this.moveHistory[targetIndex].fenAfter
          : this.moveHistory[0].fenBefore;

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
          move: undefined,
          message: "Fehler beim Rückgängigmachen",
        },
      });
      logger.error("Failed to undo move", { error });
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
          move: undefined,
          message: "Keine Züge zum Wiederherstellen",
        },
      });
      logger.warn("No moves to redo");
      return false;
    }

    try {
      const targetIndex = this.currentMoveIndex + 1;
      const targetFen = this.moveHistory[targetIndex].fenAfter;

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
          move: undefined,
          message: "Fehler beim Wiederherstellen",
        },
      });
      logger.error("Failed to redo move", { error });
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

    logger.debug("Reset to starting position");
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
    return this.chess.moves(options as any);
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
      // logger.debug("ChessService.validateMove", { move, currentFen });

      // Additional validation for move object format
      if (typeof move === 'object' && move !== null) {
        // Check if it's a move object with from/to properties
        if ('from' in move && 'to' in move) {
          const { from, to } = move as { from: string; to: string; promotion?: string };
          
          // Basic square format validation (e.g., "e2", "h8")
          const squareRegex = /^[a-h][1-8]$/;
          if (!squareRegex.test(from) || !squareRegex.test(to)) {
            logger.debug("Invalid square format in move object", { from, to });
            return false;
          }
          
          // Check if source square actually has a piece
          const tempChess = new Chess(currentFen);
          const piece = tempChess.get(from as any);
          if (!piece) {
            logger.debug("No piece on source square", { from, currentFen });
            return false;
          }
        }
      }

      // Create a temporary chess instance to test the move
      const tempChess = new Chess(currentFen);
      const result = tempChess.move(move);

      // Validation result determined
      return result !== null;
    } catch (error) {
      // Enhanced error logging to debug E2E issues
      logger.error("ChessService.validateMove error", { 
        error: error instanceof Error ? error.message : String(error),
        errorType: error ? error.constructor.name : 'unknown',
        move: typeof move === 'object' ? JSON.stringify(move) : String(move),
        moveType: typeof move,
        currentFen: this.chess.fen(),
        stack: error instanceof Error ? error.stack : undefined
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
          move: undefined,
          message: "Ungültiges PGN-Format",
        },
      });
      logger.error("Failed to load PGN", { error });
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
          move: undefined,
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
          : this.moveHistory[moveIndex].fenAfter;

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
          move: undefined,
          message: "Fehler beim Navigieren zum Zug",
        },
      });
      logger.error("Failed to go to move", { moveIndex, error });
      return false;
    }
  }
}

// Export singleton instance
export const chessService = new ChessService();

// Also export class for testing purposes
export { ChessService };
