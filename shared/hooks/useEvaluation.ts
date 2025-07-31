/**
 * Simplified evaluation hook using the new AnalysisService
 * Replaces the complex multi-layer evaluation pipeline
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { analysisService } from '@shared/lib/chess/AnalysisService';
import { ErrorService } from '@shared/services/errorService';
import { Logger } from '@shared/services/logging/Logger';
import type { EvaluationData } from '@shared/types';

const logger = new Logger();

interface UseEvaluationOptions {
  fen: string;
  isEnabled: boolean;
  previousFen?: string;
}

export interface UseEvaluationReturn {
  evaluations: EvaluationData[];
  lastEvaluation: EvaluationData | null;
  isEvaluating: boolean;
  error: string | null;
  addEvaluation: (evaluation: EvaluationData) => void;
  clearEvaluations: () => void;
}

export function useEvaluation({ fen, isEnabled }: UseEvaluationOptions): UseEvaluationReturn {
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

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
    logger.info('[useEvaluation] Effect triggered', { isEnabled, fen: fen?.slice(0, 20) + '...' });
    
    if (!isEnabled || !fen) {
      logger.debug('[useEvaluation] Skipping evaluation - not enabled or no FEN');
      return;
    }

    // Cancel any pending evaluation
    if (abortControllerRef.current) {
      logger.debug('[useEvaluation] Aborting previous evaluation');
      abortControllerRef.current.abort();
    }

    const evaluatePosition = async () => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      setIsEvaluating(true);
      setError(null);
      logger.info('[useEvaluation] Starting evaluation');

      try {
        // Get analysis from simplified service
        const result = await analysisService.analyzePosition(fen);
        
        if (abortController.signal.aborted) {
          return;
        }

        // Convert to EvaluationData format
        const evaluation: EvaluationData = {
          evaluation: result.evaluation,
          mateInMoves: result.mateInMoves,
          depth: result.engineData?.depth,
          pv: result.engineData?.pv ? result.engineData.pv.split(' ') : undefined,
          pvString: result.engineData?.pvString,
          multiPvResults: result.engineData?.multiPvResults?.map((item, index) => ({
            move: '', // UCI move not available from our simplified service
            san: item.san,
            score: item.score,
            pv: [], // PV not available for each line in simplified service
            rank: index + 1
          })),
          tablebase: result.tablebase
        };

        logger.info('[useEvaluation] Got evaluation', { 
          hasMultiPv: !!evaluation.multiPvResults,
          multiPvCount: evaluation.multiPvResults?.length 
        });

        if (!abortController.signal.aborted) {
          addEvaluation(evaluation);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          logger.error('[useEvaluation] Evaluation failed', err);
          const userMessage = ErrorService.handleChessEngineError(err, {
            component: 'useEvaluation',
            action: 'evaluatePosition',
            additionalData: { fen }
          });
          setError(userMessage);
        } else {
          logger.debug('[useEvaluation] Evaluation aborted');
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsEvaluating(false);
        }
      }
    };

    evaluatePosition();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fen, isEnabled, addEvaluation]);

  return {
    evaluations,
    lastEvaluation,
    isEvaluating,
    error,
    addEvaluation,
    clearEvaluations
  };
}