/**
 * @file Tests for MoveQualityEvaluator
 * @module tests/unit/orchestrators/MoveQualityEvaluator
 */

import { MoveQualityEvaluator } from "@shared/store/orchestrators/handlePlayerMove/MoveQualityEvaluator";
import { tablebaseService } from "@shared/services/TablebaseService";
import { getLogger } from "@shared/services/logging";
import { validatedMoveFactory } from "@tests/helpers/validatedMoveFactory";

// Mock dependencies
jest.mock("@shared/services/TablebaseService", () => ({
  tablebaseService: {
    getEvaluation: jest.fn(),
    getTopMoves: jest.fn(),
  },
}));

jest.mock("@shared/services/logging", () => ({
  getLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("MoveQualityEvaluator", () => {
  let evaluator: MoveQualityEvaluator;
  let mockLogger: any;
  
  // Test data used across multiple test suites
  const fenBefore = "8/8/8/8/8/8/K7/k7 w - - 0 1";
  const fenAfter = "8/8/8/8/8/8/1K6/k7 b - - 1 1";
  const validatedMove = validatedMoveFactory.create({
    san: "Kb2",
    color: "w",
    from: "a2",
    to: "b2",
  });

  beforeEach(() => {
    evaluator = new MoveQualityEvaluator();
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    (getLogger as jest.Mock).mockReturnValue(mockLogger);
    jest.clearAllMocks();
  });

  describe("evaluateMoveQuality", () => {

    it("should return no error dialog when evaluations are unavailable", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({ isAvailable: false })
        .mockResolvedValueOnce({ isAvailable: false });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result).toEqual({
        shouldShowErrorDialog: false,
        wasOptimal: false,
        outcomeChanged: false,
      });
    });

    it("should return no error dialog when evaluation before is unavailable", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({ isAvailable: false })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: -1000, dtm: -15 },
        });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result.shouldShowErrorDialog).toBe(false);
    });

    it("should return no error dialog when evaluation after is unavailable", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        })
        .mockResolvedValueOnce({ isAvailable: false });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result.shouldShowErrorDialog).toBe(false);
    });

    it("should handle optimal moves correctly", async () => {
      // Mock evaluations: draw before and after
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      // Mock top moves including the played move
      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [
          { san: "Kb2", wdl: 0, dtm: 0, category: "draw" },
          { san: "Ka3", wdl: 0, dtm: 0, category: "draw" },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result).toEqual({
        shouldShowErrorDialog: false,
        wdlBefore: 0,
        wdlAfter: 0,
        bestMove: "Kb2",
        wasOptimal: true,
        outcomeChanged: false,
      });
    });

    it("should detect suboptimal moves with outcome change", async () => {
      // Mock evaluations: win before, draw after (from white's perspective)
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      // Mock top moves NOT including the played move
      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [
          { san: "Ka3", wdl: 1000, dtm: 15, category: "win" },
          { san: "Kb3", wdl: 1000, dtm: 17, category: "win" },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result).toEqual({
        shouldShowErrorDialog: true,
        wdlBefore: 1000,
        wdlAfter: 0,
        bestMove: "Ka3",
        wasOptimal: false,
        outcomeChanged: true,
      });
    });

    it("should handle draw to loss correctly", async () => {
      // Mock evaluations: draw before, loss after (from player's perspective)
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 }, // Win for opponent after move
        });

      // Mock top moves NOT including the played move
      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [
          { san: "Ka3", wdl: 0, dtm: 0, category: "draw" },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result).toEqual({
        shouldShowErrorDialog: true,
        wdlBefore: 0,
        wdlAfter: 1000,
        bestMove: "Ka3",
        wasOptimal: false,
        outcomeChanged: true,
      });
    });

    it("should not show error dialog for suboptimal move without outcome change", async () => {
      // Mock evaluations: win before and after (same outcome)
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: -1000, dtm: -17 }, // Still win for player
        });

      // Mock top moves NOT including the played move
      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [
          { san: "Ka3", wdl: 1000, dtm: 13, category: "win" },
        ],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result).toEqual({
        shouldShowErrorDialog: false,
        wdlBefore: 1000,
        wdlAfter: -1000,
        bestMove: "Ka3",
        wasOptimal: false,
        outcomeChanged: false,
      });
    });

    it("should use training baseline when provided", async () => {
      // Mock evaluations
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 500, dtm: 10 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      // Mock top moves NOT including the played move
      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [
          { san: "Ka3", wdl: 1000, dtm: 15, category: "win" },
        ],
      });

      const trainingBaseline = { wdl: 1000, fen: fenBefore };

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
        trainingBaseline,
      );

      // Should detect outcome change from baseline win (1000) to draw (0)
      expect(result.shouldShowErrorDialog).toBe(true);
      expect(result.outcomeChanged).toBe(true);
    });

    it("should handle null training baseline", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [{ san: "Ka3", wdl: 1000, dtm: 15, category: "win" }],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
        null,
      );

      expect(result.shouldShowErrorDialog).toBe(true);
    });

    it("should handle getTopMoves failure gracefully", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      // Mock getTopMoves to throw error
      (tablebaseService.getTopMoves as jest.Mock).mockRejectedValue(
        new Error("API error"),
      );

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      // Should assume move was not best when API fails
      expect(result.wasOptimal).toBe(false);
      expect(result.bestMove).toBeUndefined();
    });

    it("should handle evaluation errors gracefully", async () => {
      (tablebaseService.getEvaluation as jest.Mock).mockRejectedValue(
        new Error("Evaluation failed"),
      );

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result).toEqual({
        shouldShowErrorDialog: false,
        wasOptimal: false,
        outcomeChanged: false,
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Move quality evaluation failed:",
        expect.any(Error),
      );
    });

    it("should log comprehensive debugging information", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [{ san: "Ka3", wdl: 1000, dtm: 15, category: "win" }],
      });

      await evaluator.evaluateMoveQuality(fenBefore, fenAfter, validatedMove);

      // Should log move evaluation context
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[MoveQuality] Evaluating move quality:",
        expect.objectContaining({
          moveColor: "w",
          moveSan: "Kb2",
          wdlBefore: 1000,
          wdlAfter: 0,
        }),
      );

      // Should log WDL evaluation context
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[MoveQuality] WDL evaluation context:",
        expect.objectContaining({
          wdlBeforeFromPlayerPerspective: 1000,
          wdlAfterFromPlayerPerspective: 0,
        }),
      );

      // Should log best moves comparison
      expect(mockLogger.info).toHaveBeenCalledWith(
        "[MoveQuality] Best moves check:",
      );

      // Should log decision values
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[MoveQuality] DECISION VALUES:",
      );

      // Should log final decision
      expect(mockLogger.info).toHaveBeenCalledWith(
        "[MoveQuality] Decision to show error dialog:",
        expect.objectContaining({
          shouldShowErrorDialog: true,
          playedMoveWasBest: false,
          outcomeChanged: true,
        }),
      );
    });
  });

  describe("WDL perspective conversion", () => {
    it("should handle perspective conversion correctly", async () => {
      // Test case: Black plays, wdlBefore is from black's perspective, wdlAfter is from white's perspective
      const blackMove = validatedMoveFactory.create({
        san: "Kd7",
        color: "b",
        from: "d6",
        to: "d7",
      });

      // Before: Draw from black's perspective (0)
      // After: Win from white's perspective (1000), so loss from black's perspective (-1000)
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        });

      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [{ san: "Ke7", wdl: 0, dtm: 0, category: "draw" }],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        blackMove,
      );

      // Should detect draw to loss outcome change
      expect(result.outcomeChanged).toBe(true);
      expect(result.shouldShowErrorDialog).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty top moves list", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result.wasOptimal).toBe(false);
      expect(result.bestMove).toBeUndefined();
    });

    it("should handle top moves unavailable", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 1000, dtm: 15 },
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: false,
        moves: [],
      });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result.wasOptimal).toBe(false);
      expect(result.bestMove).toBeUndefined();
    });

    it("should handle evaluations without result field", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          // Missing result field
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result.shouldShowErrorDialog).toBe(false);
    });

    it("should handle evaluations with null result", async () => {
      (tablebaseService.getEvaluation as jest.Mock)
        .mockResolvedValueOnce({
          isAvailable: true,
          result: null,
        })
        .mockResolvedValueOnce({
          isAvailable: true,
          result: { wdl: 0, dtm: 0 },
        });

      const result = await evaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
      );

      expect(result.shouldShowErrorDialog).toBe(false);
    });
  });
});