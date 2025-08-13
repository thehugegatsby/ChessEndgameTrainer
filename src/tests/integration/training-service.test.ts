import { vi } from 'vitest';
/**
 * @file Integration test for TrainingService
 * @module tests/integration/training-service
 * 
 * @description
 * Tests the centralized TrainingService with real store and ChessService.
 * This is a true integration test that verifies the complete flow.
 */

import { TrainingService } from '@shared/services/TrainingService';
import { TRAIN_SCENARIOS } from '../fixtures/trainPositions';
import { useStore } from '@shared/store/rootStore';
import { type EndgamePosition } from '@shared/types/endgame';

describe('TrainingService Integration', () => {
  let trainingService: TrainingService;
  let onCompleteMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Reset the real store to clean state
    useStore.getState().reset();
    
    // Create a real training position for the test
    const testPosition: EndgamePosition = {
      id: 1,
      fen: TRAIN_SCENARIOS.TRAIN_1.fen,
      title: TRAIN_SCENARIOS.TRAIN_1.title,
      description: TRAIN_SCENARIOS.TRAIN_1.description,
      difficulty: 'beginner',
      category: 'pawn',
    };

    // Load the training context using the real orchestrator
    await useStore.getState().loadTrainingContext(testPosition);
    
    trainingService = new TrainingService();
    onCompleteMock = vi.fn();
  });

  it('should execute moves through real store orchestrator', async () => {
    const store = useStore;
    
    // Get initial state
    const initialState = store.getState();
    expect(initialState.game.moveHistory).toHaveLength(0);
    
    // Execute a move from the training scenario
    const firstMove = TRAIN_SCENARIOS.TRAIN_1.sequences.WIN.moves[0]; // 'Kd6'
    const result = await trainingService.executeMove(store, firstMove, onCompleteMock);
    
    expect(result.success).toBe(true);
    
    // Verify the move was applied to the store 
    const state = store.getState();
    expect(state.game.moveHistory.length).toBeGreaterThan(0);
    expect(state.game.moveHistory[0].san).toBe(firstMove);
    
    // For this simple test, we don't expect completion yet
    expect(onCompleteMock).not.toHaveBeenCalled();
  });

  it('should handle move parsing correctly', async () => {
    const store = useStore;
    
    // Test SAN notation (what TrainingService actually gets from E2E tests)
    const result1 = await trainingService.executeMove(store, 'Kd6', onCompleteMock);
    expect(result1.success).toBe(true);
    
    // Reset for next test
    store.getState().reset();
    await store.getState().loadTrainingContext({
      id: 1,
      fen: TRAIN_SCENARIOS.TRAIN_1.fen,
      title: TRAIN_SCENARIOS.TRAIN_1.title,
      description: TRAIN_SCENARIOS.TRAIN_1.description,
      difficulty: 'beginner',
      category: 'pawn',
    });
    
    // Test coordinate notation - valid move from the position
    const result2 = await trainingService.executeMove(store, 'e6-d6', onCompleteMock);
    expect(result2.success).toBe(true);
  });

  it('should handle invalid moves correctly', async () => {
    const store = useStore;
    
    // Try an invalid move
    const result = await trainingService.executeMove(store, 'invalidmove', onCompleteMock);
    
    // Should fail gracefully
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(onCompleteMock).not.toHaveBeenCalled();
  });
});