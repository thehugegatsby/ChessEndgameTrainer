/**
 * ChessServiceV2 - Modern implementation of chess service
 *
 * This is the new implementation for the Strangler Fig Pattern migration.
 * It implements the IChessService interface to ensure compatibility with
 * the legacy ChessService while providing improved architecture.
 */

import { Chess, type Move as ChessJsMove } from 'chess.js';
import type { ValidatedMove } from '@shared/types/chess';
import { createValidatedMove } from '@shared/types/chess';
import { getLogger } from '@shared/services/logging';
import type {
  IChessService,
  GameStatePayload,
  ChessServiceEvent,
  ChessServiceListener,
  MoveInput,
  MoveOptions,
} from '../types/IChessService';

const logger = getLogger().setContext('ChessServiceV2');

/**
 * Modern chess service implementation
 * Singleton pattern with improved architecture
 */
// Constants
const MAX_FEN_CACHE_SIZE = 100;

class ChessServiceV2 implements IChessService {
  private static instance: ChessServiceV2;
  private chess: Chess;
  private listeners = new Set<ChessServiceListener>();
  private moveHistory: ValidatedMove[] = [];
  private currentMoveIndex = -1;
  private fenCache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = MAX_FEN_CACHE_SIZE;
  private initialFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  private constructor() {
    this.chess = new Chess();
    logger.info('ChessServiceV2 initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ChessServiceV2 {
    if (!ChessServiceV2.instance) {
      ChessServiceV2.instance = new ChessServiceV2();
    }
    return ChessServiceV2.instance;
  }

  /**
   * Subscribe to chess service events
   */
  public subscribe(listener: ChessServiceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: ChessServiceEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error in ChessServiceV2 listener: ${errorMessage}`, {
          errorType: error ? error.constructor.name : 'unknown',
          stack: error instanceof Error ? error.stack : undefined,
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
      moveHistory: this.moveHistory.slice(0, this.currentMoveIndex + 1),
      currentMoveIndex: this.currentMoveIndex,
      isGameOver: this.chess.isGameOver(),
      gameResult: this.getGameResult(),
    };
  }

  /**
   * Initialize with a FEN position
   */
  public initialize(fen: string): boolean {
    try {
      const cachedFen = this.fenCache.get(fen);
      if (cachedFen) {
        this.chess = new Chess(cachedFen);
      } else {
        this.chess = new Chess(fen);
        this.updateCache(fen, this.chess.fen());
      }

      this.initialFen = this.chess.fen();
      this.moveHistory = [];
      this.currentMoveIndex = -1;

      this.emit({
        type: 'stateUpdate',
        payload: this.buildStatePayload(),
        source: 'load',
      });

      return true;
    } catch (error) {
      this.emit({
        type: 'error',
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          message: 'Ungültige FEN-Position',
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize with FEN: ${errorMessage}`, {
        fen,
        errorType: error ? error.constructor.name : 'unknown',
      });
      return false;
    }
  }

  /**
   * Reset the game to initial position
   */
  public reset(): void {
    this.chess = new Chess(this.initialFen);
    this.moveHistory = [];
    this.currentMoveIndex = -1;

    this.emit({
      type: 'stateUpdate',
      payload: this.buildStatePayload(),
      source: 'reset',
    });
  }

  /**
   * Make a move
   */
  public move(move: MoveInput): ValidatedMove | null {
    try {
      const fenBefore = this.chess.fen();
      const normalizedMove = this.normalizeMove(move);
      const result = this.chess.move(normalizedMove);

      if (result) {
        const fenAfter = this.chess.fen();
        const validatedMove = createValidatedMove(result, fenBefore, fenAfter);

        // Handle undo/redo history
        if (this.currentMoveIndex < this.moveHistory.length - 1) {
          this.moveHistory = this.moveHistory.slice(0, this.currentMoveIndex + 1);
        }

        this.moveHistory.push(validatedMove);
        this.currentMoveIndex++;

        this.emit({
          type: 'stateUpdate',
          payload: this.buildStatePayload(),
          source: 'move',
        });

        return validatedMove;
      }

      return null;
    } catch (error) {
      this.emit({
        type: 'error',
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          move: typeof move === 'object' ? JSON.stringify(move) : String(move),
          message: 'Ungültiger Zug',
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to make move: ${errorMessage}`, {
        move: typeof move === 'object' ? JSON.stringify(move) : move,
        errorType: error ? error.constructor.name : 'unknown',
      });
      return null;
    }
  }

  /**
   * Undo the last move
   */
  public undo(): boolean {
    if (this.currentMoveIndex < 0) {
      logger.warn('No moves to undo');
      return false;
    }

    try {
      const firstMove = this.moveHistory[0];
      const targetFen =
        this.currentMoveIndex === 0 && firstMove
          ? firstMove.fenBefore
          : this.moveHistory[this.currentMoveIndex - 1]?.fenAfter || this.initialFen;

      this.chess = new Chess(targetFen);
      this.currentMoveIndex--;

      this.emit({
        type: 'stateUpdate',
        payload: this.buildStatePayload(),
        source: 'undo',
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to undo move: ${errorMessage}`, {
        currentMoveIndex: this.currentMoveIndex,
        errorType: error ? error.constructor.name : 'unknown',
      });
      return false;
    }
  }

  /**
   * Redo a previously undone move
   */
  public redo(): boolean {
    if (this.currentMoveIndex >= this.moveHistory.length - 1) {
      logger.warn('No moves to redo');
      return false;
    }

    try {
      const nextMove = this.moveHistory[this.currentMoveIndex + 1];
      if (!nextMove) {
        return false;
      }
      this.chess = new Chess(nextMove.fenAfter);
      this.currentMoveIndex++;

      this.emit({
        type: 'stateUpdate',
        payload: this.buildStatePayload(),
        source: 'redo',
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to redo move: ${errorMessage}`, {
        currentMoveIndex: this.currentMoveIndex,
        errorType: error ? error.constructor.name : 'unknown',
      });
      return false;
    }
  }

  /**
   * Validate a move without making it
   */
  public validateMove(move: MoveInput): boolean {
    try {
      const currentFen = this.chess.fen();
      const tempChess = new Chess(currentFen);
      const normalizedMove = this.normalizeMove(move);
      const result = tempChess.move(normalizedMove);
      return result !== null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ChessServiceV2.validateMove error: ${errorMessage}`, {
        errorType: error ? error.constructor.name : 'unknown',
        move: typeof move === 'object' ? JSON.stringify(move) : String(move),
        currentFen: this.chess.fen(),
      });
      return false;
    }
  }

  /**
   * Get current FEN
   */
  public getFen(): string {
    return this.chess.fen();
  }

  /**
   * Get current PGN
   */
  public getPgn(): string {
    return this.chess.pgn();
  }

  /**
   * Get move history
   */
  public getMoveHistory(): ValidatedMove[] {
    return [...this.moveHistory];
  }

  /**
   * Get current move index
   */
  public getCurrentMoveIndex(): number {
    return this.currentMoveIndex;
  }

  /**
   * Check if game is over
   */
  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /**
   * Check if in check
   */
  public isCheck(): boolean {
    return this.chess.isCheck();
  }

  /**
   * Check if checkmate
   */
  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  /**
   * Check if stalemate
   */
  public isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  /**
   * Check if draw
   */
  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  /**
   * Get whose turn it is
   */
  public turn(): 'w' | 'b' {
    return this.chess.turn();
  }

  /**
   * Get game result
   */
  public getGameResult(): string | null {
    if (!this.chess.isGameOver()) return null;

    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? '0-1' : '1-0';
    }

    return '1/2-1/2'; // Draw
  }

  /**
   * Get legal moves for a square
   */
  public moves(options?: MoveOptions): string[] | ChessJsMove[] {
    if (!options) {
      return this.chess.moves();
    }

    const chessOptions: { square?: string; verbose?: boolean } = {};
    if (options.verbose !== undefined) {
      chessOptions.verbose = options.verbose;
    }
    if (options.square && /^[a-h][1-8]$/.test(options.square)) {
      chessOptions.square = options.square as 'a1';
    }

    return this.chess.moves(chessOptions);
  }

  /**
   * Load from PGN
   */
  public loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);

      // Rebuild move history from PGN
      const moves = this.chess.history({ verbose: true });
      this.chess = new Chess();
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
        type: 'stateUpdate',
        payload: this.buildStatePayload(),
        source: 'load',
      });

      return true;
    } catch (error) {
      this.emit({
        type: 'error',
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          message: 'Ungültiges PGN-Format',
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to load PGN: ${errorMessage}`, {
        errorType: error ? error.constructor.name : 'unknown',
      });
      return false;
    }
  }

  /**
   * Go to specific move in history
   */
  public goToMove(moveIndex: number): boolean {
    if (moveIndex < -1 || moveIndex >= this.moveHistory.length) {
      this.emit({
        type: 'error',
        payload: {
          error: new Error(`Invalid move index: ${moveIndex}`),
          message: `Ungültiger Zugindex: ${moveIndex}`,
        },
      });
      logger.warn('Invalid move index', { moveIndex });
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
        type: 'stateUpdate',
        payload: this.buildStatePayload(),
        source: 'load',
      });

      return true;
    } catch (error) {
      this.emit({
        type: 'error',
        payload: {
          error: error instanceof Error ? error : new Error(String(error)),
          message: 'Fehler beim Navigieren zum Zug',
        },
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to go to move: ${errorMessage}`, {
        moveIndex,
        errorType: error ? error.constructor.name : 'unknown',
      });
      return false;
    }
  }

  /**
   * Update FEN cache with LRU eviction
   */
  private updateCache(key: string, normalizedFen: string): void {
    if (this.fenCache.has(key)) {
      this.fenCache.delete(key);
    }

    if (this.fenCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.fenCache.keys().next().value;
      if (firstKey !== undefined) {
        this.fenCache.delete(firstKey);
      }
    }

    this.fenCache.set(key, normalizedFen);
  }

  /**
   * Normalize move input to chess.js format
   * Handles German piece notation (D, T, L, S) and various formats
   */
  private normalizeMove(move: MoveInput): MoveInput {
    if (typeof move === 'object' && move !== null && 'promotion' in move && move.promotion) {
      const normalizedPromotion = this.normalizePromotionPiece(move.promotion);
      const result = { ...move };
      if (normalizedPromotion) {
        result.promotion = normalizedPromotion;
      }
      return result;
    } else if (typeof move === 'string') {
      // Handle string notation with German piece letters
      let promotionMatch = move.match(/^([a-h][1-8])-?([a-h][1-8])([DTLSQRBN])$/i);
      if (promotionMatch && promotionMatch[3]) {
        const normalizedPromotion = this.normalizePromotionPiece(promotionMatch[3]);
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
        const normalizedPromotion = this.normalizePromotionPiece(promotionMatch[2]);
        return `${promotionMatch[1]}=${(normalizedPromotion || '').toUpperCase()}`;
      }
    }

    return move;
  }

  /**
   * Convert German piece notation to chess.js format
   */
  private normalizePromotionPiece(notation: string | undefined): string | undefined {
    if (!notation) return undefined;

    const germanToChessJs: Record<string, string> = {
      D: 'q', // Dame (Queen)
      d: 'q',
      T: 'r', // Turm (Rook)
      t: 'r',
      L: 'b', // Läufer (Bishop)
      l: 'b',
      S: 'n', // Springer (Knight)
      s: 'n',
      // Also support English notation
      Q: 'q',
      q: 'q',
      R: 'r',
      r: 'r',
      B: 'b',
      b: 'b',
      N: 'n',
      n: 'n',
    };

    return germanToChessJs[notation] || notation;
  }
}

// Export singleton instance
export const chessServiceV2 = ChessServiceV2.getInstance();

// Also export class for testing
export default ChessServiceV2;
