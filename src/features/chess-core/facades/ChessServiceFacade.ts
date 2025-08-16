/**
 * ChessServiceFacade - Orchestrator for all chess components
 *
 * This facade coordinates all chess-related services (ChessEngine, MoveValidator,
 * MoveHistory, GermanNotation, ChessEventBus, FenCache) and provides a clean API
 * that matches the original ChessService interface.
 * Part of the Clean Architecture refactoring - Phase 1 final component.
 */

import type { Move as ChessJsMove } from 'chess.js';
import type { ValidatedMove } from '@shared/types/chess';
import { createValidatedMove as createMove } from '@shared/types/chess';
import type {
  IChessServiceFacade,
  IChessEngine,
  IMoveValidator,
  IMoveHistory,
  IChessEventBus,
  IGermanNotation,
  IFenCache,
  ChessEventHandler,
} from '../types/interfaces';

// Default implementations
import ChessEngine from '../services/ChessEngine';
import MoveValidator from '../services/MoveValidator';
import MoveHistory from '../services/MoveHistory';
import ChessEventBus from '../services/ChessEventBus';
import GermanNotation from '../utils/GermanNotation';
import FenCache from '../services/FenCache';

interface ChessServiceFacadeDependencies {
  engine?: IChessEngine;
  validator?: IMoveValidator;
  history?: IMoveHistory;
  eventBus?: IChessEventBus;
  notation?: IGermanNotation;
  cache?: IFenCache;
}

export default class ChessServiceFacade implements IChessServiceFacade {
  private engine: IChessEngine;
  private validator: IMoveValidator;
  private history: IMoveHistory;
  private eventBus: IChessEventBus;
  private notation: IGermanNotation;
  private cache: IFenCache;

  constructor(dependencies: ChessServiceFacadeDependencies = {}) {
    // Initialize dependencies with defaults
    this.engine = dependencies.engine ?? new ChessEngine();
    this.validator = dependencies.validator ?? new MoveValidator();
    this.history = dependencies.history ?? new MoveHistory();
    this.eventBus = dependencies.eventBus ?? new ChessEventBus();
    this.notation = dependencies.notation ?? new GermanNotation();
    this.cache = dependencies.cache ?? new FenCache();
  }

  // ========== Component Access (for testing) ==========
  public getEngine(): IChessEngine {
    return this.engine;
  }

  public getValidator(): IMoveValidator {
    return this.validator;
  }

  public getHistory(): IMoveHistory {
    return this.history;
  }

  public getEventBus(): IChessEventBus {
    return this.eventBus;
  }

  public getNotation(): IGermanNotation {
    return this.notation;
  }

  public getCache(): IFenCache {
    return this.cache;
  }

  // ========== Event System ==========
  public subscribe(listener: ChessEventHandler): () => void {
    return this.eventBus.subscribe(listener);
  }

  // ========== Game Initialization ==========
  public initialize(
    fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  ): boolean {
    const success = this.engine.initialize(fen);
    if (success) {
      this.history.setInitialFen(fen);
      this.history.clear();
      this.emitStateUpdate('load');
    }
    return success;
  }

  public reset(): void {
    this.engine.reset();
    this.history.clear();
    this.cache.clear();
    this.emitStateUpdate('reset');
  }

  // ========== Move Operations ==========
  public move(
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ): ValidatedMove | null {
    // Convert German notation if needed
    const normalizedMove = this.normalizeMove(move);

    // Validate move first
    if (!this.validator.validateMove(normalizedMove, this.engine)) {
      return null;
    }

    // Execute move on engine
    const chessJsMove = this.engine.move(normalizedMove);
    if (!chessJsMove) {
      return null;
    }

    // Create validated move using factory function
    const currentFen = this.engine.getFen();
    const validatedMove = createMove(chessJsMove, chessJsMove.before, currentFen);

    // Add to history
    this.history.addMove(validatedMove);

    // Cache FEN position
    this.cache.set(
      currentFen,
      JSON.stringify({
        moveNumber: this.history.getCurrentIndex() + 1,
        gameState: {
          isCheck: this.engine.isCheck(),
          isCheckmate: this.engine.isCheckmate(),
          isStalemate: this.engine.isStalemate(),
          isDraw: this.engine.isDraw(),
        },
      })
    );

    // Emit event
    this.eventBus.emit({
      type: 'move',
      payload: {
        move: validatedMove,
        fen: currentFen,
        currentMoveIndex: this.history.getCurrentIndex(),
        source: 'move',
      },
    });

    return validatedMove;
  }

  public undo(): boolean {
    if (!this.history.canUndo()) {
      return false;
    }

    // Undo on engine
    const undoneMove = this.engine.undo();
    if (!undoneMove) {
      return false;
    }

    // Update history position
    const newIndex = this.history.getCurrentIndex() - 1;
    this.history.setPosition(newIndex);

    this.emitStateUpdate('undo');
    return true;
  }

  public redo(): boolean {
    if (!this.history.canRedo()) {
      return false;
    }

    const nextIndex = this.history.getCurrentIndex() + 1;
    const nextMove = this.history.getMove(nextIndex);

    if (!nextMove) {
      return false;
    }

    // Execute move on engine
    const moveObj = {
      from: nextMove.from,
      to: nextMove.to,
      ...(nextMove.promotion && { promotion: nextMove.promotion }),
    };
    const result = this.engine.move(moveObj);

    if (!result) {
      return false;
    }

    // Update history position
    this.history.setPosition(nextIndex);

    this.emitStateUpdate('redo');
    return true;
  }

  // ========== Move Validation ==========
  public validateMove(
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ): boolean {
    const normalizedMove = this.normalizeMove(move);
    return this.validator.validateMove(normalizedMove, this.engine);
  }

  // ========== Game State ==========
  public getFen(): string {
    return this.engine.getFen();
  }

  public getPgn(): string {
    return this.engine.getPgn();
  }

  public getMoveHistory(): ValidatedMove[] {
    return this.history.getMoves();
  }

  public getCurrentMoveIndex(): number {
    return this.history.getCurrentIndex();
  }

  public isGameOver(): boolean {
    return this.engine.isGameOver();
  }

  public isCheck(): boolean {
    return this.engine.isCheck();
  }

  public isCheckmate(): boolean {
    return this.engine.isCheckmate();
  }

  public isStalemate(): boolean {
    return this.engine.isStalemate();
  }

  public isDraw(): boolean {
    return this.engine.isDraw();
  }

  public turn(): 'w' | 'b' {
    return this.engine.turn();
  }

  public getGameResult(): string | null {
    if (this.isCheckmate()) {
      return this.turn() === 'w' ? '0-1' : '1-0'; // Opposite color wins
    }
    if (this.isStalemate() || this.isDraw()) {
      return '1/2-1/2';
    }
    return null;
  }

  // ========== Move Generation ==========
  public moves(options?: { square?: string; verbose?: boolean }): string[] | ChessJsMove[] {
    return this.engine.moves(options);
  }

  // ========== PGN Operations ==========
  public loadPgn(pgn: string): boolean {
    const success = this.engine.loadPgn(pgn);
    if (success) {
      this.rebuildHistoryFromEngine();
      this.emitStateUpdate('load');
    }
    return success;
  }

  // ========== Navigation ==========
  public goToMove(moveIndex: number): boolean {
    const totalMoves = this.history.getMoves().length;

    if (moveIndex < -1 || moveIndex >= totalMoves) {
      return false;
    }

    const currentIndex = this.history.getCurrentIndex();
    if (moveIndex === currentIndex) {
      return true; // Already at target position
    }

    // Reset to initial position
    this.engine.initialize(this.history.getInitialFen());

    // Replay moves up to target index
    if (moveIndex >= 0) {
      const moves = this.history.getMoves();
      for (let i = 0; i <= moveIndex; i++) {
        const move = moves[i];
        if (move) {
          const moveObj = {
            from: move.from,
            to: move.to,
            ...(move.promotion && { promotion: move.promotion }),
          };
          this.engine.move(moveObj);
        }
      }
    }

    // Update history position
    this.history.setPosition(moveIndex);

    this.emitStateUpdate('undo');
    return true;
  }

  // ========== Private Helpers ==========
  private normalizeMove(
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ): ChessJsMove | { from: string; to: string; promotion?: string } | string {
    if (typeof move === 'string') {
      // Check if it contains German notation
      if (this.notation.hasGermanNotation(move)) {
        // Try promotion notation first
        const promotionNormalized = this.notation.normalizeMove(move);
        if (promotionNormalized) {
          return promotionNormalized;
        }

        // Then try general SAN conversion
        const sanNormalized = this.notation.germanToSan(move);
        if (sanNormalized !== move) {
          return sanNormalized;
        }
      }
    }

    return move;
  }

  private emitStateUpdate(source: 'move' | 'reset' | 'undo' | 'redo' | 'load'): void {
    this.eventBus.emit({
      type: 'stateUpdate',
      payload: {
        fen: this.getFen(),
        pgn: this.getPgn(),
        moveHistory: this.getMoveHistory(),
        currentMoveIndex: this.getCurrentMoveIndex(),
        isGameOver: this.isGameOver(),
        gameResult: this.getGameResult(),
        source,
      },
    });
  }

  private rebuildHistoryFromEngine(): void {
    this.history.clear();

    const engineHistory = this.engine.history({ verbose: true });
    if (!Array.isArray(engineHistory)) {
      return;
    }

    // Get initial FEN by undoing all moves
    const moveCount = engineHistory.length;
    for (let i = 0; i < moveCount; i++) {
      this.engine.undo();
    }
    const initialFen = this.engine.getFen();
    this.history.setInitialFen(initialFen);

    // Replay and record moves
    for (const chessJsMove of engineHistory) {
      const result = this.engine.move(chessJsMove);
      if (result) {
        const validatedMove = createMove(result, result.before, this.engine.getFen());

        this.history.addMove(validatedMove);
      }
    }
  }
}
