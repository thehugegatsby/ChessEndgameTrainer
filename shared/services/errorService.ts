/**
 * Centralized Error Handling Service
 *
 * Provides consistent error handling, logging, and user-friendly messages
 * across the application.
 */

import { getLogger } from "./logging";

/**
 *
 */
export enum ErrorType {
  TABLEBASE = "TABLEBASE",
  UI_COMPONENT = "UI_COMPONENT",
  NETWORK = "NETWORK",
  STORAGE = "STORAGE",
  VALIDATION = "VALIDATION",
}

/**
 *
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
   *
   */
  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Handle Tablebase errors with specific context
   * @param error
   * @param context
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
   * @param error
   * @param componentName
   * @param context
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
   * @param error
   * @param context
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
