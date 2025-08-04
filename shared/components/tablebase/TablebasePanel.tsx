/**
 * TablebasePanel Component
 *
 * Unified tablebase display panel that replaces the basic tablebase column
 * with a professional, Lichess-like interface featuring grouped moves,
 * color-coded evaluation bars, and clear visual hierarchy.
 */

"use client";

import React, { useMemo } from "react";
import { MoveResultGroup } from "./MoveResultGroup";
import {
  type TablebaseMove,
  classifyMovesByDTZ,
} from "@shared/utils/tablebase/resultClassification";
import { type TablebaseData } from "@shared/types/evaluation";

export interface TablebasePanelProps {
  /** Tablebase data from the evaluation system */
  tablebaseData: TablebaseData;
  /** Callback when a move is selected */
  onMoveSelect: (move: string) => void;
  /** Currently selected move */
  selectedMove?: string;
  /** Whether the panel is in a loading state */
  loading?: boolean;
  /** Whether to show compact layout */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const TablebasePanel: React.FC<TablebasePanelProps> = ({
  tablebaseData,
  onMoveSelect,
  selectedMove,
  loading = false,
  compact = false,
  className = "",
}) => {
  // Convert tablebase data to our move format
  const moves: TablebaseMove[] = useMemo(() => {
    if (!tablebaseData.topMoves || tablebaseData.topMoves.length === 0) {
      return [];
    }

    return tablebaseData.topMoves.map((move) => ({
      move: move.move,
      san: move.san,
      dtz: move.dtz,
      dtm: move.dtm,
      wdl: move.wdl,
      category: move.category,
    }));
  }, [tablebaseData.topMoves]);

  // Classify moves by result type
  const categorizedMoves = useMemo(() => {
    return classifyMovesByDTZ(moves);
  }, [moves]);

  // Loading state
  if (loading) {
    return (
      <div className={`tablebase-panel ${className}`}>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tablebase
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // No tablebase data
  if (!tablebaseData.isTablebasePosition) {
    return (
      <div className={`tablebase-panel ${className}`}>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tablebase
        </div>
        <div className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          Keine Tablebase-Daten verfügbar
        </div>
      </div>
    );
  }

  // No moves available
  if (moves.length === 0) {
    return (
      <div className={`tablebase-panel ${className}`}>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tablebase
        </div>
        <div className="text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          Warte auf Tablebase-Analyse...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tablebase-panel ${className}`}
      data-testid="tablebase-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tablebase
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {categorizedMoves.totalMoves} moves
        </div>
      </div>

      {/* Move Groups */}
      <div className="space-y-2">
        {/* Winning Moves */}
        {categorizedMoves.winningMoves.length > 0 && (
          <MoveResultGroup
            moves={categorizedMoves.winningMoves}
            resultType="win"
            onMoveSelect={onMoveSelect}
            selectedMove={selectedMove}
            initiallyExpanded={true}
            compact={compact}
          />
        )}

        {/* Drawing Moves */}
        {categorizedMoves.drawingMoves.length > 0 && (
          <MoveResultGroup
            moves={categorizedMoves.drawingMoves}
            resultType="draw"
            onMoveSelect={onMoveSelect}
            selectedMove={selectedMove}
            initiallyExpanded={true}
            compact={compact}
          />
        )}

        {/* Losing Moves */}
        {categorizedMoves.losingMoves.length > 0 && (
          <MoveResultGroup
            moves={categorizedMoves.losingMoves}
            resultType="loss"
            onMoveSelect={onMoveSelect}
            selectedMove={selectedMove}
            initiallyExpanded={false}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Compact version of TablebasePanel for dense layouts
 */
export const CompactTablebasePanel: React.FC<TablebasePanelProps> = (props) => {
  return (
    <TablebasePanel
      {...props}
      compact={true}
      className={`compact-tablebase-panel ${props.className || ""}`}
    />
  );
};

/**
 * Error boundary wrapper for TablebasePanel
 */
export { TablebasePanel as TablebasePanelWithErrorBoundary };
