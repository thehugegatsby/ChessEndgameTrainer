/**
 * DualEvaluationPanel - Restored with Clean Architecture
 * 
 * Two-column layout showing Engine and Tablebase evaluations side-by-side
 * Uses existing useEvaluation hook and clean architecture patterns
 * Enhanced with efficient batch move quality assessment
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { useEvaluation } from '@shared/hooks/useEvaluation';
import { useBatchMoveQuality, type MoveToAnalyze } from '@shared/hooks/useBatchMoveQuality';
import { MoveQualityDisplay } from '@shared/components/analysis/MoveQualityDisplay';
import { TablebasePanel } from '@shared/components/tablebase/TablebasePanel';

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

  // Batch move quality assessment
  const { results, isLoading: isQualityLoading, analyzeMoveBatch, clearResults } = useBatchMoveQuality();

  // Extract player to move from FEN
  const playerToMove = fen.split(' ')[1] as 'w' | 'b';

  // Memoize moves to analyze based on evaluation results
  const movesToAnalyze = useMemo((): MoveToAnalyze[] => {
    if (!lastEvaluation || !previousFen) return [];
    
    const moves: MoveToAnalyze[] = [];
    
    // Add engine moves
    if (lastEvaluation.multiPvResults && lastEvaluation.multiPvResults.length > 0) {
      for (const result of lastEvaluation.multiPvResults.slice(0, 3)) {
        try {
          const chess = new Chess(fen);
          const moveResult = chess.move(result.san);
          if (moveResult) {
            moves.push({
              san: result.san,
              fenBefore: fen,
              fenAfter: chess.fen(),
              player: playerToMove,
            });
          }
        } catch (err) {
          // Skip invalid moves
        }
      }
    }
    
    // Add tablebase moves
    if (lastEvaluation.tablebase?.topMoves && lastEvaluation.tablebase.topMoves.length > 0) {
      for (const move of lastEvaluation.tablebase.topMoves.slice(0, 3)) {
        try {
          const chess = new Chess(fen);
          const moveResult = chess.move(move.san);
          if (moveResult) {
            moves.push({
              san: move.san,
              fenBefore: fen,
              fenAfter: chess.fen(),
              player: playerToMove,
            });
          }
        } catch (err) {
          // Skip invalid moves
        }
      }
    }
    
    return moves;
  }, [lastEvaluation, fen, playerToMove, previousFen]);

  // Trigger batch analysis when moves change
  useEffect(() => {
    if (isVisible && movesToAnalyze.length > 0) {
      analyzeMoveBatch(movesToAnalyze);
    } else if (!isVisible) {
      clearResults();
    }
  }, [isVisible, movesToAnalyze, analyzeMoveBatch, clearResults]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="dual-evaluation-panel" data-testid="dual-evaluation-panel">
      
      {/* Vertical Layout - Engine on top, Tablebase below */}
      <div className="space-y-6">
        
        {/* Engine Top-3 Moves */}
        <div className="engine-evaluation-section" data-testid="engine-evaluation-panel">
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">🔧 Engine</div>
          
          {isEvaluating && (
            <div className="text-xs text-blue-500 mb-2">🔄 Analysiert...</div>
          )}

          {error ? (
            <div className="text-xs text-red-500 font-medium">
              ❌ {error}
            </div>
          ) : lastEvaluation ? (
            <div className="space-y-3">
              {/* Top 3 Engine Moves - Clean Layout like Tablebase */}
              {lastEvaluation.multiPvResults && lastEvaluation.multiPvResults.length > 0 ? (
                <div className="space-y-1">
                  {lastEvaluation.multiPvResults.slice(0, 3).map((result, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <div className="flex items-center">
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-sm">
                          {result.san}
                        </span>
                        {/* Move Quality Assessment for Engine Moves */}
                        <MoveQualityDisplay
                          quality={results.get(result.san) || null}
                          isLoading={isQualityLoading}
                          onRetry={() => analyzeMoveBatch(movesToAnalyze)}
                        />
                      </div>
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                        {result.score.type === 'mate' 
                          ? `#${Math.abs(result.score.value)}`
                          : `${result.score.value >= 0 ? '+' : ''}${(result.score.value / 100).toFixed(2)}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
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
        </div>

        {/* Enhanced Tablebase Panel - Below Engine */}
        <div className="tablebase-evaluation-section" data-testid="tablebase-evaluation-panel">
          <TablebasePanel
            tablebaseData={lastEvaluation?.tablebase || { isTablebasePosition: false }}
            onMoveSelect={(move) => {
              // TODO: Implement move selection logic
            }}
            selectedMove={undefined}
            loading={isEvaluating}
            compact={false}
          />
        </div>
        
      </div>
    </div>
  );
};
