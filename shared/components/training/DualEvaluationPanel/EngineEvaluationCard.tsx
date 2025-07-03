/**
 * Engine Evaluation Display Card
 * Shows Stockfish engine evaluation with proper formatting
 */

import React from 'react';
import { DualEvaluation } from '@shared/lib/chess/ScenarioEngine';

interface EngineEvaluationCardProps {
  evaluation: DualEvaluation['engine'];
  isLoading?: boolean;
}

export const EngineEvaluationCard: React.FC<EngineEvaluationCardProps> = ({
  evaluation,
  isLoading = false
}) => {
  const getEvaluationColor = (score: number) => {
    if (Math.abs(score) < 50) return 'text-yellow-600';
    return score > 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatScore = (score: number, mate?: number | null) => {
    if (mate !== null && mate !== undefined) {
      return `M${Math.abs(mate)}`;
    }
    return (score / 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Engine (Stockfish)
          </h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
        <div className="mt-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Engine (Stockfish)
        </h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          UCI Protocol
        </div>
      </div>
      
      <div className="mt-2">
        <div className={`text-lg font-mono font-bold ${getEvaluationColor(evaluation.score)}`}>
          {formatScore(evaluation.score, evaluation.mate)}
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {evaluation.evaluation}
        </div>
        
        {evaluation.mate !== null && evaluation.mate !== undefined && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mate in {Math.abs(evaluation.mate)} moves
          </div>
        )}
      </div>
    </div>
  );
};