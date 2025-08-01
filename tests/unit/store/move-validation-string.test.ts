/**
 * Test that makeUserMove accepts string moves (SAN format)
 * This tests the fix for TablebaseAnalysisPanel passing SAN moves
 */

import { renderHook } from "@testing-library/react";
import { useStore } from "../../../shared/store/store";
import { act } from "react";

// Mock chess.js
jest.mock("chess.js", () => {
  return {
    Chess: jest.fn().mockImplementation((fen) => {
      let currentFen =
        fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      return {
        fen: jest.fn(() => currentFen),
        pgn: jest.fn(() => ""),
        move: jest.fn((move) => {
          // --- Handle string moves ---
          if (typeof move === "string") {
            if (move === "InvalidMove") {
              return null;
            }
            if (move === "Kd6" && currentFen.includes("K7/P7/k7")) {
              currentFen = "K7/P7/k7/3K4/8/8/8/8 b - - 1 1";
              return {
                from: "a8",
                to: "d6",
                san: "Kd6",
                piece: "k",
                color: "w",
                flags: "n",
              };
            }
            if (move === "Kc5" && currentFen.includes("K7/P7/8/4k3")) {
              currentFen = "K7/P7/8/2K1k3/8/8/8/8 b - - 1 2";
              return {
                from: "d6",
                to: "c5",
                san: "Kc5",
                piece: "k",
                color: "w",
                flags: "n",
              };
            }
            // For any other string, return null to simulate an invalid move
            return null;
          }

          // --- Handle object moves ---
          if (
            typeof move === "object" &&
            move !== null &&
            move.from &&
            move.to
          ) {
            // If a SAN is already provided, preserve it. Otherwise, create a simple one.
            const san = move.san || `${move.from}${move.to}`;
            return { ...move, san };
          }

          // Return null for any unexpected input
          return null;
        }),
        load: jest.fn((fen) => {
          currentFen = fen;
        }),
        isGameOver: jest.fn(() => false),
        turn: jest.fn(() => "w"),
      };
    }),
  };
});

// Mock TablebaseService
jest.mock("../../../shared/services/TablebaseService", () => ({
  tablebaseService: {
    getEvaluation: jest.fn(),
    getTopMoves: jest.fn(),
  },
}));

// Mock logger
jest.mock("../../../shared/services/logging", () => ({
  /**
   *
   */
  getLogger: () => ({
    setContext: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock fromLibraryMove
jest.mock("../../../shared/infrastructure/chess-adapter", () => ({
  fromLibraryMove: jest.fn((move) => ({
    from: move.from,
    to: move.to,
    san: move.san,
    piece: move.piece || "k",
    color: move.color || "w",
    captured: move.captured,
    promotion: move.promotion,
    flags: move.flags || "",
  })),
  ChessAdapterError: class ChessAdapterError extends Error {
    constructor(message: string, _context?: any) {
      super(message);
      this.name = "ChessAdapterError";
    }
  },
}));

import { tablebaseService } from "../../../shared/services/TablebaseService";

describe("Store - String Move Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useStore.getState().reset();
    });
  });

  it("should accept SAN string moves from TablebaseAnalysisPanel", async () => {
    const { result } = renderHook(() => useStore());

    // Setup position - K+P vs K
    act(() => {
      result.current.setPosition({
        id: 1,
        title: "König und Bauer gegen König",
        fen: "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        description: "Test position",
        category: "pawn",
        difficulty: "beginner",
        goal: "win",
        sideToMove: "white",
        targetMoves: 6,
      });
    });

    // Mock tablebase responses for Kd6 (a winning move)
    const mockTablebaseService = tablebaseService as jest.Mocked<
      typeof tablebaseService
    >;

    // Before position evaluation (winning from white's perspective, white to move)
    mockTablebaseService.getEvaluation.mockResolvedValueOnce({
      isAvailable: true,
      result: {
        wdl: 2, // Win for white (player to move is white)
        category: "win",
        dtz: 6,
        dtm: null,
        precise: true,
        evaluation: "White wins",
      },
    });

    // After Kd6 evaluation (still winning from white's perspective, but black to move)
    mockTablebaseService.getEvaluation.mockResolvedValueOnce({
      isAvailable: true,
      result: {
        wdl: -2, // Black loses (player to move is black, so -2 means black loses = white wins)
        category: "win",
        dtz: 5,
        dtm: null,
        precise: true,
        evaluation: "Black loses",
      },
    });

    // Test making a move with SAN string (as TablebaseAnalysisPanel does)
    let moveResult: boolean = false;
    await act(async () => {
      moveResult = await result.current.makeUserMove("Kd6");
    });

    // Move should be accepted (no error dialog)
    expect(moveResult).toBe(true);
    expect(result.current.training.moveErrorDialog).toBeNull();

    // Move should be in history
    expect(result.current.training.moveHistory).toHaveLength(1);
    expect(result.current.training.moveHistory[0].san).toBe("Kd6");
  });

  it("should reject bad SAN string moves that worsen position", async () => {
    const { result } = renderHook(() => useStore());

    // Setup position
    act(() => {
      result.current.setPosition({
        id: 1,
        title: "Test position",
        fen: "K7/P7/8/4k3/8/8/8/8 w - - 0 2",
        description: "After 1.Kd6 Kf8",
        category: "pawn",
        difficulty: "beginner",
        goal: "win",
        sideToMove: "white",
        targetMoves: 5,
      });
    });

    const mockTablebaseService = tablebaseService as jest.Mocked<
      typeof tablebaseService
    >;

    // Before position evaluation (winning)
    mockTablebaseService.getEvaluation.mockResolvedValueOnce({
      isAvailable: true,
      result: {
        wdl: 2, // Win
        category: "win",
        dtz: 5,
        dtm: null,
        precise: true,
        evaluation: "White wins",
      },
    });

    // After Kc5?? evaluation (draw)
    mockTablebaseService.getEvaluation.mockResolvedValueOnce({
      isAvailable: true,
      result: {
        wdl: 0, // Draw
        category: "draw",
        dtz: 0,
        dtm: null,
        precise: true,
        evaluation: "Draw",
      },
    });

    // Mock best move
    mockTablebaseService.getTopMoves.mockResolvedValueOnce({
      isAvailable: true,
      moves: [
        {
          uci: "d6d7",
          san: "Kd7",
          dtz: 5,
          dtm: null,
          category: "win",
          wdl: 2,
        },
      ],
    });

    // Test making a bad move with SAN string
    let moveResult: boolean = false;
    await act(async () => {
      moveResult = await result.current.makeUserMove("Kc5");
    });

    // Move should be rejected
    expect(moveResult).toBe(false);
    expect(result.current.training.moveErrorDialog).toEqual({
      isOpen: true,
      wdlBefore: 2,
      wdlAfter: 0,
      bestMove: "Kd7",
    });

    // Move should not be in history
    expect(result.current.training.moveHistory).toHaveLength(0);
  });

  it("should handle invalid SAN strings gracefully", async () => {
    const { result } = renderHook(() => useStore());

    // Setup position
    act(() => {
      result.current.setPosition({
        id: 1,
        title: "Test position",
        fen: "K7/P7/k7/8/8/8/8/8 w - - 0 1",
        description: "Test",
        category: "pawn",
        difficulty: "beginner",
        goal: "win",
        sideToMove: "white",
        targetMoves: 6,
      });
    });

    // Test making an invalid move
    let moveResult: boolean = false;
    await act(async () => {
      moveResult = await result.current.makeUserMove("InvalidMove");
    });

    // Move should be rejected
    expect(moveResult).toBe(false);
    expect(result.current.training.moveHistory).toHaveLength(0);
  });
});
