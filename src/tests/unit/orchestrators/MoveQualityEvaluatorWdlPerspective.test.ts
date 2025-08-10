/**
 * Comprehensive test suite for WDL perspective conversion in MoveQualityEvaluator
 * These tests verify correct perspective handling and cover all major outcome change scenarios
 */

import { createTestValidatedMove } from "@tests/helpers/validatedMoveFactory";

// Mock tablebaseService module completely
jest.mock("@shared/services/TablebaseService");

import { MoveQualityEvaluator } from "@shared/store/orchestrators/handlePlayerMove/MoveQualityEvaluator";
import { tablebaseService } from "@shared/services/TablebaseService";

describe("MoveQualityEvaluator - WDL Perspective Conversion", () => {
  let evaluator: MoveQualityEvaluator;
  let mockTablebaseService: jest.Mocked<typeof tablebaseService>;

  beforeEach(() => {
    // Set up fresh mocks for each test
    mockTablebaseService = {
      getEvaluation: jest.fn(),
      getTopMoves: jest.fn(),
    } as any;
    
    // Override the imported tablebaseService with our mock
    (tablebaseService.getEvaluation as any) = mockTablebaseService.getEvaluation;
    (tablebaseService.getTopMoves as any) = mockTablebaseService.getTopMoves;
    
    evaluator = new MoveQualityEvaluator();
    jest.clearAllMocks();
  });

  describe("Mock Verification", () => {
    it("Should verify mocks work", async () => {
      // Set up mock
      mockTablebaseService.getEvaluation.mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: 100,
          category: "win",
          dtm: 5,
          dtz: 7,
          precise: true,
          evaluation: "Win",
        },
      });

      // Test mock directly
      const result = await mockTablebaseService.getEvaluation("test");
      expect(result.isAvailable).toBe(true);
      expect(result.result?.wdl).toBe(100);
    });

    it("Should verify MoveQualityEvaluator uses mocked service", async () => {
      // Set up the two required mocks
      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, category: "draw", dtm: null, dtz: null, precise: false, evaluation: "Draw" },
        })
        .mockResolvedValueOnce({
          isAvailable: true,  
          result: { wdl: 1000, category: "win", dtm: 15, dtz: 20, precise: true, evaluation: "Win" },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [{ san: "Ke7", uci: "d7e7", category: "draw", dtm: null, dtz: null, wdl: 0 }],
      });

      // Create a simple move
      const move = createTestValidatedMove({
        from: "d7", to: "d6", san: "Kd6", color: "b", piece: "k",
        before: "8/3k4/8/4K3/3P4/8/8/8 b - - 0 1",
        after: "8/8/3k4/4K3/3P4/8/8/8 w - - 1 2",
      });

      // Call evaluateMoveQuality
      const result = await evaluator.evaluateMoveQuality(
        "8/3k4/8/4K3/3P4/8/8/8 b - - 0 1",
        "8/8/3k4/4K3/3P4/8/8/8 w - - 1 2",
        move
      );

      // Check that mocks were called
      expect(mockTablebaseService.getEvaluation).toHaveBeenCalledTimes(2);
      expect(mockTablebaseService.getTopMoves).toHaveBeenCalledTimes(1);
      
      // Check result structure (should NOT be early return values)
      expect(result).toHaveProperty('wdlBefore');
      expect(result).toHaveProperty('wdlAfter');
    });
  });

  describe("Black moves", () => {
    it("Should detect outcome change: Draw → Loss", async () => {
      // Black plays losing move instead of defending move  
      const fenBefore = "8/3k4/8/4K3/3P4/8/8/8 b - - 0 1";
      const fenAfter = "8/8/3k4/4K3/3P4/8/8/8 w - - 1 2";

      const playedMove = createTestValidatedMove({
        from: "d7",
        to: "d6", 
        san: "Kd6",
        color: "b",
        piece: "k",
        before: fenBefore,
        after: fenAfter,
      });

      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0, // Draw from Black's perspective
            precise: false,
            evaluation: "Draw",
          },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "win",
            dtm: 15,
            dtz: 20,
            wdl: 1000, // Win from White's perspective
            precise: true,
            evaluation: "Win",
          },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            san: "Ke7",
            uci: "e8e7",
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0,
          },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        playedMove,
      );

      expect(result.wasOptimal).toBe(false);
      expect(result.outcomeChanged).toBe(true); // Draw (0) → Loss (-1000)
      expect(result.shouldShowErrorDialog).toBe(true);
    });

    it("Should detect outcome change: Win → Draw", async () => {
      // Black plays drawing move instead of winning move
      const fenBefore = "8/8/8/8/8/2k5/8/K7 b - - 0 1";
      const fenAfter = "8/8/8/8/8/3k4/8/K7 w - - 1 2";

      const playedMove = createTestValidatedMove({
        from: "c3",
        to: "d3",
        san: "Kd3",
        color: "b",
        piece: "k",
        before: fenBefore,
        after: fenAfter,
      });

      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "loss", // Loss for White = Win for Black
            dtm: -10,
            dtz: -15,
            wdl: 500, // Win from Black's perspective
            precise: true,
            evaluation: "Win",
          },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0, // Draw from White's perspective
            precise: false,
            evaluation: "Draw",
          },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            san: "Kb3",
            uci: "c3b3",
            category: "win",
            dtm: 8,
            dtz: 12,
            wdl: 600,
          },
          {
            san: "Kc2",
            uci: "c3c2",
            category: "win",
            dtm: 9,
            dtz: 14,
            wdl: 550,
          },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        playedMove,
      );

      expect(result.wasOptimal).toBe(false);
      expect(result.outcomeChanged).toBe(true); // Win (500) → Draw (0)
      expect(result.shouldShowErrorDialog).toBe(true);
    });

    it("Should NOT show error for optimal move maintaining win", async () => {
      // Black plays correct winning move
      const fenBefore = "8/8/8/8/8/2k5/8/K7 b - - 0 1";
      const fenAfter = "8/8/8/8/8/1k6/8/K7 w - - 1 2";

      const playedMove = createTestValidatedMove({
        from: "c3",
        to: "b3",
        san: "Kb3",
        color: "b",
        piece: "k",
        before: fenBefore,
        after: fenAfter,
      });

      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "loss",
            dtm: -10,
            dtz: -15,
            wdl: 500, // Win from Black's perspective
            precise: true,
            evaluation: "Win",
          },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "loss",
            dtm: -8,
            dtz: -12,
            wdl: -600, // Loss from White's perspective = Win for Black
            precise: true,
            evaluation: "Loss",
          },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            san: "Kb3",
            uci: "c3b3",
            category: "win",
            dtm: 8,
            dtz: 12,
            wdl: 600,
          },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        playedMove,
      );

      expect(result.wasOptimal).toBe(true);
      expect(result.outcomeChanged).toBe(false); // Still winning
      expect(result.shouldShowErrorDialog).toBe(false);
    });
  });

  describe("White moves", () => {
    it("Should detect outcome change: Win → Draw", async () => {
      // White plays drawing move instead of winning move
      const fenBefore = "8/8/8/4K3/8/8/8/k7 w - - 0 1";
      const fenAfter = "8/8/8/8/4K3/8/8/k7 b - - 1 1";

      const playedMove = createTestValidatedMove({
        from: "e5",
        to: "e4",
        san: "Ke4",
        color: "w",
        piece: "k",
        before: fenBefore,
        after: fenAfter,
      });

      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "win",
            dtm: 10,
            dtz: 15,
            wdl: 500, // Win from White's perspective
            precise: true,
            evaluation: "Win",
          },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0, // Draw from Black's perspective
            precise: false,
            evaluation: "Draw",
          },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            san: "Kd5",
            uci: "e5d5",
            category: "win",
            dtm: 8,
            dtz: 12,
            wdl: 600,
          },
          {
            san: "Kf5",
            uci: "e5f5",
            category: "win",
            dtm: 9,
            dtz: 14,
            wdl: 550,
          },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        playedMove,
      );

      expect(result.wasOptimal).toBe(false);
      expect(result.outcomeChanged).toBe(true); // Win (500) → Draw (0)
      expect(result.shouldShowErrorDialog).toBe(true);
    });

    it("Should detect outcome change: Draw → Loss", async () => {
      // White plays losing move from drawn position
      const fenBefore = "8/8/3k4/4K3/8/8/8/8 w - - 0 1";
      const fenAfter = "8/8/3k4/8/8/4K3/8/8 b - - 1 1";

      const playedMove = createTestValidatedMove({
        from: "e5",
        to: "e3",
        san: "Ke3",
        color: "w",
        piece: "k",
        before: fenBefore,
        after: fenAfter,
      });

      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0, // Draw from White's perspective
            precise: false,
            evaluation: "Draw",
          },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "win",
            dtm: 20,
            dtz: 25,
            wdl: 1000, // Win from Black's perspective = Loss for White
            precise: true,
            evaluation: "Win",
          },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            san: "Ke4",
            uci: "e5e4",
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0,
          },
          {
            san: "Kf5",
            uci: "e5f5",
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0,
          },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        playedMove,
      );

      expect(result.wasOptimal).toBe(false);
      expect(result.outcomeChanged).toBe(true); // Draw (0) → Loss (-1000)
      expect(result.shouldShowErrorDialog).toBe(true);
    });

    it("Should detect blunder: Win → Loss", async () => {
      // White blunders from winning to losing position
      const fenBefore = "8/8/8/4K3/8/8/8/2k5 w - - 0 1";
      const fenAfter = "8/8/8/8/8/4K3/8/2k5 b - - 1 1";

      const playedMove = createTestValidatedMove({
        from: "e5",
        to: "e3",
        san: "Ke3",
        color: "w",
        piece: "k",
        before: fenBefore,
        after: fenAfter,
      });

      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "win",
            dtm: 15,
            dtz: 20,
            wdl: 1000, // Win from White's perspective
            precise: true,
            evaluation: "Win",
          },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "win",
            dtm: 10,
            dtz: 15,
            wdl: 1000, // Win from Black's perspective = Loss for White
            precise: true,
            evaluation: "Win",
          },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            san: "Kd5",
            uci: "e5d5",
            category: "win",
            dtm: 12,
            dtz: 18,
            wdl: 1000,
          },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        playedMove,
      );

      expect(result.wasOptimal).toBe(false);
      expect(result.outcomeChanged).toBe(true); // Win (1000) → Loss (-1000)
      expect(result.shouldShowErrorDialog).toBe(true);
    });

    it("Should NOT show error for optimal move maintaining draw", async () => {
      // White plays correct drawing move
      const fenBefore = "8/8/3k4/4K3/8/8/8/8 w - - 0 1";
      const fenAfter = "8/8/3k4/8/4K3/8/8/8 b - - 1 1";

      const playedMove = createTestValidatedMove({
        from: "e5",
        to: "e4",
        san: "Ke4",
        color: "w",
        piece: "k",
        before: fenBefore,
        after: fenAfter,
      });

      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0, // Draw
            precise: false,
            evaluation: "Draw",
          },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0, // Still draw
            precise: false,
            evaluation: "Draw",
          },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            san: "Ke4",
            uci: "e5e4",
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0,
          },
          {
            san: "Kf5",
            uci: "e5f5",
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0,
          },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        playedMove,
      );

      expect(result.wasOptimal).toBe(true);
      expect(result.outcomeChanged).toBe(false); // Still drawing
      expect(result.shouldShowErrorDialog).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("Should handle draw values (WDL = 0) correctly", async () => {
      // Both positions are drawn
      const fenBefore = "8/8/3k4/4K3/8/8/8/8 w - - 0 1";
      const fenAfter = "8/8/3k4/8/4K3/8/8/8 b - - 1 1";

      const playedMove = createTestValidatedMove({
        from: "e5",
        to: "e4",
        san: "Ke4",
        color: "w",
        piece: "k",
        before: fenBefore,
        after: fenAfter,
      });

      mockTablebaseService.getEvaluation
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0,
            precise: false,
            evaluation: "Draw",
          },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: {
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0,
            precise: false,
            evaluation: "Draw",
          },
        });

      mockTablebaseService.getTopMoves.mockResolvedValue({
        isAvailable: true,
        moves: [
          {
            san: "Ke4",
            uci: "e5e4",
            category: "draw",
            dtm: null,
            dtz: null,
            wdl: 0,
          },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        playedMove,
      );

      // Converting perspectives: 0 → 0 and -0 → 0 (both still 0)
      expect(result.wasOptimal).toBe(true);
      expect(result.outcomeChanged).toBe(false);
      expect(result.shouldShowErrorDialog).toBe(false);
    });
  });
});
