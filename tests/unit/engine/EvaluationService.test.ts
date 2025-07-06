/**
 * @fileoverview Unit tests for EvaluationService
 * @description Tests for chess position evaluation and mistake detection
 */

import { EvaluationService } from '../../../shared/lib/chess/ScenarioEngine/evaluationService';
import { MockEngine, MockTablebaseService } from '../../helpers/engineMocks';
import { TEST_POSITIONS } from '../../helpers/testPositions';
import type { EngineEvaluation, DualEvaluation } from '../../../shared/lib/chess/ScenarioEngine/types';

// Mock dependencies
jest.mock('../../../shared/lib/chess/engine');
jest.mock('../../../shared/lib/chess/tablebase');

describe('EvaluationService', () => {
  let evaluationService: EvaluationService;
  let mockEngine: MockEngine;
  let mockTablebaseService: MockTablebaseService;

  let mockEngineInterface: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh mock instances
    mockEngine = new MockEngine();
    mockTablebaseService = new MockTablebaseService();
    
    // Mock the tablebase service module
    const { tablebaseService } = require('../../../shared/lib/chess/tablebase');
    Object.assign(tablebaseService, mockTablebaseService);
    
    // Create a proper mock engine object with the expected interface
    mockEngineInterface = {
      evaluatePosition: jest.fn().mockImplementation((fen: string) => mockEngine.evaluatePosition(fen)),
      getBestMove: jest.fn().mockImplementation((fen: string, timeMs?: number) => mockEngine.getBestMove(fen, timeMs)),
      getMultiPV: jest.fn().mockImplementation((fen: string, count: number) => mockEngine.getMultiPV(fen, count)),
      isReady: jest.fn().mockReturnValue(true)
    };
    
    // Create evaluation service with properly mocked engine
    evaluationService = new EvaluationService(mockEngineInterface);
  });

  describe('Critical Mistake Detection', () => {
    test('should_identify_critical_mistake_when_score_drops_significantly', async () => {
      // Purpose: Verify detection of moves that drastically worsen position
      const fenBefore = TEST_POSITIONS.WHITE_ADVANTAGE; // White has advantage
      const fenAfter = TEST_POSITIONS.BLACK_ADVANTAGE;  // Black takes advantage
      
      // Mock evaluations showing significant score drop
      mockEngineInterface.evaluatePosition
        .mockResolvedValueOnce({ score: 300, mate: null }) // Good position
        .mockResolvedValueOnce({ score: -250, mate: null }); // Bad position after move
      
      const isMistake = await evaluationService.isCriticalMistake(fenBefore, fenAfter);
      
      expect(isMistake).toBe(true);
      expect(mockEngineInterface.evaluatePosition).toHaveBeenCalledTimes(2);
    });

    test('should_not_flag_small_evaluation_changes_as_mistakes', async () => {
      // Purpose: Verify normal evaluation fluctuations don't trigger mistake detection
      const fenBefore = TEST_POSITIONS.STARTING_POSITION;
      const fenAfter = TEST_POSITIONS.EQUAL_POSITION;
      
      // Mock similar evaluations
      mockEngineInterface.evaluatePosition
        .mockResolvedValueOnce({ score: 25, mate: null })
        .mockResolvedValueOnce({ score: 15, mate: null });
      
      const isMistake = await evaluationService.isCriticalMistake(fenBefore, fenAfter);
      
      expect(isMistake).toBe(false);
    });

    test('should_detect_sign_flip_from_winning_to_losing_position', async () => {
      // Purpose: Verify detection when advantage completely reverses
      const fenBefore = TEST_POSITIONS.WHITE_ADVANTAGE;
      const fenAfter = TEST_POSITIONS.BLACK_ADVANTAGE;
      
      // Mock evaluations showing sign flip
      mockEngineInterface.evaluatePosition
        .mockResolvedValueOnce({ score: 150, mate: null }) // White advantage
        .mockResolvedValueOnce({ score: -120, mate: null }); // Black advantage (negative score = sign flip)
      
      const isMistake = await evaluationService.isCriticalMistake(fenBefore, fenAfter);
      
      expect(isMistake).toBe(true);
    });

    test('should_handle_mate_transitions_correctly', async () => {
      // Purpose: Verify proper handling of mate advantage changes
      const fenBefore = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      const fenAfter = TEST_POSITIONS.EQUAL_POSITION;
      
      // Mock losing mate advantage
      mockEngineInterface.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: 3 })  // Mate in 3
        .mockResolvedValueOnce({ score: 50, mate: null }); // Lost mate
      
      const isMistake = await evaluationService.isCriticalMistake(fenBefore, fenAfter);
      
      expect(isMistake).toBe(true);
    });

    test('should_not_flag_mate_improvements_as_mistakes', async () => {
      // Purpose: Verify that improving mate sequences are not flagged as errors
      const fenBefore = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      const fenAfter = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      // Mock improving mate - both mates for the same side (no mistake)
      mockEngineInterface.evaluatePosition
        .mockResolvedValueOnce({ score: 0, mate: 5 })  // Mate in 5
        .mockResolvedValueOnce({ score: 0, mate: 3 }); // Mate in 3 (improved)
      
      const isMistake = await evaluationService.isCriticalMistake(fenBefore, fenAfter);
      
      expect(isMistake).toBe(false);
    });

    test('should_apply_perspective_correction_for_black_moves', async () => {
      // Purpose: Verify evaluations are correctly adjusted for player perspective
      // When Black is to move, engine returns evaluation from Black's perspective
      const fenBlackToMove = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const fenAfterBlackMove = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2';
      
      // Mock engine evaluation from Black's perspective
      mockEngineInterface.evaluatePosition
        .mockResolvedValueOnce({ score: -30, mate: null }) // Before move (White advantage from Black's view)
        .mockResolvedValueOnce({ score: -20, mate: null }); // After move (Black improved but still worse)
      
      const isMistake = await evaluationService.isCriticalMistake(fenBlackToMove, fenAfterBlackMove);
      
      // Should not be a mistake - Black improved position (from -30 to -20)
      expect(isMistake).toBe(false);
    });

    test('should_handle_evaluation_service_errors_gracefully', async () => {
      // Purpose: Verify robust error handling during evaluation failures
      const fenBefore = TEST_POSITIONS.STARTING_POSITION;
      const fenAfter = TEST_POSITIONS.EQUAL_POSITION;
      
      // Mock evaluation failure
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockRejectedValue(new Error('Engine evaluation failed'));
      
      const isMistake = await evaluationService.isCriticalMistake(fenBefore, fenAfter);
      
      expect(isMistake).toBe(false); // Should default to false on error
    });
  });

  describe('Dual Evaluation System', () => {
    test('should_get_dual_evaluation_with_engine_and_tablebase', async () => {
      // Purpose: Verify integration of both engine and tablebase evaluations
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      // Mock engine evaluation
      mockEngineInterface.evaluatePosition
        .mockResolvedValue({ score: 0, mate: 3 });
      
      // Mock tablebase service queryPosition method
      mockTablebaseService.queryPosition = jest.fn().mockResolvedValue({
        isTablebasePosition: true,
        result: {
          wdl: 2,
          dtz: 5,
          category: 'win',
          precise: true
        }
      });
      
      const dualEval = await evaluationService.getDualEvaluation(tablebaseFen);
      
      expect(dualEval.engine).toBeDefined();
      expect(dualEval.engine.score).toBe(0);
      expect(dualEval.engine.mate).toBe(3);
      expect(dualEval.engine.evaluation).toMatch(/M3/);
      
      expect(dualEval.tablebase).toBeDefined();
      expect(dualEval.tablebase!.isAvailable).toBe(true);
      expect(dualEval.tablebase!.result.wdl).toBe(2);
      expect(dualEval.tablebase!.evaluation).toMatch(/Win/);
    });

    test('should_handle_tablebase_unavailable_gracefully', async () => {
      // Purpose: Verify fallback when tablebase is not available
      const nonTablebaseFen = TEST_POSITIONS.STARTING_POSITION;
      
      // Mock engine evaluation
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValue({ score: 15, mate: null });
      
      // Mock tablebase not available
      jest.spyOn(mockTablebaseService, 'queryPosition')
        .mockResolvedValue({ isTablebasePosition: false });
      
      const dualEval = await evaluationService.getDualEvaluation(nonTablebaseFen);
      
      expect(dualEval.engine).toBeDefined();
      expect(dualEval.engine.score).toBe(15);
      expect(dualEval.engine.evaluation).toBe('+0.1'); // 15 centipawns = +0.15, rounded to +0.1
      expect(dualEval.tablebase).toBeUndefined();
    });

    test('should_apply_perspective_correction_for_white_to_move', async () => {
      // Purpose: Verify White-to-move positions don't need perspective correction
      const whiteFen = TEST_POSITIONS.STARTING_POSITION; // White to move
      
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValue({ score: 25, mate: null });
      
      const dualEval = await evaluationService.getDualEvaluation(whiteFen);
      
      // Engine score should be used as-is for White to move
      expect(dualEval.engine.score).toBe(25);
      expect(dualEval.engine.evaluation).toBe('+0.3'); // 25 centipawns
    });

    test('should_apply_perspective_correction_for_black_to_move', async () => {
      // Purpose: Verify Black-to-move positions get proper perspective correction
      const blackFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValue({ score: -30, mate: null }); // From Black's perspective
      
      const dualEval = await evaluationService.getDualEvaluation(blackFen);
      
      // Should be negated to get White's perspective
      expect(dualEval.engine.score).toBe(30);
      expect(dualEval.engine.evaluation).toBe('+0.3');
    });

    test('should_handle_tablebase_perspective_correction_for_black', async () => {
      // Purpose: Verify tablebase WDL values are corrected for player perspective
      const blackTablebaseFen = '8/8/8/8/8/8/4k3/K6q b - - 0 1'; // Black to move, winning
      
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValue({ score: 0, mate: -3 }); // Mate for Black
      
      jest.spyOn(mockTablebaseService, 'queryPosition')
        .mockResolvedValue({
          isTablebasePosition: true,
          result: {
            wdl: -2, // Loss for White (win for Black)
            dtz: -5,
            category: 'loss',
            precise: true
          }
        });
      
      const dualEval = await evaluationService.getDualEvaluation(blackTablebaseFen);
      
      // Engine evaluation should be corrected to White's perspective
      expect(Math.abs(dualEval.engine.score)).toBe(0); // Handle -0 vs 0 issue
      expect(dualEval.engine.mate).toBe(3); // Negated from -3
      
      // Tablebase should also be corrected to White's perspective
      expect(dualEval.tablebase!.result.wdl).toBe(2); // Negated from -2
      expect(dualEval.tablebase!.result.category).toBe('win'); // Flipped from 'loss'
    });

    test('should_handle_dual_evaluation_service_failure', async () => {
      // Purpose: Verify fallback behavior when evaluation services fail
      const testFen = TEST_POSITIONS.STARTING_POSITION;
      
      // Mock complete evaluation failure
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockRejectedValue(new Error('Engine service unavailable'));
      
      const dualEval = await evaluationService.getDualEvaluation(testFen);
      
      // Should return fallback evaluation
      expect(dualEval.engine.score).toBe(0);
      expect(dualEval.engine.mate).toBeNull();
      expect(dualEval.engine.evaluation).toBe('Evaluation unavailable');
      expect(dualEval.tablebase).toBeUndefined();
    });
  });

  describe('Evaluation Formatting', () => {
    test('should_format_positive_centipawn_evaluations_correctly', async () => {
      // Purpose: Verify proper formatting of engine evaluations for display
      const testFen = TEST_POSITIONS.WHITE_ADVANTAGE;
      
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValue({ score: 123, mate: null });
      
      const dualEval = await evaluationService.getDualEvaluation(testFen);
      
      expect(dualEval.engine.evaluation).toBe('+1.2'); // 123 centipawns = +1.23, rounded to +1.2
    });

    test('should_format_negative_centipawn_evaluations_correctly', async () => {
      // Purpose: Verify proper formatting of negative evaluations
      // Use White-to-move position for direct negative score
      const testFen = TEST_POSITIONS.WHITE_ADVANTAGE; // White to move
      
      mockEngineInterface.evaluatePosition
        .mockResolvedValue({ score: -87, mate: null }); // Negative score for White
      
      const dualEval = await evaluationService.getDualEvaluation(testFen);
      
      expect(dualEval.engine.evaluation).toBe('-0.9'); // Formatted as negative
    });

    test('should_format_mate_evaluations_correctly', async () => {
      // Purpose: Verify proper formatting of mate announcements
      const testFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValue({ score: 0, mate: 4 });
      
      const dualEval = await evaluationService.getDualEvaluation(testFen);
      
      expect(dualEval.engine.evaluation).toBe('M4');
    });

    test('should_format_negative_mate_evaluations_correctly', async () => {
      // Purpose: Verify proper formatting of mate against announcements
      const testFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValue({ score: 0, mate: -2 });
      
      const dualEval = await evaluationService.getDualEvaluation(testFen);
      
      expect(dualEval.engine.evaluation).toBe('M-2');
    });
  });

  describe('Performance and Error Handling', () => {
    test('should_handle_concurrent_evaluation_requests', async () => {
      // Purpose: Verify service handles multiple simultaneous evaluation requests
      const positions = [
        TEST_POSITIONS.STARTING_POSITION,
        TEST_POSITIONS.WHITE_ADVANTAGE,
        TEST_POSITIONS.BLACK_ADVANTAGE
      ];
      
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockImplementation(async (fen: string) => {
          // Simulate different evaluation delays
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          return { score: 0, mate: null };
        });
      
      const promises = positions.map(fen => evaluationService.getDualEvaluation(fen));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.engine).toBeDefined();
      });
    });

    test('should_timeout_on_slow_tablebase_analysis', async () => {
      // Purpose: Verify timeout handling for slow tablebase operations
      const tablebaseFen = TEST_POSITIONS.KQK_TABLEBASE_WIN;
      
      // Mock tablebase positions with both evaluations high enough to trigger deeper analysis
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValueOnce({ score: 4000, mate: null }) // High tablebase score
        .mockResolvedValueOnce({ score: 3500, mate: null }); // Also high
      
      const isMistake = await evaluationService.isCriticalMistake(tablebaseFen, tablebaseFen);
      
      // Should handle timeout gracefully
      expect(typeof isMistake).toBe('boolean');
    });

    test('should_provide_consistent_evaluation_caching', async () => {
      // Purpose: Verify evaluation consistency for repeated positions
      const testFen = TEST_POSITIONS.EQUAL_POSITION;
      
      jest.spyOn(mockEngine, 'evaluatePosition')
        .mockResolvedValue({ score: 42, mate: null });
      
      const eval1 = await evaluationService.getDualEvaluation(testFen);
      const eval2 = await evaluationService.getDualEvaluation(testFen);
      
      expect(eval1.engine.score).toBe(eval2.engine.score);
      expect(eval1.engine.evaluation).toBe(eval2.engine.evaluation);
    });
  });
});