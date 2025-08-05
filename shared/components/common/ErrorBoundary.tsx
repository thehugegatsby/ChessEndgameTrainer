/**
 * Generic Error Boundary Component
 *
 * @remarks
 * A reusable error boundary that catches JavaScript errors anywhere in the
 * component tree, logs them, and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("ErrorBoundary");

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to error reporting service
    logger.error("Component error caught by boundary", error, {
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div className="error-boundary-fallback p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Etwas ist schiefgelaufen
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">
              Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite
              neu.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-2">
                <summary className="text-xs text-red-500 cursor-pointer">
                  Fehlerdetails (nur in Entwicklung)
                </summary>
                <pre className="mt-1 text-xs text-red-500 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to reset error boundary from child components
 */
export function useErrorBoundary() {
  const [resetKey, setResetKey] = React.useState(0);

  const resetErrorBoundary = React.useCallback(() => {
    setResetKey((prev) => prev + 1);
  }, []);

  return { resetKey, resetErrorBoundary };
}
