/**
 * Centralized Error Handling Service
 *
 * Provides consistent error handling, logging, and user-friendly messages
 * across the application.
 */

import { getLogger } from "./logging";

/**
 * Error types for categorizing different error scenarios
 * @enum {string}
 * @remarks Used to provide context-specific error messages in German
 */
export enum ErrorType {
  TABLEBASE = "TABLEBASE",
  UI_COMPONENT = "UI_COMPONENT",
  NETWORK = "NETWORK",
  STORAGE = "STORAGE",
  VALIDATION = "VALIDATION",
}

/**
 * Context information for error tracking and debugging
 * @interface ErrorContext
 * @property {string} [component] - Component where error occurred
 * @property {string} [action] - User action that triggered the error
 * @property {string} [user] - User identifier for error tracking
 * @property {Date} [timestamp] - When the error occurred
 * @property {ErrorType} [type] - Categorized error type
 * @property {Record<string, any>} [additionalData] - Extra debugging information
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  user?: string;
  timestamp?: Date;
  type?: ErrorType;
  additionalData?: Record<string, any>;
}

export class ErrorService {
  private static instance: ErrorService;
  private errorLog: Array<{
    error: Error;
    context: ErrorContext;
    timestamp: Date;
  }> = [];
  private logger = getLogger().setContext("ErrorService");

  /**
   * Get singleton instance of ErrorService
   * @returns {ErrorService} Singleton instance
   * @remarks Ensures single error handler across application
   */
  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Handle Tablebase errors with specific context
   * @param {Error} error - The error object from tablebase operations
   * @param {ErrorContext} context - Additional context for debugging
   * @returns {string} User-friendly German error message
   *
   * @example
   * try {
   *   await tablebaseService.getEvaluation(fen);
   * } catch (error) {
   *   const message = ErrorService.handleTablebaseError(error, {
   *     component: "TrainingBoard",
   *     action: "evaluate-position"
   *   });
   *   showToast(message, "error");
   * }
   *
   * @throws {Error} Common tablebase errors:
   * - Network timeout: "Request timeout after retries"
   * - Invalid FEN: "Invalid FEN: <details>"
   * - Rate limiting: "API error: 429"
   * - Too many pieces: Position has >7 pieces
   */
  static handleTablebaseError(error: Error, context: ErrorContext = {}) {
    const service = ErrorService.getInstance();
    const enhancedContext = {
      ...context,
      type: ErrorType.TABLEBASE,
      timestamp: new Date(),
    };

    service.logger.error("Tablebase Error", error, enhancedContext);

    service.logError(error, enhancedContext);
    return service.getUserFriendlyMessage(ErrorType.TABLEBASE, error);
  }

  /**
   * Handle UI Component errors
   * @param {Error} error - The error object from React component
   * @param {string} componentName - Name of the component that errored
   * @param {ErrorContext} context - Additional debugging context
   * @returns {string} User-friendly German error message
   *
   * @example
   * // In React Error Boundary
   * componentDidCatch(error: Error, errorInfo: ErrorInfo) {
   *   const message = ErrorService.handleUIError(error, "ChessBoard", {
   *     additionalData: errorInfo
   *   });
   *   this.setState({ errorMessage: message });
   * }
   *
   * @remarks
   * Common UI errors:
   * - State update on unmounted component
   * - Invalid props passed to component
   * - Chess.js move validation failures
   */
  static handleUIError(
    error: Error,
    componentName: string,
    context: ErrorContext = {},
  ) {
    const service = ErrorService.getInstance();
    const enhancedContext = {
      ...context,
      component: componentName,
      type: ErrorType.UI_COMPONENT,
      timestamp: new Date(),
    };

    service.logger.error(
      `UI Error in ${componentName}`,
      error,
      enhancedContext,
    );

    service.logError(error, enhancedContext);
    return service.getUserFriendlyMessage(ErrorType.UI_COMPONENT, error);
  }

  /**
   * Handle Network/API errors
   * @param {Error} error - Network or API error
   * @param {ErrorContext} context - Request context
   * @returns {string} User-friendly German error message
   *
   * @example
   * fetch(url)
   *   .catch(error => {
   *     const message = ErrorService.handleNetworkError(error, {
   *       action: "fetch-tablebase",
   *       additionalData: { url, method: "GET" }
   *     });
   *     return { error: message };
   *   });
   *
   * @throws {Error} Common network errors:
   * - AbortError: Request timeout
   * - TypeError: Network failure
   * - 429: Rate limit exceeded
   * - 503: Service unavailable
   */
  static handleNetworkError(error: Error, context: ErrorContext = {}) {
    const service = ErrorService.getInstance();
    const enhancedContext = {
      ...context,
      type: ErrorType.NETWORK,
      timestamp: new Date(),
    };

    service.logger.error("Network Error", error, enhancedContext);

    service.logError(error, enhancedContext);
    return service.getUserFriendlyMessage(ErrorType.NETWORK, error);
  }

  /**
   * Log error for debugging and potential reporting
   * @param error
   * @param context
   */
  private logError(error: Error, context: ErrorContext) {
    this.errorLog.push({
      error,
      context,
      timestamp: new Date(),
    });

    // Keep only last 50 errors in memory
    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }
  }

  /**
   * Get user-friendly error messages
   * @param type
   * @param _error
   */
  private getUserFriendlyMessage(type: ErrorType, _error: Error): string {
    switch (type) {
      case ErrorType.TABLEBASE:
        return "Die Tablebase-Datenbank konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.";

      case ErrorType.UI_COMPONENT:
        return "Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.";

      case ErrorType.NETWORK:
        return "Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.";

      case ErrorType.STORAGE:
        return "Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.";

      case ErrorType.VALIDATION:
        return "Ungültige Eingabe. Bitte überprüfen Sie Ihre Eingaben.";

      default:
        return "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
    }
  }

  /**
   * Get error statistics for debugging
   */
  getErrorStats() {
    const stats = this.errorLog.reduce(
      (acc, log) => {
        const type = log.context.type || "UNKNOWN";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalErrors: this.errorLog.length,
      errorsByType: stats,
      recentErrors: this.errorLog.slice(-5).map((log) => ({
        type: log.context.type,
        component: log.context.component,
        timestamp: log.timestamp,
        message: log.error.message,
      })),
    };
  }

  /**
   * Clear error log (useful for testing)
   */
  clearErrorLog() {
    this.errorLog = [];
  }
}
