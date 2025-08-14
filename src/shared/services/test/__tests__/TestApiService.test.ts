import { describe, it, expect, beforeEach, vi } from 'vitest';
/**
 * @file Tests for TestApiService - Clean Store-Based Architecture
 * @description Test coverage for E2E test API service with store interactions only
 */

// Mock the logging module BEFORE imports
vi.mock("../../../../shared/services/logging", () => ({
  getLogger: vi.fn().mockReturnValue({
    setContext: vi.fn().mockReturnThis(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock chess.js
vi.mock("chess.js", () => {
  return {
    Chess: vi.fn().mockImplementation((fen?: string) => {
      return {
        fen: vi.fn(
          () =>
            fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        ),
        turn: vi.fn(() => "w"),
        pgn: vi.fn(() => "1. e4 e5"),
        isGameOver: vi.fn(() => false),
        isCheck: vi.fn(() => false),
        isCheckmate: vi.fn(() => false),
        isDraw: vi.fn(() => false),
        isStalemate: vi.fn(() => false),
        isThreefoldRepetition: vi.fn(() => false),
        isInsufficientMaterial: vi.fn(() => false),
        move: vi.fn((_move) => ({ from: "e2", to: "e4", san: "e4" })),
      };
    }),
  };
});

import {
  TestApiService,
  type TestTablebaseConfig,
  getTestApi,
} from "../../../../shared/services/test/TestApiService";
import { getLogger } from "../../../../shared/services/logging";

describe.skip("TestApiService - Store-Based Architecture", () => {
  let service: TestApiService;
  let mockStoreAccess: any;
  let consoleLogSpy: vi.SpyInstance;
  let consoleErrorSpy: vi.SpyInstance;
  let consoleWarnSpy: vi.SpyInstance;
  let mockLogger: any;

  beforeEach(() => {
    // Get the mocked logger instance and clear all mocks
    mockLogger = getLogger();
    vi.clearAllMocks();

    // Reset singleton
    TestApiService["instance"] = null;
    service = TestApiService.getInstance();

    // Mock store access - the ONLY dependency
    mockStoreAccess = {
      getState: vi.fn(() => ({
        game: {
          currentFen:
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        },
        tablebase: {
          analysisStatus: "idle",
        },
        training: {
          currentFen:
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          moveHistory: [],
          currentEvaluation: { evaluation: 0.2 },
          analysisStatus: "idle",
        },
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        history: [],
        evaluation: { tablebaseEvaluation: { value: 0.1 } },
        analysisStatus: "idle",
      })),
      subscribe: vi.fn(() => vi.fn()),
      makeMove: vi.fn(),
      applyMove: vi.fn(),
      resetPosition: vi.fn(),
      setPosition: vi.fn(),
      goToMove: vi.fn(),
      setAnalysisStatus: vi.fn(),
    };

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    service.cleanup();
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = TestApiService.getInstance();
      const instance2 = TestApiService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should provide convenience getter", () => {
      const instance = getTestApi();
      expect(instance).toBe(TestApiService.getInstance());
    });
  });

  describe("Initialization", () => {
    it("should initialize with store access", () => {
      const eventHandler = vi.fn();
      service.on("test:initialized", eventHandler);

      service.initialize(mockStoreAccess);

      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        "✅ TestApiService: Successfully initialized with store actions",
      );
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          config: { deterministic: false },
        }),
      );
      expect(service.isInitialized).toBe(true);
    });

    it("should initialize with custom config", () => {
      const customConfig: TestTablebaseConfig = {
        deterministic: true,
      };

      service.initialize(mockStoreAccess, customConfig);

      // Can't access private property directly, but we can verify it was set
      expect(service.isInitialized).toBe(true);
    });

    it("should fail initialization if required actions are missing", () => {
      const invalidStoreAccess = {
        getState: vi.fn(),
        subscribe: vi.fn(),
        // Missing required actions: makeMove, resetPosition
      };

      service.initialize(invalidStoreAccess as any);

      // Verify logger error was called
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Required store actions not available",
      );
      expect(service.isInitialized).toBe(false);
    });
  });

  describe("makeMove", () => {
    beforeEach(() => {
      service.initialize(mockStoreAccess);
    });

    it("should make move with dash notation", async () => {
      const eventHandler = vi.fn();
      service.on("test:move", eventHandler);

      const result = await service.makeMove("e2-e4");

      // Debug output
      if (!result.success) {
        console.log("Move failed with error:", result.error);
      }

      expect(mockStoreAccess.makeMove).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "e2",
          to: "e4",
        }),
      );
      expect(result.success).toBe(true);
      expect(result.resultingFen).toBeDefined();
      expect(eventHandler).toHaveBeenCalled();
    });

    it("should make move with SAN notation", async () => {
      const result = await service.makeMove("e4");

      expect(mockStoreAccess.makeMove).toHaveBeenCalledWith("e4");
      expect(result.success).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      mockStoreAccess.makeMove.mockImplementation(() => {
        throw new Error("Invalid move");
      });

      const result = await service.makeMove("invalid");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid move");
    });
  });

  describe("getGameState", () => {
    beforeEach(() => {
      service.initialize(mockStoreAccess);
    });

    it("should return current game state", () => {
      const state = service.getGameState();

      expect(state).toEqual(
        expect.objectContaining({
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          pgn: "1. e4 e5",
          turn: "w",
          moveCount: 0,
          isGameOver: false,
          isCheck: false,
          isCheckmate: false,
          isDraw: false,
        }),
      );
    });
  });

  describe("resetGame", () => {
    beforeEach(() => {
      service.initialize(mockStoreAccess);
    });

    it("should reset game position", async () => {
      const eventHandler = vi.fn();
      service.on("test:reset", eventHandler);

      await service.resetGame();

      expect(mockStoreAccess.resetPosition).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith({});
    });
  });

  describe("triggerTablebaseAnalysis", () => {
    beforeEach(() => {
      service.initialize(mockStoreAccess);
    });

    it("should trigger tablebase analysis", async () => {
      const eventHandler = vi.fn();
      service.on("test:tablebaseAnalysisComplete", eventHandler);

      const result = await service.triggerTablebaseAnalysis(2000);

      expect(mockStoreAccess.getState).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(eventHandler).toHaveBeenCalledWith({
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      });
    });

    it("should handle timeout", async () => {
      // Mock tablebase status as always loading
      mockStoreAccess.getState.mockReturnValue({
        tablebase: { analysisStatus: "loading" },
        game: {
          currentFen:
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        },
      });

      const result = await service.triggerTablebaseAnalysis(100);

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Tablebase analysis timeout after",
        { timeoutMs: 100 },
      );
    });

    it("should handle errors", async () => {
      mockStoreAccess.getState.mockImplementation(() => {
        throw new Error("Store error");
      });

      const result = await service.triggerTablebaseAnalysis(1000);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should clean up all state", () => {
      service.initialize(mockStoreAccess);
      const unsubscribe = vi.fn();
      mockStoreAccess.subscribe.mockReturnValue(unsubscribe);

      service.cleanup();

      expect(service.isInitialized).toBe(false);
    });
  });
});
