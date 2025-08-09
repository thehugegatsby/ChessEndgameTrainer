/**
 * ChessService Mock Factory
 * 
 * Creates type-safe mocks for ChessService with sensible defaults.
 * Handles both unit tests (fully mocked) and integration tests (partial mocks).
 */

import { jest } from '@jest/globals';
import { BaseMockFactory } from './BaseMockFactory';
import type { ChessService } from '@shared/services/ChessService';
import type { ChessMove, ChessEvent } from '@shared/types/index';
import { COMMON_FENS } from '../fixtures/commonFens';

type ChessListener = (event: ChessEvent) => void;

type MockedChessService = jest.Mocked<ChessService>;

export interface ChessServiceMockOverrides {
  // State
  fen?: string;
  pgn?: string;
  moveHistory?: ChessMove[];
  
  // Behaviors
  validMoves?: string[];
  moveResults?: Map<string, ChessMove | null>;
  isGameOver?: boolean;
  
  // Method overrides
  methods?: Partial<MockedChessService>;
}

export class ChessServiceMockFactory extends BaseMockFactory<ChessService, ChessServiceMockOverrides> {
  private listeners: Set<ChessListener> = new Set();
  private currentFen: string = COMMON_FENS.STARTING_POSITION;
  private moveHistory: ChessMove[] = [];

  protected _createDefaultMock(): MockedChessService {
    const mock: MockedChessService = {
      // Initialization
      initialize: jest.fn().mockImplementation((fen?: string) => {
        this.currentFen = fen || COMMON_FENS.STARTING_POSITION;
        this.moveHistory = [];
        this._emitStateUpdate('load');
        return true;
      }),

      reset: jest.fn().mockImplementation(() => {
        this.currentFen = COMMON_FENS.STARTING_POSITION;
        this.moveHistory = [];
        this._emitStateUpdate('reset');
      }),

      // State getters
      getFen: jest.fn().mockImplementation(() => this.currentFen),
      getPgn: jest.fn().mockReturnValue(''),
      getMoveHistory: jest.fn().mockImplementation(() => [...this.moveHistory]),
      getCurrentMoveIndex: jest.fn().mockImplementation(() => this.moveHistory.length - 1),
      getTurn: jest.fn().mockReturnValue('w'),
      
      // Game status
      isGameOver: jest.fn().mockReturnValue(false),
      isCheckmate: jest.fn().mockReturnValue(false),
      isDraw: jest.fn().mockReturnValue(false),
      isStalemate: jest.fn().mockReturnValue(false),
      isInsufficientMaterial: jest.fn().mockReturnValue(false),
      isThreefoldRepetition: jest.fn().mockReturnValue(false),
      isCheck: jest.fn().mockReturnValue(false),

      // Move operations
      move: jest.fn().mockImplementation((move) => {
        const mockMove: ChessMove = {
          from: typeof move === 'object' && move ? move.from : 'e2',
          to: typeof move === 'object' && move ? move.to : 'e4',
          san: 'e4',
          piece: 'p',
          color: 'w',
          flags: 'n',
          fenAfter: this.currentFen,
          fenBefore: this.currentFen,
          timestamp: Date.now(),
        };
        
        this.moveHistory.push(mockMove);
        this._emitStateUpdate('move');
        return mockMove;
      }),

      validateMove: jest.fn().mockReturnValue(true),
      getLegalMoves: jest.fn().mockReturnValue(['e4', 'd4', 'Nf3']),
      getLegalMovesFrom: jest.fn().mockReturnValue(['e4', 'e3']),

      // Navigation
      undo: jest.fn().mockImplementation(() => {
        if (this.moveHistory.length > 0) {
          this.moveHistory.pop();
          this._emitStateUpdate('undo');
          return true;
        }
        return false;
      }),

      redo: jest.fn().mockReturnValue(true),
      goToMove: jest.fn().mockReturnValue(true),
      goToFirst: jest.fn().mockImplementation(() => {
        this.moveHistory = [];
        this._emitStateUpdate('navigation');
        return true;
      }),
      goToLast: jest.fn().mockReturnValue(true),

      // Event system
      subscribe: jest.fn().mockImplementation((listener: ChessListener) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      }),

      unsubscribe: jest.fn().mockImplementation((listener: ChessListener) => {
        this.listeners.delete(listener);
      }),

      // Utility
      ascii: jest.fn().mockReturnValue('ASCII board representation'),
      loadPgn: jest.fn().mockReturnValue(true),
      header: jest.fn().mockReturnValue({}),
      getSquare: jest.fn().mockReturnValue(null),
      removeSquare: jest.fn().mockReturnValue(null),
      putSquare: jest.fn().mockReturnValue(true),
    } as any;

    return mock;
  }

  protected _mergeOverrides(
    defaultMock: MockedChessService, 
    overrides?: ChessServiceMockOverrides
  ): MockedChessService {
    if (!overrides) return defaultMock;

    const merged = { ...defaultMock };

    // Apply state overrides
    if (overrides.fen) {
      this.currentFen = overrides.fen;
      merged.getFen.mockReturnValue(overrides.fen);
    }

    if (overrides.pgn) {
      merged.getPgn.mockReturnValue(overrides.pgn);
    }

    if (overrides.moveHistory) {
      this.moveHistory = overrides.moveHistory;
      merged.getMoveHistory.mockReturnValue(overrides.moveHistory);
    }

    // Apply behavior overrides
    if (overrides.validMoves) {
      merged.getLegalMoves.mockReturnValue(overrides.validMoves);
    }

    if (overrides.moveResults) {
      merged.move.mockImplementation((move) => {
        const key = typeof move === 'string' ? move : `${move.from}-${move.to}`;
        return overrides.moveResults!.get(key) || null;
      });
    }

    if (overrides.isGameOver !== undefined) {
      merged.isGameOver.mockReturnValue(overrides.isGameOver);
    }

    // Apply method overrides
    if (overrides.methods) {
      Object.assign(merged, overrides.methods);
    }

    return merged;
  }

  protected _beforeCleanup(): void {
    // Clear all listeners
    this.listeners.clear();
    
    // Reset state
    this.currentFen = COMMON_FENS.STARTING_POSITION;
    this.moveHistory = [];
  }

  /**
   * Helper method to emit events to all listeners
   */
  private _emitStateUpdate(source: string): void {
    const event: ChessEvent = {
      type: 'stateUpdate',
      source,
      payload: {
        fen: this.currentFen,
        pgn: '',
        moveHistory: this.moveHistory,
        currentMoveIndex: this.moveHistory.length - 1,
      },
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in chess event listener:', error);
      }
    });
  }

  /**
   * Utility method to simulate a specific game position
   */
  public setupPosition(position: keyof typeof COMMON_FENS): void {
    const mock = this.get();
    const fen = COMMON_FENS[position];
    mock.initialize(fen);
  }

  /**
   * Utility method to simulate a move sequence
   */
  public simulateMoves(moves: string[]): void {
    const mock = this.get();
    moves.forEach(move => mock.move(move));
  }
}