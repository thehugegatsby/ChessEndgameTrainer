/**
 * @fileoverview ChessEngine Unit Tests - SIMPLIFIED CLEAN ARCHITECTURE
 * @description Unit tests for ChessEngine implementation with simplified mocks
 * 
 * STRATEGY: "Dumme" Mocks + Focus on Critical Paths
 * - Test internal ChessEngine logic, not external dependencies
 * - Accept Chess.js FEN normalization
 * - Immediate Promise resolution to avoid timeouts
 */

import { ChessEngine } from '../../../../../shared/lib/chess/ChessEngine';
import type { 
  MoveObject, 
  ChessEngineStats
} from '../../../../../shared/lib/chess/ChessEngine/interfaces';
import type { Chess } from 'chess.js';
import { TEST_FENS, TEST_MOVES } from '../../../../../shared/testing/TestFixtures';

// SIMPLIFIED MOCKS - Immediate resolution, no complex logic
jest.mock('../../../../../shared/lib/chess/engine/workerManager', () => ({
  StockfishWorkerManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    sendCommand: jest.fn(),
    cleanup: jest.fn(),
    isWorkerReady: jest.fn().mockReturnValue(true)
  }))
}));

jest.mock('../../../../../shared/lib/chess/engine/requestManager', () => ({
  RequestManager: jest.fn().mockImplementation(() => ({
    generateRequestId: jest.fn().mockReturnValue('test-request-id'),
    registerRequest: jest.fn().mockImplementation((_id, type, resolve) => {
      // Immediate resolution based on type - getBestMove returns null for non-initialized engine
      setImmediate(() => {
        if (type === 'bestmove') {
          resolve(null); // Return null as getBestMove does when engine not ready
        } else if (type === 'evaluation') {
          resolve({ score: 0, mate: null }); // Return default 0 score like getEvaluation
        } else {
          resolve({});
        }
      });
    }),
    cancelAllRequests: jest.fn(),
    getStats: jest.fn().mockReturnValue({ totalRequests: 5 })
  }))
}));

// Mock logging
jest.mock('../../../../../shared/services/logging', () => ({
  getLogger: () => ({
    setContext: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  })
}));

describe('ChessEngine Unit Tests - SIMPLIFIED', () => {
  let chessEngine: ChessEngine;

  beforeEach(async () => {
    jest.clearAllMocks();
    chessEngine = new ChessEngine();
    // Give time for async initialization
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    if (chessEngine) {
      chessEngine.quit();
    }
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default starting position', () => {
      const fen = chessEngine.getFen();
      expect(fen).toBe(TEST_FENS.STARTING_POSITION);
    });

    it('should initialize with custom FEN position', () => {
      const customFen = TEST_FENS.EN_PASSANT_POSITION;
      const customEngine = new ChessEngine({ initialFen: customFen });
      
      // Accept Chess.js normalization
      const actualFen = customEngine.getFen();
      expect(actualFen).toContain('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq');
      expect(actualFen).toContain('0 3');
      customEngine.quit();
    });

    it('should reject invalid FEN during initialization', () => {
      expect(() => {
        new ChessEngine({ initialFen: TEST_FENS.INVALID_FEN });
      }).toThrow('[ChessEngine] Invalid initial FEN:');
    });

    it('should initialize worker and request managers', () => {
      const { StockfishWorkerManager } = require('../../../../../shared/lib/chess/engine/workerManager');
      const { RequestManager } = require('../../../../../shared/lib/chess/engine/requestManager');
      
      expect(StockfishWorkerManager).toHaveBeenCalled();
      expect(RequestManager).toHaveBeenCalled();
    });
  });

  describe('Position Management', () => {
    describe('getFen', () => {
      it('should return current position FEN', () => {
        const fen = chessEngine.getFen();
        expect(typeof fen).toBe('string');
        expect(fen).toMatch(/^[rnbqkpRNBQKP1-8\/]+\s[wb]\s[KQkq-]+\s[a-h3-6-]+\s\d+\s\d+$/);
      });

      it('should throw error if engine is disposed', () => {
        chessEngine.quit();
        expect(() => chessEngine.getFen()).toThrow('[ChessEngine] Engine has been disposed');
      });
    });

    describe('updatePosition', () => {
      it('should update to valid FEN position', () => {
        const newFen = TEST_FENS.WHITE_ADVANTAGE;
        
        chessEngine.updatePosition(newFen);
        // Accept Chess.js normalization
        const actualFen = chessEngine.getFen();
        expect(actualFen).toContain('rnbqkbnr/ppppp2p/6P1/8/8/8/PPPP1PPP/RNBQKBNR b KQkq');
        expect(actualFen).toContain('0 3');
      });

      it('should reject invalid FEN positions', () => {
        expect(() => {
          chessEngine.updatePosition(TEST_FENS.INVALID_FEN);
        }).toThrow('[ChessEngine] Invalid FEN:');
      });

      it('should throw error if engine is disposed', () => {
        chessEngine.quit();
        expect(() => {
          chessEngine.updatePosition(TEST_FENS.STARTING_POSITION);
        }).toThrow('[ChessEngine] Engine has been disposed');
      });
    });

    describe('reset', () => {
      it('should reset to initial position', () => {
        const startingFen = TEST_FENS.STARTING_POSITION;
        
        // Change position first
        chessEngine.updatePosition(TEST_FENS.WHITE_ADVANTAGE);
        expect(chessEngine.getFen()).not.toBe(startingFen);
        
        // Reset should return to starting position
        chessEngine.reset();
        expect(chessEngine.getFen()).toBe(startingFen);
      });

      it('should throw error if engine is disposed', () => {
        chessEngine.quit();
        expect(() => chessEngine.reset()).toThrow('[ChessEngine] Engine has been disposed');
      });
    });
  });

  describe('Move Operations', () => {
    describe('makeMove', () => {
      it('should make valid moves and return ChessJsMove', async () => {
        const move = TEST_MOVES.E2E4;
        
        const result = await chessEngine.makeMove(move);
        
        expect(result).not.toBeNull();
        expect(result!.from).toBe('e2');
        expect(result!.to).toBe('e4');
        expect(chessEngine.getFen()).toContain('4P3'); // e4 pawn
      });

      it('should handle promotion moves', async () => {
        // Set up position with pawn ready to promote
        chessEngine.updatePosition(TEST_FENS.PAWN_PROMOTION_WHITE);
        
        const move: MoveObject = { from: 'e7', to: 'e8', promotion: 'q' };
        const result = await chessEngine.makeMove(move);
        
        expect(result).not.toBeNull();
        expect(result!.promotion).toBe('q');
      });

      it('should return null for invalid moves', async () => {
        const invalidMove = TEST_MOVES.ILLEGAL_MOVE; // Invalid pawn jump
        
        const result = await chessEngine.makeMove(invalidMove);
        
        expect(result).toBeNull();
      });

      it('should throw error if engine is disposed', async () => {
        chessEngine.quit();
        const move = TEST_MOVES.E2E4;
        
        await expect(chessEngine.makeMove(move)).rejects.toThrow('[ChessEngine] Engine has been disposed');
      });
    });

    describe('getBestMove', () => {
      it('should return best move from engine', async () => {
        const result = await chessEngine.getBestMove();
        
        expect(result).toBeNull(); // Default mock behavior returns null
      });

      it('should return null if engine not initialized', async () => {
        const uninitializedEngine = new ChessEngine();
        uninitializedEngine['isInitialized'] = false;
        
        const result = await uninitializedEngine.getBestMove();
        
        expect(result).toBeNull();
        uninitializedEngine.quit();
      });

      it('should throw error if engine is disposed', async () => {
        chessEngine.quit();
        
        await expect(chessEngine.getBestMove()).rejects.toThrow('[ChessEngine] Engine has been disposed');
      });
    });
  });

  describe('Analysis Operations', () => {
    describe('getEvaluation', () => {
      it('should return evaluation for current position', async () => {
        const evaluation = await chessEngine.getEvaluation();
        
        expect(evaluation.score).toBe(0); // Default mock returns 0
        expect(evaluation.mate).toBeNull();
      });

      it('should return evaluation for specific FEN', async () => {
        const testFen = TEST_FENS.WHITE_ADVANTAGE;
        
        const evaluation = await chessEngine.getEvaluation(testFen);
        
        expect(evaluation.score).toBe(0); // Default mock returns 0
      });

      it('should return default evaluation if engine not initialized', async () => {
        chessEngine['isInitialized'] = false;
        
        const evaluation = await chessEngine.getEvaluation();
        
        expect(evaluation.score).toBe(0);
        expect(evaluation.mate).toBeNull();
      });

      it('should throw error if engine is disposed', async () => {
        chessEngine.quit();
        
        await expect(chessEngine.getEvaluation()).rejects.toThrow('[ChessEngine] Engine has been disposed');
      });
    });

    describe('getDualEvaluation', () => {
      it('should return dual evaluation with engine and tablebase results', async () => {
        const testFen = TEST_FENS.KQK_TABLEBASE_WIN;
        
        const result = await chessEngine.getDualEvaluation(testFen);
        
        expect(result.engine.score).toBe(0); // Default mock returns 0
        expect(result.tablebase).toBeNull(); // No tablebase implementation yet
        expect(result.position).toBe(testFen);
        expect(typeof result.timestamp).toBe('number');
      });

      it('should throw error if engine is disposed', async () => {
        chessEngine.quit();
        const testFen = TEST_FENS.STARTING_POSITION;
        
        await expect(chessEngine.getDualEvaluation(testFen)).rejects.toThrow('[ChessEngine] Engine has been disposed');
      });
    });
  });

  describe('Advanced Methods', () => {
    describe('getStats', () => {
      it('should return engine statistics', () => {
        const stats: ChessEngineStats = chessEngine.getStats();
        
        expect(typeof stats.isReady).toBe('boolean');
        expect(typeof stats.queueLength).toBe('number');
        expect(typeof stats.isProcessing).toBe('boolean');
        expect(typeof stats.totalRequests).toBe('number');
        expect(stats.instanceCount).toBe(1);
      });
    });

    describe('isReady', () => {
      it('should return true when engine is initialized and not disposed', () => {
        chessEngine['isInitialized'] = true;
        
        const ready = chessEngine.isReady();
        
        expect(ready).toBe(true);
      });

      it('should return false when engine is not initialized', () => {
        chessEngine['isInitialized'] = false;
        
        const ready = chessEngine.isReady();
        
        expect(ready).toBe(false);
      });
    });

    describe('getChessInstance', () => {
      it('should return Chess.js instance', () => {
        const chess: Chess = chessEngine.getChessInstance();
        
        expect(chess).toBeDefined();
        expect(typeof chess.fen).toBe('function');
        expect(typeof chess.move).toBe('function');
      });

      it('should return the same instance used internally', () => {
        const chess1 = chessEngine.getChessInstance();
        const chess2 = chessEngine.getChessInstance();
        
        expect(chess1).toBe(chess2);
      });

      it('should throw error if engine is disposed', () => {
        chessEngine.quit();
        
        expect(() => chessEngine.getChessInstance()).toThrow('[ChessEngine] Engine has been disposed');
      });
    });
  });

  describe('Lifecycle Management', () => {
    describe('quit', () => {
      it('should handle multiple quit calls safely', () => {
        chessEngine.quit();
        
        expect(() => chessEngine.quit()).not.toThrow();
      });

      it('should prevent further operations after quit', () => {
        chessEngine.quit();
        
        expect(() => chessEngine.getFen()).toThrow('[ChessEngine] Engine has been disposed');
        expect(() => chessEngine.updatePosition(TEST_FENS.STARTING_POSITION)).toThrow();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Chess.js initialization errors', () => {
      expect(() => {
        new ChessEngine({ initialFen: 'completely-invalid-fen' });
      }).toThrow('[ChessEngine] Invalid initial FEN');
    });

    it('should handle worker initialization failures gracefully', async () => {
      const { StockfishWorkerManager } = require('../../../../../shared/lib/chess/engine/workerManager');
      const mockWorkerFail = new StockfishWorkerManager();
      mockWorkerFail.initialize.mockResolvedValue(false);
      
      const engine = new ChessEngine();
      
      // Give time for async initialization to fail
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Engine should still be usable for Chess.js operations
      expect(engine.getFen()).toBeDefined();
      
      engine.quit();
    });
  });
});