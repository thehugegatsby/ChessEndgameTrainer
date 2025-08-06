/**
 * @file Unit tests for Game state slice
 * @module tests/store/slices/gameSlice
 * @description Comprehensive test suite for the game slice including state, actions, and selectors.
 * Tests cover chess game operations, move validation, history navigation, and game state management.
 */

import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import {
  createGameSlice,
  gameSelectors,
  createInitialGameState,
} from "@shared/store/slices/gameSlice";
import type { GameSlice } from "@shared/store/slices/types";

/**
 * Creates a test store instance with only the game slice
 * @returns Store instance with getState and setState methods
 */
const createTestStore = () => {
  return createStore<GameSlice>()(
    immer((set, get, store) =>
      createGameSlice(set as any, get as any, store as any),
    ),
  );
};

/**
 * Test positions for various scenarios
 */
const testPositions = {
  starting: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  endgameKRK: "8/8/8/8/8/8/R7/K3k3 w - - 0 1",
  checkmateIn1: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
  stalemate: "7k/5Q2/8/8/8/8/8/7K w - - 0 1",
  promotion: "8/P7/8/8/8/8/8/k6K w - - 0 1",
  invalid: "invalid-fen-string",
};

describe("GameSlice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    /**
     * Tests that the initial state matches expected defaults
     */
    it("should have correct initial state", () => {
      const state = store.getState();
      const expectedState = createInitialGameState();

      // game property removed - Chess instance now managed by ChessService
      expect(state.currentFen).toBe(expectedState.currentFen);
      expect(state.moveHistory).toEqual(expectedState.moveHistory);
      expect(state.currentMoveIndex).toBe(expectedState.currentMoveIndex);
      expect(state.isGameFinished).toBe(expectedState.isGameFinished);
      expect(state.gameResult).toBe(expectedState.gameResult);
    });

    /**
     * Tests the initial state factory function
     */
    it("should create fresh initial state on each call", () => {
      const state1 = createInitialGameState();
      const state2 = createInitialGameState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.moveHistory).not.toBe(state2.moveHistory);
    });
  });

  describe("initializeGame", () => {
    /**
     * Tests successful game initialization
     */
    it("should initialize game with valid FEN", () => {
      const result = store.getState().initializeGame(testPositions.endgameKRK);

      expect(result).not.toBeNull();

      const state = store.getState();
      // game property removed - Chess instance now managed by ChessService
      expect(state.currentFen).toBe(testPositions.endgameKRK);
      expect(state.moveHistory).toEqual([]);
      expect(state.currentMoveIndex).toBe(-1);
      expect(state.isGameFinished).toBe(false);
    });

    /**
     * Tests initialization with invalid FEN
     */
    it("should return null for invalid FEN", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = store.getState().initializeGame(testPositions.invalid);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    /**
     * Tests that initialization resets game state
     */
    it("should reset game state on initialization", () => {
      // Make some moves first
      store.getState().initializeGame(testPositions.starting);
      store.getState().makeMove({ from: "e2", to: "e4" });
      store.getState().makeMove({ from: "e7", to: "e5" });

      expect(store.getState().moveHistory).toHaveLength(2);

      // Initialize with new position
      store.getState().initializeGame(testPositions.endgameKRK);

      const state = store.getState();
      expect(state.moveHistory).toEqual([]);
      expect(state.currentMoveIndex).toBe(-1);
    });
  });

  describe("makeMove", () => {
    beforeEach(() => {
      store.getState().initializeGame(testPositions.starting);
    });

    /**
     * Tests valid move with object notation
     */
    it("should make valid move with object notation", () => {
      const move = store.getState().makeMove({ from: "e2", to: "e4" });

      expect(move).not.toBeNull();
      expect(move?.from).toBe("e2");
      expect(move?.to).toBe("e4");
      expect(move?.san).toBe("e4");

      const state = store.getState();
      expect(state.moveHistory).toHaveLength(1);
      expect(state.currentMoveIndex).toBe(0);
      expect(state.currentFen).toContain("4P3"); // e4 pawn in FEN
    });

    /**
     * Tests valid move with algebraic notation
     */
    it("should make valid move with algebraic notation", () => {
      const move = store.getState().makeMove("Nf3");

      expect(move).not.toBeNull();
      expect(move?.san).toBe("Nf3");
      expect(move?.piece).toBe("n");
    });

    /**
     * Tests invalid move handling
     */
    it("should return null for invalid move", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const move = store.getState().makeMove({ from: "e2", to: "e5" });

      expect(move).toBeNull();
      expect(store.getState().moveHistory).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    /**
     * Tests pawn promotion
     */
    it("should handle pawn promotion", () => {
      store.getState().initializeGame(testPositions.promotion);
      const move = store
        .getState()
        .makeMove({ from: "a7", to: "a8", promotion: "q" });

      expect(move).not.toBeNull();
      expect(move?.promotion).toBe("q");
      expect(move?.san).toContain("a8=Q"); // May include check symbol
    });

    /**
     * Tests move history truncation
     */
    it("should truncate future moves when making move from middle of history", () => {
      // Make several moves
      store.getState().makeMove("e4");
      store.getState().makeMove("e5");
      store.getState().makeMove("Nf3");
      store.getState().makeMove("Nc6");

      expect(store.getState().moveHistory).toHaveLength(4);

      // Go back two moves
      store.getState().goToMove(1);

      // Make a different move
      store.getState().makeMove("d4");

      // Future moves should be truncated
      const state = store.getState();
      expect(state.moveHistory).toHaveLength(3);
      expect(state.moveHistory[2].san).toBe("d4");
    });

    /**
     * Tests game ending detection
     */
    it("should detect game over", () => {
      // Fool's mate position after 1.f3 e5 2.g4
      store
        .getState()
        .initializeGame(
          "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2",
        );

      // Black plays Qh4# - checkmate
      const move = store.getState().makeMove("Qh4");

      expect(move).not.toBeNull();
      expect(move?.san).toContain("#"); // Checkmate symbol

      const state = store.getState();
      expect(state.isGameFinished).toBe(true);
      expect(state.gameResult).toBe("0-1"); // Black wins
    });

    /**
     * Tests that move includes timestamps
     */
    it("should include timestamp in validated move", () => {
      const before = Date.now();
      const move = store.getState().makeMove("e4");
      const after = Date.now();

      expect(move?.timestamp).toBeGreaterThanOrEqual(before);
      expect(move?.timestamp).toBeLessThanOrEqual(after);
    });

    /**
     * Tests FEN before/after in moves
     */
    it("should track FEN before and after move", () => {
      const fenBefore = store.getState().currentFen;
      const move = store.getState().makeMove("e4");

      expect(move?.fenBefore).toBe(fenBefore);
      expect(move?.fenAfter).toBe(store.getState().currentFen);
      expect(move?.fenBefore).not.toBe(move?.fenAfter);
    });
  });

  describe("undoMove", () => {
    /**
     * Tests basic undo functionality
     */
    it("should undo last move", () => {
      store.getState().initializeGame(testPositions.starting);
      const fenBefore = store.getState().currentFen;

      store.getState().makeMove("e4");
      expect(store.getState().currentFen).not.toBe(fenBefore);

      const success = store.getState().undoMove();
      expect(success).toBe(true);
      expect(store.getState().currentFen).toBe(fenBefore);
      expect(store.getState().currentMoveIndex).toBe(-1);
    });

    /**
     * Tests undo with no moves
     */
    it("should return false when no moves to undo", () => {
      store.getState().initializeGame(testPositions.starting);
      const success = store.getState().undoMove();

      expect(success).toBe(false);
    });

    /**
     * Tests multiple undos
     */
    it("should handle multiple undos", () => {
      store.getState().initializeGame(testPositions.starting);

      store.getState().makeMove("e4");
      store.getState().makeMove("e5");
      store.getState().makeMove("Nf3");

      expect(store.getState().currentMoveIndex).toBe(2);

      store.getState().undoMove();
      expect(store.getState().currentMoveIndex).toBe(1);

      store.getState().undoMove();
      expect(store.getState().currentMoveIndex).toBe(0);

      store.getState().undoMove();
      expect(store.getState().currentMoveIndex).toBe(-1);
    });

    /**
     * Tests that undo preserves move history
     */
    it("should preserve move history after undo", () => {
      store.getState().initializeGame(testPositions.starting);

      store.getState().makeMove("e4");
      store.getState().makeMove("e5");

      const historyLength = store.getState().moveHistory.length;

      store.getState().undoMove();

      expect(store.getState().moveHistory).toHaveLength(historyLength);
    });
  });

  describe("redoMove", () => {
    /**
     * Tests basic redo functionality
     */
    it("should redo previously undone move", () => {
      store.getState().initializeGame(testPositions.starting);

      store.getState().makeMove("e4");
      const fenAfterMove = store.getState().currentFen;

      store.getState().undoMove();
      expect(store.getState().currentFen).not.toBe(fenAfterMove);

      const success = store.getState().redoMove();
      expect(success).toBe(true);
      expect(store.getState().currentFen).toBe(fenAfterMove);
    });

    /**
     * Tests redo with no future moves
     */
    it("should return false when no moves to redo", () => {
      store.getState().initializeGame(testPositions.starting);
      store.getState().makeMove("e4");

      const success = store.getState().redoMove();
      expect(success).toBe(false);
    });

    /**
     * Tests undo/redo sequence
     */
    it("should handle undo/redo sequence correctly", () => {
      store.getState().initializeGame(testPositions.starting);

      // Make moves
      store.getState().makeMove("e4");
      store.getState().makeMove("e5");
      store.getState().makeMove("Nf3");

      // Undo all
      store.getState().undoMove();
      store.getState().undoMove();
      store.getState().undoMove();

      expect(store.getState().currentMoveIndex).toBe(-1);

      // Redo all
      store.getState().redoMove();
      expect(store.getState().currentMoveIndex).toBe(0);

      store.getState().redoMove();
      expect(store.getState().currentMoveIndex).toBe(1);

      store.getState().redoMove();
      expect(store.getState().currentMoveIndex).toBe(2);
    });
  });

  describe("goToMove", () => {
    beforeEach(() => {
      store.getState().initializeGame(testPositions.starting);
      store.getState().makeMove("e4");
      store.getState().makeMove("e5");
      store.getState().makeMove("Nf3");
      store.getState().makeMove("Nc6");
    });

    /**
     * Tests navigation to specific moves
     */
    it("should navigate to specific move index", () => {
      const success = store.getState().goToMove(1);

      expect(success).toBe(true);
      expect(store.getState().currentMoveIndex).toBe(1);

      const move = store.getState().moveHistory[1];
      expect(store.getState().currentFen).toBe(move.fenAfter);
    });

    /**
     * Tests navigation to starting position
     */
    it("should navigate to starting position with index -1", () => {
      const startingFen = store.getState().moveHistory[0].fenBefore;

      const success = store.getState().goToMove(-1);

      expect(success).toBe(true);
      expect(store.getState().currentMoveIndex).toBe(-1);
      expect(store.getState().currentFen).toBe(startingFen);
    });

    /**
     * Tests navigation to last move
     */
    it("should navigate to last move", () => {
      store.getState().goToMove(0); // Go to first move

      const lastIndex = store.getState().moveHistory.length - 1;
      const success = store.getState().goToMove(lastIndex);

      expect(success).toBe(true);
      expect(store.getState().currentMoveIndex).toBe(lastIndex);
    });

    /**
     * Tests invalid index handling
     */
    it("should return false for out of bounds index", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(store.getState().goToMove(-2)).toBe(false);
      expect(store.getState().goToMove(10)).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("resetGame", () => {
    /**
     * Tests game reset functionality
     */
    it("should reset to starting position", () => {
      store.getState().initializeGame(testPositions.endgameKRK);
      store.getState().makeMove({ from: "a2", to: "a3" });

      store.getState().resetGame();

      const state = store.getState();
      expect(state.currentFen).toBe(testPositions.starting);
      expect(state.moveHistory).toEqual([]);
      expect(state.currentMoveIndex).toBe(-1);
      expect(state.isGameFinished).toBe(false);
      expect(state.gameResult).toBeNull();
    });
  });

  describe("setCurrentFen", () => {
    /**
     * Tests setting FEN position successfully
     */
    it("should set FEN position successfully", () => {
      const result = store.getState().setCurrentFen(testPositions.endgameKRK);

      expect(result).not.toBeNull();
      expect(store.getState().currentFen).toBe(testPositions.endgameKRK);
      expect(store.getState().moveHistory).toEqual([]);
    });

    /**
     * Tests setting invalid FEN
     */
    it("should return null for invalid FEN", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = store.getState().setCurrentFen(testPositions.invalid);

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    /**
     * Tests that setCurrentFen is alias for initializeGame
     */
    it("should behave same as initializeGame", () => {
      const initSpy = jest.spyOn(store.getState(), "initializeGame");

      store.getState().setCurrentFen(testPositions.endgameKRK);

      expect(initSpy).toHaveBeenCalledWith(testPositions.endgameKRK);
    });
  });

  describe("Selectors", () => {
    beforeEach(() => {
      store.getState().initializeGame(testPositions.starting);
    });

    /**
     * Tests basic selectors
     */
    it("should select correct state values", () => {
      const state = store.getState();

      // selectGame removed - Chess instance now managed by ChessService
      expect(gameSelectors.selectCurrentFen(state)).toBe(
        testPositions.starting,
      );
      expect(gameSelectors.selectMoveHistory(state)).toEqual([]);
      expect(gameSelectors.selectCurrentMoveIndex(state)).toBe(-1);
      expect(gameSelectors.selectIsGameOver(state)).toBe(false);
      expect(gameSelectors.selectGameResult(state)).toBeNull();
    });

    /**
     * Tests turn selector
     */
    it("should correctly determine whose turn", () => {
      expect(gameSelectors.selectIsWhiteTurn(store.getState())).toBe(true);

      store.getState().makeMove("e4");
      expect(gameSelectors.selectIsWhiteTurn(store.getState())).toBe(false);

      store.getState().makeMove("e5");
      expect(gameSelectors.selectIsWhiteTurn(store.getState())).toBe(true);
    });

    /**
     * Tests undo/redo availability selectors
     */
    it("should correctly determine undo/redo availability", () => {
      const state1 = store.getState();
      expect(gameSelectors.selectCanUndo(state1)).toBe(false);
      expect(gameSelectors.selectCanRedo(state1)).toBe(false);

      store.getState().makeMove("e4");
      const state2 = store.getState();
      expect(gameSelectors.selectCanUndo(state2)).toBe(true);
      expect(gameSelectors.selectCanRedo(state2)).toBe(false);

      store.getState().undoMove();
      const state3 = store.getState();
      expect(gameSelectors.selectCanUndo(state3)).toBe(false);
      expect(gameSelectors.selectCanRedo(state3)).toBe(true);
    });

    /**
     * Tests last move selector
     */
    it("should select last move", () => {
      expect(gameSelectors.selectLastMove(store.getState())).toBeNull();

      store.getState().makeMove("e4");
      store.getState().makeMove("e5");

      const lastMove = gameSelectors.selectLastMove(store.getState());
      expect(lastMove?.san).toBe("e5");
      expect(lastMove?.color).toBe("b");
    });

    /**
     * Tests legal moves selector
     */
    it("should select legal moves for a square", () => {
      const e2Moves = gameSelectors.selectLegalMoves("e2")(store.getState());

      expect(e2Moves).toHaveLength(2); // e3 and e4
      // Check if moves are objects or strings
      if (typeof e2Moves[0] === 'object') {
        expect(e2Moves.map((m: any) => m.to)).toContain("e3");
        expect(e2Moves.map((m: any) => m.to)).toContain("e4");
      } else {
        expect(e2Moves).toContain("e3");
        expect(e2Moves).toContain("e4");
      }
    });

    /**
     * Tests legal moves for invalid square
     */
    it("should return empty array for invalid square", () => {
      const moves = gameSelectors.selectLegalMoves("invalid")(store.getState());
      expect(moves).toEqual([]);
    });

    /**
     * Tests legal moves when no game
     */
    it("should return empty array when no game", () => {
      const emptyStore = createTestStore();
      const moves = gameSelectors.selectLegalMoves("e2")(emptyStore.getState());
      expect(moves).toEqual([]);
    });
  });

  describe("Integration Scenarios", () => {
    /**
     * Tests a complete game scenario
     */
    it("should handle a complete game workflow", () => {
      store.getState().initializeGame(testPositions.starting);

      // Opening moves
      store.getState().makeMove("e4");
      store.getState().makeMove("c5"); // Sicilian Defense
      store.getState().makeMove("Nf3");

      // Navigate back
      store.getState().goToMove(0);
      expect(store.getState().currentFen).toContain("4P3"); // e4 pawn in FEN

      // Try different variation
      store.getState().makeMove("e5"); // Different response

      const state = store.getState();
      expect(state.moveHistory).toHaveLength(2);
      expect(state.moveHistory[1].san).toBe("e5");
    });

    /**
     * Tests that game state updates correctly during play
     */
    it("should update game state correctly during play", () => {
      store.getState().initializeGame(testPositions.starting);

      // Make some moves
      const move1 = store.getState().makeMove("e4");
      expect(move1).not.toBeNull();
      expect(store.getState().isGameFinished).toBe(false);

      const move2 = store.getState().makeMove("e5");
      expect(move2).not.toBeNull();

      // Verify state consistency
      const state = store.getState();
      // game property removed - Chess instance now managed by ChessService
      expect(state.moveHistory).toHaveLength(2);
      expect(state.currentMoveIndex).toBe(1);
      expect(state.isGameFinished).toBe(false);
      expect(state.gameResult).toBeNull();
    });
  });
});
