/**
 * @file Analysis Panel with React Query Integration
 * @description Migrated version of AnalysisPanel using React Query hooks
 */

import React, { useState, useEffect, useMemo } from "react";
import { type Move } from "chess.js";
import { Chess } from "chess.js";
import { useTablebaseEvaluation, useTablebaseTopMoves } from "@shared/hooks/useTablebaseQuery";
import { SIZE_MULTIPLIERS } from '@shared/constants/multipliers';
import { MoveAnalysis } from "./MoveAnalysis";
import { AnalysisDetails } from "./AnalysisDetails";
import { DIMENSIONS } from "@shared/constants";
import type { MoveAnalysisData } from "./types";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext("AnalysisPanel");

// MoveAnalysisData interface moved to ./types.ts to prevent duplicate definitions

interface AnalysisPanelProps {
  history: Move[];
  initialFen?: string;
  onClose: () => void;
  isVisible: boolean;
}

/**
 * Position data for a single move analysis
 */
interface PositionData {
  fenBefore: string;
  fenAfter: string;
  move: Move;
  index: number;
}

/**
 * Custom hook for single move analysis using React Query
 */
function useMoveAnalysis(position: PositionData | null, enabled: boolean): { analysisData: MoveAnalysisData | null; isLoading: boolean; isError: boolean } {
  const evalBefore = useTablebaseEvaluation(position?.fenBefore || null, { enabled });
  const evalAfter = useTablebaseEvaluation(position?.fenAfter || null, { enabled });
  const topMoves = useTablebaseTopMoves(position?.fenBefore || null, 1, { enabled });

  const analysisData = useMemo((): MoveAnalysisData | null => {
    if (!position || !evalBefore.data || !evalAfter.data || !topMoves.data) {
      return null;
    }

    // Calculate move quality based on WDL change
    let classification: MoveAnalysisData["classification"] = "good";
    
    if (evalBefore.data.isAvailable && 
        evalAfter.data.isAvailable &&
        evalBefore.data.result && 
        evalAfter.data.result) {
      
      const wdlBefore = evalBefore.data.result.wdl;
      const wdlAfter = evalAfter.data.result.wdl;
      const wdlChange = wdlBefore - wdlAfter; // From player's perspective

      if (wdlChange >= 2) classification = "blunder"; // Win to loss
      else if (wdlChange >= 1) classification = "mistake"; // Win to draw or draw to loss  
      else if (wdlChange > 0) classification = "inaccuracy"; // Small loss
      else if (wdlChange === 0) classification = "excellent"; // Maintained evaluation
      else classification = "good"; // Improved position
    }

    const bestMoveValue = topMoves.data.isAvailable && 
                          topMoves.data.moves && 
                          topMoves.data.moves.length > 0 &&
                          topMoves.data.moves[0]
      ? topMoves.data.moves[0].san
      : undefined;

    return {
      move: position.move,
      evaluation: evalAfter.data.isAvailable && evalAfter.data.result
        ? evalAfter.data.result.wdl
        : 0,
      classification,
      ...(bestMoveValue !== undefined && { bestMove: bestMoveValue }),
    };
  }, [position, evalBefore.data, evalAfter.data, topMoves.data]);

  return {
    analysisData,
    isLoading: evalBefore.isLoading || evalAfter.isLoading || topMoves.isLoading,
    isError: evalBefore.isError || evalAfter.isError || topMoves.isError,
  };
}

/**
 * Analysis Panel with React Query integration
 * 
 * This version uses React Query hooks for optimal caching and parallel data fetching.
 * Key improvements:
 * - Individual React Query hooks for each position evaluation
 * - Automatic caching and deduplication of FEN-based queries
 * - Better loading states and error handling
 * - Prefetch capability for performance optimization
 */
export const AnalysisPanel: React.FC<AnalysisPanelProps> = React.memo(
  ({ history, initialFen, onClose, isVisible }) => {
    const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);

    // Calculate all positions when history changes
    const positions = useMemo((): PositionData[] => {
      if (!isVisible || history.length === 0) return [];

      const startFen = initialFen || "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1";
      const chess = new Chess(startFen);
      const result: PositionData[] = [];

      for (let i = 0; i < history.length; i++) {
        const move = history[i];
        if (!move) {
          // Skip invalid moves
          continue;
        }
        const fenBefore = chess.fen();
        
        chess.move(move);
        const fenAfter = chess.fen();
        
        result.push({
          fenBefore,
          fenAfter,
          move,
          index: i,
        });
      }

      logger.info("Calculated positions for React Query analysis", {
        totalMoves: history.length,
        positionsGenerated: result.length,
      });

      return result;
    }, [history, initialFen, isVisible]);

    // Use React Query hooks for each position
    // For demonstration, we'll analyze the first few moves
    // In production, you might want to implement virtual scrolling for large games
    const maxAnalyzedMoves = Math.min(positions.length, SIZE_MULTIPLIERS.SMALL_FACTOR); // Limit to prevent too many concurrent requests
    
    const moveAnalyses = Array.from({ length: maxAnalyzedMoves }, (_, i) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useMoveAnalysis(
        positions[i] || null, 
        isVisible && i < positions.length
      );
    });

    // Aggregate analysis data
    const analysisData = useMemo(() => {
      return moveAnalyses
        .map(analysis => analysis.analysisData)
        .filter((data): data is MoveAnalysisData => data !== null);
    }, [moveAnalyses]);

    // Aggregate loading state
    const isLoading = moveAnalyses.some(analysis => analysis.isLoading);
    const hasError = moveAnalyses.some(analysis => analysis.isError);

    // Log analysis progress
    useEffect(() => {
      if (isVisible && positions.length > 0) {
        logger.info("React Query analysis progress", {
          totalPositions: positions.length,
          analyzedPositions: maxAnalyzedMoves,
          completedAnalyses: analysisData.length,
          isLoading,
          hasError,
        });
      }
    }, [positions.length, maxAnalyzedMoves, analysisData.length, isLoading, hasError, isVisible]);

    if (hasError) {
      logger.warn("React Query analysis encountered errors");
    }

    return (
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-xl shadow-lg border-t border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out z-50 ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: `${DIMENSIONS.ANALYSIS_PANEL_HEIGHT}px` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Spielanalyse (React Query)
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({history.length} Züge, {analysisData.length} analysiert)
            </span>
            {maxAnalyzedMoves < positions.length && (
              <span className="text-xs text-blue-500 dark:text-blue-400">
                (Zeige erste {maxAnalyzedMoves})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {(() => {
            if (isLoading) {
              return (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Lade Analyse mit React Query...
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {analysisData.length}/{maxAnalyzedMoves} Züge analysiert
                    </p>
                  </div>
                </div>
              );
            }
            if (hasError) {
              return (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">⚠️</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Fehler beim Laden der Analyse
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Neu laden
                    </button>
                  </div>
                </div>
              );
            }
            return (
            <>
              {/* Move Analysis List */}
              <MoveAnalysis
                analysisData={analysisData}
                selectedMoveIndex={selectedMoveIndex}
                onMoveSelect={setSelectedMoveIndex}
              />

              {/* Analysis Details */}
              <AnalysisDetails
                selectedMoveIndex={selectedMoveIndex}
                analysisData={analysisData}
              />
            </>
            );
          })()}
        </div>
      </div>
    );
  },
);

AnalysisPanel.displayName = "AnalysisPanel";