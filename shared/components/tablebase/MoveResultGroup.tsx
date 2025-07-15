/**
 * MoveResultGroup Component
 * 
 * Groups tablebase moves by result type (Win/Draw/Loss) with collapsible sections
 * and clear visual organization, similar to Lichess tablebase interface.
 */

'use client';

import React, { useState } from 'react';
import { MoveEvaluationBar } from './MoveEvaluationBar';
import {
  type MoveResultType,
  type TablebaseMove,
  getResultTypeTitle,
  getResultIcon
} from '@shared/utils/tablebase/resultClassification';

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

export const MoveResultGroup: React.FC<MoveResultGroupProps> = ({
  moves,
  resultType,
  title,
  onMoveSelect,
  selectedMove,
  initiallyExpanded = true,
  compact = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  
  if (moves.length === 0) {
    return null;
  }

  const groupTitle = title || getResultTypeTitle(resultType);
  const icon = getResultIcon(resultType);
  const maxDtz = Math.max(...moves.map(move => Math.abs(move.dtz)));

  // Text color classes for icons
  const getTextColorClass = (type: MoveResultType): string => {
    switch (type) {
      case 'win':
        return 'text-green-600 dark:text-green-400';
      case 'draw':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'loss':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
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
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center space-x-3">
          <span className={`text-sm font-medium ${getTextColorClass(resultType)}`} aria-hidden="true">
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
            ${isExpanded ? 'rotate-180' : ''}
          `}
          aria-hidden="true"
        >
          ▼
        </div>
      </div>

      {/* Moves List */}
      {isExpanded && (
        <div className="mt-1 space-y-0">
          {moves.map((move, index) => (
            <MoveEvaluationBar
              key={`${move.san}-${index}`}
              move={move.san}
              dtz={move.dtz}
              maxDtz={maxDtz}
              onClick={() => onMoveSelect(move.san)}
              isSelected={selectedMove === move.san}
              className={compact ? 'text-xs' : ''}
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
 */
export const CompactMoveResultGroup: React.FC<MoveResultGroupProps> = (props) => {
  return (
    <MoveResultGroup
      {...props}
      compact={true}
      className={`compact-move-group ${props.className || ''}`}
    />
  );
};

/**
 * Summary statistics for a move result group
 */
export const MoveResultGroupSummary: React.FC<{
  moves: TablebaseMove[];
  resultType: MoveResultType;
}> = ({ moves, resultType }) => {
  if (moves.length === 0) return null;

  const avgDtz = moves.reduce((sum, move) => sum + Math.abs(move.dtz), 0) / moves.length;
  const minDtz = Math.min(...moves.map(move => Math.abs(move.dtz)));
  const maxDtz = Math.max(...moves.map(move => Math.abs(move.dtz)));

  const getStatsColorClass = (type: MoveResultType): string => {
    switch (type) {
      case 'win':
        return 'text-green-600 bg-green-50';
      case 'draw':
        return 'text-yellow-600 bg-yellow-50';
      case 'loss':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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