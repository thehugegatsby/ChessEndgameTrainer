import { vi } from 'vitest';
/**
 * @file Tests for GameSlice with pure functions (migration from ChessService)
 * @module tests/unit/store/slices/gameSlice.pure
 */

import { useStore } from '@shared/store/rootStore';
import { COMMON_FENS } from '@tests/fixtures/commonFens';

describe('GameSlice - Pure Functions Integration', () => {
  beforeEach(() => {
    // Reset store to initial state - preserve actions by only updating state properties
    useStore.setState(state => {
      state.game.currentFen = COMMON_FENS.STARTING_POSITION;
      state.game.currentPgn = '';
      state.game.moveHistory = [];
      state.game.currentMoveIndex = -1;
      state.game.isGameFinished = false;
      state.game.gameResult = null;
    });
  });

  describe('resetGamePure', () => {
    it('should reset game to initial position using pure functions', () => {
      const store = useStore.getState();

      // Modify some state first
      store.game.setGameFinished(true);
      store.game.setCurrentMoveIndex(5);
      expect(useStore.getState().game.isGameFinished).toBe(true);
      expect(useStore.getState().game.currentMoveIndex).toBe(5);

      // Reset game using pure functions
      store.game.resetGamePure();

      // Verify state was reset
      const state = useStore.getState();
      expect(state.game.currentFen).toBe(COMMON_FENS.STARTING_POSITION);
      expect(state.game.moveHistory).toEqual([]);
      expect(state.game.currentMoveIndex).toBe(-1);
      expect(state.game.isGameFinished).toBe(false);
      expect(state.game.gameResult).toBeNull();
    });
  });

  describe('initializeGamePure', () => {
    it('should initialize game with valid FEN using pure functions', () => {
      const store = useStore.getState();
      const testFen = '8/8/8/8/8/8/8/8 w - - 0 1';

      const result = store.game.initializeGamePure(testFen);

      expect(result).toBe(true);
      const state = useStore.getState();
      expect(state.game.currentFen).toBe(testFen);
      expect(state.game.moveHistory).toEqual([]);
      expect(state.game.currentMoveIndex).toBe(-1);
    });

    it('should reject invalid FEN', () => {
      const store = useStore.getState();
      const invalidFen = 'invalid-fen-string';

      const result = store.game.initializeGamePure(invalidFen);

      expect(result).toBe(false);
      // State should remain unchanged
      const state = useStore.getState();
      expect(state.game.currentFen).toBe(COMMON_FENS.STARTING_POSITION);
    });
  });

  describe('setGameFinished', () => {
    it('should set game finished to true', () => {
      const store = useStore.getState();

      store.game.setGameFinished(true);

      const state = useStore.getState();
      expect(state.game.isGameFinished).toBe(true);
    });

    it('should set game finished to false', () => {
      const store = useStore.getState();

      store.game.setGameFinished(false);

      const state = useStore.getState();
      expect(state.game.isGameFinished).toBe(false);
    });
  });

  describe('updatePosition', () => {
    it('should update position with FEN and PGN', () => {
      const store = useStore.getState();
      const testFen = '8/8/8/8/8/8/8/8 w - - 0 1';
      const testPgn = '1. e4';

      store.game.updatePosition(testFen, testPgn);

      const state = useStore.getState();
      expect(state.game.currentFen).toBe(testFen);
      expect(state.game.currentPgn).toBe(testPgn);
    });
  });

  describe('setMoveHistory', () => {
    it('should set move history', () => {
      const store = useStore.getState();
      const mockMoves = [
        {
          san: 'e4',
          from: 'e2',
          to: 'e4',
          color: 'w',
          piece: 'p',
          captured: undefined,
        },
        {
          san: 'e5',
          from: 'e7',
          to: 'e5',
          color: 'b',
          piece: 'p',
          captured: undefined,
        },
      ] as any;

      store.game.setMoveHistory(mockMoves);

      const state = useStore.getState();
      expect(state.game.moveHistory).toEqual(mockMoves);
    });
  });

  describe('setCurrentMoveIndex', () => {
    it('should set current move index', () => {
      const store = useStore.getState();

      store.game.setCurrentMoveIndex(5);

      const state = useStore.getState();
      expect(state.game.currentMoveIndex).toBe(5);
    });
  });

  describe('Pure function actions', () => {
    it('should make valid moves with makeMovePure', () => {
      const store = useStore.getState();

      const result = store.game.makeMovePure('e4');

      expect(result).not.toBeNull();
      if (result) {
        expect(result.newFen).toBe(COMMON_FENS.OPENING_AFTER_E4);
        
        const state = useStore.getState();
        expect(state.game.currentFen).toBe(result.newFen);
        expect(state.game.moveHistory).toHaveLength(1);
        expect(state.game.currentMoveIndex).toBe(0);
      }
    });

    it('should reject invalid moves with makeMovePure', () => {
      const store = useStore.getState();

      const result = store.game.makeMovePure('e5'); // Invalid opening move

      expect(result).toBeNull();
      
      const state = useStore.getState();
      expect(state.game.currentFen).toBe(COMMON_FENS.STARTING_POSITION);
      expect(state.game.moveHistory).toHaveLength(0);
    });

    it('should validate moves with validateMovePure', () => {
      const store = useStore.getState();

      expect(store.game.validateMovePure('e4')).toBe(true);
      expect(store.game.validateMovePure('Nf3')).toBe(true);
      expect(store.game.validateMovePure('e5')).toBe(false);
      expect(store.game.validateMovePure('Ke2')).toBe(false);
    });

    it('should get game status with getGameStatusPure', () => {
      const store = useStore.getState();

      const status = store.game.getGameStatusPure();

      expect(status).not.toBeNull();
      if (status) {
        expect(status.isGameOver).toBe(false);
        expect(status.isCheckmate).toBe(false);
        expect(status.isStalemate).toBe(false);
        expect(status.turn).toBe('w');
      }
    });

    it('should get possible moves with getPossibleMovesPure', () => {
      const store = useStore.getState();

      const allMoves = store.game.getPossibleMovesPure();
      const e2Moves = store.game.getPossibleMovesPure('e2');

      expect(allMoves).toHaveLength(20); // 16 pawn + 4 knight moves
      expect(e2Moves).toHaveLength(2); // e3, e4
      expect(e2Moves.some(move => move.san === 'e3')).toBe(true);
      expect(e2Moves.some(move => move.san === 'e4')).toBe(true);
    });
  });

  describe('Integration with nested structure', () => {
    it('should work with other slices in the store', () => {
      const store = useStore.getState();

      // Verify that other slices exist
      expect(store.tablebase).toBeDefined();
      expect(store.training).toBeDefined();
      expect(store.ui).toBeDefined();

      // Set game data using pure functions
      store.game.makeMovePure('e4');

      // Verify it doesn't affect other slices
      const state = useStore.getState();
      expect(state.game.currentFen).toBe(COMMON_FENS.OPENING_AFTER_E4);
      expect(state.tablebase.analysisStatus).toBeDefined();
      expect(state.training.isPlayerTurn).toBeDefined();
    });

    it('should maintain proper nesting in state updates', () => {
      const store = useStore.getState();

      // Make multiple updates using pure functions
      store.game.makeMovePure('e4');
      store.game.setGameFinished(true);

      // Check all updates were applied correctly
      const state = useStore.getState();
      expect(state.game.currentFen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
      expect(state.game.isGameFinished).toBe(true);
      expect(state.game.moveHistory).toHaveLength(1);

      // Verify structure is maintained
      expect(state.game).toHaveProperty('currentFen');
      expect(state.game).toHaveProperty('moveHistory');
      expect(state.game).toHaveProperty('resetGamePure');
      expect(state.game).toHaveProperty('makeMovePure');
    });
  });
});
