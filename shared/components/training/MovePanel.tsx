import React, { useMemo } from 'react';
import { Move } from 'chess.js';
import { getMoveQualityDisplay, getMoveQualityByTablebaseComparison, formatEvaluation } from '../../utils/chess/evaluationHelpers';
import { EvaluationLegend } from './EvaluationLegend';

interface MoveEvaluation {
  evaluation: number;
  mateInMoves?: number;
  // NEW: Tablebase data for true training value
  tablebase?: {
    isTablebasePosition: boolean;
    wdlBefore?: number;  // WDL value before this move
    wdlAfter?: number;   // WDL value after this move
    category?: string;   // win/draw/loss category
  };
}

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
      const whiteEval = evaluations[i];
      const blackEval = evaluations[i + 1];
      
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

  // NEW: Smart evaluation function that prioritizes tablebase comparison
  const getSmartMoveEvaluation = (evaluation: MoveEvaluation, isWhite: boolean) => {
    // Priority 1: Use tablebase comparison if available
    if (evaluation.tablebase?.isTablebasePosition && 
        evaluation.tablebase.wdlBefore !== undefined && 
        evaluation.tablebase.wdlAfter !== undefined) {
      
      console.log('🔍 Using tablebase comparison:', {
        wdlBefore: evaluation.tablebase.wdlBefore,
        wdlAfter: evaluation.tablebase.wdlAfter,
        side: isWhite ? 'white' : 'black'
      });
      
      return getMoveQualityByTablebaseComparison(
        evaluation.tablebase.wdlBefore,
        evaluation.tablebase.wdlAfter,
        isWhite ? 'w' : 'b'
      );
    }
    
    // Priority 2: Fallback to engine evaluation
    console.log('🔍 Using engine evaluation:', {
      evaluation: evaluation.evaluation,
      mate: evaluation.mateInMoves,
      side: isWhite ? 'white' : 'black'
    });
    
    return getMoveQualityDisplay(evaluation.evaluation, evaluation.mateInMoves, isWhite);
  };

  // Memoized move button component for performance
  const MoveButton = React.memo<{
    move: Move;
    moveIndex: number;
    evaluation?: MoveEvaluation;
    isWhite: boolean;
    isActive: boolean;
  }>(({ move, moveIndex, evaluation, isWhite, isActive }) => {
    const evalDisplay = evaluation ? getSmartMoveEvaluation(evaluation, isWhite) : null;
    
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={`w-2 h-2 rounded-full border flex-shrink-0 ${
          isWhite ? 'bg-gray-200' : 'bg-gray-700'
        }`}></div>
        <button
          onClick={() => onMoveClick?.(moveIndex)}
          className={`font-mono text-sm hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition-colors flex-shrink-0 ${
            isActive ? 'bg-blue-600 text-white' : ''
          }`}
          style={{ color: isActive ? 'white' : 'var(--text-primary)' }}
        >
          {move.san}
        </button>
        {showEvaluations && evaluation && evalDisplay && (
          <div 
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 ${evalDisplay.className}`}
            title={`${evalDisplay.text} ${evaluation.tablebase?.isTablebasePosition ? '(Tablebase)' : '(Engine)'}`}
          >
            {evalDisplay.text}
          </div>
        )}
      </div>
    );
  });

  MoveButton.displayName = 'MoveButton';

  if (moves.length === 0) {
    return (
      <div className="dark-card rounded-lg p-4 text-center">
        <span className="text-4xl mb-2 block">♟️</span>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Noch keine Züge gespielt
        </p>
      </div>
    );
  }

  return (
    <div className="dark-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="dark-card-elevated p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Züge
          </h3>
          {showEvaluations && (
            <span className="text-xs px-2 py-1 rounded" style={{ 
              backgroundColor: 'var(--info-bg)', 
              color: 'var(--info-text)' 
            }}>
              📊 Symbole
            </span>
          )}
        </div>
      </div>

      {/* Moves List */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-3 space-y-2">
          {movePairs.map((pair) => (
            <div 
              key={pair.moveNumber} 
              className="flex items-start gap-3 p-2 rounded transition-colors hover:bg-opacity-50"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              {/* Move Number */}
              <span className="text-xs font-mono w-6 text-center mt-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {pair.moveNumber}.
              </span>

              {/* White Move */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0"></div>
                <button
                  onClick={() => onMoveClick?.((pair.moveNumber - 1) * 2)}
                  className={`font-mono text-sm hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition-colors flex-shrink-0 ${
                    currentMoveIndex === (pair.moveNumber - 1) * 2 ? 'bg-blue-600 text-white' : ''
                  }`}
                  style={{ color: currentMoveIndex === (pair.moveNumber - 1) * 2 ? 'white' : 'var(--text-primary)' }}
                >
                  {pair.whiteMove.san}
                </button>
                {showEvaluations && pair.whiteEval && (() => {
                  const evalDisplay = getSmartMoveEvaluation(pair.whiteEval, true);
                  return (
                    <div 
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${evalDisplay.className}`}
                      title={`Weiß: ${evalDisplay.text} ${pair.whiteEval.tablebase?.isTablebasePosition ? '(Tablebase)' : '(Engine)'}`}
                    >
                      {evalDisplay.text}
                    </div>
                  );
                })()}
              </div>

              {/* Black Move */}
              {pair.blackMove ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-gray-700 flex-shrink-0"></div>
                  <button
                    onClick={() => onMoveClick?.((pair.moveNumber - 1) * 2 + 1)}
                    className={`font-mono text-sm hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition-colors flex-shrink-0 ${
                      currentMoveIndex === (pair.moveNumber - 1) * 2 + 1 ? 'bg-blue-600 text-white' : ''
                    }`}
                    style={{ color: currentMoveIndex === (pair.moveNumber - 1) * 2 + 1 ? 'white' : 'var(--text-primary)' }}
                  >
                    {pair.blackMove.san}
                  </button>
                  {showEvaluations && pair.blackEval && (() => {
                    const evalDisplay = getSmartMoveEvaluation(pair.blackEval, false);
                    return (
                      <div 
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${evalDisplay.className}`}
                        title={`Schwarz: ${evalDisplay.text} ${pair.blackEval.tablebase?.isTablebasePosition ? '(Tablebase)' : '(Engine)'}`}
                      >
                        {evalDisplay.text}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex-1"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Legend */}
      {showEvaluations && (
        <div className="border-t p-3" style={{ borderColor: 'var(--border-color)' }}>
          <EvaluationLegend />
        </div>
      )}
    </div>
  );
});

MovePanel.displayName = 'MovePanel'; 