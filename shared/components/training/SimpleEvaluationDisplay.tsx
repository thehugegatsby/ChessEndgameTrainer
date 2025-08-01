/**
 * SimpleEvaluationDisplay - Minimal component for showing engine and tablebase moves
 * Shows just the moves and their evaluations without extra complexity
 */

"use client";

import React from "react";
import { usePositionAnalysis } from "@shared/hooks/usePositionAnalysis";

interface SimpleEvaluationDisplayProps {
  fen: string;
  isVisible?: boolean;
}

export const SimpleEvaluationDisplay: React.FC<
  SimpleEvaluationDisplayProps
> = ({ fen, isVisible = true }) => {
  const { lastEvaluation } = usePositionAnalysis({
    fen,
    isEnabled: isVisible,
  });

  if (!isVisible) {
    return null;
  }

  return (
    <div className="simple-evaluation-display p-4 space-y-4">
      {/* Tablebase Moves Only - Engine removed */}
      <div>
        <div className="text-sm font-bold mb-2">📚 Tablebase</div>
        {lastEvaluation?.tablebase?.topMoves &&
        lastEvaluation.tablebase.topMoves.length > 0 ? (
          <div className="space-y-1">
            {lastEvaluation.tablebase.topMoves
              .slice(0, 3)
              .map((move, index) => (
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
