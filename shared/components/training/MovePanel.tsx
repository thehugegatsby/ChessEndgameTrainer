import React, { useMemo } from 'react';
import { Move } from 'chess.js';
import { getMoveQualityDisplay, getMoveQualityByTablebaseComparison, formatEvaluation, getSmartMoveEvaluation, type MoveEvaluation } from '../../utils/chess/evaluationHelpers';
import { EvaluationLegend } from './EvaluationLegend';

interface MovePanelProps {
  moves: Move[];
  showEvaluations?: boolean;
  evaluations?: MoveEvaluation[];
  onMoveClick?: (moveIndex: number) => void;
  currentMoveIndex?: number;
}

interface MovePair {
  moveNumber: number;
  whiteMove: Move;
  blackMove?: Move;
  whiteEval?: MoveEvaluation;
  blackEval?: MoveEvaluation;
}

export const MovePanel: React.FC<MovePanelProps> = React.memo(({ 
  moves, 
  showEvaluations = false, 
  evaluations = [], 
  onMoveClick,
  currentMoveIndex = -1 
}) => {
  // Memoize move pairs calculation for performance
  const movePairs = useMemo((): MovePair[] => {
    const pairs: MovePair[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];
      // CRITICAL: evaluations array has one extra entry at the beginning (initial position)
      // So we need to offset by 1 to get the evaluation AFTER each move
      const whiteEval = evaluations[i + 1];  // +1 offset for evaluation after move
      const blackEval = evaluations[i + 2];  // +2 for evaluation after black's move
      
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        whiteMove,
        blackMove,
        whiteEval,
        blackEval,
      });
    }
    return pairs;
  }, [moves, evaluations]);


  if (moves.length === 0) {
    return (
      <div className="text-gray-400">
        Noch keine Züge gespielt
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {movePairs.map((pair) => (
        <div 
          key={pair.moveNumber} 
          className="flex items-center gap-4 py-1 hover:bg-gray-800 rounded px-2"
        >
          {/* Move Number */}
          <span className="text-sm text-gray-400 w-6 text-center font-mono">
            {pair.moveNumber}.
          </span>

          {/* White Move with evaluation */}
          <div className="flex items-center gap-1 min-w-[80px] justify-center">
            <button
              onClick={() => onMoveClick?.((pair.moveNumber - 1) * 2)}
              className={`font-mono text-sm hover:text-blue-400 px-1 py-0.5 rounded transition-colors ${
                currentMoveIndex === (pair.moveNumber - 1) * 2 ? 'text-blue-400 bg-blue-900/30' : 'text-white'
              }`}
            >
              {pair.whiteMove.san}
            </button>
            {showEvaluations && pair.whiteEval && (() => {
              const evalDisplay = getSmartMoveEvaluation(pair.whiteEval, true, (pair.moveNumber - 1) * 2);
              return (
                <span className={`text-xs px-1 py-0.5 rounded ${evalDisplay.className}`}>
                  {evalDisplay.text}
                </span>
              );
            })()}
          </div>

          {/* Black Move with evaluation - always reserve space */}
          <div className="flex items-center gap-1 min-w-[80px] justify-center">
            {pair.blackMove ? (
              <>
                <button
                  onClick={() => onMoveClick?.((pair.moveNumber - 1) * 2 + 1)}
                  className={`font-mono text-sm hover:text-blue-400 px-1 py-0.5 rounded transition-colors ${
                    currentMoveIndex === (pair.moveNumber - 1) * 2 + 1 ? 'text-blue-400 bg-blue-900/30' : 'text-white'
                  }`}
                >
                  {pair.blackMove.san}
                </button>
                {showEvaluations && pair.blackEval && (() => {
                  const evalDisplay = getSmartMoveEvaluation(pair.blackEval, false, (pair.moveNumber - 1) * 2 + 1);
                  return (
                    <span className={`text-xs px-1 py-0.5 rounded ${evalDisplay.className}`}>
                      {evalDisplay.text}
                    </span>
                  );
                })()}
              </>
            ) : (
              // Empty placeholder to reserve space
              <div className="w-full h-6"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

MovePanel.displayName = 'MovePanel';