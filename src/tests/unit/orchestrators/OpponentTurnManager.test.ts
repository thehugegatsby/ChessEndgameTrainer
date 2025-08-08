/**
 * @file Tests for OpponentTurnManager
 * @module tests/unit/orchestrators/OpponentTurnManager
 */

import { getOpponentTurnManager } from "@shared/store/orchestrators/handlePlayerMove/OpponentTurnHandler";
import { chessService } from "@shared/services/ChessService";
import { tablebaseService } from "@shared/services/TablebaseService";
import { handleTrainingCompletion } from "@shared/store/orchestrators/handlePlayerMove/move.completion";
import type { StoreApi } from "@shared/store/orchestrators/types";

// Mock dependencies
jest.mock("@shared/services/ChessService", () => ({
  chessService: {
    getFen: jest.fn(),
    turn: jest.fn(),
    move: jest.fn(),
    isGameOver: jest.fn(),
  },
}));

jest.mock("@shared/services/TablebaseService", () => ({
  tablebaseService: {
    getTopMoves: jest.fn(),
  },
}));

jest.mock("@shared/store/orchestrators/handlePlayerMove/move.completion");

// Mock timers
jest.useFakeTimers();

describe("OpponentTurnManager", () => {
  let mockApi: StoreApi;
  let mockState: any;
  const manager = getOpponentTurnManager();

  beforeEach(() => {
    // Create mock state
    mockState = {
      training: {
        isPlayerTurn: false,
        isOpponentThinking: true,
        currentPosition: { colorToTrain: "white" },
      },
      ui: {
        toasts: [],
      },
    };

    // Create mock StoreApi
    mockApi = {
      getState: jest.fn(() => mockState),
      setState: jest.fn((callback) => {
        // Apply Immer-style updates to mockState
        callback(mockState);
      }),
    };

    // Reset all mocks
    jest.clearAllMocks();
    
    // Cancel any existing timeouts
    manager.cancel();
  });

  afterEach(() => {
    manager.cancel();
    jest.clearAllTimers();
  });

  describe("cancel", () => {
    it("should cancel scheduled opponent turn", () => {
      // Schedule a turn first
      manager.schedule(mockApi, 100);
      
      // Cancel it
      manager.cancel();
      
      // Fast-forward time - should not execute
      jest.advanceTimersByTime(200);
      
      expect(chessService.getFen).not.toHaveBeenCalled();
    });

    it("should handle cancel when no timeout is active", () => {
      // Should not throw
      expect(() => manager.cancel()).not.toThrow();
    });
  });

  describe("schedule", () => {
    it("should schedule opponent turn with default delay", () => {
      manager.schedule(mockApi);
      
      expect(mockApi.getState).toHaveBeenCalled();
    });

    it("should schedule opponent turn with custom delay", () => {
      const customDelay = 1000;
      
      manager.schedule(mockApi, customDelay);
      
      expect(mockApi.getState).toHaveBeenCalled();
    });

    it("should cancel previous timeout before scheduling new one", () => {
      // Schedule first turn
      manager.schedule(mockApi, 100);
      
      // Schedule second turn - should cancel first
      manager.schedule(mockApi, 200);
      
      // Fast-forward past first delay but not second
      jest.advanceTimersByTime(150);
      
      // Should not have executed yet
      expect(chessService.getFen).not.toHaveBeenCalled();
      
      // Fast-forward past second delay
      jest.advanceTimersByTime(100);
      
      // Now should execute (mocked)
      expect(mockApi.getState).toHaveBeenCalled();
    });

    it("should not execute if cancelled before timeout", () => {
      manager.schedule(mockApi, 100);
      manager.cancel();
      
      jest.advanceTimersByTime(200);
      
      expect(chessService.getFen).not.toHaveBeenCalled();
    });

    it("should not execute if state shows player turn", async () => {
      // Set state to player's turn
      mockState.training.isPlayerTurn = true;
      
      manager.schedule(mockApi, 0);
      
      // Fast-forward
      jest.advanceTimersByTime(100);
      
      // Should not fetch moves since it's player's turn
      expect(chessService.getFen).not.toHaveBeenCalled();
    });
  });

  describe("executeOpponentTurn integration", () => {
    beforeEach(() => {
      (chessService.getFen as jest.Mock).mockReturnValue("test-fen");
      (chessService.isGameOver as jest.Mock).mockReturnValue(false);
      (chessService.move as jest.Mock).mockReturnValue({
        san: "Kd7",
        from: "d6",
        to: "d7",
      });
      
      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: true,
        moves: [
          { san: "Kd7", wdl: -1000, dtm: -27, category: "loss" },
          { san: "Kc7", wdl: -1000, dtm: -15, category: "loss" },
        ],
      });
    });

    it("should execute opponent move when conditions are met", async () => {
      manager.schedule(mockApi, 0);
      
      // Fast-forward to trigger execution
      await jest.runOnlyPendingTimersAsync();
      
      expect(tablebaseService.getTopMoves).toHaveBeenCalledWith("test-fen", 10);
      expect(chessService.move).toHaveBeenCalledWith("Kd7");
    });

    it("should handle tablebase unavailable", async () => {
      (tablebaseService.getTopMoves as jest.Mock).mockResolvedValue({
        isAvailable: false,
        moves: [],
      });
      
      manager.schedule(mockApi, 0);
      
      await jest.runOnlyPendingTimersAsync();
      
      expect(chessService.move).not.toHaveBeenCalled();
      expect(mockApi.setState).toHaveBeenCalled();
    });

    it("should handle game over after opponent move", async () => {
      (chessService.isGameOver as jest.Mock).mockReturnValue(true);
      
      manager.schedule(mockApi, 0);
      
      await jest.runOnlyPendingTimersAsync();
      
      expect(handleTrainingCompletion).toHaveBeenCalledWith(mockApi, false);
    });

    it("should handle move execution failure", async () => {
      (chessService.move as jest.Mock).mockReturnValue(null);
      
      manager.schedule(mockApi, 0);
      
      await jest.runOnlyPendingTimersAsync();
      
      // Should set error state
      expect(mockApi.setState).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should call completion callback if provided", async () => {
      const onComplete = jest.fn();
      
      manager.schedule(mockApi, 0, { onOpponentMoveComplete: onComplete });
      
      await jest.runOnlyPendingTimersAsync();
      
      expect(onComplete).toHaveBeenCalled();
    });

    it("should handle completion callback errors", async () => {
      const onComplete = jest.fn().mockRejectedValue(new Error("Callback error"));
      
      manager.schedule(mockApi, 0, { onOpponentMoveComplete: onComplete });
      
      await jest.runOnlyPendingTimersAsync();
      
      // Should not crash
      expect(onComplete).toHaveBeenCalled();
    });
  });
});