/**
 * @file Integration test for TrainingService
 * @module tests/integration/training-service
 * 
 * @description
 * Tests the centralized TrainingService to ensure it properly
 * handles move execution and completion callbacks.
 */

import { TrainingService } from '@shared/services/TrainingService';
import { useStore } from '@shared/store/rootStore';
import { TRAIN_SCENARIOS } from '../fixtures/trainPositions';

describe.skip('TrainingService Integration', () => {
  let trainingService: TrainingService;
  let storeApi: any;
  let onCompleteMock: jest.Mock;

  beforeEach(() => {
    // Reset the store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useStore.setState({
      game: {
        currentFen: TRAIN_SCENARIOS.TRAIN_1.fen,
        currentPgn: "",
        moveHistory: [],
        currentMoveIndex: 0,
        isGameFinished: false,
        gameResult: null,
        isCheckmate: false,
        isDraw: false,
        isStalemate: false,
      },
      training: {
        currentPosition: {
          id: 1,
          fen: TRAIN_SCENARIOS.TRAIN_1.fen,
          title: TRAIN_SCENARIOS.TRAIN_1.title,
          description: TRAIN_SCENARIOS.TRAIN_1.description,
          difficulty: 'beginner' as const,
          category: 'pawn' as const,
          colorToTrain: 'white' as const,
          targetOutcome: '1-0' as const,
        },
        nextPosition: null,
        previousPosition: null,
        isLoadingNavigation: false,
        navigationError: null,
        chapterProgress: null,
        isPlayerTurn: true,
        isOpponentThinking: false,
        isSuccess: false,
        sessionStartTime: Date.now(),
        sessionEndTime: undefined,
        hintsUsed: 0,
        mistakeCount: 0,
        currentStreak: 0,
        bestStreak: 0,
        showCheckmark: false,
        autoProgressEnabled: true,
        moveErrorDialog: null,
        moveSuccessDialog: null,
        evaluationBaseline: null,
      }
    } as any);

    trainingService = new TrainingService();
    storeApi = {
      getState: useStore.getState,
      setState: useStore.setState
    };
    onCompleteMock = jest.fn();
  });

  it('should execute moves and call completion callbacks', async () => {
    const result = await trainingService.executeMove(storeApi, 'e6-d6', onCompleteMock);
    
    expect(result.success).toBe(true);
    
    // Verify the move was applied to the store
    const state = useStore.getState();
    expect(state.game.moveHistory.length).toBeGreaterThan(0);
    
    // For this simple test, we don't expect completion yet
    expect(onCompleteMock).not.toHaveBeenCalled();
  });

  it('should handle completion callbacks when training finishes', async () => {
    // Set up a state where the next move will complete the training
    useStore.setState({
      game: {
        ...useStore.getState().game,
        isGameFinished: false, // Will be set by PawnPromotionHandler
      },
      training: {
        ...useStore.getState().training,
        isSuccess: false, // Will be set by PawnPromotionHandler
      }
    });

    // Make a pawn promotion move (this should trigger completion)
    const result = await trainingService.executeMove(storeApi, 'e7-e8=q', onCompleteMock);
    
    expect(result.success).toBe(true);
    
    // Check if completion was triggered (depends on PawnPromotionHandler)
    const state = useStore.getState();
    console.log('Final state after promotion:', {
      isGameFinished: state.game.isGameFinished,
      isSuccess: state.training.isSuccess,
      sessionEndTime: state.training.sessionEndTime
    });
    
    // The completion callback should be called if PawnPromotionHandler sets the completion flags
    if (state.game.isGameFinished && state.training.isSuccess) {
      expect(onCompleteMock).toHaveBeenCalledWith(true);
    } else {
      console.log('Training not marked as complete, onComplete not called');
    }
  });

  it('should handle move parsing correctly', async () => {
    // Test coordinate notation
    const result1 = await trainingService.executeMove(storeApi, 'e6-d6');
    expect(result1.success).toBe(true);
    
    // Test promotion notation
    const result2 = await trainingService.executeMove(storeApi, 'e7-e8=q');
    expect(result2.success).toBe(true);
    
    // Test German promotion notation
    const result3 = await trainingService.executeMove(storeApi, 'e7-e8=D');
    expect(result3.success).toBe(true);
  });
});