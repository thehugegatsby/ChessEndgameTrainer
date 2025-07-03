/**
 * BestMovesDisplay - Shows top engine/tablebase moves like Lichess
 */

import React from 'react';

interface Move {
  move: string;
  evaluation: string | number;
  mate?: number;
  dtm?: number; // Distance to mate for tablebase
  wdl?: number; // Win/Draw/Loss for tablebase
}

interface BestMovesDisplayProps {
  engineMoves?: Move[];
  tablebaseMoves?: Move[];
  showEngine: boolean;
  showTablebase: boolean;
  isLoading?: boolean;
}

export const BestMovesDisplay: React.FC<BestMovesDisplayProps> = ({
  engineMoves = [],
  tablebaseMoves = [],
  showEngine,
  showTablebase,
  isLoading = false
}) => {
  const formatEngineEval = (move: Move) => {
    if (move.mate !== undefined) {
      return `M${Math.abs(move.mate)}`;
    }
    if (typeof move.evaluation === 'number') {
      const score = move.evaluation / 100;
      return score >= 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
    }
    return move.evaluation;
  };

  const formatTablebaseEval = (move: Move) => {
    if (move.dtm !== undefined) {
      return `DTM ${Math.abs(move.dtm)}`;
    }
    if (move.wdl !== undefined) {
      return move.wdl === 2 ? 'Win' : move.wdl === -2 ? 'Loss' : 'Draw';
    }
    return move.evaluation;
  };

  const getEvalColor = (move: Move, isTablebase: boolean = false) => {
    if (isTablebase && move.wdl !== undefined) {
      return move.wdl === 2 ? 'text-green-400' : 
             move.wdl === -2 ? 'text-red-400' : 
             'text-yellow-400';
    }
    
    if (move.mate !== undefined) {
      return move.mate > 0 ? 'text-green-400' : 'text-red-400';
    }
    
    if (typeof move.evaluation === 'number') {
      const score = move.evaluation / 100;
      if (Math.abs(score) < 0.5) return 'text-gray-400';
      return score > 0 ? 'text-green-400' : 'text-red-400';
    }
    
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
          <span>Calculating best moves...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Engine best moves */}
      {showEngine && engineMoves.length > 0 && (
        <div className="px-4">
          <div className="text-xs text-gray-500 mb-1.5">Engine</div>
          <div className="space-y-1">
            {engineMoves.slice(0, 3).map((move, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-200">{move.move}</span>
                <span className={`text-sm font-mono font-bold ${getEvalColor(move)}`}>
                  {formatEngineEval(move)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tablebase best moves */}
      {showTablebase && tablebaseMoves.length > 0 && (
        <div className="px-4">
          <div className="text-xs text-gray-500 mb-1.5">Tablebase</div>
          <div className="space-y-1">
            {tablebaseMoves.slice(0, 3).map((move, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-200">{move.move}</span>
                <span className={`text-sm font-mono font-bold ${getEvalColor(move, true)}`}>
                  {formatTablebaseEval(move)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No moves available */}
      {showEngine && engineMoves.length === 0 && showTablebase && tablebaseMoves.length === 0 && !isLoading && (
        <div className="px-4 py-2">
          <p className="text-sm text-gray-500">No analysis available</p>
        </div>
      )}
    </div>
  );
};