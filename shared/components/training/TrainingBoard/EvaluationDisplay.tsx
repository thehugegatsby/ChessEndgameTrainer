import React from 'react';
import { getEvaluationDisplay } from '../../../utils/chess/evaluationHelpers';

interface EvaluationDisplayProps {
  evaluation: number;
  mateInMoves?: number;
  move: string;
  isVisible: boolean;
}

export const EvaluationDisplay: React.FC<EvaluationDisplayProps> = React.memo(({
  evaluation,
  mateInMoves,
  move,
  isVisible
}) => {
  if (!isVisible) return null;

  const evalDisplay = getEvaluationDisplay(evaluation, mateInMoves);

  return (
    <div 
      className="fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg border max-w-xs"
      style={{ 
        backgroundColor: evalDisplay.bgColor,
        borderColor: evalDisplay.color,
        color: evalDisplay.color
      }}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm">Zug: {move}</span>
        <span className="text-xs opacity-80">|</span>
        <span className="font-medium text-sm">{evalDisplay.text}</span>
      </div>
      {mateInMoves !== undefined && (
        <div className="text-xs mt-1 opacity-90">
          Matt in {Math.abs(mateInMoves)} Zügen
        </div>
      )}
    </div>
  );
});

EvaluationDisplay.displayName = 'EvaluationDisplay'; 