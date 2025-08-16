/**
 * ChessService Mock Factory
 *
 * Creates type-safe mocks for ChessService with sensible defaults.
 * Handles both unit tests (fully mocked) and integration tests (partial mocks).
 */

// @ts-nocheck - Test infrastructure with complex mock typing

import { vi } from 'vitest';
import type { Move } from 'chess.js';
import { BaseMockFactory } from './BaseMockFactory';
import type { ChessService } from '@shared/services/ChessService';
import type { ValidatedMove, ChessEvent } from '@shared/types/index';
import { createValidatedMove } from '@shared/types/chess';
import { COMMON_FENS } from '../fixtures/commonFens';

type ChessListener = (event: ChessEvent) => void;

type MockedChessService = ChessService;

export interface ChessServiceMockOverrides {
  // State
  fen?: string;
  pgn?: string;
  moveHistory?: ValidatedMove[];

  // Behaviors
  validMoves?: string[];
  moveResults?: Map<string, ValidatedMove | null>;
  isGameOver?: boolean;

  // Method overrides
  methods?: Partial<MockedChessService>;
}

export class ChessServiceMockFactory extends BaseMockFactory<
  ChessService,
  ChessServiceMockOverrides
> {
  private listeners: Set<ChessListener> = new Set();
  private currentFen: string = COMMON_FENS.STARTING_POSITION;
  private moveHistory: ValidatedMove[] = [];

  protected _createDefaultMock(): MockedChessService {
    const mock: MockedChessService = {
      // Initialization
      initialize: vi.fn().mockImplementation((fen?: string) => {
        this.currentFen = fen || COMMON_FENS.STARTING_POSITION;
        this.moveHistory = [];
        this._emitStateUpdate('load');
        return true;
      }),

      reset: vi.fn().mockImplementation(() => {
        this.currentFen = COMMON_FENS.STARTING_POSITION;
        this.moveHistory = [];
        this._emitStateUpdate('reset');
      }),

      // State getters
      getFen: vi.fn().mockImplementation(() => this.currentFen),
      getPgn: vi.fn().mockReturnValue(''),
      getMoveHistory: vi.fn().mockImplementation(() => [...this.moveHistory]),
      getCurrentMoveIndex: vi.fn().mockImplementation(() => this.moveHistory.length - 1),
      turn: vi.fn().mockReturnValue('w'),

      // Game status
      isGameOver: vi.fn().mockReturnValue(false),
      isCheckmate: vi.fn().mockReturnValue(false),
      isDraw: vi.fn().mockReturnValue(false),
      isStalemate: vi.fn().mockReturnValue(false),
      isInsufficientMaterial: vi.fn().mockReturnValue(false),
      isThreefoldRepetition: vi.fn().mockReturnValue(false),
      isCheck: vi.fn().mockReturnValue(false),

      getGameResult: vi.fn().mockReturnValue(null),

      // Move operations
      move: vi.fn().mockImplementation(move => {
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
          from = (move as any).from;
          to = (move as any).to;
          san = (move as any).san || to;
        } else {
          // Fallback for invalid input
          return null;
        }

        // Create a chess.js compatible move object
        const chessJsMove = {
          from,
          to,
          san,
          piece: from[1] === '2' || from[1] === '7' ? 'p' : 'n',
          color: this.moveHistory.length % 2 === 0 ? 'w' : 'b',
          flags: 'n',
          lan: `${from}${to}`,
          captured: undefined,
          promotion: undefined,
        } as Move;

        // Use the proper factory to create ValidatedMove with branding
        const validatedMove = createValidatedMove(chessJsMove, this.currentFen, this.currentFen);

        this.moveHistory.push(validatedMove);
        this._emitStateUpdate('move');
        return validatedMove;
      }),

      validateMove: vi.fn().mockReturnValue(true),
      moves: vi.fn().mockImplementation((options?: any) => {
        if (options?.square) {
          return ['e4', 'e3']; // Moves from specific square
        }
        return ['e4', 'd4', 'Nf3']; // All legal moves
      }),

      // Navigation
      undo: vi.fn().mockImplementation(() => {
        if (this.moveHistory.length > 0) {
          this.moveHistory.pop();
          this._emitStateUpdate('undo');
          return true;
        }
        return false;
      }),

      redo: vi.fn().mockReturnValue(true),
      goToMove: vi.fn().mockReturnValue(true),
      goToFirst: vi.fn().mockImplementation(() => {
        this.moveHistory = [];
        this._emitStateUpdate('redo');
        return true;
      }),
      goToLast: vi.fn().mockReturnValue(true),

      // Event system
      subscribe: vi.fn().mockImplementation((listener: ChessListener) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      }),

      unsubscribe: vi.fn().mockImplementation((listener: ChessListener) => {
        this.listeners.delete(listener);
      }),

      // Utility
      ascii: vi.fn().mockReturnValue('ASCII board representation'),
      loadPgn: vi.fn().mockReturnValue(true),
      header: vi.fn().mockReturnValue({}),
      getSquare: vi.fn().mockReturnValue(null),
      removeSquare: vi.fn().mockReturnValue(null),
      putSquare: vi.fn().mockReturnValue(true),
    } as unknown as ChessService;

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
      merged.moves.mockReturnValue(overrides.validMoves);
    }

    if (overrides.moveResults) {
      merged.move.mockImplementation(move => {
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
  private _emitStateUpdate(source: 'reset' | 'move' | 'undo' | 'redo' | 'load'): void {
    const event: ChessEvent = {
      type: 'stateUpdate',
      source,
      payload: {
        fen: this.currentFen,
        pgn: '',
        moveHistory: this.moveHistory,
        currentMoveIndex: this.moveHistory.length - 1,
        isGameOver: false,
        gameResult: null,
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
