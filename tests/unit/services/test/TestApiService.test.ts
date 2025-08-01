/**
 * @file Tests for TestApiService - Clean Store-Based Architecture
 * @description Test coverage for E2E test API service with store interactions only
 */

import {
  TestApiService,
  TestEngineConfig,
  getTestApi,
} from "../../../../shared/services/test/TestApiService";

// Mock chess.js
jest.mock("chess.js", () => {
  return {
    Chess: jest.fn().mockImplementation(function (fen?: string) {
      return {
        fen: jest.fn(
          () =>
            fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        ),
        turn: jest.fn(() => "w"),
        pgn: jest.fn(() => "1. e4 e5"),
        isGameOver: jest.fn(() => false),
        isCheck: jest.fn(() => false),
        isCheckmate: jest.fn(() => false),
        isDraw: jest.fn(() => false),
        isStalemate: jest.fn(() => false),
        isThreefoldRepetition: jest.fn(() => false),
        isInsufficientMaterial: jest.fn(() => false),
        move: jest.fn((_move) => ({ from: "e2", to: "e4", san: "e4" })),
      };
    }),
  };
});

describe("TestApiService - Store-Based Architecture", () => {
  let service: TestApiService;
  let mockStoreAccess: any;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset singleton
    TestApiService["instance"] = null;
    service = TestApiService.getInstance();

    // Mock store access - the ONLY dependency
    mockStoreAccess = {
      getState: jest.fn(() => ({
        training: {
          currentFen:
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          moveHistory: [],
          currentEvaluation: { evaluation: 0.2 },
          analysisStatus: "idle",
        },
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        history: [],
        evaluation: { engineEvaluation: { value: 0.1 } },
        analysisStatus: "idle",
      })),
      subscribe: jest.fn(() => jest.fn()),
      makeMove: jest.fn(),
      _internalApplyMove: jest.fn(),
      resetPosition: jest.fn(),
      setPosition: jest.fn(),
      goToMove: jest.fn(),
      setAnalysisStatus: jest.fn(),
    };

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    service.cleanup();
    jest.clearAllMocks();
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
      const eventHandler = jest.fn();
      service.on("test:initialized", eventHandler);

      service.initialize(mockStoreAccess);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "✅ TestApiService: Successfully initialized with store actions",
      );
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          config: { deterministic: false },
        }),
      );
    });

    it("should initialize with custom config", () => {
      const config: TestEngineConfig = {
        deterministic: true,
        depth: 20,
        timeLimit: 5000,
      };

      service.initialize(mockStoreAccess, config);

      expect(service["engineConfig"]).toEqual({
        deterministic: true,
        depth: 20,
        timeLimit: 5000,
      });
    });

    it("should fail initialization if required actions are missing", () => {
      const invalidStoreAccess = {
        getState: jest.fn(),
        // Missing makeMove and resetPosition
      };

      service.initialize(invalidStoreAccess as any);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ TestApiService: Required store actions not available",
      );
      expect(service.isInitialized).toBe(false);
    });
  });

  describe("makeMove", () => {
    beforeEach(() => {
      service.initialize(mockStoreAccess);
    });

    it("should make move with dash notation", async () => {
      const eventHandler = jest.fn();
      service.on("test:move", eventHandler);

      const result = await service.makeMove("e2-e4");

      expect(mockStoreAccess._internalApplyMove).toHaveBeenCalledWith({
        from: "e2",
        to: "e4",
      });
      expect(result.success).toBe(true);
      expect(result.resultingFen).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      );
      expect(eventHandler).toHaveBeenCalled();
    });

    it("should make move with SAN notation", async () => {
      const result = await service.makeMove("e4");

      expect(mockStoreAccess._internalApplyMove).toHaveBeenCalledWith("e4");
      expect(result.success).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      mockStoreAccess._internalApplyMove.mockImplementation(() => {
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

      expect(mockStoreAccess.getState).toHaveBeenCalled();
      expect(state).toEqual(
        expect.objectContaining({
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
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
      const eventHandler = jest.fn();
      service.on("test:reset", eventHandler);

      await service.resetGame();

      expect(mockStoreAccess.resetPosition).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalledWith({});
    });
  });

  describe("triggerEngineAnalysis", () => {
    beforeEach(() => {
      service.initialize(mockStoreAccess);
    });

    it("should trigger engine analysis", async () => {
      const eventHandler = jest.fn();
      service.on("test:engineAnalysisComplete", eventHandler);

      const result = await service.triggerEngineAnalysis(2000);

      expect(mockStoreAccess.getState).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        }),
      );
    });

    it("should handle timeout", async () => {
      // Mock engine status as not ready
      mockStoreAccess.getState.mockReturnValue({
        training: { analysisStatus: "loading" },
        analysisStatus: "loading",
      });

      const result = await service.triggerEngineAnalysis(100);

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Engine analysis timeout after",
        100,
        "ms",
      );
    });

    it("should handle errors", async () => {
      mockStoreAccess.getState.mockImplementation(() => {
        throw new Error("Store error");
      });

      const result = await service.triggerEngineAnalysis(1000);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Engine analysis check failed:",
        expect.any(Error),
      );
    });
  });

  describe("cleanup", () => {
    it("should clean up all state", () => {
      service.initialize(mockStoreAccess);
      const eventHandler = jest.fn();
      service.on("test:cleanup", eventHandler);

      service.cleanup();

      expect(service.isInitialized).toBe(false);
      expect(service["storeAccess"]).toBeNull();
      expect(service["engineConfig"]).toEqual({ deterministic: false });
      expect(TestApiService["instance"]).toBeNull();
      expect(eventHandler).toHaveBeenCalledWith({});
    });
  });
});
