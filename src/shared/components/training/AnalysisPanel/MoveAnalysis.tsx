/**
 * @file Move analysis list component for game analysis panel
 * @module components/training/AnalysisPanel/MoveAnalysis
 *
 * @description
 * Move analysis list component displaying an interactive list of chess moves
 * with quality classifications, evaluations, and selection functionality.
 * Provides a comprehensive overview of game analysis with visual indicators.
 *
 * @remarks
 * Key features:
 * - Interactive move list with click selection
 * - Color-coded move quality classifications (excellent to blunder)
 * - Chess notation symbols for move quality (!!, !, ?!, ?, ??)
 * - Move numbering with proper chess format display
 * - Evaluation display with positive/negative formatting
 * - Responsive design with proper spacing and hover effects
 * - Dark mode support with appropriate color schemes
 * - Scrollable container for long games
 *
 * The component integrates with the AnalysisDetails component to provide
 * a complete analysis experience where users can select moves from the
 * list to view detailed information.
 */

import React from 'react';
import type { MoveAnalysisData } from './types';

/**
 * Move analysis data structure for move list display
 *
 * @interface MoveAnalysisData
 *
 * @property {Move} move - Chess move object from chess.js
 * @property {number} [evaluation] - Position evaluation after the move
 * @property {string} [bestMove] - Best move according to analysis (not displayed in list)
 * @property {'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'} [classification] - Move quality classification
 */
// MoveAnalysisData interface moved to ./types.ts

/**
 * Props for the MoveAnalysis component
 *
 * @interface MoveAnalysisProps
 *
 * @property {MoveAnalysisData[]} analysisData - Array of move analysis data for all moves
 * @property {number | null} selectedMoveIndex - Index of currently selected move, null if none selected
 * @property {(index: number) => void} onMoveSelect - Callback function when a move is selected from the list
 */
interface MoveAnalysisProps {
  analysisData: MoveAnalysisData[];
  selectedMoveIndex: number | null;
  onMoveSelect: (index: number) => void;
}

/**
 * Get CSS classes for move classification color coding
 *
 * @param {MoveAnalysisData["classification"]} [classification] - Move quality classification
 * @returns {string} CSS classes for text and background colors
 *
 * @example
 * ```typescript
 * getClassificationColor('excellent') // "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30"
 * getClassificationColor('blunder')   // "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30"
 * ```
 */
const getClassificationColor = (classification?: MoveAnalysisData['classification']): string => {
  switch (classification) {
    case 'excellent':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
    case 'good':
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
    case 'inaccuracy':
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30';
    case 'mistake':
      return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30';
    case 'blunder':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
  }
};

/**
 * Get chess notation symbol for move classification
 *
 * @param {MoveAnalysisData["classification"]} [classification] - Move quality classification
 * @returns {string} Chess notation symbol for the move quality
 *
 * @remarks
 * Chess notation symbols:
 * - !! (Excellent): Brilliant or best move
 * - ! (Good): Good move
 * - ?! (Inaccuracy): Dubious or questionable move
 * - ? (Mistake): Mistake or bad move
 * - ?? (Blunder): Blunder or very bad move
 *
 * @example
 * ```typescript
 * getClassificationSymbol('excellent')  // "!!"
 * getClassificationSymbol('blunder')    // "??"
 * getClassificationSymbol(undefined)    // ""
 * ```
 */
const getClassificationSymbol = (classification?: MoveAnalysisData['classification']): string => {
  switch (classification) {
    case 'excellent':
      return '!!';
    case 'good':
      return '!';
    case 'inaccuracy':
      return '?!';
    case 'mistake':
      return '?';
    case 'blunder':
      return '??';
    default:
      return '';
  }
};

/**
 * Move analysis list component for interactive game analysis
 *
 * @component
 * @description
 * Displays an interactive list of chess moves with quality classifications,
 * evaluations, and selection functionality. Each move shows its algebraic
 * notation, quality symbol, and evaluation in a compact, scannable format.
 *
 * @remarks
 * List features:
 * - Chess move numbering (1. e4, 1...e5, 2. Nf3, etc.)
 * - Color-coded quality indicators with standard chess symbols
 * - Evaluation display with proper +/- formatting
 * - Click selection with visual feedback
 * - Hover effects for interactive elements
 * - Scrollable container for long games
 * - Dark mode support throughout
 *
 * Visual design:
 * - Compact layout optimized for analysis workflow
 * - Clear typography with monospace font for moves
 * - Consistent spacing and alignment
 * - Selected move highlighting with blue background
 * - Quality badges with appropriate color coding
 *
 * The component is memoized for performance and integrates with
 * AnalysisDetails to provide comprehensive move analysis workflow.
 *
 * @example
 * ```tsx
 * // Basic usage in analysis panel
 * <MoveAnalysis
 *   analysisData={gameAnalysis}
 *   selectedMoveIndex={currentMove}
 *   onMoveSelect={(index) => setCurrentMove(index)}
 * />
 *
 * // In split-panel layout
 * <div className="flex">
 *   <MoveAnalysis
 *     analysisData={moves}
 *     selectedMoveIndex={selected}
 *     onMoveSelect={handleSelect}
 *   />
 *   <AnalysisDetails
 *     selectedMoveIndex={selected}
 *     analysisData={moves}
 *   />
 * </div>
 * ```
 *
 * @param {MoveAnalysisProps} props - Component configuration
 * @returns {JSX.Element} Interactive move list with analysis indicators
 */
export const MoveAnalysis: React.FC<MoveAnalysisProps> = React.memo(
  ({ analysisData, selectedMoveIndex, onMoveSelect }) => {
    return (
      <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Zugfolge</h4>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {analysisData.map((analysis, index) => {
              const moveNumber = Math.floor(index / 2) + 1;
              const isWhiteMove = index % 2 === 0;

              return (
                <div
                  key={`${analysis.move.san}-${moveNumber}-${isWhiteMove ? 'w' : 'b'}`}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-sm ${
                    selectedMoveIndex === index
                      ? 'bg-blue-100 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => onMoveSelect(index)}
                >
                  {/* Move Number */}
                  {isWhiteMove && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-6">
                      {moveNumber}.
                    </span>
                  )}
                  {!isWhiteMove && <span className="w-6"></span>}

                  {/* Move */}
                  <span className="font-mono font-medium text-gray-800 dark:text-gray-200 min-w-[45px]">
                    {analysis.move.san}
                  </span>

                  {/* Classification */}
                  {analysis.classification && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getClassificationColor(analysis.classification)}`}
                    >
                      {getClassificationSymbol(analysis.classification)}
                    </span>
                  )}

                  {/* Evaluation */}
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400 ml-auto">
                    {(() => {
                      if (analysis.evaluation === undefined) {
                        return '0.00';
                      }
                      if (analysis.evaluation > 0) {
                        return `+${analysis.evaluation.toFixed(2)}`;
                      }
                      return analysis.evaluation.toFixed(2);
                    })()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

MoveAnalysis.displayName = 'MoveAnalysis';
