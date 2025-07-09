/**
 * @fileoverview GameStateBuilder - Fluent builder for game states
 * @description Creates game states with both granular and high-level APIs
 */

import { BaseBuilder } from './BaseBuilder';
import {
  GameState,
  FenString,
  ChessMove,
  Color,
  EngineAnalysis,
  createFen,
  DEFAULT_VALUES,
} from './types';
import { Chess } from 'chess.js';

/**
 * Builder for creating GameState objects
 * Provides both low-level and high-level methods for test data creation
 */
export class GameStateBuilder extends BaseBuilder<GameState, GameStateBuilder> {
  
  /**
   * Low-level API: Set FEN directly
   */
  withFen(fen: string | FenString): GameStateBuilder {
    const fenString = typeof fen === 'string' ? createFen(fen) : fen;
    return this.with('fen', fenString);
  }

  /**
   * Low-level API: Set turn
   */
  withTurn(turn: Color): GameStateBuilder {
    return this.with('turn', turn);
  }

  /**
   * Low-level API: Set move history
   */
  withMoveHistory(moves: ChessMove[]): GameStateBuilder {
    return this.with('moveHistory', moves);
  }

  /**
   * Low-level API: Set current move index
   */
  withCurrentMoveIndex(index: number): GameStateBuilder {
    return this.with('currentMoveIndex', index);
  }

  /**
   * Low-level API: Set evaluation
   */
  withEvaluation(evaluation: number): GameStateBuilder {
    return this.with('evaluation', evaluation);
  }

  /**
   * Low-level API: Set engine analysis
   */
  withEngineAnalysis(analysis: EngineAnalysis): GameStateBuilder {
    return this.with('engineAnalysis', analysis);
  }

  /**
   * Low-level API: Set game over status
   */
  withGameOver(isGameOver: boolean): GameStateBuilder {
    return this.with('isGameOver', isGameOver);
  }

  /**
   * Low-level API: Set game result
   */
  withResult(result: '1-0' | '0-1' | '1/2-1/2'): GameStateBuilder {
    return this.withMany({
      isGameOver: true,
      result,
    });
  }

  /**
   * High-level API: Start from a position builder
   */
  fromPosition(fen: string | FenString): GameStateBuilder {
    const fenString = typeof fen === 'string' ? createFen(fen) : fen;
    const chess = new Chess(fenString);
    
    return this.withMany({
      fen: fenString,
      turn: chess.turn() as Color,
      moveHistory: [],
      currentMoveIndex: 0,
      isGameOver: chess.isGameOver(),
    });
  }

  /**
   * High-level API: Apply moves to current position
   * Updates FEN, turn, and move history
   */
  afterMoves(moves: string[]): GameStateBuilder {
    const currentData = this.getCurrentData();
    const startFen = currentData.fen || DEFAULT_VALUES.INITIAL_FEN;
    const chess = new Chess(startFen);
    
    // Apply existing moves if any
    const existingMoves = currentData.moveHistory || [];
    existingMoves.forEach(move => {
      chess.move(move);
    });
    
    // Apply new moves
    const newMoves: ChessMove[] = [];
    moves.forEach(move => {
      const result = chess.move(move);
      if (!result) {
        throw new Error(`Invalid move: ${move} in position ${chess.fen()}`);
      }
      newMoves.push(move as ChessMove);
    });
    
    return this.withMany({
      fen: createFen(chess.fen()),
      turn: chess.turn() as Color,
      moveHistory: [...existingMoves, ...newMoves],
      currentMoveIndex: existingMoves.length + newMoves.length,
      isGameOver: chess.isGameOver(),
      result: chess.isGameOver() ? this.getGameResult(chess) : undefined,
    });
  }

  /**
   * High-level API: Create a specific endgame position
   */
  withEndgamePosition(type: 'opposition' | 'bridge' | 'pawn-ending'): GameStateBuilder {
    const positions = {
      opposition: DEFAULT_VALUES.OPPOSITION_FEN,
      bridge: DEFAULT_VALUES.BRIDGE_BUILDING_FEN,
      'pawn-ending': createFen('8/2k5/3p4/1p1P1K2/8/8/8/8 w - - 0 1'),
    };
    
    return this.fromPosition(positions[type]);
  }

  /**
   * High-level API: Add mock engine evaluation
   */
  withMockEngineResponse(bestMove: string, evaluation: number, depth: number = 20): GameStateBuilder {
    return this.withMany({
      evaluation,
      engineAnalysis: {
        evaluation,
        bestMove: bestMove as ChessMove,
        depth,
        timeMs: 50, // Mock fast response
      },
    });
  }

  /**
   * High-level API: Navigate to specific move in history
   */
  atMove(moveNumber: number): GameStateBuilder {
    const currentData = this.getCurrentData();
    const moves = currentData.moveHistory || [];
    
    if (moveNumber < 0 || moveNumber > moves.length) {
      throw new Error(`Invalid move number: ${moveNumber}. History has ${moves.length} moves.`);
    }
    
    // Replay moves up to the specified point
    const startFen = DEFAULT_VALUES.INITIAL_FEN;
    const chess = new Chess(startFen);
    
    for (let i = 0; i < moveNumber; i++) {
      chess.move(moves[i]);
    }
    
    return this.withMany({
      fen: createFen(chess.fen()),
      turn: chess.turn() as Color,
      currentMoveIndex: moveNumber,
    });
  }

  /**
   * Get game result from chess instance
   */
  private getGameResult(chess: Chess): '1-0' | '0-1' | '1/2-1/2' | undefined {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? '0-1' : '1-0';
    }
    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
      return '1/2-1/2';
    }
    return undefined;
  }

  /**
   * Provide default values for GameState
   */
  protected getDefaults(): GameState {
    return {
      fen: DEFAULT_VALUES.INITIAL_FEN,
      turn: 'w',
      moveHistory: [],
      currentMoveIndex: 0,
      isGameOver: false,
    };
  }

  /**
   * Validate the game state
   */
  protected validate(data: GameState): void {
    // Validate FEN
    try {
      new Chess(data.fen);
    } catch (error) {
      throw new Error(`Invalid FEN in GameState: ${data.fen}`);
    }
    
    // Validate move index
    if (data.currentMoveIndex < 0 || data.currentMoveIndex > data.moveHistory.length) {
      throw new Error(`Invalid currentMoveIndex: ${data.currentMoveIndex}`);
    }
    
    // Validate turn
    if (data.turn !== 'w' && data.turn !== 'b') {
      throw new Error(`Invalid turn: ${data.turn}`);
    }
    
    // Validate result if game is over
    if (data.isGameOver && !data.result) {
      console.warn('Game is marked as over but no result is set');
    }
  }
}