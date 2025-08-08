/**
 * @file Tests for MoveDialogManager
 * @module tests/unit/orchestrators/MoveDialogManager
 */

import { MoveDialogManager } from "@shared/store/orchestrators/handlePlayerMove/MoveDialogManager";
import { getLogger } from "@shared/services/logging";
import type { StoreApi } from "@shared/store/orchestrators/types";

// Mock dependencies
jest.mock("@shared/services/logging", () => ({
  getLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("MoveDialogManager", () => {
  let dialogManager: MoveDialogManager;
  let mockLogger: any;
  let mockApi: StoreApi;
  let mockState: any;

  beforeEach(() => {
    dialogManager = new MoveDialogManager();
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    (getLogger as jest.Mock).mockReturnValue(mockLogger);

    // Create mock state and API
    mockState = {
      training: {
        moveErrorDialog: null,
      },
      ui: {
        toasts: [],
      },
    };

    mockApi = {
      getState: jest.fn(() => mockState),
      setState: jest.fn((callback) => {
        callback(mockState);
      }),
    };

    jest.clearAllMocks();
  });

  describe("showMoveErrorDialog", () => {
    it("should show move error dialog with all parameters", () => {
      const wdlBefore = 1000;
      const wdlAfter = 0;
      const bestMove = "Nf3";

      dialogManager.showMoveErrorDialog(mockApi, wdlBefore, wdlAfter, bestMove);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[MoveDialog] Showing move error dialog:",
        {
          wdlBefore,
          wdlAfter,
          bestMove,
        },
      );

      expect(mockApi.setState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockState.training.moveErrorDialog).toEqual({
        isOpen: true,
        wdlBefore,
        wdlAfter,
        bestMove,
      });
    });

    it("should show move error dialog without best move", () => {
      const wdlBefore = 500;
      const wdlAfter = -200;

      dialogManager.showMoveErrorDialog(mockApi, wdlBefore, wdlAfter);

      expect(mockState.training.moveErrorDialog).toEqual({
        isOpen: true,
        wdlBefore,
        wdlAfter,
        bestMove: undefined,
      });
    });

    it("should handle negative WDL values", () => {
      const wdlBefore = -500;
      const wdlAfter = -1000;
      const bestMove = "Ke2";

      dialogManager.showMoveErrorDialog(mockApi, wdlBefore, wdlAfter, bestMove);

      expect(mockState.training.moveErrorDialog).toEqual({
        isOpen: true,
        wdlBefore,
        wdlAfter,
        bestMove,
      });
    });

    it("should handle zero WDL values", () => {
      const wdlBefore = 0;
      const wdlAfter = 0;

      dialogManager.showMoveErrorDialog(mockApi, wdlBefore, wdlAfter);

      expect(mockState.training.moveErrorDialog).toEqual({
        isOpen: true,
        wdlBefore,
        wdlAfter,
        bestMove: undefined,
      });
    });
  });

  describe("closeMoveErrorDialog", () => {
    it("should close move error dialog and reset values", () => {
      // First set a dialog
      mockState.training.moveErrorDialog = {
        isOpen: true,
        wdlBefore: 1000,
        wdlAfter: 0,
        bestMove: "Nf3",
      };

      dialogManager.closeMoveErrorDialog(mockApi);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[MoveDialog] Closing move error dialog",
      );

      expect(mockApi.setState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockState.training.moveErrorDialog).toEqual({
        isOpen: false,
        wdlBefore: 0,
        wdlAfter: 0,
        bestMove: undefined,
      });
    });

    it("should work even when no dialog is currently open", () => {
      dialogManager.closeMoveErrorDialog(mockApi);

      expect(mockState.training.moveErrorDialog).toEqual({
        isOpen: false,
        wdlBefore: 0,
        wdlAfter: 0,
        bestMove: undefined,
      });
    });
  });

  describe("showPromotionDialog", () => {
    it("should show promotion dialog and auto-promote to queen", () => {
      const callback = jest.fn();
      const from = "e7";
      const to = "e8";

      dialogManager.showPromotionDialog(mockApi, from, to, callback);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[MoveDialog] Showing promotion dialog:",
        { from, to },
      );

      expect(mockApi.setState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockState.ui.toasts).toHaveLength(1);
      expect(mockState.ui.toasts[0]).toEqual(
        expect.objectContaining({
          message: "Bauernumwandlung: e7-e8",
          type: "info",
        }),
      );

      expect(callback).toHaveBeenCalledWith("q");
    });

    it("should work with different square combinations", () => {
      const callback = jest.fn();

      const testCases = [
        { from: "a7", to: "a8" },
        { from: "h2", to: "h1" },
        { from: "d7", to: "d8" },
      ];

      for (const { from, to } of testCases) {
        jest.clearAllMocks();
        mockState.ui.toasts = []; // Reset toasts

        dialogManager.showPromotionDialog(mockApi, from, to, callback);

        expect(mockState.ui.toasts[0].message).toBe(
          `Bauernumwandlung: ${from}-${to}`,
        );
        expect(callback).toHaveBeenCalledWith("q");
      }
    });
  });

  describe("showConfirmationDialog", () => {
    it("should show confirmation dialog and auto-confirm", () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      const message = "Sind Sie sicher?";

      dialogManager.showConfirmationDialog(
        mockApi,
        message,
        onConfirm,
        onCancel,
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[MoveDialog] Showing confirmation dialog:",
        { message },
      );

      expect(mockApi.setState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockState.ui.toasts).toHaveLength(1);
      expect(mockState.ui.toasts[0]).toEqual(
        expect.objectContaining({
          message,
          type: "info",
        }),
      );

      expect(onConfirm).toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("should work with different message types", () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      const messages = [
        "Zug rückgängig machen?",
        "Position zurücksetzen?",
        "Training beenden?",
      ];

      for (const message of messages) {
        jest.clearAllMocks();
        mockState.ui.toasts = [];

        dialogManager.showConfirmationDialog(
          mockApi,
          message,
          onConfirm,
          onCancel,
        );

        expect(mockState.ui.toasts[0].message).toBe(message);
        expect(onConfirm).toHaveBeenCalled();
      }
    });
  });

  describe("formatWdlChange", () => {
    it("should format improvement correctly", () => {
      expect(dialogManager.formatWdlChange(-100, 200)).toBe(
        "Position verbessert sich um 300 Punkte",
      );
      expect(dialogManager.formatWdlChange(0, 500)).toBe(
        "Position verbessert sich um 500 Punkte",
      );
      expect(dialogManager.formatWdlChange(-500, -200)).toBe(
        "Position verbessert sich um 300 Punkte",
      );
    });

    it("should format deterioration correctly", () => {
      expect(dialogManager.formatWdlChange(200, -100)).toBe(
        "Position verschlechtert sich um 300 Punkte",
      );
      expect(dialogManager.formatWdlChange(500, 0)).toBe(
        "Position verschlechtert sich um 500 Punkte",
      );
      expect(dialogManager.formatWdlChange(0, -200)).toBe(
        "Position verschlechtert sich um 200 Punkte",
      );
    });

    it("should format no change correctly", () => {
      expect(dialogManager.formatWdlChange(100, 100)).toBe(
        "Position unverändert",
      );
      expect(dialogManager.formatWdlChange(0, 0)).toBe("Position unverändert");
      expect(dialogManager.formatWdlChange(-500, -500)).toBe(
        "Position unverändert",
      );
    });

    it("should handle very large WDL values", () => {
      expect(dialogManager.formatWdlChange(-2000, 2000)).toBe(
        "Position verbessert sich um 4000 Punkte",
      );
      expect(dialogManager.formatWdlChange(2000, -2000)).toBe(
        "Position verschlechtert sich um 4000 Punkte",
      );
    });

    it("should handle decimal WDL values", () => {
      expect(dialogManager.formatWdlChange(100.5, 200.3)).toBe(
        "Position verbessert sich um 99.8 Punkte",
      );
      expect(dialogManager.formatWdlChange(200.7, 100.2)).toBe(
        "Position verschlechtert sich um 100.5 Punkte",
      );
    });
  });

  describe("isSignificantWdlChange", () => {
    it("should detect significant changes with default threshold", () => {
      expect(dialogManager.isSignificantWdlChange(100, 102)).toBe(true); // Change: 2 >= 1
      expect(dialogManager.isSignificantWdlChange(100, 99)).toBe(false); // Change: -1 < 1 (absolute)
      expect(dialogManager.isSignificantWdlChange(100, 101)).toBe(true); // Change: 1 >= 1
      expect(dialogManager.isSignificantWdlChange(100, 100)).toBe(false); // Change: 0 < 1
    });

    it("should detect significant changes with custom threshold", () => {
      const threshold = 5;

      expect(dialogManager.isSignificantWdlChange(100, 106, threshold)).toBe(
        true,
      ); // Change: 6 >= 5
      expect(dialogManager.isSignificantWdlChange(100, 104, threshold)).toBe(
        false,
      ); // Change: 4 < 5
      expect(dialogManager.isSignificantWdlChange(100, 95, threshold)).toBe(
        true,
      ); // Change: -5 >= 5 (absolute)
      expect(dialogManager.isSignificantWdlChange(100, 96, threshold)).toBe(
        false,
      ); // Change: -4 < 5 (absolute)
    });

    it("should handle negative WDL values", () => {
      expect(dialogManager.isSignificantWdlChange(-100, -98)).toBe(true); // Change: 2 >= 1
      expect(dialogManager.isSignificantWdlChange(-100, -102)).toBe(true); // Change: -2 >= 1 (absolute)
      expect(dialogManager.isSignificantWdlChange(-100, -100.5)).toBe(false); // Change: -0.5 < 1 (absolute)
    });

    it("should handle zero threshold", () => {
      const threshold = 0;

      expect(dialogManager.isSignificantWdlChange(100, 100, threshold)).toBe(
        true,
      ); // Change: 0 >= 0
      expect(dialogManager.isSignificantWdlChange(100, 100.1, threshold)).toBe(
        true,
      ); // Any change >= 0
    });

    it("should handle very large threshold", () => {
      const threshold = 1000;

      expect(dialogManager.isSignificantWdlChange(100, 1100, threshold)).toBe(
        true,
      ); // Change: 1000 >= 1000
      expect(dialogManager.isSignificantWdlChange(100, 1099, threshold)).toBe(
        false,
      ); // Change: 999 < 1000
    });
  });

  describe("getMoveQualityDescription", () => {
    it("should return correct description for optimal moves", () => {
      const result = dialogManager.getMoveQualityDescription(true, false);
      expect(result).toBe(
        "Ausgezeichneter Zug! Dies ist einer der besten Züge in dieser Position.",
      );

      // Should prioritize optimal over outcome changed
      const result2 = dialogManager.getMoveQualityDescription(true, true);
      expect(result2).toBe(
        "Ausgezeichneter Zug! Dies ist einer der besten Züge in dieser Position.",
      );
    });

    it("should return correct description for suboptimal moves with outcome change", () => {
      const result = dialogManager.getMoveQualityDescription(false, true);
      expect(result).toBe(
        "Achtung! Dieser Zug verschlechtert deine Position erheblich.",
      );
    });

    it("should return correct description for suboptimal moves without outcome change", () => {
      const result = dialogManager.getMoveQualityDescription(false, false);
      expect(result).toBe(
        "Guter Zug, aber nicht optimal. Es gibt bessere Alternativen.",
      );
    });

    it("should handle all boolean combinations correctly", () => {
      const testCases = [
        {
          optimal: true,
          outcomeChanged: true,
          expected:
            "Ausgezeichneter Zug! Dies ist einer der besten Züge in dieser Position.",
        },
        {
          optimal: true,
          outcomeChanged: false,
          expected:
            "Ausgezeichneter Zug! Dies ist einer der besten Züge in dieser Position.",
        },
        {
          optimal: false,
          outcomeChanged: true,
          expected:
            "Achtung! Dieser Zug verschlechtert deine Position erheblich.",
        },
        {
          optimal: false,
          outcomeChanged: false,
          expected:
            "Guter Zug, aber nicht optimal. Es gibt bessere Alternativen.",
        },
      ];

      for (const { optimal, outcomeChanged, expected } of testCases) {
        const result = dialogManager.getMoveQualityDescription(
          optimal,
          outcomeChanged,
        );
        expect(result).toBe(expected);
      }
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete dialog workflow", () => {
      // Show error dialog
      dialogManager.showMoveErrorDialog(mockApi, 1000, 0, "Nf3");
      expect(mockState.training.moveErrorDialog.isOpen).toBe(true);

      // Close error dialog
      dialogManager.closeMoveErrorDialog(mockApi);
      expect(mockState.training.moveErrorDialog.isOpen).toBe(false);
    });

    it("should handle multiple toast messages", () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      // Add multiple dialogs that create toasts
      dialogManager.showPromotionDialog(mockApi, "e7", "e8", jest.fn());
      dialogManager.showConfirmationDialog(
        mockApi,
        "Test message",
        onConfirm,
        onCancel,
      );

      expect(mockState.ui.toasts).toHaveLength(2);
      expect(mockState.ui.toasts[0].message).toBe("Bauernumwandlung: e7-e8");
      expect(mockState.ui.toasts[1].message).toBe("Test message");
    });

    it("should format WDL changes consistently with dialog display", () => {
      const wdlBefore = 1000;
      const wdlAfter = -500;

      // Show dialog
      dialogManager.showMoveErrorDialog(mockApi, wdlBefore, wdlAfter);

      // Format change
      const changeDescription = dialogManager.formatWdlChange(
        wdlBefore,
        wdlAfter,
      );

      expect(mockState.training.moveErrorDialog.wdlBefore).toBe(wdlBefore);
      expect(mockState.training.moveErrorDialog.wdlAfter).toBe(wdlAfter);
      expect(changeDescription).toBe(
        "Position verschlechtert sich um 1500 Punkte",
      );
    });
  });
});