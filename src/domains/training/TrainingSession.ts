/**
 * @file Training Session Management
 * @module domains/training/TrainingSession
 * 
 * @description
 * Training-specific features built on top of pure ChessGame.
 * Handles:
 * - Player vs Engine gameplay
 * - Move quality evaluation
 * - Training progression
 * - Manual mode for testing
 * 
 * Clean separation: Training features use ChessGame, not the other way around.
 */

import { ChessGame, type Move, type MoveResult } from '../chess/ChessGame';

/**
 * Training modes
 */
export type TrainingMode = 'training' | 'manual';

/**
 * Training colors
 */
export type TrainingColor = 'white' | 'black';

/**
 * Training session result
 */
export interface TrainingMoveResult extends MoveResult {
  isPlayerTurn?: boolean;
  shouldScheduleEngine?: boolean;
  trainingComplete?: boolean;
}

/**
 * Training session configuration
 */
export interface TrainingConfig {
  mode: TrainingMode;
  playerColor: TrainingColor;
  engineEnabled: boolean;
  qualityEvaluationEnabled: boolean;
  /** Predefined move sequence for training (alternating white/black) */
  moveSequence?: string[];
}

/**
 * Training Session
 * 
 * @description
 * Manages training-specific gameplay features while delegating
 * pure chess logic to ChessGame. Supports both training mode
 * (player vs engine) and manual mode (both sides manual).
 * 
 * @example
 * ```typescript
 * // Training mode (player vs engine)
 * const training = new TrainingSession({
 *   mode: 'training',
 *   playerColor: 'white',
 *   engineEnabled: true
 * });
 * 
 * // Manual mode (for tests)
 * const manual = new TrainingSession({
 *   mode: 'manual',
 *   playerColor: 'white',
 *   engineEnabled: false
 * });
 * ```
 */
export class TrainingSession {
  private game: ChessGame;
  private config: TrainingConfig;
  private isPlayerTurn: boolean;
  private isEngineThinking: boolean = false;
  private moveIndex: number = 0; // Track current position in move sequence

  constructor(fen?: string, config?: Partial<TrainingConfig>) {
    this.game = new ChessGame(fen);
    this.config = {
      mode: 'training',
      playerColor: 'white',
      engineEnabled: true,
      qualityEvaluationEnabled: true,
      ...config
    };
    
    // Initialize player turn based on config and current position
    this.isPlayerTurn = this.calculatePlayerTurn();
  }

  /**
   * Calculate if it's currently the player's turn
   */
  private calculatePlayerTurn(): boolean {
    const currentTurn = this.game.getTurn();
    return currentTurn === this.config.playerColor;
  }

  /**
   * Make a move (training-aware)
   */
  makeMove(move: Move | string): TrainingMoveResult {
    // In manual mode, allow all moves
    if (this.config.mode === 'manual') {
      const result = this.game.makeMove(move);
      return {
        ...result,
        isPlayerTurn: true, // Always player's turn in manual mode
        shouldScheduleEngine: false,
        trainingComplete: result.isGameOver
      };
    }

    // Training mode validation
    if (!this.isPlayerTurn) {
      return {
        success: false,
        error: 'Not your turn - engine is thinking or it\'s engine\'s turn',
        fen: this.game.getFen(),
        isCheckmate: this.game.isCheckmate(),
        isDraw: this.game.isDraw(),
        isStalemate: this.game.isStalemate(),
        isCheck: this.game.isCheck(),
        isGameOver: this.game.isGameOver(),
        turn: this.game.getTurn() === 'white' ? 'w' : 'b',
        isPlayerTurn: false,
        shouldScheduleEngine: false
      };
    }

    if (this.isEngineThinking) {
      return {
        success: false,
        error: 'Engine is thinking, please wait',
        fen: this.game.getFen(),
        isCheckmate: this.game.isCheckmate(),
        isDraw: this.game.isDraw(),
        isStalemate: this.game.isStalemate(),
        isCheck: this.game.isCheck(),
        isGameOver: this.game.isGameOver(),
        turn: this.game.getTurn() === 'white' ? 'w' : 'b',
        isPlayerTurn: false,
        shouldScheduleEngine: false
      };
    }

    // Make the move
    const result = this.game.makeMove(move);

    if (result.success) {
      // Move was successful, increment the move index
      this.moveIndex++;
      
      // Update turn state
      this.isPlayerTurn = this.calculatePlayerTurn();
      
      // Check if we should schedule opponent move from predefined sequence
      const shouldScheduleEngine = 
        this.config.engineEnabled && 
        !result.isGameOver && 
        !this.isPlayerTurn &&
        this.hasNextSequenceMove();

      return {
        ...result,
        isPlayerTurn: this.isPlayerTurn,
        shouldScheduleEngine,
        trainingComplete: result.isGameOver
      };
    }

    return {
      ...result,
      isPlayerTurn: this.isPlayerTurn,
      shouldScheduleEngine: false
    };
  }

  /**
   * Check if there's a next move in the predefined sequence
   */
  private hasNextSequenceMove(): boolean {
    return Boolean(
      this.config.moveSequence && 
      this.moveIndex < this.config.moveSequence.length
    );
  }

  /**
   * Get the next move from the predefined sequence
   */
  getNextSequenceMove(): string | null {
    if (!this.hasNextSequenceMove()) return null;
    return this.config.moveSequence?.[this.moveIndex] ?? null;
  }

  /**
   * Make an engine move (either computed or from sequence)
   */
  makeEngineMove(move?: Move | string): TrainingMoveResult {
    this.isEngineThinking = true;
    
    // If no move provided, use next move from sequence
    const moveToPlay = move || this.getNextSequenceMove();
    
    if (!moveToPlay) {
      this.isEngineThinking = false;
      return {
        success: false,
        error: 'No engine move available',
        fen: this.game.getFen(),
        isCheckmate: this.game.isCheckmate(),
        isDraw: this.game.isDraw(),
        isStalemate: this.game.isStalemate(),
        isCheck: this.game.isCheck(),
        isGameOver: this.game.isGameOver(),
        turn: this.game.getTurn() === 'white' ? 'w' : 'b',
        isPlayerTurn: this.isPlayerTurn,
        shouldScheduleEngine: false
      };
    }

    const result = this.game.makeMove(moveToPlay);

    if (result.success) {
      // Engine move was successful, increment the move index
      this.moveIndex++;
      
      this.isPlayerTurn = this.calculatePlayerTurn();
      this.isEngineThinking = false;

      return {
        ...result,
        isPlayerTurn: this.isPlayerTurn,
        shouldScheduleEngine: false,
        trainingComplete: result.isGameOver
      };
    }

    this.isEngineThinking = false;
    return {
      ...result,
      isPlayerTurn: this.isPlayerTurn,
      shouldScheduleEngine: false
    };
  }

  /**
   * Set engine thinking state
   */
  setEngineThinking(thinking: boolean): void {
    this.isEngineThinking = thinking;
  }

  /**
   * Get current game state (delegated to ChessGame)
   */
  getFen(): string {
    return this.game.getFen();
  }

  getPgn(): string {
    return this.game.getPgn();
  }

  getTurn(): 'white' | 'black' {
    return this.game.getTurn();
  }

  isGameOver(): boolean {
    return this.game.isGameOver();
  }

  isCheckmate(): boolean {
    return this.game.isCheckmate();
  }

  isDraw(): boolean {
    return this.game.isDraw();
  }

  isStalemate(): boolean {
    return this.game.isStalemate();
  }

  isCheck(): boolean {
    return this.game.isCheck();
  }

  getMoves(): string[] {
    return this.game.getMoves();
  }

  getHistory(): string[] {
    return this.game.getHistoryStrings();
  }

  /**
   * Training-specific getters
   */
  getIsPlayerTurn(): boolean {
    return this.isPlayerTurn;
  }

  getIsEngineThinking(): boolean {
    return this.isEngineThinking;
  }

  getConfig(): TrainingConfig {
    return { ...this.config };
  }

  /**
   * Configuration updates
   */
  setMode(mode: TrainingMode): void {
    this.config.mode = mode;
    if (mode === 'manual') {
      this.isPlayerTurn = true;
      this.isEngineThinking = false;
    } else {
      this.isPlayerTurn = this.calculatePlayerTurn();
    }
  }

  setPlayerColor(color: TrainingColor): void {
    this.config.playerColor = color;
    this.isPlayerTurn = this.calculatePlayerTurn();
  }

  /**
   * Utilities
   */
  loadFen(fen: string): boolean {
    const success = this.game.loadFen(fen);
    if (success) {
      this.isPlayerTurn = this.calculatePlayerTurn();
      this.isEngineThinking = false;
    }
    return success;
  }

  reset(): void {
    this.game.reset();
    this.isPlayerTurn = this.calculatePlayerTurn();
    this.isEngineThinking = false;
  }

  clone(): TrainingSession {
    const cloned = new TrainingSession(this.getFen(), this.config);
    cloned.isPlayerTurn = this.isPlayerTurn;
    cloned.isEngineThinking = this.isEngineThinking;
    return cloned;
  }

  /**
   * Direct access to underlying chess game (for advanced use cases)
   */
  getChessGame(): ChessGame {
    return this.game;
  }
}