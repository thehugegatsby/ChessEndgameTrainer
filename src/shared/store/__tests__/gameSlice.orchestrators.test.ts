/**
 * @file Integration tests for atomic handlePlayerMove orchestrator action
 * @description Tests the new handlePlayerMove action that replaces 440+ lines of orchestrator logic
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { createStore } from '../createStore';
import type { RootStore } from '../rootStore';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

// Mock the delegate actions to verify they're called correctly
const mockEvaluateMoveQuality = vi.fn();
const mockFinalizeTrainingSession = vi.fn();
const mockShowGameOverDialog = vi.fn();
const mockTriggerOpponentMove = vi.fn();

// Mock the pure functions
vi.mock('@shared/utils/chess-logic', async () => {
  const actual = await vi.importActual('@shared/utils/chess-logic');
  return {
    ...actual,
    validateMove: vi.fn(),
    makeMove: vi.fn(),
    getGameStatus: vi.fn(),
    turn: vi.fn(),
  };
});

// Import mocked functions for type safety
import { validateMove, makeMove, getGameStatus, turn } from '@shared/utils/chess-logic';

const mockedValidateMove = validateMove as MockedFunction<typeof validateMove>;
const mockedMakeMove = makeMove as MockedFunction<typeof makeMove>;
const mockedGetGameStatus = getGameStatus as MockedFunction<typeof getGameStatus>;
const mockedTurn = turn as MockedFunction<typeof turn>;

describe.skip('handlePlayerMove - Atomic Orchestrator Action', () => {
  let store: RootStore;

  // Mock move result used across multiple tests
  const mockMoveResult = {
    newFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    move: {
      san: 'e4',
      from: 'e2',
      to: 'e4',
      piece: 'p',
      color: 'w',
      flags: '',
      captured: undefined,
      promotion: undefined,
    },
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    isCheck: false,
    gameResult: null,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a fresh store for each test
    store = createStore();
    
    // Set up initial game state
    store.setState(state => {
      state.game.currentFen = TEST_POSITIONS.STARTING_POSITION;
      state.game.playerColor = 'w';
      state.game.moveHistory = [];
      state.game.currentMoveIndex = -1;
      delete state.game.lastMoveError;
    });

    // Mock delegate actions by injecting them into the store
    // @ts-expect-error - We're mocking for testing
    store.setState(state => {
      if (!state.actions) state.actions = {};
      if (!state.actions.training) state.actions.training = {};
      if (!state.actions.ui) state.actions.ui = {};
      if (!state.actions.opponent) state.actions.opponent = {};
      
      state.actions.training.evaluateMoveQuality = mockEvaluateMoveQuality;
      state.actions.training.finalizeTrainingSession = mockFinalizeTrainingSession;
      state.actions.ui.showGameOverDialog = mockShowGameOverDialog;
      state.actions.opponent.triggerOpponentMove = mockTriggerOpponentMove;
    });
  });

  describe('Move Validation', () => {
    it('should set error when move validation fails', async () => {
      // Arrange
      mockedValidateMove.mockReturnValue(false);
      const move = { from: 'e2', to: 'e5' }; // Invalid move

      // Act
      await store.getState().handlePlayerMove(move);

      // Assert
      expect(store.getState().game.lastMoveError).toBe('Invalid move');
      expect(store.getState().game.currentFen).toBe(TEST_POSITIONS.STARTING_POSITION); // No change
      expect(store.getState().game.moveHistory).toHaveLength(0);
      
      // Verify no delegate actions were called
      expect(mockEvaluateMoveQuality).not.toHaveBeenCalled();
      expect(mockTriggerOpponentMove).not.toHaveBeenCalled();
    });

    it('should set error when move application fails', async () => {
      // Arrange
      mockedValidateMove.mockReturnValue(true);
      mockedMakeMove.mockReturnValue(null); // Move application failed
      const move = { from: 'e2', to: 'e4' };

      // Act
      await store.getState().handlePlayerMove(move);

      // Assert
      expect(store.getState().game.lastMoveError).toBe('Move could not be applied');
      expect(store.getState().game.currentFen).toBe(TEST_POSITIONS.STARTING_POSITION); // No change
      expect(store.getState().game.moveHistory).toHaveLength(0);
    });
  });

  describe('Successful Move Application', () => {

    it('should apply move and update state atomically', async () => {
      // Arrange
      mockedValidateMove.mockReturnValue(true);
      mockedMakeMove.mockReturnValue(mockMoveResult);
      mockedGetGameStatus.mockReturnValue({
        isGameOver: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
        turn: 'b',
      });
      mockedTurn.mockReturnValue('b'); // Now black's turn
      
      const move = { from: 'e2', to: 'e4' };

      // Act
      await store.getState().handlePlayerMove(move);

      // Assert - Core state updates
      const gameState = store.getState().game;
      expect(gameState.currentFen).toBe(mockMoveResult.newFen);
      expect(gameState.moveHistory).toHaveLength(1);
      expect(gameState.moveHistory[0].san).toBe('e4');
      expect(gameState.currentMoveIndex).toBe(0);
      expect(gameState.lastMoveError).toBeUndefined();
      expect(gameState.isCheckmate).toBe(false);
      expect(gameState.isDraw).toBe(false);
      expect(gameState.isGameFinished).toBe(false);
    });

    it('should call delegate actions for ongoing game', async () => {
      // Arrange
      mockedValidateMove.mockReturnValue(true);
      mockedMakeMove.mockReturnValue(mockMoveResult);
      mockedGetGameStatus.mockReturnValue({
        isGameOver: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
        turn: 'b',
      });
      mockedTurn.mockReturnValue('b'); // Now black's turn
      
      const move = { from: 'e2', to: 'e4' };

      // Act
      await store.getState().handlePlayerMove(move);

      // Assert - Delegate actions called
      expect(mockEvaluateMoveQuality).toHaveBeenCalledWith(
        expect.objectContaining({ san: 'e4' }),
        mockMoveResult.newFen
      );
      expect(mockTriggerOpponentMove).toHaveBeenCalledWith(mockMoveResult.newFen);
      
      // Game over actions should NOT be called
      expect(mockFinalizeTrainingSession).not.toHaveBeenCalled();
      expect(mockShowGameOverDialog).not.toHaveBeenCalled();
    });
  });

  describe('Game Over Scenarios', () => {
    const mockCheckmateResult = {
      newFen: '8/8/8/8/8/8/8/k1K5 b - - 0 1', // Checkmate position
      move: {
        san: 'Ka1#',
        from: 'a2',
        to: 'a1',
        piece: 'k',
        color: 'w',
        flags: '',
        captured: undefined,
        promotion: undefined,
      },
      isCheckmate: true,
      isStalemate: false,
      isDraw: false,
      isCheck: true,
      gameResult: '1-0',
    };

    it('should handle checkmate correctly', async () => {
      // Arrange
      mockedValidateMove.mockReturnValue(true);
      mockedMakeMove.mockReturnValue(mockCheckmateResult);
      mockedGetGameStatus.mockReturnValue({
        isGameOver: true,
        isCheckmate: true,
        isStalemate: false,
        isDraw: false,
        isCheck: true,
        gameResult: '1-0',
        turn: 'b',
      });
      
      const move = { from: 'a2', to: 'a1' };

      // Act
      await store.getState().handlePlayerMove(move);

      // Assert - Game state updates
      const gameState = store.getState().game;
      expect(gameState.isCheckmate).toBe(true);
      expect(gameState.isGameFinished).toBe(true);
      expect(gameState.gameResult).toBe('1-0');

      // Assert - Game over delegate actions called
      expect(mockFinalizeTrainingSession).toHaveBeenCalledWith('1-0');
      expect(mockShowGameOverDialog).toHaveBeenCalledWith({ reason: '1-0' });
      
      // Opponent move should NOT be triggered for game over
      expect(mockTriggerOpponentMove).not.toHaveBeenCalled();
    });

    it('should handle draw correctly', async () => {
      // Arrange
      const mockDrawResult = {
        ...mockCheckmateResult,
        isCheckmate: false,
        isDraw: true,
        gameResult: '1/2-1/2',
      };
      
      mockedValidateMove.mockReturnValue(true);
      mockedMakeMove.mockReturnValue(mockDrawResult);
      mockedGetGameStatus.mockReturnValue({
        isGameOver: true,
        isCheckmate: false,
        isStalemate: false,
        isDraw: true,
        isCheck: false,
        gameResult: '1/2-1/2',
        turn: 'b',
      });
      
      const move = { from: 'a2', to: 'a1' };

      // Act
      await store.getState().handlePlayerMove(move);

      // Assert
      expect(store.getState().game.isDraw).toBe(true);
      expect(store.getState().game.isGameFinished).toBe(true);
      expect(mockFinalizeTrainingSession).toHaveBeenCalledWith('1/2-1/2');
      expect(mockShowGameOverDialog).toHaveBeenCalledWith({ reason: '1/2-1/2' });
    });
  });

  describe('Pawn Promotion', () => {
    it('should handle pawn promotion moves', async () => {
      // Arrange
      const mockPromotionResult = {
        newFen: '1Q6/8/8/8/8/8/8/k1K5 b - - 0 1',
        move: {
          san: 'b8=Q',
          from: 'b7',
          to: 'b8',
          piece: 'p',
          color: 'w',
          flags: 'p',
          captured: undefined,
          promotion: 'q',
        },
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
      };

      mockedValidateMove.mockReturnValue(true);
      mockedMakeMove.mockReturnValue(mockPromotionResult);
      mockedGetGameStatus.mockReturnValue({
        isGameOver: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
        turn: 'b',
      });
      mockedTurn.mockReturnValue('b');
      
      const move = { from: 'b7', to: 'b8', promotion: 'q' as const };

      // Act
      await store.getState().handlePlayerMove(move);

      // Assert
      expect(store.getState().game.currentFen).toBe(mockPromotionResult.newFen);
      expect(store.getState().game.moveHistory[0].san).toBe('b8=Q');
      expect(mockEvaluateMoveQuality).toHaveBeenCalled();
    });
  });

  describe('Error Edge Cases', () => {
    it('should handle null gameStatus gracefully', async () => {
      // Arrange
      mockedValidateMove.mockReturnValue(true);
      mockedMakeMove.mockReturnValue(mockMoveResult);
      mockedGetGameStatus.mockReturnValue(null); // Simulate error
      
      const move = { from: 'e2', to: 'e4' };

      // Act & Assert - Should not throw
      await expect(store.getState().handlePlayerMove(move)).resolves.toBeUndefined();
      
      // Game state should still be updated
      expect(store.getState().game.currentFen).toBe(mockMoveResult.newFen);
    });
  });

  describe('Integration Flow', () => {
    it('should execute complete move lifecycle correctly', async () => {
      // Arrange - Set up a realistic move scenario
      mockedValidateMove.mockReturnValue(true);
      mockedMakeMove.mockReturnValue(mockMoveResult);
      mockedGetGameStatus.mockReturnValue({
        isGameOver: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isCheck: false,
        gameResult: null,
        turn: 'b',
      });
      mockedTurn.mockReturnValue('b');
      
      const move = { from: 'e2', to: 'e4' };

      // Act
      await store.getState().handlePlayerMove(move);

      // Assert - Verify execution order and completeness
      expect(mockedValidateMove).toHaveBeenCalledWith(TEST_POSITIONS.STARTING_POSITION, move);
      expect(mockedMakeMove).toHaveBeenCalledWith(TEST_POSITIONS.STARTING_POSITION, move);
      expect(mockedGetGameStatus).toHaveBeenCalledWith(mockMoveResult.newFen);
      expect(mockedTurn).toHaveBeenCalledWith(mockMoveResult.newFen);
      
      // Verify all delegate actions called in correct order
      expect(mockEvaluateMoveQuality).toHaveBeenCalledBefore(mockTriggerOpponentMove);
      
      // Verify final state is consistent
      const finalState = store.getState().game;
      expect(finalState.currentFen).toBe(mockMoveResult.newFen);
      expect(finalState.moveHistory).toHaveLength(1);
      expect(finalState.lastMoveError).toBeUndefined();
    });
  });
});