/**
 * Evaluation hook using the unified evaluation system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { EvaluationData } from '@shared/types';
// TODO: Replace with SimpleEngine types after refactoring
type MultiPvResult = any;
import { UnifiedEvaluationService } from '@shared/lib/chess/evaluation/unifiedService';
import { EngineProviderAdapter } from '@shared/lib/chess/evaluation/providerAdapters';
import { LRUCache } from '@shared/lib/cache/LRUCache';
import { LRUCacheAdapter } from '@shared/lib/chess/evaluation/cacheAdapter';
import type { FormattedEvaluation } from '@shared/types/evaluation';
import { ErrorService } from '@shared/services/errorService';
import { Logger } from '@shared/services/logging/Logger';
import { CACHE } from '@shared/constants';

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
  cacheStats?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

// Singleton unified service instance for consistent behavior
let unifiedServiceInstance: UnifiedEvaluationService | null = null;

function getUnifiedService(): UnifiedEvaluationService {
  if (!unifiedServiceInstance) {
    const lruCache = new LRUCache<FormattedEvaluation>(CACHE.EVALUATION_CACHE_SIZE);
    const cache = new LRUCacheAdapter(lruCache);
    const engineProvider = new EngineProviderAdapter();
    
    unifiedServiceInstance = new UnifiedEvaluationService(
      engineProvider,
      cache
    );
  }
  return unifiedServiceInstance;
}

/**
 * Main evaluation hook implementation
 */
export function useEvaluation({ fen, isEnabled, previousFen }: UseEvaluationOptions): UseEvaluationReturn {
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const service = getUnifiedService();
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
        // Get player perspective from FEN
        const fenParts = fen.split(' ');
        const playerToMove = fenParts[1] as 'w' | 'b';
        logger.debug('[useEvaluation] Player to move', { playerToMove });
        
        // Get formatted evaluation from unified service
        logger.debug('[useEvaluation] Calling service.getFormattedEvaluation');
        const formattedEval = await service.getFormattedEvaluation(fen, playerToMove);
        logger.info('[useEvaluation] Got formatted evaluation', { formattedEval });
        
        if (abortController.signal.aborted) {
          return;
        }

        // PHASE 2.2: Also get raw engine evaluation with PV data
        const rawEngineEval = await service.getRawEngineEvaluation(fen, playerToMove);
        
        // Create multiPvResults from the engine line - extract first 3 moves
        let multiPvResults: MultiPvResult[] | undefined = undefined;
        if (rawEngineEval && rawEngineEval.pv) {
          // Convert PV string to SAN notation
          try {
            const gameClone = new (await import('chess.js')).Chess(fen);
            // pv can be either string or string[]
            const pvString = Array.isArray(rawEngineEval.pv) 
              ? rawEngineEval.pv.join(' ') 
              : rawEngineEval.pv;
            const moves = pvString.split(' ');
            
            // Extract up to 3 moves from the PV
            multiPvResults = [];
            for (let i = 0; i < Math.min(3, moves.length); i++) {
              const uciMove = moves[i];
              if (!uciMove) continue;
              
              // Convert UCI to SAN
              const from = uciMove.substring(0, 2);
              const to = uciMove.substring(2, 4);
              const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
              
              const move = gameClone.move({
                from,
                to,
                promotion
              });
              
              if (move) {
                // For the first move, use the actual evaluation
                // For subsequent moves, we don't have separate evaluations
                const score = i === 0 ? {
                  type: rawEngineEval.mate !== null ? 'mate' : 'cp',
                  value: rawEngineEval.mate !== null ? rawEngineEval.mate : rawEngineEval.score
                } : {
                  type: 'cp' as const,
                  value: 0 // Placeholder for continuation moves
                };
                
                multiPvResults.push({
                  san: move.san,
                  score
                });
              }
            }
            
            // Only set multiPvResults if we have at least one move
            if (multiPvResults.length === 0) {
              multiPvResults = undefined;
            }
          } catch (error) {
            logger.warn('[useEvaluation] Failed to convert PV to SAN', error);
          }
        }

        // Convert formatted evaluation to legacy format
        let evaluationScore: number;
        
        // Handle tablebase evaluations differently
        if (formattedEval.metadata.isTablebase) {
          // For tablebase positions, use 0 as default since actual value comes from WDL
          evaluationScore = 0;
        } else {
          // For engine evaluations, parse the score
          evaluationScore = parseFloat(formattedEval.mainText.replace(/[+M]/g, '')) * 100; // Convert to centipawns
        }
        
        const evaluation: EvaluationData = {
          evaluation: evaluationScore,
          mateInMoves: formattedEval.metadata.isMate ? 
            parseInt(formattedEval.mainText.replace(/[M+-]/g, '')) : undefined,
          // PHASE 2.2: Include enhanced UCI data from raw engine evaluation
          pv: rawEngineEval?.pv,
          pvString: rawEngineEval?.pvString,
          depth: rawEngineEval?.depth,
          nps: rawEngineEval?.nps,
          time: rawEngineEval?.time,
          nodes: rawEngineEval?.nodes,
          hashfull: rawEngineEval?.hashfull,
          seldepth: rawEngineEval?.seldepth,
          multipv: rawEngineEval?.multipv,
          currmove: rawEngineEval?.currmove,
          currmovenumber: rawEngineEval?.currmovenumber,
          // PHASE 3: Include Multi-PV results for Top-3 moves display
          multiPvResults: multiPvResults
        };

        // Handle tablebase data if available
        
        // Handle tablebase data - either with comparison (if previousFen) or standalone
        if (formattedEval.metadata.isTablebase) {
          if (previousFen) {
            // CASE 1: We have a previous position - do full comparison for move quality
            // CRITICAL: For move comparison, we need the perspective of the player who MADE the move
            // If it's currently black's turn (playerToMove === 'b'), then white just moved
            // If it's currently white's turn (playerToMove === 'w'), then black just moved
            const playerWhoMoved = playerToMove === 'b' ? 'w' : 'b';
            
            
            // Get tablebase comparison from the perspective of the player who made the move
            const prevPerspectiveEval = await service.getPerspectiveEvaluation(previousFen, playerWhoMoved);
            const currPerspectiveEval = await service.getPerspectiveEvaluation(fen, playerWhoMoved);
            
            
            if (prevPerspectiveEval.isTablebasePosition && currPerspectiveEval.isTablebasePosition) {
              evaluation.tablebase = {
                isTablebasePosition: true,
                // CRITICAL: Use RAW WDL values, not perspective-adjusted ones!
                // The getMoveQualityByTablebaseComparison function expects raw API values
                // Convert null to undefined to match TablebaseData interface
                wdlBefore: prevPerspectiveEval.wdl !== null ? prevPerspectiveEval.wdl : undefined,
                wdlAfter: currPerspectiveEval.wdl !== null ? currPerspectiveEval.wdl : undefined,
                category: formattedEval.metadata.isDrawn ? 'draw' : 
                         formattedEval.className === 'winning' ? 'win' : 'loss',
                dtz: currPerspectiveEval.dtz !== null ? currPerspectiveEval.dtz : undefined
              };
              
              // Add top 3 tablebase moves using engine PV as placeholder
              // TODO: Implement real tablebase API call for top moves
              if (evaluation.tablebase && rawEngineEval?.pv) {
                try {
                  const gameClone = new (await import('chess.js')).Chess(fen);
                  // pv can be either string or string[]
                  const pvString = Array.isArray(rawEngineEval.pv) 
                    ? rawEngineEval.pv.join(' ') 
                    : rawEngineEval.pv;
                  const moves = pvString.split(' ');
                  
                  // Extract up to 3 moves for tablebase display
                  evaluation.tablebase.topMoves = [];
                  for (let i = 0; i < Math.min(3, moves.length); i++) {
                    const uciMove = moves[i];
                    if (!uciMove) continue;
                    
                    const from = uciMove.substring(0, 2);
                    const to = uciMove.substring(2, 4);
                    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
                    
                    const move = gameClone.move({ from, to, promotion });
                    
                    if (move) {
                      evaluation.tablebase.topMoves.push({
                        move: uciMove, // UCI format
                        san: move.san,
                        dtz: evaluation.tablebase.dtz || 0,
                        dtm: 0, // Not available from engine
                        wdl: evaluation.tablebase.wdlAfter || 0,
                        category: (evaluation.tablebase.category || 'draw') as 'win' | 'draw' | 'loss'
                      });
                    }
                  }
                } catch (error) {
                  logger.warn('[useEvaluation] Failed to create tablebase moves', error);
                }
              }
              
            }
          } else {
            // CASE 2: No previous position (initial position) - just add current tablebase status
            
            const currPerspectiveEval = await service.getPerspectiveEvaluation(fen, playerToMove);
            
            
            if (currPerspectiveEval.isTablebasePosition) {
              evaluation.tablebase = {
                isTablebasePosition: true,
                // For initial position, only wdlAfter is set (use raw WDL)
                // Convert null to undefined to match TablebaseData interface
                wdlAfter: currPerspectiveEval.wdl !== null ? currPerspectiveEval.wdl : undefined,
                category: formattedEval.metadata.isDrawn ? 'draw' : 
                         formattedEval.className === 'winning' ? 'win' : 'loss',
                dtz: currPerspectiveEval.dtz !== null ? currPerspectiveEval.dtz : undefined
              };
              
              // Add top 3 tablebase moves using engine PV as placeholder
              // TODO: Implement real tablebase API call for top moves
              if (evaluation.tablebase && rawEngineEval?.pv) {
                try {
                  const gameClone = new (await import('chess.js')).Chess(fen);
                  // pv can be either string or string[]
                  const pvString = Array.isArray(rawEngineEval.pv) 
                    ? rawEngineEval.pv.join(' ') 
                    : rawEngineEval.pv;
                  const moves = pvString.split(' ');
                  
                  // Extract up to 3 moves for tablebase display
                  evaluation.tablebase.topMoves = [];
                  for (let i = 0; i < Math.min(3, moves.length); i++) {
                    const uciMove = moves[i];
                    if (!uciMove) continue;
                    
                    const from = uciMove.substring(0, 2);
                    const to = uciMove.substring(2, 4);
                    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
                    
                    const move = gameClone.move({ from, to, promotion });
                    
                    if (move) {
                      evaluation.tablebase.topMoves.push({
                        move: uciMove, // UCI format
                        san: move.san,
                        dtz: evaluation.tablebase.dtz || 0,
                        dtm: 0, // Not available from engine
                        wdl: evaluation.tablebase.wdlAfter || 0,
                        category: (evaluation.tablebase.category || 'draw') as 'win' | 'draw' | 'loss'
                      });
                    }
                  }
                } catch (error) {
                  logger.warn('[useEvaluation] Failed to create tablebase moves', error);
                }
              }
              
            }
          }
        }

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
  }, [fen, isEnabled, previousFen, service, addEvaluation]);

  return {
    evaluations,
    lastEvaluation,
    isEvaluating,
    error,
    addEvaluation,
    clearEvaluations,
    cacheStats: undefined // TODO: Expose cache stats from unified service
  };
}