import React from 'react';
import { Move } from 'chess.js';

interface MoveAnalysisData {
  move: Move;
  evaluation?: number;
  bestMove?: string;
  classification?: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

interface MoveAnalysisProps {
  analysisData: MoveAnalysisData[];
  selectedMoveIndex: number | null;
  onMoveSelect: (index: number) => void;
}

const getClassificationColor = (classification?: MoveAnalysisData['classification']) => {
  switch (classification) {
    case 'excellent': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
    case 'good': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
    case 'inaccuracy': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30';
    case 'mistake': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30';
    case 'blunder': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
  }
};

const getClassificationSymbol = (classification?: MoveAnalysisData['classification']) => {
  switch (classification) {
    case 'excellent': return '!!';
    case 'good': return '!';
    case 'inaccuracy': return '?!';
    case 'mistake': return '?';
    case 'blunder': return '??';
    default: return '';
  }
};

export const MoveAnalysis: React.FC<MoveAnalysisProps> = React.memo(({
  analysisData,
  selectedMoveIndex,
  onMoveSelect
}) => {
  return (
    <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Zugfolge</h4>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {analysisData.map((analysis, index) => {
            const moveNumber = Math.floor(index / 2) + 1;
            const isWhiteMove = index % 2 === 0;
            
            return (
              <div
                key={index}
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-sm ${
                  selectedMoveIndex === index 
                    ? 'bg-blue-100 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-700' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => onMoveSelect(index)}
              >
                {/* Move Number */}
                {isWhiteMove && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-6">
                    {moveNumber}.
                  </span>
                )}
                {!isWhiteMove && <span className="w-6"></span>}
                
                {/* Move */}
                <span className="font-mono font-medium text-gray-800 dark:text-gray-200 min-w-[45px]">
                  {analysis.move.san}
                </span>
                
                {/* Classification */}
                {analysis.classification && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getClassificationColor(analysis.classification)}`}>
                    {getClassificationSymbol(analysis.classification)}
                  </span>
                )}
                
                {/* Evaluation */}
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 ml-auto">
                  {analysis.evaluation !== undefined ? (
                    analysis.evaluation > 0 ? `+${analysis.evaluation.toFixed(2)}` : analysis.evaluation.toFixed(2)
                  ) : '0.00'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

MoveAnalysis.displayName = 'MoveAnalysis'; 