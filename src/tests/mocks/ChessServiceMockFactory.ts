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
        // Handle different input formats dynamically
        let from: string, to: string, san: string;
        
        if (typeof move === 'string') {
          // Handle algebraic notation (e.g., "e4", "Nf3")
          san = move;
          // Simple parsing for common moves
          if (move.length === 2) {
            // Pawn move like "e4"
            from = `${move[0]}2`;
            to = move;
          } else if (move.length === 3) {
            // Piece move like "Nf3"
            from = 'g1'; // Default square for demo
            to = move.substring(1);
          } else {
            // UCI format like "e2e4"
            from = move.substring(0, 2);
            to = move.substring(2, 4);
            san = to;
          }
        } else if (typeof move === 'object' && move) {
          from = move.from;
          to = move.to;
          san = move.san || to;
        } else {
          // Fallback for invalid input
          return null;
        }
        
        const mockMove: ChessMove = {
          from,
          to,
          san,
          piece: from[1] === '2' || from[1] === '7' ? 'p' : 'n',
          color: this.moveHistory.length % 2 === 0 ? 'w' : 'b',
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
    } as jest.Mocked<ChessService>;

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
    
    // Reset state completely to free memory
    this.currentFen = COMMON_FENS.STARTING_POSITION;
    this.moveHistory.length = 0; // More efficient than creating new array
    
    // Clear any remaining references
    this.listeners = new Set();
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
    if (!this.mockInstance) {
      throw new Error('[ChessServiceMockFactory] Mock not initialized. Call create() first.');
    }
    const fen = COMMON_FENS[position];
    this.mockInstance.initialize(fen);
  }

  /**
   * Utility method to simulate a move sequence
   */
  public simulateMoves(moves: string[]): void {
    if (!this.mockInstance) {
      throw new Error('[ChessServiceMockFactory] Mock not initialized. Call create() first.');
    }
    if (!Array.isArray(moves)) {
      throw new Error('[ChessServiceMockFactory] Moves must be an array of strings.');
    }
    moves.forEach(move => {
      const result = this.mockInstance!.move(move);
      if (!result) {
        console.warn(`[ChessServiceMockFactory] Move "${move}" returned null`);
      }
    });
  }
}