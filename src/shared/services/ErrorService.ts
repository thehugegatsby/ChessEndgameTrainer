/**
 * Centralized Error Handling Service
 *
 * Provides consistent error handling, logging, and user-friendly messages
 * across the application.
 */

import { getLogger } from './logging';
import { STRING_OPERATIONS, PRIORITY_VALUES } from '@shared/constants';

/**
 * Error types for categorizing different error scenarios
 * @enum {string}
 * @remarks Used to provide context-specific error messages in German
 */
export enum ErrorType {
  TABLEBASE = 'TABLEBASE',
  UI_COMPONENT = 'UI_COMPONENT',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
}

/**
 * Recent error information for statistics reporting
 */
export interface RecentError {
  type?: ErrorType;
  component?: string;
  timestamp: Date;
  message: string;
}

/**
 * Error statistics summary
 */
export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  recentErrors: RecentError[];
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
  additionalData?: Record<string, string | number | boolean | Date>;
}

/**
 * Centralized Error Handling Service
 *
 * Provides a single point of error management across the application.
 * Handles different error types, logs them internally, and returns
 * user-friendly German error messages.
 *
 * @singleton
 * @example
 * // Get the singleton instance
 * const errorService = ErrorService.getInstance();
 *
 * @example
 * // Handle a tablebase error
 * try {
 *   await tablebaseService.getEvaluation(fen);
 * } catch (error) {
 *   const userMessage = ErrorService.handleTablebaseError(error, {
 *     component: 'TrainingBoard',
 *     action: 'evaluate-position'
 *   });
 *   showToast(userMessage, 'error');
 * }
 */
export class ErrorService {
  private static instance: ErrorService;
  private errorLog: Array<{
    error: Error;
    context: ErrorContext;
    timestamp: Date;
  }> = [];
  private logger = getLogger().setContext('ErrorService');

  /**
   * Gets the singleton instance of ErrorService.
   *
   * Creates a new instance on first call and returns the same
   * instance on subsequent calls. This ensures consistent error
   * handling and a single error log across the application.
   *
   * @returns {ErrorService} The singleton ErrorService instance
   * @example
   * const errorService = ErrorService.getInstance();
   * const stats = errorService.getErrorStats();
   */
  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Handles errors from tablebase operations.
   *
   * Processes errors that occur when interacting with the Lichess
   * tablebase API. Logs the error with context and returns a
   * user-friendly German message.
   *
   * Side effects:
   * - Logs the error via Logger service with ERROR level
   * - Adds the error to internal error log
   *
   * @static
   * @param {Error} error - The error object from tablebase operations
   * @param {ErrorContext} [context={}] - Additional context for debugging
   * @param {string} [context.component] - Component where error occurred
   * @param {string} [context.action] - Action that triggered the error
   * @param {Record<string, any>} [context.additionalData] - Extra debug data
   * @returns {string} User-friendly German error message
   *
   * @example
   * try {
   *   await tablebaseService.getEvaluation(fen);
   * } catch (error) {
   *   const message = ErrorService.handleTablebaseError(error, {
   *     component: "TrainingBoard",
   *     action: "evaluate-position",
   *     additionalData: { fen, pieceCount: 7 }
   *   });
   *   showToast(message, "error");
   * }
   *
   * @remarks
   * Common tablebase errors include:
   * - Network timeout: "Request timeout after retries"
   * - Invalid FEN: "Invalid FEN: <details>"
   * - Rate limiting: "API error: 429"
   * - Too many pieces: Position has >7 pieces
   */
  static handleTablebaseError(error: Error, context: ErrorContext = {}): string {
    const service = ErrorService.getInstance();
    const enhancedContext = {
      ...context,
      type: ErrorType.TABLEBASE,
      timestamp: new Date(),
    };

    service.logger.error('Tablebase Error', error, enhancedContext);

    service.logError(error, enhancedContext);
    return service.getUserFriendlyMessage(ErrorType.TABLEBASE);
  }

  /**
   * Handles errors from UI components.
   *
   * Processes errors that occur in React components, including render
   * errors, state update issues, and prop validation failures. Logs the
   * error with component context and returns a user-friendly German message.
   *
   * Side effects:
   * - Logs the error via Logger service with ERROR level
   * - Adds the error to internal error log with component name
   *
   * @static
   * @param {Error} error - The error object from React component
   * @param {string} componentName - Name of the component that errored
   * @param {ErrorContext} [context={}] - Additional debugging context
   * @param {string} [context.action] - User action that triggered the error
   * @param {Record<string, any>} [context.additionalData] - Extra debug data (e.g., ErrorInfo from React)
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
   * @example
   * // In event handler
   * try {
   *   handleSquareClick(square);
   * } catch (error) {
   *   const message = ErrorService.handleUIError(error, "TrainingBoard", {
   *     action: "square-click",
   *     additionalData: { square, position: currentPosition }
   *   });
   *   showToast(message, "error");
   * }
   *
   * @remarks
   * Common UI errors include:
   * - State update on unmounted component
   * - Invalid props passed to component
   * - Chess.js move validation failures
   * - Render errors from missing data
   * - Event handler exceptions
   */
  static handleUIError(error: Error, componentName: string, context: ErrorContext = {}): string {
    const service = ErrorService.getInstance();
    const enhancedContext = {
      ...context,
      component: componentName,
      type: ErrorType.UI_COMPONENT,
      timestamp: new Date(),
    };

    service.logger.error(`UI Error in ${componentName}`, error, enhancedContext);

    service.logError(error, enhancedContext);
    return service.getUserFriendlyMessage(ErrorType.UI_COMPONENT);
  }

  /**
   * Handles network and API communication errors.
   *
   * Processes errors that occur during network requests, including
   * timeouts, connection failures, and API response errors. Logs the
   * error with request context and returns a user-friendly German message.
   *
   * Side effects:
   * - Logs the error via Logger service with ERROR level
   * - Adds the error to internal error log with network context
   *
   * @static
   * @param {Error} error - Network or API error object
   * @param {ErrorContext} [context={}] - Additional context for debugging
   * @param {string} [context.component] - Component making the request
   * @param {string} [context.action] - Action that triggered the request
   * @param {Record<string, any>} [context.additionalData] - Extra debug data (URL, method, headers)
   * @returns {string} User-friendly German error message
   *
   * @example
   * // In async fetch call
   * try {
   *   const response = await fetch(url);
   *   return await response.json();
   * } catch (error) {
   *   const message = ErrorService.handleNetworkError(error, {
   *     action: "fetch-tablebase",
   *     additionalData: { url, method: "GET" }
   *   });
   *   return { error: message };
   * }
   *
   * @example
   * // With AbortController for timeout
   * const controller = new AbortController();
   * const timeout = setTimeout(() => controller.abort(), 5000);
   *
   * try {
   *   const response = await fetch(url, { signal: controller.signal });
   *   return await response.json();
   * } catch (error) {
   *   const message = ErrorService.handleNetworkError(error, {
   *     component: "TablebaseService",
   *     action: "evaluate-position",
   *     additionalData: {
   *       url,
   *       timeout: 5000,
   *       aborted: error.name === 'AbortError'
   *     }
   *   });
   *   throw new Error(message);
   * } finally {
   *   clearTimeout(timeout);
   * }
   *
   * @remarks
   * Common network errors include:
   * - AbortError: Request timeout or manual abort
   * - TypeError: Network failure (no connection)
   * - HTTP 429: Rate limit exceeded
   * - HTTP 503: Service temporarily unavailable
   * - HTTP 500: Server error
   * - CORS errors: Cross-origin request blocked
   */
  static handleNetworkError(error: Error, context: ErrorContext = {}): string {
    const service = ErrorService.getInstance();
    const enhancedContext = {
      ...context,
      type: ErrorType.NETWORK,
      timestamp: new Date(),
    };

    service.logger.error('Network Error', error, enhancedContext);

    service.logError(error, enhancedContext);
    return service.getUserFriendlyMessage(ErrorType.NETWORK);
  }

  /**
   * Logs an error to the internal error log.
   *
   * Maintains a rolling log of the last 50 errors for debugging
   * and monitoring purposes. Older errors are automatically removed
   * when the limit is exceeded.
   *
   * @private
   * @param {Error} error - The error object to log
   * @param {ErrorContext} context - Additional context information
   */
  private logError(error: Error, context: ErrorContext): void {
    this.errorLog.push({
      error,
      context,
      timestamp: new Date(),
    });

    // Keep only last N errors in memory
    if (this.errorLog.length > STRING_OPERATIONS.ERROR_TRUNCATE_LENGTH) {
      this.errorLog.shift();
    }
  }

  /**
   * Gets a user-friendly German error message based on error type.
   *
   * Returns localized messages suitable for display to end users.
   * Technical error details are logged separately and not exposed
   * to users for security and usability reasons.
   *
   * @private
   * @param {ErrorType} type - The category of error
   * @param {Error} _error - The error object (unused, for future extension)
   * @returns {string} A German error message suitable for user display
   */
  private getUserFriendlyMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.TABLEBASE:
        return 'Die Tablebase-Datenbank konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.';

      case ErrorType.UI_COMPONENT:
        return 'Ein Problem mit der Benutzeroberfläche ist aufgetreten. Bitte versuchen Sie es erneut.';

      case ErrorType.NETWORK:
        return 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.';

      case ErrorType.STORAGE:
        return 'Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.';

      case ErrorType.VALIDATION:
        return 'Ungültige Eingabe. Bitte überprüfen Sie Ihre Eingaben.';

      default:
        return 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
    }
  }

  /**
   * Gets statistics about logged errors.
   *
   * Provides a summary of all errors in the internal log, grouped
   * by type and including recent error details. Useful for debugging
   * and monitoring application health.
   *
   * @returns {Object} Error statistics including:
   *   - totalErrors: Total number of errors in log
   *   - errorsByType: Count of errors grouped by ErrorType
   *   - recentErrors: Array of last 5 errors with details
   * @example
   * import { getLogger } from '@shared/services/logging/Logger';
   * const logger = getLogger();
   * const stats = errorService.getErrorStats();
   * logger.info(`Total errors: ${stats.totalErrors}`);
   * logger.info(`UI errors: ${stats.errorsByType.UI_COMPONENT || 0}`);
   */
  getErrorStats(): ErrorStats {
    const stats = this.errorLog.reduce(
      (acc, log) => {
        const type = log.context.type || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalErrors: this.errorLog.length,
      errorsByType: stats,
      recentErrors: this.errorLog.slice(PRIORITY_VALUES.ERROR_PRIORITY_OFFSET).map(log => ({
        ...log.context,
        timestamp: log.timestamp,
        message: log.error.message,
      })),
    };
  }

  /**
   * Clears all errors from the internal log.
   *
   * Resets the error tracking to a clean state. Primarily used
   * for testing, but can also be used to reset error tracking
   * after exporting or processing error data.
   *
   * @returns {void}
   * @example
   * // Export errors then clear
   * const stats = errorService.getErrorStats();
   * await sendErrorReport(stats);
   * errorService.clearErrorLog();
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}
