/**
 * @file Tablebase analysis display panel
 * @module components/tablebase/TablebasePanel
 *
 * @description
 * Professional tablebase analysis panel with grouped move display,
 * color-coded evaluation bars, and interactive move selection.
 * Provides a Lichess-style interface for exploring tablebase evaluations.
 *
 * @remarks
 * Key features:
 * - Automatic move grouping by outcome (win/draw/loss)
 * - Visual DTZ (Distance to Zero) indicators
 * - Color-coded evaluation bars
 * - Expandable/collapsible move groups
 * - Loading and error state handling
 * - Responsive layout with compact mode
 *
 * The component integrates with the tablebase evaluation system
 * and provides visual feedback for optimal move selection.
 */

"use client";

import React, { useMemo } from "react";
import { MoveResultGroup } from "./MoveResultGroup";
import {
  type TablebaseMove,
  classifyMovesByDTZ,
} from "@shared/utils/tablebase/resultClassification";
import { type TablebaseData } from "@shared/types/evaluation";

/**
 * Props for the TablebasePanel component
 *
 * @interface TablebasePanelProps
 *
 * @description
 * Configuration options for the tablebase analysis panel,
 * including data source, interaction callbacks, and display options.
 */
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

/**
 * Tablebase analysis display panel
 *
 * @component
 * @description
 * Displays tablebase evaluation results in an organized, interactive format.
 * Groups moves by outcome and provides visual indicators for move quality.
 *
 * @remarks
 * The component automatically categorizes moves into three groups:
 * - Winning moves (positive WDL)
 * - Drawing moves (zero WDL)
 * - Losing moves (negative WDL)
 *
 * Each group can be expanded/collapsed and shows DTZ information
 * when available. The panel handles various states including loading,
 * no data, and no moves available.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TablebasePanel
 *   tablebaseData={evaluation.tablebase}
 *   onMoveSelect={(move) => makeMove(move)}
 *   selectedMove={currentMove}
 * />
 *
 * // With loading state and compact mode
 * <TablebasePanel
 *   tablebaseData={data}
 *   onMoveSelect={handleMove}
 *   loading={isAnalyzing}
 *   compact={true}
 *   className="mt-4"
 * />
 * ```
 *
 * @param {TablebasePanelProps} props - Component configuration
 * @returns {JSX.Element} Rendered tablebase panel
 */
export const TablebasePanel: React.FC<TablebasePanelProps> = ({
  tablebaseData,
  onMoveSelect,
  selectedMove,
  loading = false,
  compact = false,
  className = "",
}) => {
  /**
   * Transforms tablebase API data to internal move format
   *
   * @description
   * Converts the raw tablebase data structure into a normalized
   * format suitable for display and interaction. Handles missing
   * data gracefully by returning an empty array.
   *
   * @remarks
   * The transformation preserves all tablebase metrics:
   * - move: UCI notation (e.g., "e2e4")
   * - san: Standard Algebraic Notation (e.g., "e4")
   * - dtz: Distance to Zero (moves to conversion)
   * - dtm: Distance to Mate (if applicable)
   * - wdl: Win/Draw/Loss value
   * - category: Outcome classification
   */
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

  /**
   * Categorizes moves by outcome for grouped display
   *
   * @description
   * Uses the classification utility to group moves into
   * winning, drawing, and losing categories based on their
   * WDL (Win/Draw/Loss) values.
   *
   * @remarks
   * This categorization enables the UI to display moves
   * in semantically meaningful groups with appropriate
   * visual styling and prioritization.
   */
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
