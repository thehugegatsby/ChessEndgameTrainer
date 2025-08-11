/**
 * @file Move result grouping component
 * @module components/tablebase/MoveResultGroup
 *
 * @description
 * Groups tablebase moves by result type (Win/Draw/Loss) with collapsible sections
 * and clear visual organization. Provides an intuitive interface similar to the
 * Lichess tablebase display for exploring move categories.
 *
 * @remarks
 * Key features:
 * - Collapsible groups for space efficiency
 * - Visual icons and color coding by outcome
 * - Move count display per group
 * - Keyboard accessible expand/collapse
 * - Automatic DTZ normalization within groups
 * - Summary statistics component
 *
 * The component automatically calculates the maximum DTZ within each group
 * to ensure consistent bar scaling for visual comparison.
 */

"use client";

import React, { useState } from "react";
import { MoveEvaluationBar } from "./MoveEvaluationBar";
import {
  type MoveResultType,
  type TablebaseMove,
  getResultTypeTitle,
  getResultIcon,
} from "@shared/utils/tablebase/resultClassification";

/**
 * Props for the MoveResultGroup component
 *
 * @interface MoveResultGroupProps
 *
 * @description
 * Configuration for grouping and displaying moves by outcome type,
 * with support for collapsible sections and move selection.
 */
interface MoveResultGroupProps {
  /** Array of moves for this result type */
  moves: TablebaseMove[];
  /** The result type for this group */
  resultType: MoveResultType;
  /** Custom title for the group (optional) */
  title?: string;
  /** Callback when a move is selected */
  onMoveSelect: (move: string) => void;
  /** Currently selected move */
  selectedMove?: string;
  /** Whether the group should be initially expanded */
  initiallyExpanded?: boolean;
  /** Whether to show compact layout */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Move result grouping component
 *
 * @component
 * @description
 * Displays tablebase moves grouped by outcome type (Win/Draw/Loss) with
 * collapsible sections for better organization. Each group shows move count,
 * visual outcome indicators, and can be expanded/collapsed for space efficiency.
 *
 * @remarks
 * Features:
 * - Automatic DTZ normalization within groups for consistent bar scaling
 * - Keyboard accessible with Enter/Space for expand/collapse
 * - Visual color coding: green (win), yellow (draw), red (loss)
 * - Hover states for better interactivity
 * - ARIA labels for screen reader support
 *
 * The component calculates the maximum DTZ within each group to ensure
 * evaluation bars scale proportionally for easy visual comparison.
 *
 * @example
 * ```tsx
 * <MoveResultGroup
 *   moves={winningMoves}
 *   resultType="win"
 *   onMoveSelect={(move) => makeMove(move)}
 *   selectedMove={currentMove}
 *   initiallyExpanded={true}
 * />
 * ```
 *
 * @param {MoveResultGroupProps} props - Component configuration
 * @returns {JSX.Element | null} Rendered group or null if no moves
 */
export const MoveResultGroup: React.FC<MoveResultGroupProps> = ({
  moves,
  resultType,
  title,
  onMoveSelect,
  selectedMove,
  initiallyExpanded = true,
  compact = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  if (moves.length === 0) {
    return null;
  }

  const groupTitle = title || getResultTypeTitle(resultType);
  const icon = getResultIcon(resultType);
  const maxDtz = Math.max(...moves.map((move) => Math.abs(move.dtz)));

  /**
   * Gets CSS color class for result type icons
   *
   * @private
   * @param {MoveResultType} type - The result type to style
   * @returns {string} Tailwind CSS classes for text color
   *
   * @description
   * Maps result types to appropriate color classes with dark mode support.
   * Colors follow standard chess conventions: green for wins, yellow for draws,
   * red for losses, and gray for unknown/unclassified results.
   */
  const getTextColorClass = (type: MoveResultType): string => {
    switch (type) {
      case "win":
        return "text-green-600 dark:text-green-400";
      case "draw":
        return "text-yellow-600 dark:text-yellow-400";
      case "loss":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className={`move-result-group ${className}`}>
      {/* Group Header */}
      <div
        className={`
          flex items-center justify-between py-2 px-1 cursor-pointer
          transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
        `}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-label={`${groupTitle} section, ${moves.length} moves`}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center space-x-3">
          <span
            className={`text-sm font-medium ${getTextColorClass(resultType)}`}
            aria-hidden="true"
          >
            {icon}
          </span>
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
            {groupTitle}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {moves.length}
          </span>
        </div>

        {/* Expand/Collapse indicator */}
        <div
          className={`
            transition-transform duration-200 text-xs text-gray-400
            ${isExpanded ? "rotate-180" : ""}
          `}
          aria-hidden="true"
        >
          ▼
        </div>
      </div>

      {/* Moves List */}
      {isExpanded && (
        <div className="mt-1 space-y-0">
          {moves.map((move, _index) => (
            <MoveEvaluationBar
              key={`${move.san}-${move.dtz}-${move.dtm}`}
              move={move.san}
              dtz={move.dtz}
              maxDtz={maxDtz}
              onClick={() => onMoveSelect(move.san)}
              isSelected={selectedMove === move.san}
              className={compact ? "text-xs" : ""}
              category={move.category}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Compact version of MoveResultGroup for dense layouts
 *
 * @component
 * @description
 * A space-optimized variant of MoveResultGroup designed for sidebars,
 * mobile layouts, or any context where screen real estate is limited.
 * Maintains full functionality while reducing visual footprint.
 *
 * @remarks
 * This is a convenience wrapper that passes compact=true to the base
 * MoveResultGroup component. The compact mode affects:
 * - Reduced padding and margins
 * - Smaller font sizes in child components
 * - Tighter spacing between elements
 *
 * @example
 * ```tsx
 * <CompactMoveResultGroup
 *   moves={drawMoves}
 *   resultType="draw"
 *   onMoveSelect={handleMoveSelect}
 *   initiallyExpanded={false}
 * />
 * ```
 *
 * @param {MoveResultGroupProps} props - Same props as MoveResultGroup
 * @returns {JSX.Element} Compact move result group
 */
export const CompactMoveResultGroup: React.FC<MoveResultGroupProps> = (
  props,
) => {
  return (
    <MoveResultGroup
      {...props}
      compact={true}
      className={`compact-move-group ${props.className || ""}`}
    />
  );
};

/**
 * Summary statistics for a move result group
 *
 * @component
 * @description
 * Displays aggregate statistics for a group of moves including count,
 * minimum/maximum/average DTZ values. Provides a quick overview of move
 * distribution and quality within a result category.
 *
 * @remarks
 * Statistics displayed:
 * - Count: Total number of moves in the group
 * - Min DTZ: Fastest path to outcome
 * - Avg DTZ: Average distance to outcome
 * - Max DTZ: Slowest path to outcome
 *
 * Color coding matches the result type for visual consistency.
 * Background colors provide subtle visual separation.
 *
 * @example
 * ```tsx
 * <MoveResultGroupSummary
 *   moves={lossingMoves}
 *   resultType="loss"
 * />
 * // Displays: "Count: 3  Min DTZ: 5  Avg DTZ: 12.3  Max DTZ: 20"
 * ```
 *
 * @param {Object} props - Component props
 * @param {TablebaseMove[]} props.moves - Array of moves to summarize
 * @param {MoveResultType} props.resultType - Type of result for styling
 * @returns {JSX.Element | null} Summary statistics or null if no moves
 */
export const MoveResultGroupSummary: React.FC<{
  moves: TablebaseMove[];
  resultType: MoveResultType;
}> = ({ moves, resultType }) => {
  if (moves.length === 0) return null;

  const avgDtz =
    moves.reduce((sum, move) => sum + Math.abs(move.dtz), 0) / moves.length;
  const minDtz = Math.min(...moves.map((move) => Math.abs(move.dtz)));
  const maxDtz = Math.max(...moves.map((move) => Math.abs(move.dtz)));

  /**
   * Gets background and text color classes for statistics display
   *
   * @private
   * @param {MoveResultType} type - The result type to style
   * @returns {string} Combined Tailwind CSS classes for styling
   *
   * @description
   * Provides subtle background colors with matching text for the summary
   * statistics component. Uses light backgrounds to avoid overwhelming
   * the interface while maintaining visual consistency.
   */
  const getStatsColorClass = (type: MoveResultType): string => {
    switch (type) {
      case "win":
        return "text-green-600 bg-green-50";
      case "draw":
        return "text-yellow-600 bg-yellow-50";
      case "loss":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const statsColorClass = getStatsColorClass(resultType);

  return (
    <div className={`text-xs p-2 rounded ${statsColorClass}`}>
      <div className="flex justify-between items-center">
        <span>Count: {moves.length}</span>
        <span>Min DTZ: {minDtz}</span>
        <span>Avg DTZ: {avgDtz.toFixed(1)}</span>
        <span>Max DTZ: {maxDtz}</span>
      </div>
    </div>
  );
};
