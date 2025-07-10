/**
 * @fileoverview GamePlayer implementation for E2E test game interaction
 * @description Concrete implementation of IGamePlayer using chess.js for validation
 * 
 * Design Decisions:
 * 1. Chess.js injection with optional fallback - enables unit testing while providing convenience
 * 2. Validation within GamePlayer - maintains cohesion and leverages chess.js directly
 * 3. Error reporting via PlayResult - follows SRP, AppDriver handles aggregation
 * 4. Async methods throughout - future-proofs for potential API interactions
 */

import { Chess } from 'chess.js';
import { IGamePlayer } from './IGamePlayer';
import { PlayResult, PlayOptions, SequenceError } from './types';
import { GamePlayerDependencies } from '../interfaces/driver-dependencies';
import { Result, ok, err, isMoveLegal, validateFEN } from '../utils/chess-utils';

export class GamePlayer implements IGamePlayer {
  private chess: Chess;
  private startTime: number = 0;

  /**
   * Create a new GamePlayer instance
   * @param dependencies - Required dependencies (board, logger, etc.)
   * @param chessInstance - Optional chess.js instance for dependency injection
   */
  constructor(
    private dependencies: GamePlayerDependencies,
    chessInstance?: Chess
  ) {
    // Support both injection and internal creation
    this.chess = chessInstance || new Chess();
  }

  /**
   * Play a single move on the board
   */
  async playMove(move: string, options?: { useSAN?: boolean }): Promise<PlayResult> {
    this.startTime = Date.now();
    const errors: SequenceError[] = [];
    
    try {
      // Get current position from board
      const currentFen = await this.getCurrentPosition();
      
      // Validate the move
      const validationResult = await this.validateMove(move, currentFen);
      if (!validationResult.isOk) {
        errors.push({
          move,
          reason: validationResult.error.message,
          moveIndex: 0
        });
        
        return {
          success: false,
          finalFen: currentFen,
          errors,
          movesPlayed: 0,
          duration: Date.now() - this.startTime
        };
      }

      // Parse move to get from/to squares
      const moveResult = isMoveLegal(currentFen, move);
      if (!moveResult.isOk) {
        errors.push({
          move,
          reason: moveResult.error.message,
          moveIndex: 0
        });
        
        return {
          success: false,
          finalFen: currentFen,
          errors,
          movesPlayed: 0,
          duration: Date.now() - this.startTime
        };
      }

      // Execute the move on the board
      const { from, to, san } = moveResult.value;
      await this.dependencies.board.makeMove(from, to);
      
      // Update internal chess instance using the validated move object
      const chessMove = this.chess.move({ from, to });
      if (!chessMove) {
        throw new Error(`Chess.js rejected move ${from}-${to} despite validation`);
      }
      
      // Wait for board to update if auto-wait is enabled
      if (this.dependencies.config.autoWaitForEngine) {
        await this.dependencies.page.waitForTimeout(300);
      }

      // Get final position
      const finalFen = await this.getCurrentPosition();
      
      return {
        success: true,
        finalFen,
        errors: [],
        movesPlayed: 1,
        duration: Date.now() - this.startTime
      };
      
    } catch (error) {
      await this.dependencies.errorHandler(
        'GamePlayer.playMove',
        error instanceof Error ? error : new Error(String(error))
      );
      
      errors.push({
        move,
        reason: error instanceof Error ? error.message : String(error),
        moveIndex: 0
      });
      
      return {
        success: false,
        finalFen: await this.getCurrentPosition().catch(() => this.chess.fen()),
        errors,
        movesPlayed: 0,
        duration: Date.now() - this.startTime
      };
    }
  }

  /**
   * Play a sequence of moves
   */
  async playMoveSequence(moves: string[], options?: PlayOptions): Promise<PlayResult> {
    this.startTime = Date.now();
    const errors: SequenceError[] = [];
    let movesPlayed = 0;
    
    // Set starting position if provided
    if (options?.startPositionFen) {
      const fenResult = validateFEN(options.startPositionFen);
      if (!fenResult.isOk) {
        errors.push({
          move: 'initial-position',
          reason: fenResult.error.message,
          moveIndex: -1
        });
        
        return {
          success: false,
          finalFen: this.chess.fen(),
          errors,
          movesPlayed: 0,
          duration: Date.now() - this.startTime
        };
      }
      
      // Load position into both chess instance and board
      this.chess.load(fenResult.value);
      await this.dependencies.board.loadPosition({
        fen: fenResult.value,
        description: 'Custom Position'
      });
    }

    // Play each move in sequence
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      // Add delay between moves if specified
      if (i > 0 && options?.delayBetweenMoves) {
        await this.dependencies.page.waitForTimeout(options.delayBetweenMoves);
      }
      
      // Play the move
      const result = await this.playMove(move, { useSAN: options?.useSAN });
      
      if (!result.success) {
        // Update error with correct move index
        if (result.errors.length > 0) {
          result.errors[0].moveIndex = i;
          errors.push(result.errors[0]);
        }
        
        // Check if we should stop on error
        if (options?.stopOnError !== false) {
          return {
            success: false,
            finalFen: result.finalFen,
            errors,
            movesPlayed,
            duration: Date.now() - this.startTime
          };
        }
        // Continue playing if stopOnError is false
      } else {
        movesPlayed++;
      }
    }
    
    const finalFen = await this.getCurrentPosition();
    
    return {
      success: errors.length === 0,
      finalFen,
      errors,
      movesPlayed,
      duration: Date.now() - this.startTime
    };
  }

  /**
   * Validate if a move is legal without executing it
   */
  async validateMove(move: string, currentFen?: string): Promise<Result<string, Error>> {
    try {
      // Get current position if not provided
      const fen = currentFen || await this.getCurrentPosition();
      
      // Use chess-utils for validation
      const result = isMoveLegal(fen, move);
      if (result.isOk) {
        return ok(result.value.san);
      }
      
      return result as Result<string, Error>;
    } catch (error) {
      return err(new Error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * Get current board position as FEN
   */
  async getCurrentPosition(): Promise<string> {
    try {
      // Get FEN from the board component
      const fen = await this.dependencies.board.getPosition();
      
      // Sync internal chess instance
      if (fen !== this.chess.fen()) {
        this.chess.load(fen);
      }
      
      return fen;
    } catch (error) {
      this.dependencies.logger.error('Failed to get board position', error);
      // Return internal chess state as fallback
      return this.chess.fen();
    }
  }

  /**
   * Reset the game to initial position
   */
  async reset(): Promise<void> {
    // Reset internal chess instance
    this.chess.reset();
    
    // Reset the board UI
    await this.dependencies.board.loadPosition({
      fen: this.chess.fen(),
      description: 'Initial Position'
    });
    
    // Wait for board to update
    await this.dependencies.page.waitForTimeout(100);
  }

  /**
   * Get move history in SAN notation
   */
  async getHistory(): Promise<string[]> {
    try {
      // Sync with board first to ensure accurate history
      await this.getCurrentPosition();
      return this.chess.history();
    } catch (error) {
      this.dependencies.logger.error('Failed to get move history', error);
      return this.chess.history();
    }
  }

  /**
   * Get current game as PGN
   */
  async getPGN(): Promise<string> {
    try {
      // Sync with board first
      await this.getCurrentPosition();
      
      // Add basic headers
      const headers = {
        Event: 'E2E Test Game',
        Site: 'ChessEndgameTrainer',
        Date: new Date().toISOString().split('T')[0],
        Round: '1',
        White: 'Test',
        Black: 'Test',
        Result: '*'
      };
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        this.chess.header(key, value);
      });
      
      return this.chess.pgn();
    } catch (error) {
      this.dependencies.logger.error('Failed to get PGN', error);
      return this.chess.pgn();
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // No specific cleanup needed for chess.js
    // This method exists for interface compliance and future extensibility
  }
}