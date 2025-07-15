/**
 * MoveEvaluationBar Component
 * 
 * Visual progress bar component that displays tablebase moves with color-coded
 * evaluation bars based on DTZ values, similar to Lichess tablebase interface.
 */

'use client';

import React from 'react';
import {
  type MoveResultType,
  getEvaluationBarColor,
  getResultIcon,
  calculateBarWidth,
  formatDtzDisplay,
  getMoveResultType
} from '@shared/utils/tablebase/resultClassification';

interface MoveEvaluationBarProps {
  /** The chess move in SAN notation */
  move: string;
  /** Distance to Zero value from tablebase */
  dtz: number;
  /** Maximum DTZ value in current set for width normalization */
  maxDtz: number;
  /** Click handler for move selection */
  onClick?: () => void;
  /** Whether this move is currently selected */
  isSelected?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional category from tablebase data */
  category?: 'win' | 'draw' | 'loss';
}

export const MoveEvaluationBar: React.FC<MoveEvaluationBarProps> = ({
  move,
  dtz,
  maxDtz,
  onClick,
  isSelected = false,
  className = '',
  category
}) => {
  const resultType: MoveResultType = category || getMoveResultType(dtz);
  const barWidth = calculateBarWidth(dtz, maxDtz);
  const barColor = getEvaluationBarColor(resultType);
  const dtzDisplay = formatDtzDisplay(dtz);

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
    <div
      className={`
        relative flex items-center justify-between py-2 px-3 
        cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        ${className}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Move ${move}, ${dtzDisplay}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Subtle background evaluation bar */}
      <div 
        className={`
          absolute left-0 top-0 bottom-0 opacity-5 transition-all duration-300
          ${barColor}
        `}
        style={{ width: `${barWidth}%` }}
        aria-hidden="true"
      />
      
      {/* Move content */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          {/* Move notation */}
          <span className={`font-mono font-medium text-sm ${getTextColorClass(resultType)}`}>
            {move}
          </span>
        </div>
        
        {/* DTZ display */}
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getTextColorClass(resultType)}`}>
            DTZ {dtz === 0 ? '0' : Math.abs(dtz)}
          </span>
          
          {/* Accessibility-friendly result indicator */}
          <span className="sr-only">
            {dtzDisplay}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version of MoveEvaluationBar for dense layouts
 */
export const CompactMoveEvaluationBar: React.FC<MoveEvaluationBarProps> = ({
  move,
  dtz,
  maxDtz,
  onClick,
  isSelected = false,
  className = '',
  category
}) => {
  const resultType: MoveResultType = category || getMoveResultType(dtz);
  const barWidth = calculateBarWidth(dtz, maxDtz);
  const barColor = getEvaluationBarColor(resultType);
  const icon = getResultIcon(resultType);

  return (
    <div
      className={`
        relative flex items-center justify-between py-1 px-2 rounded
        cursor-pointer transition-all duration-200 hover:bg-gray-100
        ${isSelected ? 'bg-blue-50 border-blue-300' : ''}
        ${className}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Move ${move}, DTZ ${Math.abs(dtz)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Background evaluation bar */}
      <div 
        className={`
          absolute inset-0 rounded opacity-10 transition-all duration-300
          ${barColor}
        `}
        style={{ width: `${barWidth}%` }}
        aria-hidden="true"
      />
      
      {/* Compact content */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center space-x-1">
          <span className="text-xs" aria-hidden="true">{icon}</span>
          <span className="font-mono font-bold text-sm">{move}</span>
        </div>
        
        <span className="text-xs text-gray-600">
          {dtz === 0 ? '0' : Math.abs(dtz)}
        </span>
      </div>
    </div>
  );
};