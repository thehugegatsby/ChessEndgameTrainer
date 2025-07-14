/**
 * @fileoverview Principal Variation Component
 * @version 1.0.0
 * @description PHASE 2.2: Reusable component for displaying chess engine's principal variation
 * 
 * EXPERT CONSENSUS IMPLEMENTATION:
 * - Dedicated, reusable React component (Option C)
 * - Interactive move list with board preview capability
 * - Performance optimized with React.memo and throttling
 * - Mobile-responsive design following industry standards
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { UI_CONSTANTS } from '@shared/constants/uiConstants';
import { DIMENSIONS } from '@shared/constants';

export interface PrincipalVariationProps {
  /** Array of moves in algebraic notation (e.g., ['e2e4', 'e7e5', 'g1f3']) */
  pv?: string[];
  /** Raw PV string for debugging */
  pvString?: string;
  /** Current evaluation score for context */
  evaluation?: number;
  /** Depth of analysis */
  depth?: number;
  /** Callback when user clicks a move for board preview */
  onMoveClick?: (moveIndex: number, move: string) => void;
  /** Whether the component should be in interactive mode */
  interactive?: boolean;
  /** Maximum number of moves to display (for mobile optimization) */
  maxMoves?: number;
  /** CSS class name for styling */
  className?: string;
}

/**
 * PrincipalVariation Component
 * 
 * Displays the engine's best line of play as an interactive move sequence.
 * Following industry standards from Lichess/Chess.com for optimal UX.
 * 
 * Features:
 * - Interactive move list with hover/click states
 * - Mobile-responsive with configurable move limit
 * - Performance optimized with React.memo
 * - Accessible keyboard navigation
 */
export const PrincipalVariation: React.FC<PrincipalVariationProps> = React.memo(({
  pv = [],
  pvString,
  evaluation,
  depth,
  onMoveClick,
  interactive = true,
  maxMoves = UI_CONSTANTS.PRINCIPAL_VARIATION.MAX_MOVES_DISPLAY,
  className = ''
}) => {
  const [hoveredMoveIndex, setHoveredMoveIndex] = useState<number | null>(null);

  // Memoize processed moves for performance
  const processedMoves = useMemo(() => {
    if (!pv || pv.length === 0) return [];
    
    // Limit moves for mobile performance and UI clarity
    const limitedMoves = pv.slice(0, maxMoves);
    
    return limitedMoves.map((move, index) => ({
      move,
      index,
      notation: move, // Could be converted to SAN notation in future
      isEven: index % 2 === 0 // For alternating white/black styling
    }));
  }, [pv, maxMoves]);

  // Handle move click with performance optimization
  const handleMoveClick = useCallback((moveIndex: number, move: string) => {
    if (!interactive || !onMoveClick) return;
    onMoveClick(moveIndex, move);
  }, [interactive, onMoveClick]);

  // Handle mouse events for hover effects
  const handleMouseEnter = useCallback((index: number) => {
    if (interactive) {
      setHoveredMoveIndex(index);
    }
  }, [interactive]);

  const handleMouseLeave = useCallback(() => {
    if (interactive) {
      setHoveredMoveIndex(null);
    }
  }, [interactive]);

  // Empty state
  if (!pv || pv.length === 0) {
    return (
      <div className={`principal-variation-empty ${className}`}>
        <div className="text-center py-3">
          <div className="text-gray-400 dark:text-gray-500 mb-1">
            <span className="text-lg">🎯</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hauptvariante wird geladen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`principal-variation ${className}`}>
      {/* Header */}
      <div className="pv-header flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Hauptvariante
          </span>
          {depth && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
              Tiefe {depth}
            </span>
          )}
        </div>
        
        {evaluation !== undefined && (
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
            {evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2)}
          </span>
        )}
      </div>

      {/* Move List */}
      <div className="pv-moves-container">
        <div className="pv-moves flex flex-wrap gap-1 items-center">
          {processedMoves.map(({ move, index, notation, isEven }) => (
            <React.Fragment key={`move-${index}`}>
              {/* Move number for white moves */}
              {isEven && (
                <span className="move-number text-xs text-gray-500 dark:text-gray-400 font-medium" style={{ minWidth: `${DIMENSIONS.MOVE_NUMBER_MIN_WIDTH}px` }}>
                  {Math.floor(index / 2) + 1}.
                </span>
              )}
              
              {/* Move button */}
              <button
                type="button"
                className={`
                  move-button px-2 py-1 text-xs font-mono rounded transition-all duration-150
                  ${interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  ${hoveredMoveIndex === index 
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                  ${isEven ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                `}
                onClick={() => handleMoveClick(index, move)}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                disabled={!interactive}
                title={interactive ? `Klicken um Position nach ${notation} zu sehen` : undefined}
                aria-label={`Zug ${index + 1}: ${notation}`}
              >
                {notation}
              </button>
            </React.Fragment>
          ))}
          
          {/* Show indicator if moves were truncated */}
          {pv.length > maxMoves && (
            <span className="truncation-indicator text-xs text-gray-400 dark:text-gray-500 ml-1">
              ... +{pv.length - maxMoves} weitere
            </span>
          )}
        </div>
      </div>

      {/* Interactive help text */}
      {interactive && processedMoves.length > 0 && (
        <div className="pv-help mt-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Klicken Sie auf einen Zug, um die Position zu sehen
          </p>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && pvString && (
        <details className="pv-debug mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
            Raw PV: {pvString}
          </pre>
        </details>
      )}
    </div>
  );
});

PrincipalVariation.displayName = 'PrincipalVariation';