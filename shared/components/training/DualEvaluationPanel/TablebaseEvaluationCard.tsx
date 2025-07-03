/**
 * Tablebase Evaluation Display Card
 * Shows perfect endgame database evaluation
 */

import React from 'react';
import { DualEvaluation } from '@shared/lib/chess/ScenarioEngine';

interface TablebaseEvaluationCardProps {
  evaluation?: DualEvaluation['tablebase'];
  isLoading?: boolean;
}

export const TablebaseEvaluationCard: React.FC<TablebaseEvaluationCardProps> = ({
  evaluation,
  isLoading = false
}) => {
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'win':
        return 'text-green-600';
      case 'loss':
        return 'text-red-600';
      case 'cursed-win':
        return 'text-yellow-600';
      case 'blessed-loss':
        return 'text-orange-600';
      case 'draw':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  const formatCategory = (category?: string) => {
    switch (category) {
      case 'win':
        return 'Win';
      case 'loss':
        return 'Loss';
      case 'cursed-win':
        return 'Cursed Win';
      case 'blessed-loss':
        return 'Blessed Loss';
      case 'draw':
        return 'Draw';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tablebase (Syzygy)
          </h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
        </div>
        <div className="mt-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!evaluation?.isAvailable) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tablebase (Syzygy)
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Not Available
          </div>
        </div>
        
        <div className="mt-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Position not in tablebase (&gt;7 pieces)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tablebase (Syzygy)
        </h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Perfect Knowledge
        </div>
      </div>
      
      <div className="mt-2">
        <div className={`text-lg font-mono font-bold ${getCategoryColor(evaluation.result?.category)}`}>
          {formatCategory(evaluation.result?.category)}
        </div>
        
        {evaluation.evaluation && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {evaluation.evaluation}
          </div>
        )}
        
        <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {evaluation.result?.wdl !== undefined && (
            <div>WDL: {evaluation.result.wdl}</div>
          )}
          {evaluation.result?.dtz !== undefined && (
            <div>DTZ: {evaluation.result.dtz}</div>
          )}
        </div>
      </div>
    </div>
  );
};