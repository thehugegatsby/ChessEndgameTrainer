/**
 * DualEvaluationPanel - Restored with Clean Architecture
 * 
 * Two-column layout showing Engine and Tablebase evaluations side-by-side
 * Uses existing useEvaluation hook and clean architecture patterns
 */

'use client';

import React from 'react';
import { useEvaluation } from '@shared/hooks/useEvaluation';

interface DualEvaluationPanelProps {
  fen: string;
  isVisible: boolean;
  previousFen?: string;
}

export const DualEvaluationPanel: React.FC<DualEvaluationPanelProps> = ({
  fen,
  isVisible,
  previousFen
}) => {
  const { lastEvaluation, isEvaluating, error } = useEvaluation({
    fen,
    isEnabled: isVisible,
    previousFen
  });

  if (!isVisible) {
    return null;
  }

  return (
    <div className="dual-evaluation-panel p-4 space-y-4" data-testid="dual-evaluation-panel">
      <div className="dual-evaluation-grid grid grid-cols-2 gap-4">
        
        {/* Engine Evaluation Column */}
        <div className="engine-evaluation-panel bg-gray-50 dark:bg-gray-800 rounded-lg p-3" data-testid="engine-evaluation-panel">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Engine-Bewertung
          </h4>
          
          {isEvaluating && (
            <div className="text-xs text-blue-500 mb-2">Analysiert...</div>
          )}

          {error ? (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          ) : lastEvaluation ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Bewertung</span>
                <span className="font-mono text-sm font-semibold">
                  {lastEvaluation.mateInMoves 
                    ? `M${Math.abs(lastEvaluation.mateInMoves)}`
                    : `${(lastEvaluation.evaluation / 100).toFixed(2)}`
                  }
                </span>
              </div>
              
              {lastEvaluation.depth && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Tiefe</span>
                  <span className="text-xs font-mono">{lastEvaluation.depth}</span>
                </div>
              )}
              
              {lastEvaluation.nps && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">kN/s</span>
                  <span className="text-xs font-mono">{Math.round(lastEvaluation.nps / 1000)}</span>
                </div>
              )}

              {lastEvaluation.pv && lastEvaluation.pv.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div className="font-medium mb-1">Hauptvariante:</div>
                  <div className="font-mono bg-white dark:bg-gray-900 p-2 rounded border">
                    {lastEvaluation.pv.slice(0, 3).join(' ')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-400 dark:text-gray-500 mb-1">
                <span className="text-lg">⏳</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Warte auf Analyse...
              </p>
            </div>
          )}
        </div>

        {/* Tablebase Evaluation Column */}
        <div className="tablebase-evaluation-panel bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3" data-testid="tablebase-evaluation-panel">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Tablebase-Bewertung
          </h4>
          
          {lastEvaluation?.tablebase?.isTablebasePosition ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Status</span>
                <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {lastEvaluation.tablebase.category === 'win' ? 'Gewonnen' :
                   lastEvaluation.tablebase.category === 'loss' ? 'Verloren' :
                   'Remis'}
                </span>
              </div>
              
              {lastEvaluation.tablebase.dtz && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">DTZ</span>
                  <span className="text-xs font-mono">{lastEvaluation.tablebase.dtz}</span>
                </div>
              )}
              
              {lastEvaluation.tablebase.wdlAfter !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">WDL</span>
                  <span className="text-xs font-mono">{lastEvaluation.tablebase.wdlAfter}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-400 dark:text-gray-500 mb-1">
                <span className="text-lg">📚</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Keine Tablebase-Daten
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
