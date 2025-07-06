/**
 * @fileoverview Unit tests for ScenarioEngine
 * @description Tests for the main chess scenario engine with mobile optimization
 */

import { Chess } from 'chess.js';
import { ScenarioEngine } from '../../../shared/lib/chess/ScenarioEngine';
import { TEST_POSITIONS, TEST_MOVES, getInvalidPositions } from '../../helpers/testPositions';
import { MockEngine, MockTablebaseService } from '../../helpers/engineMocks';

// Mock dependencies
jest.mock('../../../shared/lib/chess/engine');
jest.mock('../../../shared/lib/chess/tablebase');

describe('ScenarioEngine', () => {
  let mockEngine: MockEngine;
  let mockTablebaseService: MockTablebaseService;
  let scenarioEngine: ScenarioEngine;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create fresh mock instances
    mockEngine = new MockEngine();
    mockTablebaseService = new MockTablebaseService();
    
    // Mock the Engine class completely
    jest.doMock('../../../shared/lib/chess/engine', () => ({
      Engine: {
        getInstance: jest.fn().mockReturnValue(mockEngine)
      }
    }));
    
    // Mock the tablebase service completely
    jest.doMock('../../../shared/lib/chess/tablebase', () => ({
      tablebaseService: mockTablebaseService
    }));
    
    // For existing required modules, manually assign
    const engineModule = require('../../../shared/lib/chess/engine');
    const tablebaseModule = require('../../../shared/lib/chess/tablebase');
    
    if (engineModule.Engine) {
      engineModule.Engine.getInstance = jest.fn().mockReturnValue(mockEngine);
    }
    if (tablebaseModule.tablebaseService) {
      Object.assign(tablebaseModule.tablebaseService, mockTablebaseService);
    }
  });
  
  afterEach(() => {
    // Clean up scenario engine to prevent memory leaks
    if (scenarioEngine) {
      scenarioEngine.quit();
    }
    
    // Reset static instance count to prevent test interference
    // Access private static field through prototype manipulation
    (ScenarioEngine as any).instanceCount = 0;
  });

  describe('Instance Management', () => {
    test('should_create_instance_with_default_starting_position', () => {
      // Purpose: Verify that ScenarioEngine initializes with standard chess starting position
      scenarioEngine = new ScenarioEngine();
      
      expect(scenarioEngine.getFen()).toBe(TEST_POSITIONS.STARTING_POSITION);
      expect(mockEngine.isReady()).toBe(true);
    });

    test('should_create_instance_with_custom_fen_position', () => {
      // Purpose: Verify that ScenarioEngine can be initialized with custom endgame positions
      const customFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      scenarioEngine = new ScenarioEngine(customFen);
      
      expect(scenarioEngine.getFen()).toBe(customFen);
    });

    test('should_track_instance_count_correctly_when_creating_multiple_engines', () => {
      // Purpose: Verify mobile memory management through instance counting
      // Reset counter to start clean
      (ScenarioEngine as any).instanceCount = 0;
      
      const engine1 = new ScenarioEngine();
      const engine2 = new ScenarioEngine();
      const engine3 = new ScenarioEngine();
      
      const stats = engine1.getStats();
      expect(stats.instanceCount).toBe(3);
      
      // Cleanup
      engine1.quit();
      engine2.quit();
      engine3.quit();
    });

    test('should_cleanup_instance_count_when_quit_called', () => {
      // Purpose: Verify proper cleanup reduces instance count for memory management
      // Reset counter to start clean
      (ScenarioEngine as any).instanceCount = 0;
      
      const engine1 = new ScenarioEngine();
      const engine2 = new ScenarioEngine();
      
      let stats = engine1.getStats();
      expect(stats.instanceCount).toBe(2);
      
      engine1.quit();
      stats = engine2.getStats();
      expect(stats.instanceCount).toBe(1);
      
      engine2.quit();
      // Create new engine to check final count
      const engine3 = new ScenarioEngine();
      stats = engine3.getStats();
      expect(stats.instanceCount).toBe(1);
      
      engine3.quit();
    });

    test('should_handle_quit_cleanup_gracefully_on_multiple_calls', () => {
      // Purpose: Verify that calling quit() multiple times doesn't break the engine
      scenarioEngine = new ScenarioEngine();
      
      expect(() => {
        scenarioEngine.quit();
        scenarioEngine.quit(); // Second call should not throw
        scenarioEngine.quit(); // Third call should not throw
      }).not.toThrow();
    });
  });

  describe('FEN Validation', () => {
    test('should_accept_valid_starting_position_fen', () => {
      // Purpose: Verify engine accepts standard chess starting position
      expect(() => {
        scenarioEngine = new ScenarioEngine(TEST_POSITIONS.STARTING_POSITION);
      }).not.toThrow();
      
      expect(scenarioEngine.getFen()).toBe(TEST_POSITIONS.STARTING_POSITION);
    });

    test('should_accept_valid_endgame_position_fen', () => {
      // Purpose: Verify engine accepts complex endgame positions for training
      const endgameFen = TEST_POSITIONS.ROOK_ENDGAME;
      
      expect(() => {
        scenarioEngine = new ScenarioEngine(endgameFen);
      }).not.toThrow();
      
      expect(scenarioEngine.getFen()).toBe(endgameFen);
    });

    test('should_reject_empty_fen_string', () => {
      // Purpose: Verify proper error handling for invalid FEN input
      expect(() => {
        new ScenarioEngine(TEST_POSITIONS.EMPTY_FEN);
      }).toThrow('FEN must be a non-empty string');
    });

    test('should_reject_null_or_undefined_fen', () => {
      // Purpose: Verify robust input validation
      expect(() => {
        new ScenarioEngine(null as any);
      }).toThrow('FEN must be a non-empty string');
      
      expect(() => {
        new ScenarioEngine(undefined as any);
      }).not.toThrow(); // undefined is acceptable, uses default
    });

    test('should_update_position_with_valid_fen', () => {
      // Purpose: Verify position updates work correctly during training
      scenarioEngine = new ScenarioEngine();
      const newPosition = TEST_POSITIONS.QUEEN_ENDGAME;
      
      scenarioEngine.updatePosition(newPosition);
      expect(scenarioEngine.getFen()).toBe(newPosition);
    });

    test('should_reject_invalid_fen_on_position_update', () => {
      // Purpose: Verify error handling during position updates
      scenarioEngine = new ScenarioEngine();
      
      expect(() => {
        scenarioEngine.updatePosition(TEST_POSITIONS.INVALID_FEN);
      }).toThrow('Invalid FEN');
    });
  });

  describe('Move Making', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    test('should_make_legal_move_and_trigger_engine_response', async () => {
      // Purpose: Verify core gameplay loop - player move followed by engine response
      mockEngine.setShouldFail(false);
      
      const result = await scenarioEngine.makeMove(TEST_MOVES.E2E4);
      
      expect(result).toBeTruthy();
      expect(result.from).toBe('e2');
      expect(result.to).toBe('e4');
      expect(mockEngine.calls.getBestMove.length).toBe(1);
    });

    test('should_reject_illegal_moves_gracefully', async () => {
      // Purpose: Verify robust handling of invalid move attempts
      const result = await scenarioEngine.makeMove(TEST_MOVES.ILLEGAL_MOVE);
      
      expect(result).toBeNull();
      expect(mockEngine.calls.getBestMove.length).toBe(0); // No engine call for illegal move
    });

    test('should_handle_promotion_moves_correctly', async () => {
      // Purpose: Verify special move handling for pawn promotion
      // Use a position where promotion is definitely possible - Black pawn on 2nd rank, White king not blocking
      const promotionFen = '4k3/8/8/8/8/8/4p3/K7 b - - 0 1';
      
      scenarioEngine = new ScenarioEngine(promotionFen);
      
      // Black pawn can promote from e2 to e1 (White king is on a1, not blocking)
      const promotionMove = { from: 'e2', to: 'e1', promotion: 'q' as const };
      const result = await scenarioEngine.makeMove(promotionMove);
      
      expect(result).toBeTruthy();
      if (result) {
        expect(result.promotion).toBe('q');
        expect(result.from).toBe('e2');
        expect(result.to).toBe('e1');
      }
    });

    test('should_handle_engine_failure_during_move_gracefully', async () => {
      // Purpose: Verify resilience when engine fails to respond
      mockEngine.setShouldFail(true);
      
      const result = await scenarioEngine.makeMove(TEST_MOVES.E2E4);
      
      // Player move should still succeed even if engine fails
      expect(result).toBeTruthy();
      expect(result.from).toBe('e2');
      expect(result.to).toBe('e4');
    });

    test('should_reset_to_initial_position_correctly', () => {
      // Purpose: Verify training session reset functionality
      const customFen = TEST_POSITIONS.ROOK_ENDGAME;
      scenarioEngine = new ScenarioEngine(customFen);
      
      // Make some moves to change position
      scenarioEngine.getChessInstance().move('Kc6');
      expect(scenarioEngine.getFen()).not.toBe(customFen);
      
      // Reset should return to initial position
      scenarioEngine.reset();
      expect(scenarioEngine.getFen()).toBe(customFen);
    });
  });

  describe('Engine Integration', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    test('should_get_best_move_from_engine_with_success', async () => {
      // Purpose: Verify engine integration for move suggestions
      mockEngine.setShouldFail(false);
      
      const bestMove = await scenarioEngine.getBestMove(TEST_POSITIONS.STARTING_POSITION);
      
      expect(bestMove).toBeTruthy();
      expect(typeof bestMove).toBe('string');
      expect(bestMove).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/); // UCI format
      expect(mockEngine.calls.getBestMove.length).toBe(1);
    });

    test('should_handle_engine_failure_gracefully', async () => {
      // Purpose: Verify graceful degradation when engine is unavailable
      mockEngine.setShouldFail(true);
      
      const bestMove = await scenarioEngine.getBestMove(TEST_POSITIONS.STARTING_POSITION);
      
      expect(bestMove).toBeNull();
    });

    test('should_get_position_evaluation_successfully', async () => {
      // Purpose: Verify evaluation system integration
      mockEngine.setShouldFail(false);
      
      const evaluation = await scenarioEngine.getEvaluation();
      
      expect(evaluation).toBeDefined();
      expect(typeof evaluation.score).toBe('number');
      expect(mockEngine.calls.evaluatePosition.length).toBe(1);
    });

    test('should_handle_evaluation_failure_with_fallback', async () => {
      // Purpose: Verify evaluation error handling provides safe defaults
      mockEngine.setShouldFail(true);
      
      const evaluation = await scenarioEngine.getEvaluation();
      
      expect(evaluation).toEqual({ score: 0, mate: null });
    });

    test('should_get_multi_pv_moves_for_analysis', async () => {
      // Purpose: Verify multi-PV analysis for training feedback
      mockEngine.setShouldFail(false);
      const moveCount = 3;
      
      const bestMoves = await scenarioEngine.getBestMoves(TEST_POSITIONS.STARTING_POSITION, moveCount);
      
      expect(bestMoves).toBeDefined();
      expect(bestMoves.engine).toBeDefined();
      expect(Array.isArray(bestMoves.engine)).toBe(true);
      expect(bestMoves.engine.length).toBeLessThanOrEqual(moveCount);
      expect(mockEngine.calls.getMultiPV.length).toBe(1);
    });
  });

  describe('Tablebase Integration', () => {
    beforeEach(() => {
      scenarioEngine = new ScenarioEngine();
    });

    test('should_get_tablebase_info_for_endgame_position', async () => {
      // Purpose: Verify tablebase integration for precise endgame analysis
      scenarioEngine = new ScenarioEngine();
      
      // Mock the tablebaseService.getTablebaseInfo method directly on the instance
      const mockGetTablebaseInfo = jest.fn().mockResolvedValue({
        isTablebasePosition: true,
        result: {
          wdl: 2,
          dtz: 5,
          category: 'win',
          precise: true
        },
        bestMoves: [
          { move: 'Qh8#', evaluation: 'Win' }
        ]
      });
      
      // Access the private tablebaseService and mock its method
      (scenarioEngine as any).tablebaseService.getTablebaseInfo = mockGetTablebaseInfo;
      
      const tablebaseInfo = await scenarioEngine.getTablebaseInfo(TEST_POSITIONS.KQK_TABLEBASE_WIN);
      
      expect(tablebaseInfo.isTablebasePosition).toBe(true);
      expect(tablebaseInfo.result).toBeDefined();
      expect(mockGetTablebaseInfo).toHaveBeenCalledWith(TEST_POSITIONS.KQK_TABLEBASE_WIN);
    });

    test('should_handle_non_tablebase_position_gracefully', async () => {
      // Purpose: Verify handling of positions not in tablebase
      const complexPosition = TEST_POSITIONS.STARTING_POSITION; // Too many pieces
      
      const tablebaseInfo = await scenarioEngine.getTablebaseInfo(complexPosition);
      
      expect(tablebaseInfo.isTablebasePosition).toBe(false);
    });

    test('should_handle_tablebase_service_failure', async () => {
      // Purpose: Verify resilience when tablebase service is unavailable
      mockTablebaseService.setShouldFail(true);
      
      const tablebaseInfo = await scenarioEngine.getTablebaseInfo(TEST_POSITIONS.KQK_TABLEBASE_WIN);
      
      expect(tablebaseInfo.isTablebasePosition).toBe(false);
      expect(tablebaseInfo.error).toBeDefined();
    });

    test('should_include_tablebase_moves_in_best_moves_analysis', async () => {
      // Purpose: Verify integration of tablebase moves in analysis
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      const bestMoves = await scenarioEngine.getBestMoves(tablebaseFen, 3);
      
      expect(bestMoves.tablebase).toBeDefined();
      expect(Array.isArray(bestMoves.tablebase)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should_handle_engine_initialization_failure', () => {
      // Purpose: Verify robust error handling during engine setup
      const { Engine } = require('../../../shared/lib/chess/engine');
      Engine.getInstance = jest.fn().mockReturnValue(null);
      
      expect(() => {
        new ScenarioEngine();
      }).toThrow('Engine failed to initialize');
    });

    test('should_provide_accurate_stats_for_debugging', () => {
      // Purpose: Verify debugging information is accurate and helpful
      // Reset counter to start clean
      (ScenarioEngine as any).instanceCount = 0;
      
      const customFen = TEST_POSITIONS.BRUCKENBAU_POSITION;
      scenarioEngine = new ScenarioEngine(customFen);
      
      const stats = scenarioEngine.getStats();
      
      expect(stats.instanceCount).toBe(1);
      expect(stats.currentFen).toBe(customFen);
      expect(stats.initialFen).toBe(customFen);
      expect(stats.cacheStats).toBeDefined();
      expect(typeof stats.cacheStats.size).toBe('number');
      expect(typeof stats.cacheStats.maxSize).toBe('number');
    });

    test('should_provide_direct_chess_instance_access_for_advanced_operations', () => {
      // Purpose: Verify advanced users can access Chess.js instance when needed
      scenarioEngine = new ScenarioEngine();
      
      const chessInstance = scenarioEngine.getChessInstance();
      
      expect(chessInstance).toBeInstanceOf(Chess);
      expect(chessInstance.fen()).toBe(TEST_POSITIONS.STARTING_POSITION);
    });

    test('should_handle_concurrent_evaluations_correctly', async () => {
      // Purpose: Verify engine handles multiple simultaneous requests
      scenarioEngine = new ScenarioEngine();
      
      const promises = [
        scenarioEngine.getEvaluation(TEST_POSITIONS.STARTING_POSITION),
        scenarioEngine.getEvaluation(TEST_POSITIONS.WHITE_ADVANTAGE),
        scenarioEngine.getEvaluation(TEST_POSITIONS.BLACK_ADVANTAGE)
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.score).toBe('number');
      });
    });
  });

  describe('Mobile Performance Optimization', () => {
    test('should_limit_instance_creation_for_memory_management', () => {
      // Purpose: Verify mobile memory constraints are respected
      // Reset counter to start clean
      (ScenarioEngine as any).instanceCount = 0;
      
      const engines: ScenarioEngine[] = [];
      
      // Create multiple instances
      for (let i = 0; i < 10; i++) {
        engines.push(new ScenarioEngine());
      }
      
      const stats = engines[0].getStats();
      expect(stats.instanceCount).toBe(10);
      
      // Cleanup all engines
      engines.forEach(engine => engine.quit());
    });

    test('should_handle_memory_cleanup_during_quit', () => {
      // Purpose: Verify proper memory management and reference cleanup
      scenarioEngine = new ScenarioEngine();
      const initialStats = scenarioEngine.getStats();
      
      scenarioEngine.quit();
      
      // After quit, references should be cleared
      // Note: In a real test, we might check that references are nullified
      // but this is primarily tested through memory profiling tools
      expect(() => scenarioEngine.getStats()).toThrow();
    });
  });
});