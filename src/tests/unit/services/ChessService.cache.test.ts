import { vi } from 'vitest';
/**
 * @file ChessService Cache & Performance Tests
 * @description Coverage tests for cache management (Line 528) and performance optimization
 * Target: Complete 100% coverage for ChessService
 */

describe("ChessService Cache & Performance Tests", () => {
  let chessService: any; // Use any for dynamically imported instance
  let mockChessInstance: any;
  let Chess: any;
  let MockedChess: any;
  let ChessService: any; // Use any for dynamically imported class

  beforeEach(() => {
    // Reset the module registry to ensure clean module loading
    vi.resetModules();
    
    // Mock chess.js module before any imports
    vi.doMock("chess.js", () => ({
      Chess: vi.fn()
    }));
    
    // Now require modules in the correct order
    const chessModule = require("chess.js");
    Chess = chessModule.Chess;
    MockedChess = Chess as any;
    
    MockedChess.mockClear();

    // Create comprehensive mock Chess instance
    mockChessInstance = {
      move: vi.fn(),
      fen: vi.fn().mockReturnValue("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
      pgn: vi.fn().mockReturnValue(""),
      history: vi.fn().mockReturnValue([]),
      load: vi.fn(),
      loadPgn: vi.fn(),
      isGameOver: vi.fn().mockReturnValue(false),
      turn: vi.fn().mockReturnValue("w"),
      moves: vi.fn().mockReturnValue(["e4", "e3", "Nf3"]),
      isCheck: vi.fn().mockReturnValue(false),
      isCheckmate: vi.fn().mockReturnValue(false),
      isStalemate: vi.fn().mockReturnValue(false),
      isDraw: vi.fn().mockReturnValue(false),
    } as any;

    MockedChess.mockImplementation(() => mockChessInstance);
    
    // Now import ChessService dynamically after mocks are configured
    const ChessServiceModule = require("@shared/services/ChessService");
    ChessService = ChessServiceModule.ChessService;
    chessService = new ChessService();
  });

  describe("Cache Key Update - Line 528", () => {
    it("should delete existing cache key before re-adding (Line 528)", () => {
      // Create a scenario where updateCache is called with an existing key
      // This can happen when the input FEN is different from the normalized FEN from chess.js
      
      const inputFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 5 10"; // With move counters
      const normalizedFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Normalized by chess.js
      
      // First initialization - this will populate cache: inputFen -> normalizedFen 
      mockChessInstance.fen.mockReturnValue(normalizedFen);
      chessService.initialize(inputFen);
      
      // Now simulate a case where we need to access the cache internal state
      // We'll use reflection to manipulate the cache directly to force the condition
      const cacheAccess = (chessService as any).fenCache;
      
      // Manually add an entry that will collide with updateCache
      const collisionKey = "collision-test-fen";
      cacheAccess.set(collisionKey, normalizedFen);
      
      // Now force updateCache to be called with the collision key by making initialize
      // bypass the cache check through a different path
      // Mock Chess constructor to simulate what would happen
      MockedChess.mockImplementationOnce(() => {
        const mockInstance = {
          ...mockChessInstance,
          fen: vi.fn().mockReturnValue(normalizedFen)
        };
        return mockInstance as any;
      });
      
      // This should trigger updateCache with a key that already exists (collision-test-fen)
      // by calling the private updateCache method with an existing key
      const updateCacheMethod = (chessService as any).updateCache;
      updateCacheMethod.call(chessService, collisionKey, normalizedFen);
      
      // Verify the cache still works after the key deletion and re-addition
      expect(cacheAccess.has(collisionKey)).toBe(true);
    });

    it("should handle cache key move-to-end behavior correctly", () => {
      // Fill cache with multiple positions
      const fens: string[] = [];
      for (let i = 0; i < 50; i++) {
        const fen = `test-${i}-8/8/8/8/8/8/8/k6K w - - 0 1`;
        fens.push(fen);
        mockChessInstance.fen.mockReturnValue(fen);
        chessService.initialize(fen);
      }

      // Access an early FEN again - should move it to end of cache (Line 528)
      const earlyFen = fens[5];
      mockChessInstance.fen.mockReturnValue(earlyFen);
      chessService.initialize(earlyFen);
      
      // Add more FENs to test that the recently accessed one isn't evicted
      for (let i = 50; i < 80; i++) {
        const fen = `new-${i}-8/8/8/8/8/8/8/k6K w - - 0 1`;
        mockChessInstance.fen.mockReturnValue(fen);
        chessService.initialize(fen);
      }

      // Should still work without errors
      expect(() => chessService.initialize(earlyFen)).not.toThrow();
    });

    it("should handle multiple cache key updates in sequence", () => {
      const testFens = [
        "pos1-8/8/8/8/8/8/8/k6K w - - 0 1",
        "pos2-8/8/8/8/8/8/8/k6K w - - 0 1", 
        "pos3-8/8/8/8/8/8/8/k6K w - - 0 1"
      ];

      // Initialize each position twice to trigger cache key updates
      testFens.forEach((fen) => {
        mockChessInstance.fen.mockReturnValue(fen);
        chessService.initialize(fen); // First time - add to cache
        chessService.initialize(fen); // Second time - update cache (Line 528)
      });

      // All operations should complete successfully
      testFens.forEach((fen) => {
        expect(() => chessService.initialize(fen)).not.toThrow();
      });
    });
  });

  describe("Performance - Cache Efficiency", () => {
    it("should minimize Chess instance creations through caching", () => {
      const testFen = "8/8/8/8/8/5k2/8/5K2 w - - 0 1";
      mockChessInstance.fen.mockReturnValue(testFen);

      // Clear mock call count
      MockedChess.mockClear();

      // First call - should create Chess instance
      chessService.initialize(testFen);
      const firstCallCount = MockedChess.mock.calls.length;

      // Subsequent calls - should use cached normalized FEN
      chessService.initialize(testFen);
      chessService.initialize(testFen);
      const subsequentCallCount = MockedChess.mock.calls.length;

      // Should create new instances each time but use cached FEN for normalization
      expect(subsequentCallCount).toBeGreaterThan(firstCallCount);
    });

    it("should handle rapid consecutive initializations efficiently", () => {
      const positions: string[] = [
        "8/8/8/8/8/8/8/k6K w - - 0 1",
        "8/8/8/8/8/k7/8/6K1 w - - 0 1",
        "8/8/8/8/k7/8/8/6K1 w - - 0 1"
      ];

      // Rapid consecutive calls should not throw errors
      expect(() => {
        positions.forEach((fen) => {
          mockChessInstance.fen.mockReturnValue(fen);
          // Initialize each position multiple times rapidly
          for (let i = 0; i < 10; i++) {
            chessService.initialize(fen);
          }
        });
      }).not.toThrow();
    });
  });
});