/**
 * @fileoverview PositionBuilder - Fluent builder for chess positions
 * @description Creates position configurations for training scenarios
 */

import { BaseBuilder } from './BaseBuilder';
import {
  Position,
  FenString,
  ChessMove,
  createFen,
  DEFAULT_VALUES,
  PieceType,
  Color,
} from './types';
import { Chess, Square } from 'chess.js';

/**
 * Builder for creating Position objects
 * Focuses on position setup for training scenarios
 */
export class PositionBuilder extends BaseBuilder<Position, PositionBuilder> {
  
  /**
   * Set position ID
   */
  withId(id: number): PositionBuilder {
    return this.with('id', id);
  }
  
  /**
   * Set FEN directly
   */
  withFen(fen: string | FenString): PositionBuilder {
    const fenString = typeof fen === 'string' ? createFen(fen) : fen;
    return this.with('fen', fenString);
  }

  /**
   * Set expected evaluation
   */
  withEvaluation(evaluation: number): PositionBuilder {
    return this.with('evaluation', evaluation);
  }

  /**
   * Set best move for this position
   */
  withBestMove(move: string | ChessMove): PositionBuilder {
    return this.with('bestMove', move as ChessMove);
  }

  /**
   * Set description for the position
   */
  withDescription(description: string): PositionBuilder {
    return this.with('description', description);
  }

  /**
   * High-level: Create empty board
   */
  empty(): PositionBuilder {
    return this.withFen(DEFAULT_VALUES.EMPTY_FEN)
      .withDescription('Empty board');
  }

  /**
   * High-level: Create standard starting position
   */
  startingPosition(): PositionBuilder {
    return this.withFen(DEFAULT_VALUES.INITIAL_FEN)
      .withDescription('Standard starting position');
  }

  /**
   * High-level: Create king opposition position
   */
  kingOpposition(advanced: boolean = false): PositionBuilder {
    if (advanced) {
      return this.withFen('8/8/4k3/8/8/4K3/8/8 w - - 0 1')
        .withDescription('Advanced king opposition')
        .withEvaluation(0);
    }
    
    return this.withFen(DEFAULT_VALUES.OPPOSITION_FEN)
      .withDescription('Basic king opposition')
      .withEvaluation(0);
  }

  /**
   * High-level: Create bridge building position
   */
  bridgeBuilding(): PositionBuilder {
    return this.withFen(DEFAULT_VALUES.BRIDGE_BUILDING_FEN)
      .withDescription('Bridge building endgame')
      .withBestMove('Kc5')
      .withEvaluation(200); // Winning for white
  }

  /**
   * High-level: Create pawn endgame position
   */
  pawnEndgame(type: 'basic' | 'race' | 'breakthrough' = 'basic'): PositionBuilder {
    const positions = {
      basic: {
        fen: '8/2k5/3p4/1p1P1K2/8/8/8/8 w - - 0 1',
        description: 'Basic pawn endgame',
        evaluation: 0,
      },
      race: {
        fen: '8/1p6/8/P7/8/8/6k1/7K w - - 0 1',
        description: 'Pawn race endgame',
        evaluation: 0,
      },
      breakthrough: {
        fen: '8/pp6/8/PP6/8/8/6k1/7K w - - 0 1',
        description: 'Pawn breakthrough',
        evaluation: 150,
        bestMove: 'b6',
      },
    };
    
    const config = positions[type];
    let builder = this.withFen(createFen(config.fen))
      .withDescription(config.description)
      .withEvaluation(config.evaluation);
    
    if ('bestMove' in config && config.bestMove) {
      builder = builder.withBestMove(config.bestMove);
    }
    
    return builder;
  }

  /**
   * High-level: Create position by placing pieces
   */
  withPieces(pieces: Array<{ piece: PieceType; color: Color; square: Square }>): PositionBuilder {
    // Start with empty board
    const chess = new Chess(DEFAULT_VALUES.EMPTY_FEN);
    
    // Place each piece
    pieces.forEach(({ piece, color, square }) => {
      chess.put({ type: piece, color }, square);
    });
    
    // Add kings if not present (required for valid position)
    const board = chess.board();
    let whiteKingPresent = false;
    let blackKingPresent = false;
    
    board.forEach(row => {
      row.forEach(piece => {
        if (piece?.type === 'k') {
          if (piece.color === 'w') whiteKingPresent = true;
          if (piece.color === 'b') blackKingPresent = true;
        }
      });
    });
    
    if (!whiteKingPresent) {
      chess.put({ type: 'k', color: 'w' }, 'e1');
    }
    if (!blackKingPresent) {
      chess.put({ type: 'k', color: 'b' }, 'e8');
    }
    
    return this.withFen(createFen(chess.fen()));
  }

  /**
   * High-level: Create common theoretical position
   */
  theoreticalPosition(name: 'lucena' | 'philidor' | 'vancura'): PositionBuilder {
    const positions = {
      lucena: {
        fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
        description: 'Lucena position',
        bestMove: 'Rd1+',
        evaluation: 500,
      },
      philidor: {
        fen: '4k3/8/8/8/8/8/r7/4K2R w - - 0 1',
        description: 'Philidor position',
        evaluation: 0,
      },
      vancura: {
        fen: '8/8/8/8/kPK5/8/8/r7 w - - 0 1',
        description: 'Vancura position',
        evaluation: 0,
      },
    };
    
    const config = positions[name];
    let builder = this.withFen(createFen(config.fen))
      .withDescription(config.description)
      .withEvaluation(config.evaluation);
    
    if ('bestMove' in config && config.bestMove) {
      builder = builder.withBestMove(config.bestMove);
    }
    
    return builder;
  }

  /**
   * High-level: Apply a transformation to current position
   */
  afterMove(move: string): PositionBuilder {
    const currentData = this.getCurrentData();
    const fen = currentData.fen || DEFAULT_VALUES.INITIAL_FEN;
    const chess = new Chess(fen);
    
    const result = chess.move(move);
    if (!result) {
      throw new Error(`Invalid move: ${move} in position ${fen}`);
    }
    
    return this.withFen(createFen(chess.fen()));
  }

  /**
   * Provide default values
   */
  protected getDefaults(): Position {
    return {
      fen: DEFAULT_VALUES.INITIAL_FEN,
    };
  }

  /**
   * Validate the position
   */
  protected validate(data: Position): void {
    // Validate FEN
    try {
      const chess = new Chess(data.fen);
      
      // If best move is specified, validate it
      if (data.bestMove) {
        const testChess = new Chess(data.fen);
        const move = testChess.move(data.bestMove);
        if (!move) {
          throw new Error(`Best move '${data.bestMove}' is not valid in position`);
        }
      }
    } catch (error) {
      throw new Error(`Invalid position: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Validate evaluation is reasonable
    if (data.evaluation !== undefined) {
      if (data.evaluation < -10000 || data.evaluation > 10000) {
        throw new Error(`Evaluation ${data.evaluation} seems unreasonable`);
      }
    }
  }
}