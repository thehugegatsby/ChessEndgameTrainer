/**
 * Test suite demonstrating the WDL perspective conversion bug in MoveQualityEvaluator
 * This test SHOULD FAIL with the current implementation, proving the bug exists
 */

import { MoveQualityEvaluator } from "@shared/store/orchestrators/handlePlayerMove/MoveQualityEvaluator";
import { tablebaseService } from "@shared/services/TablebaseService";
import type { ValidatedMove } from "@shared/types/chess";
import { createTestValidatedMove } from "@tests/helpers/validatedMoveFactory";

jest.mock("@shared/services/TablebaseService");

describe("MoveQualityEvaluator - WDL Perspective Bug", () => {
  let evaluator: MoveQualityEvaluator;
  const mockTablebaseService = tablebaseService as jest.Mocked<
    typeof tablebaseService
  >;

  beforeEach(() => {
    evaluator = new MoveQualityEvaluator();
    jest.clearAllMocks();
  });

  it("FAILING TEST: Should detect outcome change when Black plays losing move instead of drawing move", async () => {
    // Position: Black King on e8, White King on e5, White Pawn on e4
    // Black to move can draw with Ke7, but plays losing Kd7 instead

    const fenBefore = "4k3/8/8/4K3/4P3/8/8/8 b - - 0 1"; // Black to move
    const fenAfter = "8/3k4/8/4K3/4P3/8/8/8 w - - 1 2"; // After Black plays Kd7

    const playedMove: ValidatedMove = createTestValidatedMove({
      from: "e8",
      to: "d7",
      san: "Kd7",
      color: "b",
      piece: "k",
      before: fenBefore,
      after: fenAfter,
    });

    // Mock API responses based on actual Lichess Tablebase behavior
    // The API returns WDL from the side-to-move perspective
    mockTablebaseService.getEvaluation
      .mockResolvedValueOnce({
        // Before move: Black to move, position is drawn
        isAvailable: true,
        result: {
          category: "draw",
          dtm: null,
          dtz: null,
          wdl: 0, // Draw from Black's perspective (side to move)
          precise: false,
          evaluation: "Draw",
        },
      })
      .mockResolvedValueOnce({
        // After move: White to move, White is winning
        isAvailable: true,
        result: {
          category: "win",
          dtm: 15,
          dtz: 20,
          wdl: 1000, // Win from White's perspective (side to move)
          precise: true,
          evaluation: "Win",
        },
      });

    // Mock the best moves - only Ke7 draws
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

    console.log(
      "\n=== FAILING TEST: Black plays losing Kd7 instead of drawing Ke7 ===",
    );
    console.log("Position before: Black to move, can draw with Ke7");
    console.log("Black played: Kd7 (losing move)");
    console.log("API wdlBefore:", 0, "(draw from Black's perspective)");
    console.log("API wdlAfter:", 1000, "(win from White's perspective)");
    console.log("\nResult from evaluator:", {
      shouldShowErrorDialog: result.shouldShowErrorDialog,
      wasOptimal: result.wasOptimal,
      outcomeChanged: result.outcomeChanged,
    });

    // These assertions SHOULD pass but WILL FAIL with the current buggy implementation
    expect(result.wasOptimal).toBe(false); // Kd7 was not optimal (only Ke7 draws)
    expect(result.outcomeChanged).toBe(true); // FAILS: Bug causes this to be false!
    expect(result.shouldShowErrorDialog).toBe(true); // FAILS: Bug causes this to be false!
  });

  it("FAILING TEST: Should detect outcome change when White plays drawing move instead of winning move", async () => {
    // Another test case: White has a winning position but plays a drawing move

    const fenBefore = "8/8/8/4K3/8/8/8/k7 w - - 0 1"; // White to move, winning
    const fenAfter = "8/8/8/8/4K3/8/8/k7 b - - 1 1"; // After White plays Ke4 (drawing)

    const playedMove: ValidatedMove = createTestValidatedMove({
      from: "e5",
      to: "e4",
      san: "Ke4",
      color: "w",
      piece: "k",
      before: fenBefore,
      after: fenAfter,
    });

    // Mock API responses
    mockTablebaseService.getEvaluation
      .mockResolvedValueOnce({
        // Before: White to move, White is winning
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
        // After: Black to move, position is drawn
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

    // Mock the best moves - winning moves available
    mockTablebaseService.getTopMoves.mockResolvedValue({
      isAvailable: true,
      moves: [
        { san: "Kd5", uci: "e5d5", category: "win", dtm: 8, dtz: 12, wdl: 600 },
        { san: "Kf5", uci: "e5f5", category: "win", dtm: 9, dtz: 14, wdl: 550 },
      ],
    });

    const result = await evaluator.evaluateMoveQuality(
      fenBefore,
      fenAfter,
      playedMove,
    );

    console.log(
      "\n=== FAILING TEST: White plays drawing Ke4 instead of winning move ===",
    );
    console.log("Position before: White to move, winning");
    console.log("White played: Ke4 (drawing move)");
    console.log("API wdlBefore:", 500, "(win from White's perspective)");
    console.log("API wdlAfter:", 0, "(draw from Black's perspective)");
    console.log("\nResult from evaluator:", {
      shouldShowErrorDialog: result.shouldShowErrorDialog,
      wasOptimal: result.wasOptimal,
      outcomeChanged: result.outcomeChanged,
    });

    // These assertions SHOULD pass but WILL FAIL with the current buggy implementation
    expect(result.wasOptimal).toBe(false); // Ke4 was not optimal
    expect(result.outcomeChanged).toBe(true); // FAILS: Bug causes this to be false!
    expect(result.shouldShowErrorDialog).toBe(true); // FAILS: Bug causes this to be false!
  });
});
