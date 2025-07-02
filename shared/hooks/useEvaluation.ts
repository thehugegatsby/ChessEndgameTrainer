import { useState, useEffect, useRef, useCallback } from 'react';
import { Move } from 'chess.js';

interface EvaluationData {
  evaluation: number;
  mateInMoves?: number;
  tablebase?: {
    isTablebasePosition: boolean;
    wdlBefore?: number;
    wdlAfter?: number;
    category?: string;
    dtz?: number;
  };
}

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
  
  const engineRef = useRef<any>(null);
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
    if (!isEnabled || !fen || lastFenRef.current === fen) {
      return;
    }

    lastFenRef.current = fen;
    
    const evaluatePosition = async () => {
      setIsEvaluating(true);
      setError(null);
      
      try {
        if (!engineRef.current) {
          const { ScenarioEngine } = await import('../lib/chess/ScenarioEngine');
          engineRef.current = new ScenarioEngine(fen);
        }

        engineRef.current.updatePosition(fen);
        
        const dualEvaluation = await engineRef.current.getDualEvaluation(fen);
        console.log('🔍 useEvaluation - Got dual evaluation:', dualEvaluation);
        
        const evaluation: EvaluationData = {
          evaluation: dualEvaluation.engine.score,
          mateInMoves: dualEvaluation.engine.mate || undefined
        };

        if (dualEvaluation.tablebase?.isAvailable && previousFen) {
          try {
            const previousDualEval = await engineRef.current.getDualEvaluation(previousFen);
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
  }, [fen, isEnabled, previousFen, addEvaluation]);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        try {
          engineRef.current.quit();
        } catch (error) {
          // Ignore cleanup errors
        }
        engineRef.current = null;
      }
    };
  }, []);

  return {
    evaluations,
    lastEvaluation,
    isEvaluating,
    error,
    addEvaluation,
    clearEvaluations
  };
}; 