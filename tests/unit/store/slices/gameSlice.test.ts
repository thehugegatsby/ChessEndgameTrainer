/**
 * @file Tests for GameSlice with nested store structure
 * @module tests/unit/store/slices/gameSlice.nested
 */

import { useStore } from "@shared/store/rootStore";
import { chessService } from "@shared/services/ChessService";

// Mock ChessService
jest.mock("@shared/services/ChessService", () => ({
  chessService: {
    reset: jest.fn(),
    initialize: jest.fn().mockReturnValue(true), // Mock initialize method
    loadPosition: jest.fn(),
    getFen: jest
      .fn()
      .mockReturnValue(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ),
    getPgn: jest.fn().mockReturnValue(""),
    getHistory: jest.fn().mockReturnValue([]),
    turn: jest.fn().mockReturnValue("w"),
    isGameOver: jest.fn().mockReturnValue(false),
    isCheck: jest.fn().mockReturnValue(false),
    isCheckmate: jest.fn().mockReturnValue(false),
    isDraw: jest.fn().mockReturnValue(false),
    isStalemate: jest.fn().mockReturnValue(false),
    isThreefoldRepetition: jest.fn().mockReturnValue(false),
    isInsufficientMaterial: jest.fn().mockReturnValue(false),
    onStateChange: jest.fn(),
    move: jest.fn(),
    undo: jest.fn(),
    validateMove: jest.fn(),
    getMoves: jest.fn().mockReturnValue([]),
    subscribe: jest.fn().mockReturnValue(jest.fn()), // Mock subscribe to return unsubscribe function
    emit: jest.fn(),
  },
}));

describe("GameSlice - Nested Store Structure", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset store to initial state - preserve actions by only updating state properties
    useStore.setState((state) => {
      state.game.currentFen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      state.game.currentPgn = "";
      state.game.moveHistory = [];
      state.game.currentMoveIndex = -1;
      state.game.isGameFinished = false;
      state.game.gameResult = null;
    });
  });

  describe("resetGame", () => {
    it("should call ChessService reset", () => {
      const store = useStore.getState();

      // Modify some state first
      store.game.setGameFinished(true);
      expect(useStore.getState().game.isGameFinished).toBe(true);

      // Reset game - this calls chessService.reset() which should emit an event
      // In a real scenario, the rootStore subscription would sync the state
      store.game.resetGame();

      // Verify that ChessService.reset was called
      expect(chessService.reset).toHaveBeenCalled();

      // In unit tests, we'd need to manually trigger the state sync or mock the event system
      // For now, just test that the service method was called
    });
  });

  describe("initializeGame", () => {
    it("should initialize game with FEN", () => {
      const store = useStore.getState();
      const testFen = "8/8/8/8/8/8/8/8 w - - 0 1";

      const result = store.game.initializeGame(testFen);

      // The actual implementation would use chessService
      expect(result).toBeDefined();
    });
  });

  describe("setGameFinished", () => {
    it("should set game finished to true", () => {
      const store = useStore.getState();

      store.game.setGameFinished(true);

      const state = useStore.getState();
      expect(state.game.isGameFinished).toBe(true);
    });

    it("should set game finished to false", () => {
      const store = useStore.getState();

      store.game.setGameFinished(false);

      const state = useStore.getState();
      expect(state.game.isGameFinished).toBe(false);
    });
  });

  describe("updatePosition", () => {
    it("should update position with FEN and PGN", () => {
      const store = useStore.getState();
      const testFen = "8/8/8/8/8/8/8/8 w - - 0 1";
      const testPgn = "1. e4";

      store.game.updatePosition(testFen, testPgn);

      const state = useStore.getState();
      expect(state.game.currentFen).toBe(testFen);
      expect(state.game.currentPgn).toBe(testPgn);
    });
  });

  describe("setMoveHistory", () => {
    it("should set move history", () => {
      const store = useStore.getState();
      const mockMoves = [
        {
          san: "e4",
          from: "e2",
          to: "e4",
          color: "w",
          piece: "p",
          captured: undefined,
        },
        {
          san: "e5",
          from: "e7",
          to: "e5",
          color: "b",
          piece: "p",
          captured: undefined,
        },
      ] as any;

      store.game.setMoveHistory(mockMoves);

      const state = useStore.getState();
      expect(state.game.moveHistory).toEqual(mockMoves);
    });
  });

  describe("setCurrentMoveIndex", () => {
    it("should set current move index", () => {
      const store = useStore.getState();

      store.game.setCurrentMoveIndex(5);

      const state = useStore.getState();
      expect(state.game.currentMoveIndex).toBe(5);
    });
  });

  describe("Integration with nested structure", () => {
    it("should work with other slices in the store", () => {
      const store = useStore.getState();

      // Verify that other slices exist
      expect(store.tablebase).toBeDefined();
      expect(store.training).toBeDefined();
      expect(store.ui).toBeDefined();

      // Set game data
      store.game.setGameFinished(true);

      // Verify it doesn't affect other slices
      const state = useStore.getState();
      expect(state.game.isGameFinished).toBe(true);
      expect(state.tablebase.analysisStatus).toBeDefined();
      expect(state.training.isPlayerTurn).toBeDefined();
    });

    it("should maintain proper nesting in state updates", () => {
      const store = useStore.getState();

      // Make multiple updates
      store.game.setGameFinished(true);
      store.game.setCurrentMoveIndex(3);

      // Check all updates were applied correctly
      const state = useStore.getState();
      expect(state.game.isGameFinished).toBe(true);
      expect(state.game.currentMoveIndex).toBe(3);

      // Verify structure is maintained
      expect(state.game).toHaveProperty("currentFen");
      expect(state.game).toHaveProperty("moveHistory");
      expect(state.game).toHaveProperty("resetGame");
    });
  });
});
