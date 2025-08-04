/**
 * Tests for ErrorService
 *
 * Tests cover:
 * - Singleton pattern behavior
 * - Error handling methods (tablebase, UI, network)
 * - Internal error log management
 * - Error statistics
 * - User message generation
 * - Logger integration (mocked)
 */

import { ErrorService, ErrorType } from "@shared/services/errorService";
import { getLogger } from "@shared/services/logging/Logger";

// Mock the Logger module
jest.mock("@shared/services/logging/Logger", () => ({
  getLogger: jest.fn().mockReturnValue({
    setContext: jest.fn().mockReturnThis(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe("ErrorService", () => {
  let loggerMock: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Get the mocked logger instance
    loggerMock = getLogger();

    // Clear the error log before each test
    ErrorService.getInstance().clearErrorLog();
  });

  describe("Singleton Pattern", () => {
    it("should always return the same instance", () => {
      const instance1 = ErrorService.getInstance();
      const instance2 = ErrorService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("handleTablebaseError", () => {
    it("should log error and return German user message", () => {
      const error = new Error("Network timeout");
      const context = {
        component: "TrainingBoard",
        action: "evaluate-position",
      };

      const message = ErrorService.handleTablebaseError(error, context);

      // Check logger was called with correct parameters
      expect(loggerMock.error).toHaveBeenCalledWith(
        "Tablebase Error",
        error,
        expect.objectContaining({
          ...context,
          type: ErrorType.TABLEBASE,
          timestamp: expect.any(Date),
        }),
      );

      // Check German message
      expect(message).toBe(
        "Die Tablebase-Datenbank konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.",
      );
    });

    it("should handle missing context gracefully", () => {
      const error = new Error("API error");

      const message = ErrorService.handleTablebaseError(error);

      expect(loggerMock.error).toHaveBeenCalledWith(
        "Tablebase Error",
        error,
        expect.objectContaining({
          type: ErrorType.TABLEBASE,
          timestamp: expect.any(Date),
        }),
      );

      expect(message).toBe(
        "Die Tablebase-Datenbank konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.",
      );
    });

    it("should handle non-Error objects", () => {
      const errorString = "Simple error string";

      const message = ErrorService.handleTablebaseError(errorString as any);

      expect(loggerMock.error).toHaveBeenCalled();
      expect(message).toBe(
        "Die Tablebase-Datenbank konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.",
      );
    });
  });

  describe("handleUIError", () => {
    it("should log UI error with component name", () => {
      const error = new Error("Component render failed");
      const componentName = "ChessBoard";
      const context = { additionalData: { moveCount: 5 } };

      const message = ErrorService.handleUIError(error, componentName, context);

      expect(loggerMock.error).toHaveBeenCalledWith(
        `UI Error in ${componentName}`,
        error,
        expect.objectContaining({
          ...context,
          component: componentName,
          type: ErrorType.UI_COMPONENT,
          timestamp: expect.any(Date),
        }),
      );

      expect(message).toBe(
        "Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.",
      );
    });
  });

  describe("handleNetworkError", () => {
    it("should log network error and return appropriate message", () => {
      const error = new Error("Connection refused");
      const context = {
        action: "fetch-tablebase",
        additionalData: { url: "https://api.example.com", method: "GET" },
      };

      const message = ErrorService.handleNetworkError(error, context);

      expect(loggerMock.error).toHaveBeenCalledWith(
        "Network Error",
        error,
        expect.objectContaining({
          ...context,
          type: ErrorType.NETWORK,
          timestamp: expect.any(Date),
        }),
      );

      expect(message).toBe(
        "Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.",
      );
    });
  });

  describe("Error Log Management", () => {
    it("should store errors in internal log", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      ErrorService.handleUIError(error1, "Component1");
      ErrorService.handleNetworkError(error2);

      const stats = ErrorService.getInstance().getErrorStats();

      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByType[ErrorType.UI_COMPONENT]).toBe(1);
      expect(stats.errorsByType[ErrorType.NETWORK]).toBe(1);
    });

    it("should limit error log to 50 entries", () => {
      // Log 51 errors
      for (let i = 0; i < 51; i++) {
        ErrorService.handleTablebaseError(new Error(`Error ${i}`));
      }

      const stats = ErrorService.getInstance().getErrorStats();

      expect(stats.totalErrors).toBe(50);
    });

    it("should clear error log when requested", () => {
      ErrorService.handleUIError(new Error("Test error"), "TestComponent");

      let stats = ErrorService.getInstance().getErrorStats();
      expect(stats.totalErrors).toBe(1);

      ErrorService.getInstance().clearErrorLog();

      stats = ErrorService.getInstance().getErrorStats();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe("getErrorStats", () => {
    it("should return correct statistics", () => {
      // Log different types of errors
      ErrorService.handleTablebaseError(new Error("Tablebase error"));
      ErrorService.handleUIError(new Error("UI error 1"), "Component1");
      ErrorService.handleUIError(new Error("UI error 2"), "Component2");
      ErrorService.handleNetworkError(new Error("Network error"));

      const stats = ErrorService.getInstance().getErrorStats();

      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByType[ErrorType.TABLEBASE]).toBe(1);
      expect(stats.errorsByType[ErrorType.UI_COMPONENT]).toBe(2);
      expect(stats.errorsByType[ErrorType.NETWORK]).toBe(1);
      expect(stats.recentErrors).toHaveLength(4);

      // Check recent errors structure
      const recentError = stats.recentErrors[0];
      expect(recentError).toHaveProperty("type");
      expect(recentError).toHaveProperty("component");
      expect(recentError).toHaveProperty("timestamp");
      expect(recentError).toHaveProperty("message");
    });

    it("should handle empty error log", () => {
      const stats = ErrorService.getInstance().getErrorStats();

      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType).toEqual({});
      expect(stats.recentErrors).toEqual([]);
    });
  });

  describe("User Message Generation", () => {
    it("should return correct German messages for each error type", () => {
      // We'll use the private method indirectly through public methods
      const tablebaseMsg = ErrorService.handleTablebaseError(new Error("test"));
      expect(tablebaseMsg).toBe(
        "Die Tablebase-Datenbank konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.",
      );

      const uiMsg = ErrorService.handleUIError(new Error("test"), "Test");
      expect(uiMsg).toBe(
        "Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.",
      );

      const networkMsg = ErrorService.handleNetworkError(new Error("test"));
      expect(networkMsg).toBe(
        "Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle null error gracefully", () => {
      const message = ErrorService.handleTablebaseError(null as any);

      expect(loggerMock.error).toHaveBeenCalled();
      expect(message).toBe(
        "Die Tablebase-Datenbank konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.",
      );
    });

    it("should handle undefined error gracefully", () => {
      const message = ErrorService.handleUIError(undefined as any, "Component");

      expect(loggerMock.error).toHaveBeenCalled();
      expect(message).toBe(
        "Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.",
      );
    });

    it("should handle string errors", () => {
      const message = ErrorService.handleNetworkError("Network failed" as any);

      expect(loggerMock.error).toHaveBeenCalled();
      expect(message).toBe(
        "Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.",
      );
    });

    it("should handle errors with circular references", () => {
      const error: any = new Error("Circular error");
      error.circular = error; // Create circular reference

      const message = ErrorService.handleTablebaseError(error);

      expect(loggerMock.error).toHaveBeenCalled();
      expect(message).toBe(
        "Die Tablebase-Datenbank konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.",
      );
    });
  });
});
