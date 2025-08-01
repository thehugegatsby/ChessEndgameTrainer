/**
 * Position Analysis hook using TablebaseService directly
 * Acts as adapter between TablebaseService and UI components
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { tablebaseService } from "@shared/services/TablebaseService";
import { formatPositionAnalysis } from "@shared/utils/positionAnalysisFormatter";
import { ErrorService } from "@shared/services/errorService";
import { Logger } from "@shared/services/logging/Logger";
import type { PositionAnalysis } from "@shared/types";

const logger = new Logger();

interface UsePositionAnalysisOptions {
  fen: string;
  isEnabled: boolean;
  previousFen?: string;
}

export interface UsePositionAnalysisReturn {
  evaluations: PositionAnalysis[];
  lastEvaluation: PositionAnalysis | null;
  isEvaluating: boolean;
  error: string | null;
  addEvaluation: (evaluation: PositionAnalysis) => void;
  clearEvaluations: () => void;
}

export function usePositionAnalysis({
  fen,
  isEnabled,
}: UsePositionAnalysisOptions): UsePositionAnalysisReturn {
  const [evaluations, setEvaluations] = useState<PositionAnalysis[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<PositionAnalysis | null>(
    null,
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const addEvaluation = useCallback((evaluation: PositionAnalysis) => {
    setEvaluations((prev) => [...prev, evaluation]);
    setLastEvaluation(evaluation);
  }, []);

  const clearEvaluations = useCallback(() => {
    setEvaluations([]);
    setLastEvaluation(null);
    setError(null);
  }, []);

  useEffect(() => {
    logger.info("[usePositionAnalysis] Effect triggered", {
      isEnabled,
      fen: fen?.slice(0, 20) + "...",
    });

    if (!isEnabled || !fen) {
      logger.debug(
        "[usePositionAnalysis] Skipping evaluation - not enabled or no FEN",
      );
      return;
    }

    // Cancel any pending evaluation
    if (abortControllerRef.current) {
      logger.debug("[usePositionAnalysis] Aborting previous evaluation");
      abortControllerRef.current.abort();
    }

    const evaluatePosition = async () => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsEvaluating(true);
      setError(null);
      logger.info("[usePositionAnalysis] Starting evaluation");

      try {
        // Get tablebase evaluation directly
        const tablebaseResult = await tablebaseService.getEvaluation(fen);

        if (abortController.signal.aborted) {
          return;
        }

        // No tablebase data available
        if (!tablebaseResult.isAvailable || !tablebaseResult.result) {
          const evaluation: PositionAnalysis = {
            evaluation: 0,
            tablebase: undefined,
          };
          if (!abortController.signal.aborted) {
            addEvaluation(evaluation);
          }
          return;
        }

        // Format tablebase result for UI
        const displayData = formatPositionAnalysis(tablebaseResult.result);

        // Get top moves for display
        const topMoves = await tablebaseService.getTopMoves(fen, 5);

        // Convert to PositionAnalysis format (adapter pattern)
        const evaluation: PositionAnalysis = {
          evaluation: displayData.score,
          mateInMoves:
            displayData.isWin && tablebaseResult.result.dtz
              ? Math.abs(tablebaseResult.result.dtz)
              : undefined,
          tablebase: {
            isTablebasePosition: true,
            wdlAfter: tablebaseResult.result.wdl,
            category: tablebaseResult.result.category as
              | "win"
              | "draw"
              | "loss",
            dtz: tablebaseResult.result.dtz ?? undefined,
            topMoves:
              topMoves.isAvailable && topMoves.moves
                ? topMoves.moves.map((move) => ({
                    move: move.uci,
                    san: move.san,
                    dtz: move.dtz || 0,
                    dtm: move.dtm || 0,
                    wdl: move.wdl,
                    category: move.category as "win" | "draw" | "loss",
                  }))
                : [],
          },
        };

        logger.info("[usePositionAnalysis] Got tablebase evaluation", {
          wdl: tablebaseResult.result.wdl,
          dtz: tablebaseResult.result.dtz,
          topMovesCount: evaluation.tablebase?.topMoves?.length,
        });

        if (!abortController.signal.aborted) {
          addEvaluation(evaluation);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          logger.error("[usePositionAnalysis] Evaluation failed", err);
          const userMessage = ErrorService.handleChessEngineError(err, {
            component: "usePositionAnalysis",
            action: "evaluatePosition",
            additionalData: { fen },
          });
          setError(userMessage);
        } else {
          logger.debug("[usePositionAnalysis] Evaluation aborted");
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
    clearEvaluations,
  };
}
