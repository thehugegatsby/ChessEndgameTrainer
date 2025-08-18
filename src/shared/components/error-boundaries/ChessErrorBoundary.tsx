/**
 * Chess Error Boundary Component
 * 
 * Provides comprehensive error handling for chess-related components.
 * Catches JavaScript errors anywhere in the chess UI tree, logs them,
 * and displays a fallback UI instead of the whole app crashing.
 * 
 * Key features:
 * - Catches rendering errors, event handler errors, and lifecycle errors
 * - Structured error logging with chess-specific context
 * - User-friendly fallback UI with recovery options
 * - Automatic retry mechanisms
 * - Error reporting integration
 */

'use client';

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { getLogger } from '@shared/services/logging';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ChessErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ChessErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class ChessErrorBoundary extends Component<
  ChessErrorBoundaryProps,
  ChessErrorBoundaryState
> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ChessErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChessErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || crypto.randomUUID();
    
    // Log the error with chess-specific context
    getLogger().error('[CHESS-ERROR-BOUNDARY] Chess interaction failed', {
      errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });

    // Update state with error details
    this.setState({
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry after 5 seconds for first error
    if (this.state.retryCount === 0) {
      this.resetTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, 5000);
    }
  }

  override componentDidUpdate(prevProps: ChessErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when specified props change
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => {
        return prevProps.resetKeys?.[index] !== key;
      });

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    getLogger().info('[CHESS-ERROR-BOUNDARY] Error boundary reset', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    });
  };

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    getLogger().info('[CHESS-ERROR-BOUNDARY] Manual retry attempted', {
      errorId: this.state.errorId,
      retryCount: newRetryCount
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: newRetryCount
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (error && errorInfo && errorId) {
      // In a real app, you would send this to your error reporting service
      const errorReport = {
        errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      };

      getLogger().info('[CHESS-ERROR-BOUNDARY] Error report generated', errorReport);
      
      // For development, copy to clipboard
      if (typeof window !== 'undefined' && window.navigator.clipboard) {
        window.navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
          .then(() => {
            alert('Error report copied to clipboard');
          })
          .catch(() => {
            console.log('Error report:', errorReport);
            alert('Error report logged to console');
          });
      }
    }
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ChessErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
          onReset={this.resetErrorBoundary}
          onReport={this.handleReportError}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// FALLBACK UI COMPONENT
// ============================================================================

interface ChessErrorFallbackProps {
  error: Error | null;
  errorId: string | null;
  retryCount: number;
  onRetry: () => void;
  onReset: () => void;
  onReport: () => void;
}

function ChessErrorFallback({
  error,
  errorId,
  retryCount,
  onRetry,
  onReset,
  onReport
}: ChessErrorFallbackProps) {
  const isRepeatedError = retryCount > 0;

  return (
    <div className="chess-error-boundary bg-red-50 border border-red-200 rounded-lg p-6 m-4">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-red-800">
            {isRepeatedError ? 'Persistenter Schachbrett-Fehler' : 'Schachbrett-Fehler'}
          </h3>
          <p className="text-sm text-red-600 mt-1">
            {isRepeatedError 
              ? 'Das Schachbrett hat wiederholt Probleme. Bitte lade die Seite neu.'
              : 'Ein Fehler ist beim Schachbrett aufgetreten. Wir versuchen es automatisch erneut.'
            }
          </p>
        </div>
      </div>

      {/* Error details for development */}
      {process.env.NODE_ENV === 'development' && error && (
        <div className="mb-4 p-3 bg-red-100 rounded border border-red-300">
          <h4 className="text-sm font-medium text-red-800 mb-2">Fehlerdetails (Development):</h4>
          <p className="text-xs text-red-700 font-mono break-all">
            {error.name}: {error.message}
          </p>
          {errorId && (
            <p className="text-xs text-red-600 mt-1">
              Error ID: {errorId}
            </p>
          )}
        </div>
      )}

      {/* Retry count indicator */}
      {retryCount > 0 && (
        <div className="mb-4 text-sm text-red-600">
          Fehlgeschlagene Versuche: {retryCount}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Erneut versuchen
        </button>

        <button
          onClick={onReset}
          className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Zurücksetzen
        </button>

        <button
          onClick={onReport}
          className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Fehler melden
        </button>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Seite neu laden
        </button>
      </div>

      {/* Help text */}
      <div className="mt-4 text-sm text-red-600">
        <p>
          Wenn das Problem weiterhin besteht, versuche diese Schritte:
        </p>
        <ol className="mt-2 ml-4 list-decimal list-inside space-y-1">
          <li>Lade die Seite vollständig neu (Strg+F5)</li>
          <li>Lösche den Browser-Cache</li>
          <li>Verwende einen anderen Browser</li>
          <li>Melde das Problem über "Fehler melden"</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================================
// CONVENIENCE WRAPPER
// ============================================================================

/**
 * Convenience wrapper component for common chess error boundary usage
 */
interface ChessErrorWrapperProps {
  children: ReactNode;
  resetKeys?: Array<string | number>;
}

export function ChessErrorWrapper({ children, resetKeys }: ChessErrorWrapperProps) {
  return (
    <ChessErrorBoundary
      resetOnPropsChange={true}
      {...(resetKeys && { resetKeys })}
    >
      {children}
    </ChessErrorBoundary>
  );
}