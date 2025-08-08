/**
 * TablebasePanel with Error Boundary
 *
 * @remarks
 * Wraps the TablebasePanel component with proper error handling
 * to gracefully handle any runtime errors in the tablebase display.
 */

import React from "react";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { TablebasePanel, type TablebasePanelProps } from "./TablebasePanel";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("TablebasePanelWithBoundary");

/**
 * Custom fallback UI for tablebase errors
 */
const TablebaseErrorFallback: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={`tablebase-panel ${className || ""}`}>
    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      Tablebase
    </div>
    <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <p className="font-medium mb-1">Fehler beim Laden der Tablebase-Daten</p>
      <p className="text-xs opacity-80">
        Bitte versuchen Sie es später erneut oder laden Sie die Seite neu.
      </p>
    </div>
  </div>
);

/**
 * TablebasePanel wrapped with error boundary
 */
export const TablebasePanelWithBoundary: React.FC<TablebasePanelProps> = (
  props,
) => {
  return (
    <ErrorBoundary
      fallback={<TablebaseErrorFallback className={props.className} />}
      onError={(error) => {
        logger.error("TablebasePanel error", error);
      }}
    >
      <TablebasePanel {...props} />
    </ErrorBoundary>
  );
};
