/**
 * DualEvaluationSidebar - Optimized version for sidebar integration
 * Compact display that fits the chess.com-style sidebar
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useEngine } from '@shared/hooks';
import { DualEvaluation } from '@shared/lib/chess/ScenarioEngine';
import { EngineErrorBoundary } from '@shared/components/ui';
import { BestMovesDisplay } from './BestMovesDisplay';

interface DualEvaluationSidebarProps {
  fen: string;
  onEvaluationUpdate?: (evaluation: DualEvaluation) => void;
  isVisible: boolean;
  showEngine?: boolean;
  showTablebase?: boolean;
}

export const DualEvaluationSidebar: React.FC<DualEvaluationSidebarProps> = ({ 
  fen, 
  onEvaluationUpdate,
  isVisible,
  showEngine = true,
  showTablebase = true
}) => {
  const [evaluation, setEvaluation] = useState<DualEvaluation | null>(null);
  const [bestMoves, setBestMoves] = useState<{
    engine: Array<{ move: string; evaluation: number; mate?: number }>;
    tablebase: Array<{ move: string; wdl: number; dtm?: number; evaluation: string }>;
  }>({ engine: [], tablebase: [] });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use managed engine service
  const { engine, isLoading: engineLoading, error: engineError } = useEngine({
    id: 'dual-evaluation-sidebar',
    autoCleanup: true
  });

  useEffect(() => {
    if (!isVisible || !fen || !engine || engineLoading) return;

    let isMounted = true;

    const evaluatePosition = async () => {
      try {
        setIsEvaluating(true);
        setError(null);

        // Update engine position before evaluation
        engine.updatePosition(fen);
        const result = await engine.getDualEvaluation(fen);
        
        if (isMounted) {
          setEvaluation(result);
          onEvaluationUpdate?.(result);
          
          // Get best moves if available
          if (showEngine || showTablebase) {
            const moves = await engine.getBestMoves(fen, 3);
            setBestMoves(moves);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Evaluation failed');
        }
      } finally {
        if (isMounted) {
          setIsEvaluating(false);
        }
      }
    };

    evaluatePosition();

    return () => {
      isMounted = false;
    };
  }, [fen, engine, engineLoading, isVisible, onEvaluationUpdate]);

  if (!isVisible) {
    return null;
  }

  const isLoading = engineLoading || isEvaluating;

  const getEvaluationColor = (score: number) => {
    if (Math.abs(score) < 50) return 'text-yellow-400';
    return score > 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatScore = (score: number, mate?: number | null) => {
    if (mate !== null && mate !== undefined) {
      return `M${Math.abs(mate)}`;
    }
    const formatted = (score / 100).toFixed(1);
    return score >= 0 ? `+${formatted}` : formatted;
  };

  const getConfidenceBar = (confidence: number) => {
    const percentage = Math.min(100, Math.max(0, confidence));
    return (
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const getTablebaseDisplay = (tablebase?: DualEvaluation['tablebase']) => {
    if (!tablebase?.result?.wdl) return null;
    
    const resultText = tablebase.result.wdl === 2 ? 'Gewinn' : 
                      tablebase.result.wdl === -2 ? 'Verlust' : 
                      'Remis';
    
    const resultColor = tablebase.result.wdl === 2 ? 'text-green-400' : 
                       tablebase.result.wdl === -2 ? 'text-red-400' : 
                       'text-yellow-400';

    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Tablebase:</span>
        <span className={`font-medium ${resultColor}`}>
          {resultText}
          {tablebase.result.dtz && ` in ${Math.abs(tablebase.result.dtz)}`}
        </span>
      </div>
    );
  };

  if (engineError || error) {
    return (
      <div className="text-red-400 text-xs">
        {engineError || error}
      </div>
    );
  }

  return (
    <EngineErrorBoundary engineId="dual-evaluation-sidebar">
      {/* Best moves display - Lichess style */}
      <BestMovesDisplay
        engineMoves={bestMoves.engine}
        tablebaseMoves={bestMoves.tablebase}
        showEngine={showEngine}
        showTablebase={showTablebase}
        isLoading={isLoading}
      />
    </EngineErrorBoundary>
  );
};