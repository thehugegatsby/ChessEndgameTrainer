/**
 * PHASE 2.2: Enhanced Evaluation Sidebar with Principal Variation display
 * 
 * DualEvaluationSidebar - Clean architecture implementation
 * Displays engine evaluation with PV using the unified evaluation system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useEvaluation } from '@shared/hooks/useEvaluation';
import { PrincipalVariation } from '@shared/components/training/PrincipalVariation';

interface DualEvaluationSidebarProps {
  fen: string;
  isVisible: boolean;
}

export const DualEvaluationSidebar: React.FC<DualEvaluationSidebarProps> = ({
  fen,
  isVisible
}) => {
  // Use the enhanced useEvaluation hook that now includes PV data
  const { lastEvaluation, isEvaluating, error } = useEvaluation({
    fen,
    isEnabled: isVisible,
    previousFen: undefined
  });

  if (!isVisible) {
    return null;
  }

  return (
    <div className="evaluation-sidebar p-4 space-y-4">
      {/* Engine Evaluation Display */}
      <div className="engine-section">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Engine-Bewertung
          </h4>
          {isEvaluating && (
            <div className="text-xs text-blue-500">Analysiert...</div>
          )}
        </div>

        {error ? (
          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        ) : lastEvaluation ? (
          <div className="space-y-2">
            {/* Score Display */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">Bewertung</span>
                <span className="font-mono text-sm font-semibold">
                  {lastEvaluation.mateInMoves 
                    ? `M${Math.abs(lastEvaluation.mateInMoves)}`
                    : `${(lastEvaluation.evaluation / 100).toFixed(2)}`
                  }
                </span>
              </div>
              
              {/* Additional Engine Data */}
              {lastEvaluation.depth && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Tiefe</span>
                  <span className="text-xs font-mono">{lastEvaluation.depth}</span>
                </div>
              )}
              
              {lastEvaluation.nps && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">kN/s</span>
                  <span className="text-xs font-mono">{Math.round(lastEvaluation.nps / 1000)}</span>
                </div>
              )}
            </div>

            {/* Principal Variation Display */}
            {lastEvaluation.pv && lastEvaluation.pv.length > 0 && (
              <div className="pv-section">
                <PrincipalVariation
                  pv={lastEvaluation.pv}
                  pvString={lastEvaluation.pvString}
                  evaluation={lastEvaluation.evaluation}
                  depth={lastEvaluation.depth}
                  interactive={false} // Non-interactive in sidebar
                  maxMoves={6} // Compact for sidebar
                  className="w-full"
                />
              </div>
            )}

            {/* Tablebase Information */}
            {lastEvaluation.tablebase?.isTablebasePosition && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                  Tablebase-Position
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {lastEvaluation.tablebase.category === 'win' ? 'Gewonnen' :
                   lastEvaluation.tablebase.category === 'loss' ? 'Verloren' :
                   'Remis'}
                  {lastEvaluation.tablebase.dtz && ` (DTZ: ${lastEvaluation.tablebase.dtz})`}
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
    </div>
  );
};