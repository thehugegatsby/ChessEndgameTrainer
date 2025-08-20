import type { 
  TrainingState, 
  TrainingSnapshot, 
  Position,
  Result,
  TablebaseResult
} from './types';
import { createOk, createError } from './types';
import type { ChessService } from './services/chess.service';
import type { TablebaseService } from './services/tablebase.service';
import type { PositionService } from './services/position.service';

export type CoordinatorError =
  | { code: 'INVALID_STATE'; message: string }
  | { code: 'NO_POSITION'; message: string }
  | { code: 'SERVICE_ERROR'; message: string };

interface TrainingSession {
  startTime: number;
  moveCount: number;
  correctMoves: number;
  mistakes: string[]; // UCI moves that were mistakes
}

/**
 * TrainingCoordinator - Orchestrates the training flow
 * Manages state machine for training sessions
 */
export class TrainingCoordinator {
  private state: TrainingState = 'idle';
  private currentPosition?: Position;
  private feedback?: { type: 'success' | 'error' | 'hint'; message: string };
  private opponentThinking = false;
  private listeners = new Set<(snapshot: TrainingSnapshot) => void>();
  private session: TrainingSession = {
    startTime: 0,
    moveCount: 0,
    correctMoves: 0,
    mistakes: []
  };
  private lastTablebaseResult?: TablebaseResult;

  constructor(
    private chess: ChessService,
    private tablebase: TablebaseService,
    private positions: PositionService
  ) {
    // Subscribe to chess state changes
    this.chess.subscribe(() => {
      this.emit();
    });
  }

  // ========== Public API ==========
  
  /**
   * Start a new training session
   */
  async startNewSession(category?: string): Promise<Result<void, CoordinatorError>> {
    this.transitionTo('loading');
    
    // Reset session stats
    this.session = {
      startTime: Date.now(),
      moveCount: 0,
      correctMoves: 0,
      mistakes: []
    };
    
    // Load random position
    const positionResult = await this.positions.getRandomPosition(category);
    if (!positionResult.ok) {
      this.transitionTo('idle');
      return createError({
        code: 'SERVICE_ERROR',
        message: positionResult.error.message
      });
    }

    this.currentPosition = positionResult.value;
    
    // Load position into chess service
    const loadResult = this.chess.loadFen(this.currentPosition.fen);
    if (!loadResult.ok) {
      this.transitionTo('idle');
      return createError({
        code: 'SERVICE_ERROR',
        message: loadResult.error.message
      });
    }

    // Check if position is in tablebase scope
    if (!this.tablebase.isInTablebaseScope(this.currentPosition.fen)) {
      this.feedback = {
        type: 'error',
        message: 'Position hat zu viele Figuren für Tablebase (max 6)'
      };
    } else {
      this.feedback = undefined;
    }
    
    // Determine who moves first
    const isPlayerTurn = this.currentPosition.sideToMove === 'w'; // Assuming player is white
    
    if (isPlayerTurn) {
      this.transitionTo('waitingForPlayer');
    } else {
      // Computer moves first
      this.transitionTo('opponentThinking');
      await this.makeOpponentMove();
    }
    
    return createOk(undefined);
  }

  /**
   * Handle player's move
   */
  async handlePlayerMove(moveInput: string): Promise<Result<void, CoordinatorError>> {
    if (this.state !== 'waitingForPlayer') {
      return createError({
        code: 'INVALID_STATE',
        message: `Kann Zug nicht verarbeiten im Status: ${this.state}`
      });
    }

    this.transitionTo('validatingMove');
    this.session.moveCount++;

    // Convert input to UCI if needed (handle both SAN and UCI input)
    let uci: string;
    if (this.looksLikeUci(moveInput)) {
      uci = moveInput;
    } else {
      // Try to parse as SAN
      const sanResult = this.chess.sanToUci(moveInput);
      if (!sanResult.ok) {
        this.feedback = {
          type: 'error',
          message: 'Ungültiger Zug'
        };
        this.transitionTo('waitingForPlayer');
        return createOk(undefined);
      }
      uci = sanResult.value;
    }

    // Check if move is legal
    if (!this.chess.isValidMove(uci)) {
      this.feedback = {
        type: 'error',
        message: 'Ungültiger Zug'
      };
      this.transitionTo('waitingForPlayer');
      return createOk(undefined);
    }

    // Get tablebase evaluation for current position
    const currentFen = this.chess.getFen();
    const tablebaseResult = await this.tablebase.lookup(currentFen);
    
    if (!tablebaseResult.ok) {
      // Tablebase unavailable - just accept the move
      const moveResult = this.chess.makeMove(uci);
      if (moveResult.ok) {
        this.feedback = {
          type: 'success',
          message: 'Zug akzeptiert'
        };
        
        // Check if game is over
        if (this.chess.isGameOver()) {
          this.handleGameOver();
        } else {
          this.transitionTo('opponentThinking');
          await this.makeOpponentMove();
        }
      }
      return createOk(undefined);
    }

    // Store tablebase result for later use
    this.lastTablebaseResult = tablebaseResult.value;

    // Check if player move matches best move
    const bestMove = tablebaseResult.value.bestMove;
    const isCorrect = uci === bestMove;

    if (isCorrect) {
      // Correct move!
      this.session.correctMoves++;
      const moveResult = this.chess.makeMove(uci);
      
      if (moveResult.ok) {
        // Get evaluation string
        const evalString = this.tablebase.getEvaluation(tablebaseResult.value);
        this.feedback = {
          type: 'success',
          message: `Perfekt! ${evalString}`
        };
        
        // Check if game is over
        if (this.chess.isGameOver()) {
          this.handleGameOver();
        } else {
          this.transitionTo('opponentThinking');
          await this.makeOpponentMove();
        }
      }
    } else {
      // Incorrect move - don't make it, give feedback
      this.session.mistakes.push(uci);
      
      // Check how bad the move is
      const moveQuality = await this.evaluateMoveQuality(uci, bestMove);
      
      this.feedback = {
        type: 'error',
        message: this.getMoveFeeback(moveQuality, bestMove)
      };
      this.transitionTo('waitingForPlayer');
    }

    return createOk(undefined);
  }

  /**
   * Load next position
   */
  async loadNextPosition(category?: string): Promise<Result<void, CoordinatorError>> {
    return this.startNewSession(category);
  }

  /**
   * Get current training snapshot
   */
  getSnapshot(): TrainingSnapshot {
    return {
      state: this.state,
      currentPosition: this.currentPosition,
      feedback: this.feedback,
      opponentThinking: this.opponentThinking,
      moveCount: this.session.moveCount,
      correctMoves: this.session.correctMoves
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const duration = Date.now() - this.session.startTime;
    const accuracy = this.session.moveCount > 0 
      ? (this.session.correctMoves / this.session.moveCount) * 100 
      : 0;
    
    return {
      duration,
      moveCount: this.session.moveCount,
      correctMoves: this.session.correctMoves,
      mistakes: this.session.mistakes.length,
      accuracy: Math.round(accuracy)
    };
  }

  // ========== Event System ==========
  
  subscribe(listener: (snapshot: TrainingSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ========== Private Methods ==========
  
  private transitionTo(newState: TrainingState): void {
    this.state = newState;
    this.opponentThinking = newState === 'opponentThinking';
    this.emit();
  }

  private async makeOpponentMove(): Promise<void> {
    // Simulate thinking time
    await this.delay(500 + Math.random() * 1000);

    // Check if game is already over
    if (this.chess.isGameOver()) {
      this.handleGameOver();
      return;
    }

    // Get opponent move from tablebase
    const currentFen = this.chess.getFen();
    const tablebaseResult = await this.tablebase.lookup(currentFen);
    
    if (tablebaseResult.ok && tablebaseResult.value.bestMove) {
      const opponentMove = tablebaseResult.value.bestMove;
      const moveResult = this.chess.makeMove(opponentMove);
      
      if (moveResult.ok) {
        // Convert to SAN for display
        const sanResult = this.chess.uciToSan(opponentMove);
        const moveDisplay = sanResult.ok ? sanResult.value : opponentMove;
        
        // Check if game is over after opponent move
        if (this.chess.isGameOver()) {
          this.handleGameOver();
        } else {
          this.feedback = {
            type: 'hint',
            message: `Gegner spielte: ${moveDisplay}`
          };
          this.transitionTo('waitingForPlayer');
        }
      } else {
        // Shouldn't happen with correct tablebase
        this.feedback = {
          type: 'error',
          message: 'Fehler beim Gegnerzug'
        };
        this.transitionTo('sessionComplete');
      }
    } else {
      // Tablebase unavailable or position is terminal
      if (this.chess.isGameOver()) {
        this.handleGameOver();
      } else {
        // Make a random legal move as fallback
        const legalMoves = this.chess.getLegalMovesUCI();
        if (legalMoves.length > 0) {
          const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
          if (randomMove) {
            this.chess.makeMove(randomMove);
          }
          
          this.feedback = {
            type: 'hint',
            message: 'Gegner hat gezogen (Tablebase nicht verfügbar)'
          };
          this.transitionTo('waitingForPlayer');
        } else {
          this.handleGameOver();
        }
      }
    }
  }

  private handleGameOver(): void {
    const snapshot = this.chess.getSnapshot();
    let message = '';
    
    if (snapshot.gameState === 'checkmate') {
      const winner = this.chess.getTurn() === 'w' ? 'Schwarz' : 'Weiß';
      message = `Schachmatt! ${winner} gewinnt.`;
    } else if (snapshot.gameState === 'stalemate') {
      message = 'Patt! Unentschieden.';
    } else if (snapshot.gameState === 'draw') {
      message = 'Remis!';
    }
    
    const stats = this.getSessionStats();
    message += ` (${stats.correctMoves}/${stats.moveCount} korrekt, ${stats.accuracy}% Genauigkeit)`;
    
    this.feedback = {
      type: 'success',
      message
    };
    this.transitionTo('sessionComplete');
  }

  private async evaluateMoveQuality(
    playerMove: string, 
    bestMove: string
  ): Promise<'good' | 'inaccuracy' | 'mistake' | 'blunder'> {
    // For now, simple evaluation
    // In production, would compare WDL scores
    return playerMove === bestMove ? 'good' : 'mistake';
  }

  private getMoveFeeback(quality: string, bestMove: string): string {
    // Convert best move to SAN for display
    const sanResult = this.chess.uciToSan(bestMove);
    const moveHint = sanResult.ok ? sanResult.value : bestMove;
    
    switch (quality) {
      case 'good':
        return 'Guter Zug!';
      case 'inaccuracy':
        return `Ungenauigkeit. Besser wäre: ${moveHint}`;
      case 'mistake':
        return `Fehler! Versuche: ${moveHint}`;
      case 'blunder':
        return `Groẞer Fehler! Der beste Zug ist: ${moveHint}`;
      default:
        return `Versuche: ${moveHint}`;
    }
  }

  private looksLikeUci(move: string): boolean {
    // UCI format: e2e4, e7e8q
    return /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(move);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }
}