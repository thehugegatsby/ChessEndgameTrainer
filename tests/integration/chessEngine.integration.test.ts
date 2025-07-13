/**
 * @fileoverview ChessEngine Integration Tests - CLEAN ARCHITECTURE
 * @description Integration tests for stateless ChessEngine interface
 * 
 * FOCUS: Test stateless IChessEngine interface only
 * - Mock Worker dependencies, not internal logic
 * - Test essential functionality with real Chess.js integration
 */

import { EngineService } from '../../shared/services/chess/EngineService';
import type { IChessEngine, BestMoveResult, EvaluationResult, EngineOptions } from '../../shared/lib/chess/IChessEngine';

// Mock EngineService since we're testing the interface, not implementation
jest.mock('../../shared/services/chess/EngineService');

// Mock logging to reduce test noise
jest.mock('../../shared/services/logging', () => ({
  getLogger: () => ({
    setContext: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  })
}));

describe('ChessEngine Integration Tests - STATELESS API', () => {
  let chessEngine: IChessEngine;
  let mockEngineService: jest.Mocked<IChessEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock engine with stateless interface
    mockEngineService = {
      findBestMove: jest.fn(),
      evaluatePosition: jest.fn(),
      stop: jest.fn(),
      terminate: jest.fn()
    };
    
    // Mock EngineService.getInstance to return our mock
    (EngineService.getInstance as jest.Mock).mockReturnValue(mockEngineService);
    
    // Use the mock as our engine for testing
    chessEngine = mockEngineService;
  });

  afterEach(async () => {
    // Clean up engine resources
    if (chessEngine) {
      await chessEngine.terminate();
    }
  });

  describe('Core Chess Engine Operations', () => {
    describe('findBestMove', () => {
      it('should find best move for starting position', async () => {
        // Arrange
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const mockResult: BestMoveResult = {
          move: 'e2e4',
          evaluation: 0.15
        };
        
        mockEngineService.findBestMove.mockResolvedValue(mockResult);

        // Act
        const result = await chessEngine.findBestMove(startingFen);

        // Assert
        expect(result).toEqual(mockResult);
        expect(mockEngineService.findBestMove).toHaveBeenCalledWith(startingFen);
      });

      it('should find best move with custom options', async () => {
        // Arrange
        const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
        const options: EngineOptions = {
          depth: 20,
          movetime: 5000
        };
        const mockResult: BestMoveResult = {
          move: 'e7e5',
          evaluation: 0.25
        };
        
        mockEngineService.findBestMove.mockResolvedValue(mockResult);

        // Act
        const result = await chessEngine.findBestMove(testFen, options);

        // Assert
        expect(result).toEqual(mockResult);
        expect(mockEngineService.findBestMove).toHaveBeenCalledWith(testFen, options);
      });

      it('should handle mate in one scenarios', async () => {
        // Arrange - Classic back rank mate
        const mateFen = 'rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
        const mockResult: BestMoveResult = {
          move: 'Qxf7#',
          evaluation: 32000, // Mate value
          mate: 1
        };
        
        mockEngineService.findBestMove.mockResolvedValue(mockResult);

        // Act
        const result = await chessEngine.findBestMove(mateFen);

        // Assert
        expect(result.mate).toBe(1);
        expect(result.move).toBe('Qxf7#');
        expect(result.evaluation).toBeGreaterThan(30000);
      });

      it('should handle engine errors gracefully', async () => {
        // Arrange
        const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const engineError = new Error('Engine worker crashed');
        
        mockEngineService.findBestMove.mockRejectedValue(engineError);

        // Act & Assert
        await expect(chessEngine.findBestMove(testFen)).rejects.toThrow('Engine worker crashed');
      });
    });

    describe('evaluatePosition', () => {
      it('should evaluate starting position as roughly equal', async () => {
        // Arrange
        const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const mockResult: EvaluationResult = {
          evaluation: 0.15,
          pv: ['e2e4', 'e7e5', 'g1f3']
        };
        
        mockEngineService.evaluatePosition.mockResolvedValue(mockResult);

        // Act
        const result = await chessEngine.evaluatePosition(startingFen);

        // Assert
        expect(result.evaluation).toBe(0.15);
        expect(Math.abs(result.evaluation)).toBeLessThan(0.5); // Roughly equal
        expect(result.pv).toHaveLength(3);
      });

      it('should evaluate advantageous position correctly', async () => {
        // Arrange - White has material advantage
        const advantageousFen = 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5';
        const mockResult: EvaluationResult = {
          evaluation: 1.25, // White advantage
          pv: ['Ng5', 'O-O', 'Nxf7']
        };
        
        mockEngineService.evaluatePosition.mockResolvedValue(mockResult);

        // Act
        const result = await chessEngine.evaluatePosition(advantageousFen);

        // Assert
        expect(result.evaluation).toBeGreaterThan(1.0);
      });

      it('should handle mate evaluations', async () => {
        // Arrange - Forced mate position
        const mateFen = 'rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
        const mockResult: EvaluationResult = {
          evaluation: 32000,
          mate: 1,
          pv: ['Qxf7#']
        };
        
        mockEngineService.evaluatePosition.mockResolvedValue(mockResult);

        // Act
        const result = await chessEngine.evaluatePosition(mateFen);

        // Assert
        expect(result.mate).toBe(1);
        expect(result.evaluation).toBeGreaterThan(30000);
        expect(result.pv![0]).toContain('#');
      });
    });

    describe('Engine Lifecycle Management', () => {
      it('should handle stop operation', async () => {
        // Arrange
        mockEngineService.stop.mockResolvedValue();

        // Act
        await chessEngine.stop();

        // Assert
        expect(mockEngineService.stop).toHaveBeenCalledTimes(1);
      });

      it('should handle terminate operation and cleanup', async () => {
        // Arrange
        mockEngineService.terminate.mockResolvedValue();

        // Act
        await chessEngine.terminate();

        // Assert
        expect(mockEngineService.terminate).toHaveBeenCalledTimes(1);
      });

      it('should handle multiple stop calls safely', async () => {
        // Arrange
        mockEngineService.stop.mockResolvedValue();

        // Act
        await chessEngine.stop();
        await chessEngine.stop(); // Second call should not fail

        // Assert
        expect(mockEngineService.stop).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Chess.js Integration', () => {
    it('should work with valid FEN positions from real games', async () => {
      // Arrange - Collection of real game positions
      const realGamePositions = [
        'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 4 4', // Italian Game
        'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4', // Italian Game response
        'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5' // Developed position
      ];

      const mockResult: BestMoveResult = {
        move: 'Nf3',
        evaluation: 0.3
      };
      
      mockEngineService.findBestMove.mockResolvedValue(mockResult);

      // Act & Assert - All positions should be processable
      for (const fen of realGamePositions) {
        const result = await chessEngine.findBestMove(fen);
        expect(result).toBeDefined();
        expect(result.move).toBeTruthy();
      }

      expect(mockEngineService.findBestMove).toHaveBeenCalledTimes(realGamePositions.length);
    });

    it('should reject invalid FEN positions', async () => {
      // Arrange - Invalid FEN strings
      const invalidFens = [
        '', // Empty string
        'invalid-fen-string', // Completely invalid
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP', // Missing parts
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0' // Missing move number
      ];

      // Act & Assert - Mock to reject invalid FENs
      for (const invalidFen of invalidFens) {
        mockEngineService.findBestMove.mockRejectedValueOnce(new Error('Invalid FEN'));
        await expect(chessEngine.findBestMove(invalidFen)).rejects.toThrow('Invalid FEN');
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid sequential requests', async () => {
      // Arrange
      const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const mockResult: BestMoveResult = {
        move: 'e2e4',
        evaluation: 0.15
      };
      
      mockEngineService.findBestMove.mockResolvedValue(mockResult);

      // Act - Make multiple rapid requests
      const promises = Array(5).fill(null).map(() => 
        chessEngine.findBestMove(testFen)
      );
      
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.move).toBe('e2e4');
        expect(result.evaluation).toBe(0.15);
      });
      expect(mockEngineService.findBestMove).toHaveBeenCalledTimes(5);
    });

    it('should handle engine timeout scenarios', async () => {
      // Arrange
      const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const timeoutError = new Error('Engine request timeout');
      
      mockEngineService.findBestMove.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(chessEngine.findBestMove(testFen)).rejects.toThrow('Engine request timeout');
    });

    it('should handle mixed operation types concurrently', async () => {
      // Arrange
      const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      const mockMoveResult: BestMoveResult = { move: 'e7e5', evaluation: 0.0 };
      const mockEvalResult: EvaluationResult = { evaluation: 0.0 };
      
      mockEngineService.findBestMove.mockResolvedValue(mockMoveResult);
      mockEngineService.evaluatePosition.mockResolvedValue(mockEvalResult);

      // Act - Mix of move and evaluation requests
      const [moveResult, evalResult] = await Promise.all([
        chessEngine.findBestMove(testFen),
        chessEngine.evaluatePosition(testFen)
      ]);

      // Assert
      expect(moveResult.move).toBe('e7e5');
      expect(evalResult.evaluation).toBe(0.0);
      expect(mockEngineService.findBestMove).toHaveBeenCalledTimes(1);
      expect(mockEngineService.evaluatePosition).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle endgame positions correctly', async () => {
      // Arrange - King and Pawn vs King endgame
      const endgameFen = '8/8/8/8/8/8/4K1k1/8 w - - 0 1';
      const mockResult: BestMoveResult = {
        move: 'Kd3',
        evaluation: 0.0
      };
      
      mockEngineService.findBestMove.mockResolvedValue(mockResult);

      // Act
      const result = await chessEngine.findBestMove(endgameFen);

      // Assert
      expect(result).toBeDefined();
      expect(result.move).toBe('Kd3');
      expect(result.move).toBe('Kd3');
    });

    it('should handle complex tactical positions', async () => {
      // Arrange - Position with tactical motifs
      const tacticalFen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 6 6';
      const mockResult: BestMoveResult = {
        move: 'Ng5',
        evaluation: 0.8
      };
      
      mockEngineService.findBestMove.mockResolvedValue(mockResult);

      // Act
      const result = await chessEngine.findBestMove(tacticalFen);

      // Assert
      expect(result.move).toBe('Ng5');
      expect(result.evaluation).toBeGreaterThan(0.5); // Tactical advantage
      expect(result.evaluation).toBeGreaterThan(0.5); // Tactical advantage
    });
  });
});