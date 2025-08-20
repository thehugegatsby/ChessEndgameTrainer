/**
 * @file TestApiService Integration Tests - Move Validation Pipeline
 * @description Tests the complete move validation pipeline from API to MoveValidator
 */

import { TestApiService } from '@shared/services/test/TestApiService';
import { TEST_POSITIONS } from '@shared/testing/ChessTestData';
import { vi } from 'vitest';

describe('TestApiService - Move Validation Pipeline Integration', () => {
  let testApi: TestApiService;
  let mockStoreAccess: any;

  beforeEach(() => {
    testApi = TestApiService.getInstance();
    
    // Mock store access with minimal required structure
    mockStoreAccess = {
      getState: vi.fn(() => ({
        training: {
          isPlayerTurn: true,
          isOpponentThinking: false,
          moveInFlight: false,
        },
        game: {
          currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moveHistory: [], // FIX: This was missing - line 328 needs this as iterable
          currentMoveIndex: -1,
        },
      })),
      setState: vi.fn(),
      makeMove: vi.fn(),
      _internalApplyMove: vi.fn(),
      resetPosition: vi.fn(),
      setPosition: vi.fn(),
      goToMove: vi.fn(),
      setAnalysisStatus: vi.fn(),
    };

    testApi.initialize(mockStoreAccess);
  });

  afterEach(() => {
    testApi.cleanup();
  });

  describe('Move Format Consistency', () => {
    it('should handle all supported move formats without crashing', async () => {
      const moveFormats = [
        'e4',                           // SAN notation
        'Nf3',                         // SAN piece move
        'e2-e4',                       // Dash notation
        'e2e4',                        // Coordinate string
        { from: 'e2', to: 'e4' },      // Object notation
        { from: 'g1', to: 'f3' },      // Object for knight
      ];

      for (const moveFormat of moveFormats) {
        try {
          const result = await testApi.makeValidatedMove(moveFormat);
          
          // Should always return a result object, never crash
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('resultingFen');
          expect(result).toHaveProperty('moveCount');
          
          // Error should be string if present
          if ('error' in result) {
            expect(typeof result.error).toBe('string');
          }
        } catch (error) {
          // Should NEVER throw unhandled exceptions
          expect.fail(`Move format ${JSON.stringify(moveFormat)} caused unhandled exception: ${error}`);
        }
      }
    });
  });

  describe('Bug Reproduction - SAN Moves That Failed in E2E', () => {
    beforeEach(() => {
      // Setup promotion position wie in den E2E Tests
      mockStoreAccess.getState.mockReturnValue({
        training: {
          isPlayerTurn: true,
          isOpponentThinking: false,
          moveInFlight: false,
        },
        game: {
          currentFen: TEST_POSITIONS.PAWN_PROMOTION_TO_WIN_SEQUENCE.fen,
          moveHistory: [],
          currentMoveIndex: -1,
        },
      });
    });

    it('should process SAN moves that caused "from is not defined" error', async () => {
      // Diese exakten Moves haben den Bug in E2E Tests ausgelöst
      const problematicMoves = ['e6', 'e7', 'e8=Q+'];
      
      for (const move of problematicMoves) {
        try {
          console.log(`Testing problematic move: ${move}`);
          const result = await testApi.makeValidatedMove(move);
          
          // WICHTIG: Sollte NICHT mit "from is not defined" crashen
          expect(result).toBeDefined();
          expect(result).toHaveProperty('success');
          
          // Kann valid oder invalid sein, aber kein Runtime Error!
          if (!result.success && result.error) {
            expect(typeof result.error).toBe('string');
            expect(result.error).not.toContain('from is not defined');
            expect(result.error).not.toContain('undefined');
          }
        } catch (error) {
          expect.fail(`Move "${move}" should not throw unhandled exception: ${error}`);
        }
      }
    });
  });

  describe('Error Handling Robustness', () => {
    it('should handle edge case objects that triggered the bug', async () => {
      const edgeCases = [
        new String('e4'),              // String object wrapper
        { san: 'e4' },                 // Object without from/to
        { move: 'e4', type: 'pawn' },  // Different object structure
        ['e2', 'e4'],                  // Array (typeof 'object')
        null,                          // Null
        undefined,                     // Undefined
      ];

      for (const edgeCase of edgeCases) {
        try {
          const result = await testApi.makeValidatedMove(edgeCase as any);
          
          // Should gracefully handle all inputs
          expect(result).toBeDefined();
          expect(result.success).toBe(false);
          expect(typeof result.error).toBe('string');
        } catch (error) {
          expect.fail(`Edge case ${JSON.stringify(edgeCase)} should not crash: ${error}`);
        }
      }
    });
  });

  describe('Turn State Management', () => {
    it('should respect turn validation checks', async () => {
      // Test when it's not player turn
      mockStoreAccess.getState.mockReturnValue({
        training: {
          isPlayerTurn: false,  // Not player turn
          isOpponentThinking: false,
          moveInFlight: false,
        },
        game: {
          currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moveHistory: [], // FIX: This was missing - line 328 needs this as iterable
          currentMoveIndex: -1,
        },
      });

      const result = await testApi.makeValidatedMove('e4');
      
      expect(result.success).toBe(false);
      // Should fail gracefully, not crash
    });

    it('should respect move in flight check', async () => {
      mockStoreAccess.getState.mockReturnValue({
        training: {
          isPlayerTurn: true,
          isOpponentThinking: false,
          moveInFlight: true,  // Move already in progress
        },
        game: {
          currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moveHistory: [], // FIX: This was missing - line 328 needs this as iterable
          currentMoveIndex: -1,
        },
      });

      const result = await testApi.makeValidatedMove('e4');
      
      expect(result.success).toBe(false);
      // Should fail gracefully, not crash
    });
  });

  describe('Real Test Position Integration', () => {
    it('should work with all test positions from ChessTestData', async () => {
      const positions = [
        TEST_POSITIONS.STANDARD_OPENING,
        TEST_POSITIONS.PAWN_PROMOTION_TO_WIN_SEQUENCE,
        TEST_POSITIONS.KING_AND_QUEEN_VS_KING,
        TEST_POSITIONS.ROOK_ENDGAME_WIN,
      ];

      for (const position of positions) {
        mockStoreAccess.getState.mockReturnValue({
          training: {
            isPlayerTurn: true,
            isOpponentThinking: false,
            moveInFlight: false,
          },
          game: {
            currentFen: position.fen,
          },
        });

        // Try some common moves
        const commonMoves = ['e4', 'Nf3', 'Kf1'];
        
        for (const move of commonMoves) {
          try {
            const result = await testApi.makeValidatedMove(move);
            expect(result).toBeDefined();
            // Can be valid or invalid, but no crashes
          } catch (error) {
            expect.fail(`Position ${position.name} with move ${move} crashed: ${error}`);
          }
        }
      }
    });
  });
});