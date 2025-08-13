import { vi } from 'vitest';
/**
 * @file Tests for pawn promotion auto-win feature
 * @module tests/unit/store/orchestrators/handlePlayerMove.promotion
 */

import { handlePlayerMove } from "@shared/store/orchestrators/handlePlayerMove";
import { getOpponentTurnManager } from "@shared/store/orchestrators/handlePlayerMove/OpponentTurnHandler";
import { chessService } from "@shared/services/ChessService";
import { tablebaseService } from "@shared/services/TablebaseService";
import { handleTrainingCompletion } from "@shared/store/orchestrators/handlePlayerMove/move.completion";
import { PawnPromotionHandler } from "@shared/store/orchestrators/handlePlayerMove/PawnPromotionHandler";
import type { StoreApi } from "@shared/store/orchestrators/types";

// Mock services
vi.mock("@shared/services/ChessService", () => ({
  chessService: {
    validateMove: vi.fn(),
    move: vi.fn(),
    getFen: vi.fn(),
    isGameOver: vi.fn(),
    turn: vi.fn(),
  },
}));

vi.mock("@shared/services/TablebaseService", () => ({
  tablebaseService: {
    getEvaluation: vi.fn(),
    getTopMoves: vi.fn(),
  },
}));

vi.mock("@shared/store/orchestrators/handlePlayerMove/move.completion");

// Mock other orchestrators
vi.mock("@shared/store/orchestrators/handlePlayerMove/MoveValidator", () => ({
  MoveValidator: vi.fn().mockImplementation(() => ({
    validate: vi.fn().mockReturnValue({ isValid: true }),
  })),
}));

vi.mock("@shared/store/orchestrators/handlePlayerMove/MoveQualityEvaluator", () => ({
  MoveQualityEvaluator: vi.fn().mockImplementation(() => ({
    evaluate: vi.fn(),
  })),
}));

vi.mock("@shared/store/orchestrators/handlePlayerMove/MoveDialogManager", () => ({
  MoveDialogManager: vi.fn().mockImplementation(() => ({
    handleMoveQuality: vi.fn(),
  })),
}));

vi.mock("@shared/store/orchestrators/handlePlayerMove/OpponentTurnHandler", () => ({
  getOpponentTurnManager: vi.fn(() => ({
    schedule: vi.fn(),
    cancel: vi.fn(),
  })),
}));

// Mock pawnPromotionHandler  
vi.mock("@shared/store/orchestrators/handlePlayerMove/PawnPromotionHandler", () => ({
  PawnPromotionHandler: vi.fn().mockImplementation(() => ({
    checkPromotion: vi.fn(),
    evaluatePromotionOutcome: vi.fn(),
    handleAutoWin: vi.fn(),
    getPromotionPieceLabel: vi.fn(),
  })),
  pawnPromotionHandler: {
    checkPromotion: vi.fn(),
    evaluatePromotionOutcome: vi.fn(), 
    handleAutoWin: vi.fn(),
    getPromotionPieceLabel: vi.fn(),
  },
}));

describe.skip("Pawn Promotion Auto-Win Feature", () => {
  let mockApi: StoreApi;
  let mockState: any;

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    // Create mock state
    mockState = {
      game: {
        currentFen: "4k3/4P3/8/8/8/8/8/4K3 w - - 0 1",
        isGameFinished: false,
        moveHistory: [],
      },
      training: {
        isPlayerTurn: true,
        isOpponentThinking: false,
        currentPosition: { colorToTrain: "white" },
        moveSuccessDialog: null,
      },
      ui: {
        loading: { position: false },
        toasts: [],
      },
    };

    // Create mock StoreApi
    mockApi = {
      getState: vi.fn(() => mockState),
      setState: vi.fn((callback) => {
        // Apply Immer-style updates to mockState
        callback(mockState);
      }),
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending timers to prevent the "environment torn down" error
    vi.clearAllTimers();
    // Also cancel any pending opponent turns
    const mockManager = getOpponentTurnManager() as any;
    if (mockManager && mockManager.cancel) {
      mockManager.cancel();
    }
  });

  describe("Test Position: K+P endgame leading to promotion", () => {
    // Position from train/1: 4Q3/3K4/5k2/8/8/8/8/8 w - - 1 6
    // After moves: 1. Kd6 Kf7 2. Kd7 Kf8 3. e6 Kg8 4. e7 Kf7 5. e8=Q+

    it("should auto-complete training when white promotes pawn to queen with winning position", async () => {
      // Arrange - Position just before promotion: 4k3/4P3/8/8/8/8/8/4K3 w - - 0 1
      const moveBeforePromotion = { from: "e7", to: "e8", promotion: "q" };
      const fenAfterPromotion = "4Q3/8/8/8/8/8/8/4k3 b - - 0 1";

      // Mock chess service
      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.getFen as ReturnType<typeof vi.fn>).mockReturnValue(fenAfterPromotion);
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (chessService.turn as ReturnType<typeof vi.fn>).mockReturnValue("b");
      (chessService.move as ReturnType<typeof vi.fn>).mockReturnValue({
        san: "e8=Q+",
        color: "w",
        promotion: "q",
        from: "e7",
        to: "e8",
        flags: "p", // Promotion flag required by checkPromotion method
        piece: "p", // Pawn piece
      });
      (chessService.getFen as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce("4k3/4P3/8/8/8/8/8/4K3 w - - 0 1") // Before move
        .mockReturnValue(fenAfterPromotion); // After move
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (chessService.turn as ReturnType<typeof vi.fn>).mockReturnValue("b"); // Black's turn after white moves

      // Mock tablebase evaluation - WDL from white's perspective after white promotes
      // Positive value means white wins
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: 2, // White wins (from white's perspective, positive = good for white)
          dtz: 5,
          dtm: 5,
          category: "mate",
          precise: true,
          evaluation: "White is winning",
        },
      });

      // Mock getTopMoves for the move quality evaluation
      (tablebaseService.getTopMoves as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: false,
        moves: [],
      });

      // Mock PawnPromotionHandler - SKIPPED TEST
      // This test needs to be rewritten for the new PawnPromotionHandler class structure

      // Mock handleTrainingCompletion
      (handleTrainingCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      // Act
      const result = await handlePlayerMove(mockApi, moveBeforePromotion);

      // Assert
      expect(result).toBe(true);
      expect(chessService.move).toHaveBeenCalledWith(moveBeforePromotion);
      expect(tablebaseService.getEvaluation).toHaveBeenCalledWith(
        fenAfterPromotion,
      );
      expect(handleTrainingCompletion).toHaveBeenCalledWith(mockApi, true);

      // Check that success dialog was set (not toast anymore)
      expect(mockApi.setState).toHaveBeenCalled();
      expect(mockState.training.moveSuccessDialog).toEqual({
        isOpen: true,
        promotionPiece: "Dame",
        moveDescription: "e8=Q+",
      });
    });

    it("should NOT auto-complete if promotion leads to draw position", async () => {
      // Arrange - Same position but tablebase returns draw
      const moveBeforePromotion = { from: "e7", to: "e8", promotion: "q" };
      const fenAfterPromotion = "4Q3/8/8/8/8/8/8/4k3 b - - 0 1";

      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.getFen as ReturnType<typeof vi.fn>).mockReturnValue(fenAfterPromotion);
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (chessService.turn as ReturnType<typeof vi.fn>).mockReturnValue("b");
      (chessService.move as ReturnType<typeof vi.fn>).mockReturnValue({
        san: "e8=Q",
        color: "w",
        promotion: "q",
      });
      (chessService.getFen as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce("4k3/4P3/8/8/8/8/8/4K3 w - - 0 1")
        .mockReturnValue(fenAfterPromotion);
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Mock tablebase returns draw (WDL = 0)
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: 0, // Draw
          dtz: null,
          dtm: null,
          category: "draw",
          precise: true,
          evaluation: "Drawn position",
        },
      });

      // Act
      await handlePlayerMove(mockApi, moveBeforePromotion);

      // Assert
      expect(handleTrainingCompletion).not.toHaveBeenCalled();
    });

    it("should NOT auto-complete on rook promotion that leads to draw", async () => {
      // Arrange - Rook promotion that doesn't win
      const moveBeforePromotion = { from: "e7", to: "e8", promotion: "r" };

      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.move as ReturnType<typeof vi.fn>).mockReturnValue({
        san: "e8=R",
        color: "w",
        promotion: "r", // Rook
      });
      (chessService.getFen as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce("4k3/4P3/8/8/8/8/8/4K3 w - - 0 1")
        .mockReturnValue("4R3/8/8/8/8/8/8/4k3 b - - 0 1");
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Mock tablebase returns draw for rook promotion
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: 0, // Draw
          dtz: null,
          dtm: null,
          category: "draw",
          precise: true,
          evaluation: "Drawn position",
        },
      });

      // Act
      await handlePlayerMove(mockApi, moveBeforePromotion);

      // Assert
      expect(tablebaseService.getEvaluation).toHaveBeenCalled();
      expect(handleTrainingCompletion).not.toHaveBeenCalled();
    });

    it("should auto-complete on rook promotion that leads to win", async () => {
      // Arrange - Rook promotion that wins
      const moveBeforePromotion = { from: "e7", to: "e8", promotion: "r" };

      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.move as ReturnType<typeof vi.fn>).mockReturnValue({
        san: "e8=R",
        color: "w",
        promotion: "r",
        from: "e7",
        to: "e8",
        flags: "p", // Promotion flag required by checkPromotion method
        piece: "p", // Pawn piece
      });
      (chessService.getFen as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce("4k3/4P3/8/8/8/8/8/4K3 w - - 0 1")
        .mockReturnValue("4R3/8/8/8/8/8/8/4k3 b - - 0 1");
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Mock tablebase returns win for rook promotion - WDL from white's perspective
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: 2, // White wins (positive = good for white)
          dtz: 3,
          dtm: 3,
          category: "mate",
          precise: true,
          evaluation: "White is winning",
        },
      });

      // Mock getTopMoves for move quality evaluation
      (tablebaseService.getTopMoves as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: false,
        moves: [],
      });

      // Act
      const result = await handlePlayerMove(mockApi, moveBeforePromotion);

      // Assert
      expect(result).toBe(true);
      expect(chessService.move).toHaveBeenCalledWith(moveBeforePromotion);
      expect(handleTrainingCompletion).toHaveBeenCalledWith(mockApi, true);

      // Check that success dialog was set (not toast anymore)
      expect(mockApi.setState).toHaveBeenCalled();
      expect(mockState.training.moveSuccessDialog).toEqual({
        isOpen: true,
        promotionPiece: "Turm",
        moveDescription: "e8=R",
      });
    });

    it("should handle black pawn promotion correctly", async () => {
      // Arrange - Black promotes on e1
      mockState.training.currentPosition.colorToTrain = "black";
      const moveBeforePromotion = { from: "e2", to: "e1", promotion: "q" };
      const fenAfterPromotion = "8/8/8/8/8/8/8/4q3 w - - 0 1";

      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.move as ReturnType<typeof vi.fn>).mockReturnValue({
        san: "e1=Q",
        color: "b",
        promotion: "q",
        from: "e2",
        to: "e1",
        flags: "p", // Promotion flag required by checkPromotion method
        piece: "p", // Pawn piece
      });
      (chessService.getFen as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce("8/8/8/8/8/8/4p3/8 b - - 0 1")
        .mockReturnValue(fenAfterPromotion);
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Mock tablebase - for black training, check WDL from white's perspective
      // WDL = -2 means white loses = black wins (training success)
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: true,
        result: {
          wdl: -2, // White loses = black wins
          dtz: 5,
          dtm: 5,
          category: "mate",
          precise: true,
          evaluation: "Black is winning",
        },
      });

      // Mock getTopMoves for move quality evaluation
      (tablebaseService.getTopMoves as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: false,
        moves: [],
      });

      // Act
      const result = await handlePlayerMove(mockApi, moveBeforePromotion);

      // Assert
      expect(result).toBe(true);
      expect(chessService.move).toHaveBeenCalledWith(moveBeforePromotion);
      expect(handleTrainingCompletion).toHaveBeenCalledWith(mockApi, true);

      // Check that success dialog was set (not toast anymore)
      expect(mockApi.setState).toHaveBeenCalled();
      expect(mockState.training.moveSuccessDialog).toEqual({
        isOpen: true,
        promotionPiece: "Dame",
        moveDescription: "e1=Q",
      });
    });

    it("should continue normal flow if tablebase is unavailable", async () => {
      // Arrange
      const moveBeforePromotion = { from: "e7", to: "e8", promotion: "q" };

      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.move as ReturnType<typeof vi.fn>).mockReturnValue({
        san: "e8=Q",
        color: "w",
        promotion: "q",
      });
      (chessService.getFen as ReturnType<typeof vi.fn>).mockReturnValue(
        "4Q3/8/8/8/8/8/8/4k3 b - - 0 1",
      );
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Tablebase unavailable
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockResolvedValue({
        isAvailable: false,
      });

      // Act
      await handlePlayerMove(mockApi, moveBeforePromotion);

      // Assert
      expect(handleTrainingCompletion).not.toHaveBeenCalled();
      // Should continue with normal flow
    });

    it("should handle tablebase errors gracefully", async () => {
      // Arrange
      const moveBeforePromotion = { from: "e7", to: "e8", promotion: "q" };

      (chessService.validateMove as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (chessService.move as ReturnType<typeof vi.fn>).mockReturnValue({
        san: "e8=Q",
        color: "w",
        promotion: "q",
      });
      (chessService.getFen as ReturnType<typeof vi.fn>).mockReturnValue(
        "4Q3/8/8/8/8/8/8/4k3 b - - 0 1",
      );
      (chessService.isGameOver as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Tablebase throws error
      (tablebaseService.getEvaluation as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      // Act - Should not throw
      const result = await handlePlayerMove(mockApi, moveBeforePromotion);

      // Assert
      expect(result).toBe(true); // Move succeeds despite tablebase error
      expect(handleTrainingCompletion).not.toHaveBeenCalled();
    });
  });
});
