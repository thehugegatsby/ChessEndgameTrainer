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
    <div className="dual-evaluation-panel space-y-6" data-testid="dual-evaluation-panel">
      
      {/* Engine Top-3 Moves - Simple Text Display */}
      <div className="engine-evaluation-section" data-testid="engine-evaluation-panel">
        <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">🔧 Engine</div>
        
        {isEvaluating && (
          <div className="text-xs text-blue-500 mb-2">Analysiert...</div>
        )}

        {error ? (
          <div className="text-xs text-red-500 font-medium">
            {error}
          </div>
        ) : lastEvaluation ? (
          <div className="space-y-1">
            {/* Top 3 Engine Moves - Normale Größe, bessere Farben */}
            {lastEvaluation.multiPvResults && lastEvaluation.multiPvResults.length > 0 ? (
              lastEvaluation.multiPvResults.slice(0, 3).map((result, index) => (
                <div key={index} className="text-sm">
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{result.san}</span>
                  <span className="text-orange-600 dark:text-orange-400 ml-2">
                    {result.score.type === 'mate' 
                      ? `Matt in ${Math.abs(result.score.value)}`
                      : `${result.score.value >= 0 ? '+' : ''}${(result.score.value / 100).toFixed(2)}`
                    }
                  </span>
                </div>
              ))
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
        
        {/* DEBUG: Show evaluation data */}
        {lastEvaluation && (
          <div className="mt-2 text-xs text-gray-500">
            DEBUG: multiPvResults={lastEvaluation.multiPvResults?.length || 0}
          </div>
        )}
      </div>

      {/* Tablebase Top-3 Moves - Simple Text Display */}
      <div className="tablebase-evaluation-section" data-testid="tablebase-evaluation-panel">
        <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">📚 Tablebase</div>
        
        {lastEvaluation?.tablebase?.isTablebasePosition ? (
          <div className="space-y-1">
            {/* Top 3 Tablebase Moves - Normale Größe, bessere Farben */}
            {lastEvaluation.tablebase.topMoves && lastEvaluation.tablebase.topMoves.length > 0 ? (
              lastEvaluation.tablebase.topMoves.slice(0, 3).map((move, index) => (
                <div key={index} className="text-sm">
                  <span className="font-mono font-bold text-green-700 dark:text-green-300">{move.san}</span>
                  <span className="text-purple-600 dark:text-purple-400 ml-2">
                    DTZ {move.dtz}, DTM {move.dtm}
                  </span>
                </div>
              ))
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
        
        {/* DEBUG: Show tablebase data */}
        {lastEvaluation && (
          <div className="mt-2 text-xs text-gray-500">
            DEBUG: isTablebase={lastEvaluation.tablebase?.isTablebasePosition || false}, 
            topMoves={lastEvaluation.tablebase?.topMoves?.length || 0}, 
            FEN: {fen.substring(0, 20)}...
          </div>
        )}
      </div>
    </div>
  );
};
