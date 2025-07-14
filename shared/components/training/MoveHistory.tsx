import React from 'react';
import { Move } from 'chess.js';
import { UI_CONSTANTS } from '@shared/constants/uiConstants';

interface MoveHistoryProps {
  moves: Move[];
  showEvaluations?: boolean;
  evaluations?: Array<{ evaluation: number; mateInMoves?: number }>;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, showEvaluations = false, evaluations = [] }) => {
  // Erstelle Zugpaare mit korrekter sofortiger Positionierung
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];
    
    movePairs.push({
      number: moveNumber,
      white: whiteMove,
      black: blackMove,
      whiteEval: evaluations[i],
      blackEval: evaluations[i + 1]
    });
  }

  const formatEvaluation = (evalData?: { evaluation: number; mateInMoves?: number }) => {
    if (!evalData) return '';
    
    if (evalData.mateInMoves !== undefined) {
      return `#${Math.abs(evalData.mateInMoves)}`;
    }
    
    const eval_ = evalData.evaluation;
    if (Math.abs(eval_) < 0.1) return '0.0';
    return eval_ > 0 ? `+${eval_.toFixed(1)}` : eval_.toFixed(1);
  };

  const getEvaluationColor = (evalData?: { evaluation: number; mateInMoves?: number }) => {
    if (!evalData) return '';
    
    if (evalData.mateInMoves !== undefined) {
      return evalData.mateInMoves > 0 ? 'text-green-700' : 'text-red-700';
    }
    
    const eval_ = evalData.evaluation;
    if (eval_ > 2) return 'text-green-700';
    if (eval_ > 0.5) return 'text-green-600';
    if (eval_ > -0.5) return 'text-gray-600';
    if (eval_ > -2) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg h-full overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📋</span>
          <span>Züge{showEvaluations ? ' & Bewertungen' : ''}</span>
        </h2>
      </div>
      
      <div className="p-3">
        {moves.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <span className="text-xl">🎯</span>
            </div>
            <p className="text-gray-500 text-base italic">Noch keine Züge gespielt</p>
            <p className="text-gray-400 text-sm mt-1">Ziehe eine Figur um zu beginnen</p>
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: UI_CONSTANTS.MOVE_HISTORY.MAX_HEIGHT }}>
            <div className="space-y-0.5">
              {movePairs.map((pair) => (
                <div key={pair.number} className="group flex items-center py-1.5 px-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-transparent hover:border-blue-100">
                  <span className="font-bold text-emerald-600 w-6 text-right text-sm">{pair.number}.</span>
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Weißer Zug - links */}
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        <span className="font-mono text-sm text-gray-800 bg-gray-50 px-1.5 py-0.5 rounded group-hover:bg-white transition-colors truncate w-full text-center">
                          {pair.white.san}
                        </span>
                        {showEvaluations && (
                          <span className={`text-xs font-mono ${getEvaluationColor(pair.whiteEval)} mt-0.5`}>
                            {formatEvaluation(pair.whiteEval)}
                          </span>
                        )}
                      </div>
                      
                      {/* Schwarzer Zug - rechts */}
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        {pair.black ? (
                          <>
                            <span className="font-mono text-sm text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded group-hover:bg-white transition-colors truncate w-full text-center">
                              {pair.black.san}
                            </span>
                            {showEvaluations && (
                              <span className={`text-xs font-mono ${getEvaluationColor(pair.blackEval)} mt-0.5`}>
                                {formatEvaluation(pair.blackEval)}
                              </span>
                            )}
                          </>
                        ) : (
                          // Empty placeholder to maintain consistent spacing
                          <div className="h-6"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 