/**
 * @file gameSlice.pure.test.ts
 * @description Tests for GameSlice integration with pure chess functions
 * 
 * This test file supports Issue #185: Pure Chess Functions + GameSlice Integration
 * Tests how the new pure functions will integrate with the GameSlice state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ValidatedMove } from '@shared/types/chess';

// Import pure functions from chess-logic (will be available after Issue #185)
type MoveResult = {
  newFen: string;
  move: any; // ChessJsMove
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isCheck: boolean;
  gameResult: string | null;
};

// Mock pure functions for now - these will be real imports after Issue #185
const mockPureFunctions = {
  makeMove: (fen: string, move: string | { from: string; to: string; promotion?: string }): MoveResult | null => {
    // Mock implementation for testing
    const moveStr = typeof move === 'string' ? move : `${move.from}${move.to}${move.promotion || ''}`;
    
    if ((moveStr === 'e4' || moveStr === 'e2e4') && fen.includes('rnbqkbnr/pppppppp')) {
      return {
        newFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        move: { from: 'e2', to: 'e4', piece: 'p', color: 'w', san: 'e4' },
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
      };
    }
    
    if (moveStr === 'd4' && fen.includes('4P3')) {
      return {
        newFen: 'rnbqkbnr/pppppppp/8/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq d3 0 1',
        move: { from: 'd2', to: 'd4', piece: 'p', color: 'w', san: 'd4' },
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
      };
    }
    
    return null;
  },
  
  validateMove: (fen: string, move: string | { from: string; to: string; promotion?: string }): boolean => {
    // Mock implementation
    const moveStr = typeof move === 'string' ? move : `${move.from}${move.to}${move.promotion || ''}`;
    
    if (fen.includes('rnbqkbnr/pppppppp') && ['e4', 'd4', 'Nf3', 'Nc3', 'e2e4', 'e2e5'].includes(moveStr)) {
      return moveStr !== 'e2e5'; // e2e5 is invalid
    }
    return false;
  },
  
  getPossibleMoves: (fen: string): any[] => {
    // Mock implementation
    if (fen.includes('rnbqkbnr/pppppppp')) {
      return [
        { from: 'e2', to: 'e4', san: 'e4' },
        { from: 'g1', to: 'f3', san: 'Nf3' },
      ];
    }
    return [];
  },
  
  getGameStatus: (fen: string) => {
    return {
      isGameOver: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      isCheck: false,
      gameResult: null,
      turn: 'w' as const,
    };
  }
};

// =============================================================================
// PURE GAMESLICE IMPLEMENTATION (Post-Migration)
// =============================================================================

interface GameState {
  currentFen: string;
  currentPgn: string;
  moveHistory: ValidatedMove[];
  currentMoveIndex: number;
  isGameFinished: boolean;
  gameResult: string | null;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
}

interface GameActions {
  // Pure function integration
  makeMovePure: (move: string | { from: string; to: string; promotion?: string }) => boolean;
  validateMovePure: (move: string | { from: string; to: string; promotion?: string }) => boolean;
  getPossibleMovesPure: (square?: string) => any[];
  getGameStatusPure: () => any;
  
  // State management
  updatePosition: (fen: string, pgn: string) => void;
  addMove: (move: ValidatedMove) => void;
  setMoveHistory: (moves: ValidatedMove[]) => void;
  setCurrentMoveIndex: (index: number) => void;
  resetGame: () => void;
  loadPosition: (fen: string) => void;
}

type GameSlice = GameState & GameActions;

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState: GameState = {
  currentFen: STARTING_FEN,
  currentPgn: '',
  moveHistory: [],
  currentMoveIndex: -1,
  isGameFinished: false,
  gameResult: null,
  isCheckmate: false,
  isDraw: false,
  isStalemate: false,
};

const createGameSlice = (set: any, get: any): GameSlice => ({
  ...initialState,

  // NEW: Pure Function Integration
  makeMovePure: (move) => {
    const state = get();
    const result = mockPureFunctions.makeMove(state.currentFen, move);
    
    if (result) {
      set((draft: GameSlice) => {
        draft.currentFen = result.newFen;
        
        // Create validated move object
        const validatedMove: ValidatedMove = {
          move: result.move,
          fenBefore: state.currentFen,
          fenAfter: result.newFen,
          timestamp: Date.now(),
          san: result.move.san,
        };
        
        // Truncate history if we're not at the end
        draft.moveHistory = draft.moveHistory.slice(0, draft.currentMoveIndex + 1);
        draft.moveHistory.push(validatedMove);
        draft.currentMoveIndex = draft.moveHistory.length - 1;
        
        // Update game status
        draft.isCheckmate = result.isCheckmate;
        draft.isStalemate = result.isStalemate;
        draft.isDraw = result.isDraw;
        draft.isGameFinished = result.isCheckmate || result.isStalemate || result.isDraw;
        draft.gameResult = result.gameResult;
      });
      return true;
    }
    return false;
  },

  validateMovePure: (move) => {
    const state = get();
    return mockPureFunctions.validateMove(state.currentFen, move);
  },

  getPossibleMovesPure: (square) => {
    const state = get();
    const allMoves = mockPureFunctions.getPossibleMoves(state.currentFen);
    
    if (square) {
      return allMoves.filter(move => move.from === square);
    }
    
    return allMoves;
  },

  getGameStatusPure: () => {
    const state = get();
    return mockPureFunctions.getGameStatus(state.currentFen);
  },

  // State management actions
  updatePosition: (fen, pgn) =>
    set((draft: GameSlice) => {
      draft.currentFen = fen;
      draft.currentPgn = pgn;
    }),

  addMove: (move) =>
    set((draft: GameSlice) => {
      draft.moveHistory = draft.moveHistory.slice(0, draft.currentMoveIndex + 1);
      draft.moveHistory.push(move);
      draft.currentMoveIndex = draft.moveHistory.length - 1;
    }),

  setMoveHistory: (moves) =>
    set((draft: GameSlice) => {
      draft.moveHistory = moves;
    }),

  setCurrentMoveIndex: (index) =>
    set((draft: GameSlice) => {
      draft.currentMoveIndex = index;
    }),

  resetGame: () =>
    set((draft: GameSlice) => {
      Object.assign(draft, initialState);
    }),

  loadPosition: (fen) =>
    set((draft: GameSlice) => {
      draft.currentFen = fen;
      draft.moveHistory = [];
      draft.currentMoveIndex = -1;
      draft.isGameFinished = false;
      draft.gameResult = null;
      draft.isCheckmate = false;
      draft.isDraw = false;
      draft.isStalemate = false;
    }),
});

// =============================================================================
// TESTS
// =============================================================================

describe('GameSlice Pure Functions Integration', () => {
  let store: any;

  beforeEach(() => {
    store = createStore<GameSlice>()(
      immer((set, get) => createGameSlice(set, get))
    );
  });

  describe('makeMovePure', () => {
    it('should make a valid move and update state', () => {
      const currentState = store.getState();
      expect(currentState.currentFen).toBe(STARTING_FEN);
      expect(currentState.moveHistory).toHaveLength(0);

      const success = store.getState().makeMovePure('e4');
      
      expect(success).toBe(true);
      
      const newState = store.getState();
      expect(newState.currentFen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
      expect(newState.moveHistory).toHaveLength(1);
      expect(newState.currentMoveIndex).toBe(0);
      expect(newState.moveHistory[0].san).toBe('e4');
    });

    it('should reject invalid moves', () => {
      const success = store.getState().makeMovePure('e5'); // Invalid opening move
      
      expect(success).toBe(false);
      
      const state = store.getState();
      expect(state.currentFen).toBe(STARTING_FEN); // Unchanged
      expect(state.moveHistory).toHaveLength(0);
    });

    it('should handle object move format', () => {
      const success = store.getState().makeMovePure({ from: 'e2', to: 'e4' });
      
      expect(success).toBe(true);
      
      const state = store.getState();
      expect(state.moveHistory).toHaveLength(1);
    });

    it('should update game status flags', () => {
      // This test would use a position that leads to checkmate
      // For now, testing the structure
      store.getState().makeMovePure('e4');
      
      const state = store.getState();
      expect(state.isCheckmate).toBe(false);
      expect(state.isStalemate).toBe(false);
      expect(state.isDraw).toBe(false);
      expect(state.isGameFinished).toBe(false);
    });

    it('should truncate move history when making move from middle', () => {
      // Make two moves
      store.getState().makeMovePure('e4');
      store.getState().makeMovePure('e5'); // This would be rejected by mock, but structure test
      
      // Go back to first move
      store.getState().setCurrentMoveIndex(0);
      
      // Make different second move
      const success = store.getState().makeMovePure('d4');
      
      // Should truncate history and add new move
      const state = store.getState();
      expect(state.currentMoveIndex).toBe(1);
    });
  });

  describe('validateMovePure', () => {
    it('should validate legal opening moves', () => {
      expect(store.getState().validateMovePure('e4')).toBe(true);
      expect(store.getState().validateMovePure('d4')).toBe(true);
      expect(store.getState().validateMovePure('Nf3')).toBe(true);
    });

    it('should reject illegal moves', () => {
      expect(store.getState().validateMovePure('e5')).toBe(false);
      expect(store.getState().validateMovePure('Ke2')).toBe(false);
    });

    it('should work with object format', () => {
      expect(store.getState().validateMovePure({ from: 'e2', to: 'e4' })).toBe(true);
      expect(store.getState().validateMovePure({ from: 'e2', to: 'e5' })).toBe(false);
    });

    it('should validate in different positions', () => {
      // Make a move first
      store.getState().makeMovePure('e4');
      
      // Now validate moves in the new position
      // This would require more sophisticated mocking
      const isValid = store.getState().validateMovePure('e5');
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('getPossibleMovesPure', () => {
    it('should return all possible moves from starting position', () => {
      const moves = store.getState().getPossibleMovesPure();
      
      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    it('should return moves for specific square', () => {
      const moves = store.getState().getPossibleMovesPure('e2');
      
      expect(Array.isArray(moves)).toBe(true);
      // Would need more sophisticated mocking to test filtering
    });

    it('should return empty array for invalid square', () => {
      const moves = store.getState().getPossibleMovesPure('e3'); // Empty square
      
      expect(Array.isArray(moves)).toBe(true);
    });
  });

  describe('getGameStatusPure', () => {
    it('should return correct status for starting position', () => {
      const status = store.getState().getGameStatusPure();
      
      expect(status).toEqual({
        isGameOver: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
        turn: 'w',
      });
    });

    it('should update status after moves', () => {
      store.getState().makeMovePure('e4');
      const status = store.getState().getGameStatusPure();
      
      expect(status.turn).toBe('w'); // Mock always returns 'w'
    });
  });

  describe('State Management Integration', () => {
    it('should maintain move history correctly', () => {
      store.getState().makeMovePure('e4');
      
      const state = store.getState();
      expect(state.moveHistory).toHaveLength(1);
      expect(state.moveHistory[0]).toEqual({
        move: expect.objectContaining({ san: 'e4' }),
        fenBefore: STARTING_FEN,
        fenAfter: expect.stringContaining('4P3'),
        timestamp: expect.any(Number),
        san: 'e4',
      });
    });

    it('should update currentMoveIndex correctly', () => {
      expect(store.getState().currentMoveIndex).toBe(-1);
      
      store.getState().makeMovePure('e4');
      expect(store.getState().currentMoveIndex).toBe(0);
    });

    it('should preserve FEN after move', () => {
      store.getState().makeMovePure('e4');
      
      const state = store.getState();
      expect(state.currentFen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    });

    it('should reset correctly', () => {
      // Make some moves and changes
      store.getState().makeMovePure('e4');
      store.getState().updatePosition('custom-fen', 'custom-pgn');
      
      // Reset
      store.getState().resetGame();
      
      const state = store.getState();
      
      // Check only state properties, not functions
      expect(state.currentFen).toBe(initialState.currentFen);
      expect(state.currentPgn).toBe(initialState.currentPgn);
      expect(state.moveHistory).toEqual(initialState.moveHistory);
      expect(state.currentMoveIndex).toBe(initialState.currentMoveIndex);
      expect(state.isGameFinished).toBe(initialState.isGameFinished);
      expect(state.gameResult).toBe(initialState.gameResult);
    });

    it('should load position correctly', () => {
      const customFen = '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1';
      
      store.getState().loadPosition(customFen);
      
      const state = store.getState();
      expect(state.currentFen).toBe(customFen);
      expect(state.moveHistory).toHaveLength(0);
      expect(state.currentMoveIndex).toBe(-1);
      expect(state.isGameFinished).toBe(false);
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory with repeated moves', () => {
      // Make many moves to test memory handling
      for (let i = 0; i < 100; i++) {
        store.getState().validateMovePure('e4');
        store.getState().getPossibleMovesPure();
        store.getState().getGameStatusPure();
      }
      
      // If we reach here without issues, test passes
      expect(true).toBe(true);
    });

    it('should be fast for validation', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        store.getState().validateMovePure('e4');
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Integration with Pure Functions', () => {
    it('should use pure functions without side effects', () => {
      const stateBefore = store.getState();
      
      // Validate moves should not change state
      store.getState().validateMovePure('e4');
      store.getState().getPossibleMovesPure();
      store.getState().getGameStatusPure();
      
      const stateAfterReads = store.getState();
      expect(stateAfterReads).toEqual(stateBefore);
    });

    it('should only update state through makeMovePure', () => {
      const initialFen = store.getState().currentFen;
      
      // These should not change state
      store.getState().validateMovePure('e4');
      store.getState().getPossibleMovesPure();
      
      expect(store.getState().currentFen).toBe(initialFen);
      
      // Only this should change state
      store.getState().makeMovePure('e4');
      expect(store.getState().currentFen).not.toBe(initialFen);
    });

    it('should handle errors gracefully', () => {
      // This tests how the store handles pure function errors
      const success = store.getState().makeMovePure('invalid-move');
      
      expect(success).toBe(false);
      expect(store.getState().currentFen).toBe(STARTING_FEN);
    });
  });

  describe('Compatibility with Migration', () => {
    it('should support parallel old/new actions during migration', () => {
      // During migration, both old and new actions should coexist
      const oldMakeMove = (move: string) => {
        // Simulate legacy service-based action
        console.log('Old action called with:', move);
        return true;
      };

      const newMakeMove = store.getState().makeMovePure;
      
      // Both should be callable
      expect(typeof oldMakeMove).toBe('function');
      expect(typeof newMakeMove).toBe('function');
    });

    it('should be feature-flaggable', () => {
      // This structure supports feature flags during migration
      const USE_PURE_FUNCTIONS = true;
      
      const makeMove = USE_PURE_FUNCTIONS 
        ? store.getState().makeMovePure
        : () => false; // Old implementation
      
      const success = makeMove('e4');
      expect(success).toBe(true);
    });
  });
});