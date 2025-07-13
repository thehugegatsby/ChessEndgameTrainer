/**
 * @fileoverview Training Actions Tests
 * @description Comprehensive tests for async training actions with engine operations
 */

import { 
  requestEngineMove, 
  requestPositionEvaluation, 
  stopEngineAnalysis, 
  terminateEngine 
} from '../../../shared/store/trainingActions';
import { EngineService } from '../../../shared/services/chess/EngineService';
import type { IChessEngine, BestMoveResult, EvaluationResult } from '../../../shared/lib/chess/IChessEngine';
import type { TrainingState } from '../../../shared/store/types';

// Mock dependencies
jest.mock('../../../shared/services/chess/EngineService');
jest.mock('../../../shared/services/logging', () => ({
  getLogger: () => ({
    setContext: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn()
    })
  })
}));

describe('trainingActions', () => {
  let mockEngine: jest.Mocked<IChessEngine>;
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;
  let mockState: { training: TrainingState };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock engine
    mockEngine = {
      findBestMove: jest.fn(),
      evaluatePosition: jest.fn(),
      stop: jest.fn(),
      terminate: jest.fn()
    };

    // Mock EngineService.getInstance
    (EngineService.getInstance as jest.Mock).mockReturnValue(mockEngine);

    // Create mock store functions
    mockGet = jest.fn();
    mockSet = jest.fn();

    // Create mock training state
    mockState = {
      training: {
        isEngineThinking: false,
        engineStatus: 'ready',
        engineMove: undefined,
        currentEvaluation: undefined
      } as TrainingState
    };

    mockGet.mockReturnValue(mockState);
  });

  describe('requestEngineMove', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const testOptions = { depth: 15, time: 1000 };

    it('should successfully request and return engine move', async () => {
      // Arrange
      const expectedResult: BestMoveResult = {
        move: 'e2e4',
        evaluation: 0.15,
        depth: 15,
        principalVariation: ['e2e4', 'e7e5']
      };
      mockEngine.findBestMove.mockResolvedValue(expectedResult);

      // Act
      const action = requestEngineMove(testFen, testOptions);
      const result = await action(mockGet, mockSet);

      // Assert
      expect(mockEngine.findBestMove).toHaveBeenCalledWith(testFen, testOptions);
      expect(result).toBe('e2e4');

      // Verify store updates
      expect(mockSet).toHaveBeenCalledTimes(2);
      
      // First call: set thinking state
      expect(mockSet).toHaveBeenNthCalledWith(1, expect.any(Function));
      const firstUpdate = mockSet.mock.calls[0][0](mockState);
      expect(firstUpdate.training.isEngineThinking).toBe(true);
      expect(firstUpdate.training.engineStatus).toBe('analyzing');

      // Second call: set result state
      const secondUpdate = mockSet.mock.calls[1][0](mockState);
      expect(secondUpdate.training.isEngineThinking).toBe(false);
      expect(secondUpdate.training.engineMove).toBe('e2e4');
      expect(secondUpdate.training.engineStatus).toBe('ready');
    });

    it('should handle engine errors gracefully', async () => {
      // Arrange
      const engineError = new Error('Engine initialization failed');
      mockEngine.findBestMove.mockRejectedValue(engineError);

      // Act & Assert
      const action = requestEngineMove(testFen, testOptions);
      await expect(action(mockGet, mockSet)).rejects.toThrow('Engine move failed: Error: Engine initialization failed');

      // Verify error state update
      expect(mockSet).toHaveBeenCalledTimes(2);
      const errorUpdate = mockSet.mock.calls[1][0](mockState);
      expect(errorUpdate.training.isEngineThinking).toBe(false);
      expect(errorUpdate.training.engineStatus).toBe('error');
    });

    it('should work without options parameter', async () => {
      // Arrange
      const expectedResult: BestMoveResult = {
        move: 'd2d4',
        evaluation: 0.25
      };
      mockEngine.findBestMove.mockResolvedValue(expectedResult);

      // Act
      const action = requestEngineMove(testFen);
      const result = await action(mockGet, mockSet);

      // Assert
      expect(mockEngine.findBestMove).toHaveBeenCalledWith(testFen, undefined);
      expect(result).toBe('d2d4');
    });
  });

  describe('requestPositionEvaluation', () => {
    const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    const testOptions = { depth: 20 };

    it('should successfully evaluate position', async () => {
      // Arrange
      const expectedResult: EvaluationResult = {
        evaluation: 0.35,
        mate: undefined,
        depth: 20,
        principalVariation: ['e7e5', 'g1f3']
      };
      mockEngine.evaluatePosition.mockResolvedValue(expectedResult);

      // Act
      const action = requestPositionEvaluation(testFen, testOptions);
      const result = await action(mockGet, mockSet);

      // Assert
      expect(mockEngine.evaluatePosition).toHaveBeenCalledWith(testFen, testOptions);
      expect(result).toEqual(expectedResult);

      // Verify store updates
      expect(mockSet).toHaveBeenCalledTimes(2);
      
      // First call: set analyzing state
      const firstUpdate = mockSet.mock.calls[0][0](mockState);
      expect(firstUpdate.training.engineStatus).toBe('analyzing');

      // Second call: set evaluation result
      const secondUpdate = mockSet.mock.calls[1][0](mockState);
      expect(secondUpdate.training.currentEvaluation).toEqual({
        evaluation: 0.35,
        mate: undefined,
        depth: 20
      });
      expect(secondUpdate.training.engineStatus).toBe('ready');
    });

    it('should handle mate evaluation correctly', async () => {
      // Arrange
      const expectedResult: EvaluationResult = {
        evaluation: 1000,
        mate: 3,
        depth: 15
      };
      mockEngine.evaluatePosition.mockResolvedValue(expectedResult);

      // Act
      const action = requestPositionEvaluation(testFen, { depth: 15 });
      await action(mockGet, mockSet);

      // Assert
      const secondUpdate = mockSet.mock.calls[1][0](mockState);
      expect(secondUpdate.training.currentEvaluation).toEqual({
        evaluation: 1000,
        mate: 3,
        depth: 15
      });
    });

    it('should use default depth when options not provided', async () => {
      // Arrange
      const expectedResult: EvaluationResult = {
        evaluation: -0.15
      };
      mockEngine.evaluatePosition.mockResolvedValue(expectedResult);

      // Act
      const action = requestPositionEvaluation(testFen);
      await action(mockGet, mockSet);

      // Assert
      const secondUpdate = mockSet.mock.calls[1][0](mockState);
      expect(secondUpdate.training.currentEvaluation.depth).toBe(15); // default depth
    });

    it('should handle evaluation errors gracefully', async () => {
      // Arrange
      const evaluationError = new Error('Position evaluation timeout');
      mockEngine.evaluatePosition.mockRejectedValue(evaluationError);

      // Act & Assert
      const action = requestPositionEvaluation(testFen, testOptions);
      await expect(action(mockGet, mockSet)).rejects.toThrow('Position evaluation failed: Error: Position evaluation timeout');

      // Verify error state
      const errorUpdate = mockSet.mock.calls[1][0](mockState);
      expect(errorUpdate.training.engineStatus).toBe('error');
    });
  });

  describe('stopEngineAnalysis', () => {
    it('should successfully stop engine analysis', async () => {
      // Arrange
      mockEngine.stop.mockResolvedValue();

      // Act
      const action = stopEngineAnalysis();
      await action(mockGet, mockSet);

      // Assert
      expect(mockEngine.stop).toHaveBeenCalledTimes(1);
      
      // Verify store update
      expect(mockSet).toHaveBeenCalledTimes(1);
      const update = mockSet.mock.calls[0][0](mockState);
      expect(update.training.isEngineThinking).toBe(false);
      expect(update.training.engineStatus).toBe('ready');
    });

    it('should handle stop errors gracefully without throwing', async () => {
      // Arrange
      const stopError = new Error('Engine stop failed');
      mockEngine.stop.mockRejectedValue(stopError);

      // Act - should not throw
      const action = stopEngineAnalysis();
      await expect(action(mockGet, mockSet)).resolves.toBeUndefined();

      // Assert
      expect(mockEngine.stop).toHaveBeenCalledTimes(1);
      // Note: stopEngineAnalysis does NOT update state on error (logs only)
      expect(mockSet).toHaveBeenCalledTimes(0);
    });
  });

  describe('terminateEngine', () => {
    it('should successfully terminate engine', async () => {
      // Arrange
      mockEngine.terminate.mockResolvedValue();

      // Act
      const action = terminateEngine();
      await action(mockGet, mockSet);

      // Assert
      expect(mockEngine.terminate).toHaveBeenCalledTimes(1);
      
      // Verify store reset
      expect(mockSet).toHaveBeenCalledTimes(1);
      const update = mockSet.mock.calls[0][0](mockState);
      expect(update.training.isEngineThinking).toBe(false);
      expect(update.training.engineMove).toBeUndefined();
      expect(update.training.engineStatus).toBe('idle');
    });

    it('should handle terminate errors gracefully without throwing', async () => {
      // Arrange
      const terminateError = new Error('Engine terminate failed');
      mockEngine.terminate.mockRejectedValue(terminateError);

      // Act - should not throw
      const action = terminateEngine();
      await expect(action(mockGet, mockSet)).resolves.toBeUndefined();

      // Assert
      expect(mockEngine.terminate).toHaveBeenCalledTimes(1);
      // Note: terminateEngine does NOT update state on error (logs only)
      expect(mockSet).toHaveBeenCalledTimes(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle sequential engine operations correctly', async () => {
      // Arrange
      const moveResult: BestMoveResult = { move: 'e2e4', evaluation: 0.2 };
      const evalResult: EvaluationResult = { evaluation: 0.2, depth: 15 };
      
      mockEngine.findBestMove.mockResolvedValue(moveResult);
      mockEngine.evaluatePosition.mockResolvedValue(evalResult);
      mockEngine.stop.mockResolvedValue();

      // Act
      const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      
      await requestEngineMove(testFen)(mockGet, mockSet);
      await requestPositionEvaluation(testFen)(mockGet, mockSet);
      await stopEngineAnalysis()(mockGet, mockSet);

      // Assert
      expect(mockEngine.findBestMove).toHaveBeenCalledTimes(1);
      expect(mockEngine.evaluatePosition).toHaveBeenCalledTimes(1);
      expect(mockEngine.stop).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledTimes(5); // 2 + 2 + 1
    });

    it('should preserve state immutability', async () => {
      // Arrange
      const originalState = { ...mockState };
      const moveResult: BestMoveResult = { move: 'e2e4', evaluation: 0.2 };
      mockEngine.findBestMove.mockResolvedValue(moveResult);

      // Act
      const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      await requestEngineMove(testFen)(mockGet, mockSet);

      // Assert - original state should not be mutated
      expect(mockState).toEqual(originalState);
      
      // Verify new state objects are created
      const firstUpdate = mockSet.mock.calls[0][0](mockState);
      const secondUpdate = mockSet.mock.calls[1][0](mockState);
      
      expect(firstUpdate.training).not.toBe(mockState.training);
      expect(secondUpdate.training).not.toBe(mockState.training);
    });
  });
});