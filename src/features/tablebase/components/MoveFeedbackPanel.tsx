/**
 * Move Feedback Panel Component
 * 
 * @description
 * Displays feedback for player moves based on tablebase analysis.
 * Shows whether the move was optimal, suboptimal, or a mistake,
 * along with alternative suggestions and evaluation changes.
 */

"use client";

import React from 'react';
import { useTrainingEvent } from '../../training/components/TrainingEventListener';
import { useStore } from '@shared/store/rootStore';
import type { TablebaseMove } from '../types/interfaces';

/**
 * Props for the MoveFeedbackPanel component
 */
interface MoveFeedbackPanelProps {
  /** Whether the panel is visible */
  isVisible?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Callback when user wants to see suggested moves */
  onShowSuggestions?: () => void;
  /** Callback when user clicks on a suggested move */
  onMoveSelect?: (move: TablebaseMove) => void;
}

/**
 * Interface for move feedback data
 */
interface MoveFeedbackData {
  type: 'success' | 'warning' | 'error';
  message: string;
  wasOptimal: boolean;
  wdlBefore?: number;
  wdlAfter?: number;
  bestMove?: string;
  playedMove?: string;
  evaluation?: {
    before: string;
    after: string;
  };
  suggestions?: TablebaseMove[];
}

/**
 * Hook to convert WDL values to human-readable outcomes
 */
function useWdlFormatter(): {
  formatWdl: (wdl: number) => string;
  getWdlColor: (wdl: number) => string;
} {
  const formatWdl = (wdl: number): string => {
    if (wdl > 0) return 'Win';
    if (wdl < 0) return 'Loss';
    return 'Draw';
  };

  const getWdlColor = (wdl: number): string => {
    if (wdl > 0) return 'text-green-600 dark:text-green-400';
    if (wdl < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return { formatWdl, getWdlColor };
}

/**
 * Move feedback panel component
 * 
 * @description
 * Listens to move feedback events and displays contextual information
 * about the quality of moves played. Provides suggestions for improvement
 * and shows evaluation changes from the tablebase perspective.
 * 
 * @example
 * ```tsx
 * <MoveFeedbackPanel
 *   isVisible={showFeedback}
 *   onMoveSelect={(move) => playMove(move.uci)}
 *   onShowSuggestions={() => setShowSuggestions(true)}
 * />
 * ```
 */
export const MoveFeedbackPanel: React.FC<MoveFeedbackPanelProps> = ({
  isVisible = true,
  className = '',
  onShowSuggestions,
  onMoveSelect,
}) => {
  const [feedbackData, setFeedbackData] = React.useState<MoveFeedbackData | null>(null);
  const { formatWdl, getWdlColor } = useWdlFormatter();
  
  // Get tablebase moves from store for suggestions
  const tablebaseData = useStore(state => state.ui.tablebaseData);

  // Listen to move feedback events
  useTrainingEvent('move:feedback', (data) => {
    const evaluation = data.wdlBefore !== undefined && data.wdlAfter !== undefined
      ? {
          before: formatWdl(data.wdlBefore),
          after: formatWdl(data.wdlAfter),
        }
      : undefined;

    let message = '';
    if (data.type === 'success') {
      message = data.wasOptimal ? 'Perfect move!' : 'Good move!';
    } else if (data.type === 'warning') {
      message = 'Suboptimal move. There was a better option.';
    } else if (data.type === 'error') {
      message = 'This move loses the position!';
    }

    const suggestions = tablebaseData?.moves?.filter(move => 
      move.san !== data.playedMove
    ).slice(0, 3); // Show top 3 alternatives

    const feedbackData: MoveFeedbackData = {
      type: data.type,
      message,
      wasOptimal: data.wasOptimal,
      ...(data.wdlBefore !== undefined && { wdlBefore: data.wdlBefore }),
      ...(data.wdlAfter !== undefined && { wdlAfter: data.wdlAfter }),
      ...(data.bestMove && { bestMove: data.bestMove }),
      ...(data.playedMove && { playedMove: data.playedMove }),
      ...(evaluation && { evaluation }),
      ...(suggestions && suggestions.length > 0 && { suggestions }),
    };
    
    setFeedbackData(feedbackData);

    // Auto-hide after 10 seconds for success messages
    if (data.type === 'success') {
      setTimeout(() => setFeedbackData(null), 10000);
    }
  });

  // Don't render if not visible or no feedback data
  if (!isVisible || !feedbackData) {
    return null;
  }

  const typeStyles = {
    success: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    warning: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    error: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
  };

  const iconStyles = {
    success: '✓',
    warning: '⚠',
    error: '✗',
  };

  const textStyles = {
    success: 'text-green-800 dark:text-green-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    error: 'text-red-800 dark:text-red-200',
  };

  return (
    <div className={`move-feedback-panel border rounded-lg p-4 ${typeStyles[feedbackData.type]} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`text-lg font-bold ${textStyles[feedbackData.type]}`}>
            {iconStyles[feedbackData.type]}
          </span>
          <h3 className={`font-semibold ${textStyles[feedbackData.type]}`}>
            Move Feedback
          </h3>
        </div>
        
        <button
          onClick={() => setFeedbackData(null)}
          className={`text-sm opacity-60 hover:opacity-100 ${textStyles[feedbackData.type]}`}
          aria-label="Close feedback"
        >
          ✕
        </button>
      </div>

      {/* Feedback Message */}
      <p className={`text-sm mb-3 ${textStyles[feedbackData.type]}`}>
        {feedbackData.message}
      </p>

      {/* Evaluation Change */}
      {feedbackData.evaluation && (
        <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded border">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Position evaluation:
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className={getWdlColor(feedbackData.wdlBefore || 0)}>
              {feedbackData.evaluation.before}
            </span>
            <span className="text-gray-400">→</span>
            <span className={getWdlColor(feedbackData.wdlAfter || 0)}>
              {feedbackData.evaluation.after}
            </span>
          </div>
        </div>
      )}

      {/* Move Information */}
      <div className="space-y-2 mb-3">
        {feedbackData.playedMove && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Played:</span>
            <span className="font-mono font-medium">{feedbackData.playedMove}</span>
          </div>
        )}
        
        {feedbackData.bestMove && feedbackData.bestMove !== feedbackData.playedMove && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Best:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {feedbackData.bestMove}
            </span>
          </div>
        )}
      </div>

      {/* Alternative Moves */}
      {feedbackData.suggestions && feedbackData.suggestions.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Alternative moves:
            </h4>
            {onShowSuggestions && (
              <button
                onClick={onShowSuggestions}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show all
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {feedbackData.suggestions.map((move, index) => (
              <button
                key={`${move.uci}-${index}`}
                onClick={() => onMoveSelect?.(move)}
                className="w-full flex items-center justify-between p-2 text-sm bg-white dark:bg-gray-800 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={`${move.san} leads to ${move.outcome}${move.dtm ? ` in ${Math.abs(move.dtm)} moves` : ''}`}
              >
                <span className="font-mono">{move.san}</span>
                <span className={`text-xs ${
                  move.outcome === 'win' ? 'text-green-600 dark:text-green-400' :
                  move.outcome === 'loss' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {move.outcome === 'win' ? '+' : move.outcome === 'loss' ? '-' : '='}
                  {move.dtm !== undefined && Math.abs(move.dtm)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};