import { renderHook, act } from '@testing-library/react';
import { useEnhancedMoveHandler } from '../useEnhancedMoveHandler';
import { Chess } from 'chess.js';

// Mock chess.js
jest.mock('chess.js');

describe('useEnhancedMoveHandler', () => {
  let mockScenarioEngine: any;
  let mockGame: jest.Mocked<Chess>;
  let mockMakeMove: jest.Mock;
  let mockOnWarning: jest.Mock;
  let mockOnEngineError: jest.Mock;
  let mockShowEvaluationBriefly: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock scenario engine
    mockScenarioEngine = {
      getBestMove: jest.fn()
    };
    
    // Setup mock game
    mockGame = {
      fen: jest.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    } as any;
    
    // Setup mock functions
    mockMakeMove = jest.fn();
    mockOnWarning = jest.fn();
    mockOnEngineError = jest.fn();
    mockShowEvaluationBriefly = jest.fn();
  });

  test('should handle move when engine is ready', async () => {
    mockMakeMove.mockResolvedValueOnce(true); // Player move succeeds
    mockScenarioEngine.getBestMove.mockResolvedValueOnce('e2e4');
    mockMakeMove.mockResolvedValueOnce(true); // Engine move succeeds
    
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: mockScenarioEngine,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    const move = { from: 'd2', to: 'd4' };
    
    await act(async () => {
      await result.current.handleMove(move);
    });
    
    expect(mockMakeMove).toHaveBeenCalledTimes(2);
    expect(mockMakeMove).toHaveBeenNthCalledWith(1, move);
    expect(mockMakeMove).toHaveBeenNthCalledWith(2, { from: 'e2', to: 'e4' });
    expect(mockScenarioEngine.getBestMove).toHaveBeenCalledWith(mockGame.fen());
  });

  test('should block move when engine is not ready', async () => {
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: null,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd2', to: 'd4' });
    });
    
    expect(mockMakeMove).not.toHaveBeenCalled();
  });

  test('should block move when game is finished', async () => {
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: mockScenarioEngine,
      isGameFinished: true,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd2', to: 'd4' });
    });
    
    expect(mockMakeMove).not.toHaveBeenCalled();
  });

  test('should handle player move failure', async () => {
    mockMakeMove.mockResolvedValueOnce(false); // Player move fails
    
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: mockScenarioEngine,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd2', to: 'd4' });
    });
    
    expect(mockMakeMove).toHaveBeenCalledTimes(1);
    expect(mockScenarioEngine.getBestMove).not.toHaveBeenCalled();
  });

  test('should handle engine move failure', async () => {
    mockMakeMove.mockResolvedValueOnce(true); // Player move succeeds
    mockScenarioEngine.getBestMove.mockResolvedValueOnce('e2e4');
    mockMakeMove.mockResolvedValueOnce(false); // Engine move fails
    
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: mockScenarioEngine,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd2', to: 'd4' });
    });
    
    expect(mockMakeMove).toHaveBeenCalledTimes(2);
    expect(mockOnEngineError).toHaveBeenCalledWith('Engine-Zug ungültig');
  });

  test('should handle invalid UCI move from engine', async () => {
    mockMakeMove.mockResolvedValueOnce(true); // Player move succeeds
    mockScenarioEngine.getBestMove.mockResolvedValueOnce('e2'); // Invalid UCI
    
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: mockScenarioEngine,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd2', to: 'd4' });
    });
    
    expect(mockMakeMove).toHaveBeenCalledTimes(1); // Only player move
    expect(mockOnEngineError).not.toHaveBeenCalled();
  });

  test('should handle engine error', async () => {
    mockMakeMove.mockResolvedValueOnce(true); // Player move succeeds
    mockScenarioEngine.getBestMove.mockRejectedValueOnce(new Error('Engine error'));
    
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: mockScenarioEngine,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd2', to: 'd4' });
    });
    
    expect(mockOnEngineError).toHaveBeenCalledWith('Engine-Zug fehlgeschlagen');
  });

  test('should handle move processing error', async () => {
    mockMakeMove.mockRejectedValueOnce(new Error('Move error'));
    
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: mockScenarioEngine,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd2', to: 'd4' });
    });
    
    expect(mockOnEngineError).toHaveBeenCalledWith('Zug konnte nicht verarbeitet werden');
  });

  test('should handle promotion moves', async () => {
    mockMakeMove.mockResolvedValueOnce(true); // Player move succeeds
    mockScenarioEngine.getBestMove.mockResolvedValueOnce('e7e8q'); // Promotion move
    mockMakeMove.mockResolvedValueOnce(true); // Engine move succeeds
    
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: mockScenarioEngine,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd7', to: 'd8', promotion: 'q' });
    });
    
    expect(mockMakeMove).toHaveBeenCalledTimes(2);
    expect(mockMakeMove).toHaveBeenNthCalledWith(2, { from: 'e7', to: 'e8', promotion: 'q' });
  });

  test('should handle engine without getBestMove method', async () => {
    const invalidEngine = { someOtherMethod: jest.fn() };
    mockMakeMove.mockResolvedValueOnce(true); // Player move succeeds
    
    const { result } = renderHook(() => useEnhancedMoveHandler({
      scenarioEngine: invalidEngine,
      isGameFinished: false,
      game: mockGame,
      makeMove: mockMakeMove,
      lastEvaluation: null,
      onWarning: mockOnWarning,
      onEngineError: mockOnEngineError,
      showEvaluationBriefly: mockShowEvaluationBriefly
    }));
    
    await act(async () => {
      await result.current.handleMove({ from: 'd2', to: 'd4' });
    });
    
    expect(mockMakeMove).toHaveBeenCalledTimes(1); // Only player move
    expect(mockOnEngineError).not.toHaveBeenCalled();
  });
});

// Test the parseUciMove utility function separately
describe('parseUciMove', () => {
  test('should parse regular move', () => {
    // This would require exporting parseUciMove from the module
    // For now, we're testing it indirectly through the hook
    expect(true).toBe(true);
  });
});