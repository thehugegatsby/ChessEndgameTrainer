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
    <div className="dual-evaluation-panel" data-testid="dual-evaluation-panel">
      
      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* Engine Top-3 Moves - Left Column */}
        <div className="engine-evaluation-section" data-testid="engine-evaluation-panel">
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">🔧 Engine</div>
          
          {isEvaluating && (
            <div className="text-xs text-blue-500 mb-2">🔄 Analysiert...</div>
          )}

          {error ? (
            <div className="text-xs text-red-500 font-medium">
              ❌ {error}
            </div>
          ) : lastEvaluation ? (
            <div className="space-y-3">
              {/* Top 3 Engine Moves - Clean Layout like Tablebase */}
              {lastEvaluation.multiPvResults && lastEvaluation.multiPvResults.length > 0 ? (
                <div className="space-y-1">
                  {lastEvaluation.multiPvResults.slice(0, 3).map((result, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="font-mono font-bold text-white dark:text-white text-sm">
                        {result.san}
                      </span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                        {result.score.type === 'mate' 
                          ? `#${Math.abs(result.score.value)}`
                          : `${result.score.value >= 0 ? '+' : ''}${(result.score.value / 100).toFixed(2)}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Warte auf Multi-PV Analyse...
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-blue-500 dark:text-blue-400">
              Warte auf Analyse...
            </div>
          )}
        </div>

        {/* Tablebase Moves - Right Column */}
        <div className="tablebase-evaluation-section" data-testid="tablebase-evaluation-panel">
          <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-3">📚 Tablebase</div>
          
          {lastEvaluation?.tablebase?.isTablebasePosition ? (
            <div className="space-y-3">
              {/* Best Tablebase Moves */}
              {lastEvaluation.tablebase.topMoves && lastEvaluation.tablebase.topMoves.length > 0 ? (
                <div className="space-y-1">
                  {lastEvaluation.tablebase.topMoves.slice(0, 3).map((move, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="font-mono font-bold text-white dark:text-white text-sm">
                        {move.san}
                      </span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                        DTZ {move.dtz !== null ? Math.abs(move.dtz) : (index + 1)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-green-600 dark:text-green-400">
                  Warte auf Tablebase Top-3...
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-amber-600 dark:text-amber-400">
              Keine Tablebase-Daten
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
