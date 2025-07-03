import { useState, useEffect, useRef, useCallback } from 'react';
import { Move } from 'chess.js';
import { EvaluationData } from '@shared/types';
import { useEngine } from './useEngine';

interface UseEvaluationOptions {
  fen: string;
  isEnabled: boolean;
  previousFen?: string;
}

interface UseEvaluationReturn {
  evaluations: EvaluationData[];
  lastEvaluation: EvaluationData | null;
  isEvaluating: boolean;
  error: string | null;
  addEvaluation: (evaluation: EvaluationData) => void;
  clearEvaluations: () => void;
}

export const useEvaluation = ({ fen, isEnabled, previousFen }: UseEvaluationOptions): UseEvaluationReturn => {
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use managed engine service instead of creating new instances
  const { engine, isLoading: engineLoading, error: engineError } = useEngine({
    id: 'evaluation-hook',
    autoCleanup: true
  });
  
  const lastFenRef = useRef<string>('');

  const addEvaluation = useCallback((evaluation: EvaluationData) => {
    setEvaluations(prev => [...prev, evaluation]);
    setLastEvaluation(evaluation);
  }, []);

  const clearEvaluations = useCallback(() => {
    setEvaluations([]);
    setLastEvaluation(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isEnabled || !fen || lastFenRef.current === fen || !engine || engineLoading) {
      return;
    }

    lastFenRef.current = fen;
    
    const evaluatePosition = async () => {
      setIsEvaluating(true);
      setError(null);
      
      try {
        // Update engine position before evaluation
        engine.updatePosition(fen);
        
        const dualEvaluation = await engine.getDualEvaluation(fen);
        console.log('🔍 useEvaluation - Got dual evaluation:', dualEvaluation);
        
        const evaluation: EvaluationData = {
          evaluation: dualEvaluation.engine.score,
          mateInMoves: dualEvaluation.engine.mate || undefined
        };

        if (dualEvaluation.tablebase?.isAvailable && previousFen) {
          try {
            engine.updatePosition(previousFen);
            const previousDualEval = await engine.getDualEvaluation(previousFen);
            console.log('🔍 useEvaluation - Previous position tablebase:', previousDualEval.tablebase);
            
            if (previousDualEval.tablebase?.isAvailable) {
              evaluation.tablebase = {
                isTablebasePosition: true,
                wdlBefore: previousDualEval.tablebase.result.wdl,
                wdlAfter: dualEvaluation.tablebase.result.wdl,
                category: dualEvaluation.tablebase.result.category,
                dtz: dualEvaluation.tablebase.result.dtz
              };
              
              console.log('🏆 useEvaluation - TABLEBASE COMPARISON AVAILABLE:', {
                previousFen,
                currentFen: fen,
                wdlBefore: evaluation.tablebase.wdlBefore,
                wdlAfter: evaluation.tablebase.wdlAfter,
                categoryBefore: previousDualEval.tablebase.result.category,
                categoryAfter: evaluation.tablebase.category
              });
            } else {
              console.log('⚠️ useEvaluation - Previous position not in tablebase');
            }
          } catch (error) {
            console.warn('⚠️ useEvaluation - Failed to get previous position tablebase:', error);
          }
        } else if (dualEvaluation.tablebase?.isAvailable) {
          evaluation.tablebase = {
            isTablebasePosition: true,
            category: dualEvaluation.tablebase.result.category,
            dtz: dualEvaluation.tablebase.result.dtz
          };
          console.log('📊 useEvaluation - Tablebase position but no comparison available');
        }
        
        addEvaluation(evaluation);
        
      } catch (err: any) {
        console.error('Evaluation failed:', err);
        setError(err.message || 'Evaluation failed');
      } finally {
        setIsEvaluating(false);
      }
    };

    evaluatePosition();
  }, [fen, isEnabled, previousFen, addEvaluation, engine, engineLoading]);

  // Error handling for engine initialization
  useEffect(() => {
    if (engineError) {
      setError(`Engine initialization failed: ${engineError}`);
    }
  }, [engineError]);

  return {
    evaluations,
    lastEvaluation,
    isEvaluating: isEvaluating || engineLoading,
    error: error || engineError,
    addEvaluation,
    clearEvaluations
  };
}; 