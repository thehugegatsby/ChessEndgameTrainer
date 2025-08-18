/**
 * @file Integration test for handlePlayerMove streak logic
 * @description Tests that streak counter is correctly updated when making moves
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from '../createStore';
import type { RootStore } from '../rootStore';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';

// Mock chess logic functions
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

import { validateMove, makeMove, getGameStatus, turn } from '@shared/utils/chess-logic';

describe('handlePlayerMove - Streak Logic Integration', () => {
  let store: RootStore;

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
    vi.clearAllMocks();
    
    // Create fresh store
    store = createStore();
    
    // Set up initial state with training session
    store.setState(state => {
      state.game.currentFen = TEST_POSITIONS.STARTING_POSITION;
      state.game.playerColor = 'w';
      state.game.moveHistory = [];
      state.game.currentMoveIndex = -1;
      
      // Set up training state
      state.training.currentPosition = {
        id: 1,
        category: 'KPK',
        fen: TEST_POSITIONS.STARTING_POSITION,
        colorToTrain: 'w',
        targetOutcome: '1-0',
      };
      state.training.currentStreak = 0; // Start with 0 streak
      state.training.isActive = true;
      
      delete state.game.lastMoveError;
    });

    // Mock successful move scenario
    (validateMove as any).mockReturnValue(true);
    (makeMove as any).mockReturnValue(mockMoveResult);
    (getGameStatus as any).mockReturnValue({
      isGameOver: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      isCheck: false,
      gameResult: null,
      turn: 'b',
    });
    (turn as any).mockReturnValue('b');
  });

  it('🔥 CRITICAL: should increment streak from 0 to 1 on first correct move', async () => {
    // Arrange: Verify initial state
    expect(store.getState().training.currentStreak).toBe(0);
    
    const move = { from: 'e2', to: 'e4' };

    // Act: Make the move
    await store.getState().handlePlayerMove(move);

    // Assert: Streak should be incremented to 1
    const finalStreak = store.getState().training.currentStreak;
    console.log('🎯 DEBUG - Initial streak: 0, Final streak:', finalStreak);
    
    expect(finalStreak).toBe(1);
  });

  it('should increment streak from 1 to 2 on second correct move', async () => {
    // Arrange: Set initial streak to 1
    store.setState(state => {
      state.training.currentStreak = 1;
    });
    
    const move = { from: 'e2', to: 'e4' };

    // Act
    await store.getState().handlePlayerMove(move);

    // Assert
    expect(store.getState().training.currentStreak).toBe(2);
  });

  it('should reset streak to 0 on incorrect move', async () => {
    // Arrange: Set initial streak to 5
    store.setState(state => {
      state.training.currentStreak = 5;
    });

    // Mock move validation failure for incorrect move
    (validateMove as any).mockReturnValue(false);
    
    const move = { from: 'e2', to: 'e5' }; // Invalid move

    // Act
    await store.getState().handlePlayerMove(move);

    // Assert: Streak should be reset to 0
    expect(store.getState().training.currentStreak).toBe(0);
  });

  it('should maintain streak when not in training mode', async () => {
    // Arrange: Disable training mode by removing currentPosition
    store.setState(state => {
      state.training.currentPosition = undefined; // No position = not in training mode
      state.training.currentStreak = 3;
    });
    
    const move = { from: 'e2', to: 'e4' };

    // Act
    await store.getState().handlePlayerMove(move);

    // Assert: Streak should remain unchanged
    expect(store.getState().training.currentStreak).toBe(3);
  });

  it('should handle streak logic when move quality evaluation is involved', async () => {
    // Arrange: Verify initial streak
    expect(store.getState().training.currentStreak).toBe(0);
    
    const move = { from: 'e2', to: 'e4' };

    // Act
    await store.getState().handlePlayerMove(move);

    // Assert: Streak should be incremented regardless of move quality evaluation
    expect(store.getState().training.currentStreak).toBe(1);
  });
});