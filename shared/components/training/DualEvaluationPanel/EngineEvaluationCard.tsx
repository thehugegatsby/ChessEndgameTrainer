/**
 * EngineEvaluationCard - Displays engine evaluation results
 * Rewritten for clean architecture with IChessEngine interface
 */

'use client';

import React from 'react';
import { useEvaluation } from '@shared/hooks/useEvaluation';
import { PrincipalVariation } from '@shared/components/training/PrincipalVariation';

interface EngineEvaluationCardProps {
  fen: string;
  isVisible?: boolean;
  showPrincipalVariation?: boolean;
  onMoveClick?: (moveIndex: number, move: string) => void;
}

export const EngineEvaluationCard: React.FC<EngineEvaluationCardProps> = ({
  fen,
  isVisible = true,
  showPrincipalVariation = true,
  onMoveClick
}) => {
  const { lastEvaluation, isEvaluating, error } = useEvaluation({
    fen,
    isEnabled: isVisible,
    previousFen: undefined
  });

  if (!isVisible) {
    return null;
  }

  const formatEvaluation = () => {
    if (!lastEvaluation) return null;
    
    if (lastEvaluation.mateInMoves !== undefined) {
      const mateIn = Math.abs(lastEvaluation.mateInMoves);
      return {
        value: `M${mateIn}`,
        color: lastEvaluation.mateInMoves > 0 ? 'text-green-600' : 'text-red-600',
        description: lastEvaluation.mateInMoves > 0 ? `Matt in ${mateIn}` : `Matt gegen Sie in ${mateIn}`
      };
    }
    
    const score = lastEvaluation.evaluation / 100;
    const absScore = Math.abs(score);
    
    let color = 'text-gray-600';
    if (absScore > 2) {
      color = score > 0 ? 'text-green-600' : 'text-red-600';
    } else if (absScore > 0.5) {
      color = score > 0 ? 'text-green-500' : 'text-red-500';
    }
    
    return {
      value: score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2),
      color,
      description: `Vorteil: ${absScore.toFixed(2)} Bauern`
    };
  };

  const evaluation = formatEvaluation();

  return (
    <div className="engine-evaluation-card bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Engine-Analyse
        </h3>
        {isEvaluating && (
          <div className="flex items-center gap-2 text-xs text-blue-500">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
            <span>Analysiert...</span>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="text-sm text-red-600 dark:text-red-400">
            Fehler bei der Engine-Analyse: {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isEvaluating && !lastEvaluation && (
        <div className="text-center py-6">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Engine startet...
          </div>
        </div>
      )}

      {/* Evaluation Results */}
      {lastEvaluation && evaluation && !error && (
        <div className="space-y-4">
          {/* Main Evaluation Score */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <div className={`text-2xl font-bold font-mono ${evaluation.color}`}>
                {evaluation.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {evaluation.description}
              </div>
            </div>
            
            {/* Engine Stats */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              {lastEvaluation.depth && (
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tiefe</div>
                  <div className="text-sm font-mono">{lastEvaluation.depth}</div>
                </div>
              )}
              
              {lastEvaluation.nps && (
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">kN/s</div>
                  <div className="text-sm font-mono">{Math.round(lastEvaluation.nps / 1000)}</div>
                </div>
              )}
              
              {lastEvaluation.time && (
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Zeit</div>
                  <div className="text-sm font-mono">{(lastEvaluation.time / 1000).toFixed(1)}s</div>
                </div>
              )}
            </div>
          </div>

          {/* Principal Variation */}
          {showPrincipalVariation && lastEvaluation.pv && lastEvaluation.pv.length > 0 && (
            <div>
              <PrincipalVariation
                pv={lastEvaluation.pv}
                pvString={lastEvaluation.pvString}
                evaluation={lastEvaluation.evaluation}
                depth={lastEvaluation.depth}
                onMoveClick={onMoveClick}
                interactive={!!onMoveClick}
                maxMoves={8}
                className="w-full"
              />
            </div>
          )}

          {/* Tablebase Information */}
          {lastEvaluation.tablebase?.isTablebasePosition && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">🗄️</span>
                <div>
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Tablebase-Position
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {lastEvaluation.tablebase.category === 'win' ? 'Gewonnen' :
                     lastEvaluation.tablebase.category === 'loss' ? 'Verloren' :
                     'Remis'}
                    {lastEvaluation.tablebase.dtz && ` (DTZ: ${lastEvaluation.tablebase.dtz})`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
