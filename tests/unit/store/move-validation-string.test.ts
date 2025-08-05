/**
 * Test that makeUserMove accepts string moves (SAN format)
 * This tests the fix for TablebaseAnalysisPanel passing SAN moves
 */

import { useStore } from "@shared/store/rootStore";

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => `test-id-${Math.random()}`),
}));

// Mock chess.js
jest.mock("chess.js", () => {
  // Store current FEN outside to maintain state between constructor calls
  let globalCurrentFen =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  return {
    Chess: jest.fn().mockImplementation((fen) => {
      // Update global FEN when new Chess instance is created
      if (fen) {
        globalCurrentFen = fen;
      }
      let currentFen = globalCurrentFen;

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
              globalCurrentFen = currentFen; // Update global FEN
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
              globalCurrentFen = currentFen; // Update global FEN
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
          globalCurrentFen = fen;
        }),
        isGameOver: jest.fn(() => false),
        isCheckmate: jest.fn(() => false),
        isDraw: jest.fn(() => false),
        turn: jest.fn(() => currentFen.split(" ")[1] || "w"),
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
    // Reset the store before each test
    useStore.getState().reset();
  });

  it("should accept SAN string moves from TablebaseAnalysisPanel", async () => {
    // Use the store directly instead of renderHook to ensure consistent store instance
    const store = useStore.getState();

    // Setup position - K+P vs K (EndgamePosition format)
    await store.loadTrainingContext({
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

    // Mock tablebase responses for Kd6 (a winning move)
    const mockTablebaseService = tablebaseService as jest.Mocked<
      typeof tablebaseService
    >;

    // Mock all tablebase calls to return consistent values
    mockTablebaseService.getEvaluation.mockImplementation((fen) => {
      if (fen.includes("K7/P7/k7/8")) {
        // Starting position
        return Promise.resolve({
          isAvailable: true,
          result: {
            wdl: 2, // Win for white
            category: "win",
            dtz: 6,
            dtm: null,
            precise: true,
            evaluation: "White wins",
          },
        });
      } else if (fen.includes("K7/P7/k7/3K4")) {
        // After Kd6
        return Promise.resolve({
          isAvailable: true,
          result: {
            wdl: -2, // Black loses (white still wins)
            category: "win",
            dtz: 5,
            dtm: null,
            precise: true,
            evaluation: "Black loses",
          },
        });
      }
      return Promise.resolve({ isAvailable: false });
    });

    // Mock getTopMoves as well
    mockTablebaseService.getTopMoves.mockResolvedValue({
      isAvailable: true,
      moves: [
        {
          uci: "a8d6",
          san: "Kd6",
          dtz: 6,
          dtm: null,
          category: "win",
          wdl: 2,
        },
      ],
    });

    // Test making a move with SAN string (as TablebaseAnalysisPanel does)
    const moveResult = await store.makeUserMove("Kd6");

    // Move should be accepted (no error dialog)
    expect(moveResult).toBe(true);

    // Get updated state
    const stateAfterMove = useStore.getState();
    expect(stateAfterMove.moveErrorDialog).toBeNull();

    // Move should be in history
    expect(stateAfterMove.moveHistory).toHaveLength(1);
    expect(stateAfterMove.moveHistory[0].san).toBe("Kd6");
  });

  it("should reject bad SAN string moves that worsen position", async () => {
    const store = useStore.getState();

    // Setup position
    await store.loadTrainingContext({
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
    const moveResult = await store.makeUserMove("Kc5");

    // Move should be accepted (move was made)
    expect(moveResult).toBe(true);

    // Get updated state
    const stateAfterMove = useStore.getState();

    // But error dialog should be shown
    expect(stateAfterMove.moveErrorDialog).toEqual({
      isOpen: true,
      wdlBefore: 2,
      wdlAfter: 0,
      bestMove: "Kd7",
    });

    // Move should be in history (even if suboptimal)
    expect(stateAfterMove.moveHistory).toHaveLength(1);
  });

  it("should handle invalid SAN strings gracefully", async () => {
    const store = useStore.getState();

    // Setup position
    await store.loadTrainingContext({
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

    // Test making an invalid move
    const moveResult = await store.makeUserMove("InvalidMove");

    // Move should be rejected
    expect(moveResult).toBe(false);

    // Get updated state
    const stateAfterMove = useStore.getState();
    expect(stateAfterMove.moveHistory).toHaveLength(0);
  });
});
