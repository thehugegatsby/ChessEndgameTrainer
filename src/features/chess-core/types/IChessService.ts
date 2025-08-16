/**
 * IChessService Interface
 *
 * Defines the public API for chess services.
 * This interface ensures compatibility between legacy ChessService
 * and new ChessServiceV2 during the Strangler Fig Pattern migration.
 */

/* eslint-disable @typescript-eslint/naming-convention */

import type { Move as ChessJsMove } from 'chess.js';
import type { ValidatedMove } from '@shared/types/chess';

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
      type: 'stateUpdate';
      payload: GameStatePayload;
      source: 'move' | 'reset' | 'undo' | 'redo' | 'load';
    }
  | {
      type: 'error';
      payload: {
        error: Error;
        move?: ValidatedMove | string;
        message: string;
      };
    };

/**
 * Listener function type for ChessService events
 */
export type ChessServiceListener = (event: ChessServiceEvent) => void;

/**
 * Move input type - supports multiple formats
 */
export type MoveInput = ChessJsMove | { from: string; to: string; promotion?: string } | string;

/**
 * Move options for getting legal moves
 */
export interface MoveOptions {
  square?: string;
  verbose?: boolean;
}

/**
 * Chess Service Interface
 * Defines the public API that both legacy and new implementations must follow
 */
export interface IChessService {
  // Event Management
  subscribe(listener: ChessServiceListener): () => void;

  // Game Initialization
  initialize(fen: string): boolean;
  reset(): void;

  // Move Operations
  move(move: MoveInput): ValidatedMove | null;
  undo(): boolean;
  redo(): boolean;
  validateMove(move: MoveInput): boolean;

  // Game State Queries
  getFen(): string;
  getPgn(): string;
  getMoveHistory(): ValidatedMove[];
  getCurrentMoveIndex(): number;

  // Game Status
  isGameOver(): boolean;
  isCheck(): boolean;
  isCheckmate(): boolean;
  isStalemate(): boolean;
  isDraw(): boolean;
  turn(): 'w' | 'b';
  getGameResult(): string | null;

  // Move Generation
  moves(options?: MoveOptions): string[] | ChessJsMove[];

  // PGN Operations
  loadPgn(pgn: string): boolean;

  // Navigation
  goToMove(moveIndex: number): boolean;
}

/**
 * Factory function type for creating service instances
 */
export type ChessServiceFactory = () => IChessService;
