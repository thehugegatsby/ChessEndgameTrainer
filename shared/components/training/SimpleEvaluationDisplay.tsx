/**
 * SimpleEvaluationDisplay - Minimal component for showing engine and tablebase moves
 * Shows just the moves and their evaluations without extra complexity
 */

'use client';

import React from 'react';
import { useEvaluation } from '@shared/hooks/useEvaluation';

interface SimpleEvaluationDisplayProps {
  fen: string;
  isVisible?: boolean;
}

// Simple score formatter
const formatScore = (score: { type: 'cp' | 'mate'; value: number }): string => {
  if (score.type === 'mate') {
    return `#${Math.abs(score.value)}`;
  }
  const pawnValue = (score.value / 100).toFixed(2);
  return score.value >= 0 ? `+${pawnValue}` : pawnValue;
};

export const SimpleEvaluationDisplay: React.FC<SimpleEvaluationDisplayProps> = ({
  fen,
  isVisible = true
}) => {
  const { lastEvaluation, isEvaluating } = useEvaluation({
    fen,
    isEnabled: isVisible
  });

  if (!isVisible) {
    return null;
  }

  return (
    <div className="simple-evaluation-display p-4 space-y-4">
      {/* Engine Moves */}
      <div>
        <div className="text-sm font-bold mb-2">🔧 Engine</div>
        {isEvaluating ? (
          <div className="text-sm">🔄 Analysiert...</div>
        ) : lastEvaluation?.multiPvResults && lastEvaluation.multiPvResults.length > 0 ? (
          <div className="space-y-1">
            {lastEvaluation.multiPvResults.slice(0, 3).map((result, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-mono">{result.san}</span>
                <span className="text-sm">{formatScore(result.score)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm">Warte auf Analyse...</div>
        )}
      </div>

      {/* Tablebase Moves */}
      <div>
        <div className="text-sm font-bold mb-2">📚 Tablebase</div>
        {lastEvaluation?.tablebase?.topMoves && lastEvaluation.tablebase.topMoves.length > 0 ? (
          <div className="space-y-1">
            {lastEvaluation.tablebase.topMoves.slice(0, 3).map((move, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-mono">{move.san}</span>
                <span className="text-sm">DTZ {move.dtz}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm">Keine Tablebase-Daten</div>
        )}
      </div>
    </div>
  );
};