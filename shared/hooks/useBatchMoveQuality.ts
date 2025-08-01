/**
 * Hook for efficient batch move quality assessment
 *
 * Provides centralized move quality analysis for multiple moves
 * Following clean architecture principles with optimized performance
 *
 * Features:
 * - Batch processing of multiple moves
 * - Efficient resource usage (single service instance)
 * - Controlled parallelity to prevent system overload
 * - Race condition protection with AbortController
 * - Comprehensive error handling
 *
 * @module useBatchMoveQuality
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { tablebaseService } from "@shared/services/TablebaseService";
import { assessTablebaseMoveQuality } from "@shared/utils/moveQuality";
import { Chess } from "chess.js";
import type { SimplifiedMoveQualityResult } from "../types/evaluation";
import { Logger } from "../services/logging/Logger";

const logger = new Logger();

export interface MoveToAnalyze {
  /** Move in SAN notation */
  san: string;
  /** FEN position before the move */
  fenBefore: string;
  /** FEN position after the move */
  fenAfter: string;
  /** Player who made the move */
  player: "w" | "b";
}

interface UseBatchMoveQualityState {
  /** Map of move SAN to quality result */
  results: Map<string, SimplifiedMoveQualityResult>;
  /** Whether any analysis is in progress */
  isLoading: boolean;
  /** Error from analysis */
  error: Error | null;
  /** Number of completed analyses */
  completed: number;
  /** Total number of moves to analyze */
  total: number;
}

/**
 * Hook for efficient batch move quality assessment
 *
 * Analyzes multiple moves in controlled batches to optimize performance
 * and prevent system overload
 *
 * @returns Object with results map, loading state, and analysis function
 */
export const useBatchMoveQuality = () => {
  const [state, setState] = useState<UseBatchMoveQualityState>({
    results: new Map(),
    isLoading: false,
    error: null,
    completed: 0,
    total: 0,
  });

  // Ref to manage abort controller and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Analyze multiple moves in batch with controlled parallelism
   *
   * @param moves - Array of moves to analyze
   * @param maxParallel - Maximum number of parallel analyses (default: 2)
   * @returns Promise resolving to results map
   */
  const analyzeMoveBatch = useCallback(
    async (
      moves: MoveToAnalyze[],
      maxParallel: number = 2,
    ): Promise<Map<string, SimplifiedMoveQualityResult>> => {
      // Abort previous analysis if running
      abortControllerRef.current?.abort();

      // Create new abort controller for this batch
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Initialize state
      const resultsMap = new Map<string, SimplifiedMoveQualityResult>();
      setState({
        results: new Map(),
        isLoading: true,
        error: null,
        completed: 0,
        total: moves.length,
      });

      try {
        logger.info("[useBatchMoveQuality] Starting batch analysis", {
          moveCount: moves.length,
          maxParallel,
        });

        // Process moves in controlled batches
        const batches = createBatches(moves, maxParallel);

        for (const batch of batches) {
          if (controller.signal.aborted) {
            break;
          }

          // Process batch in parallel
          const promises = batch.map((move) =>
            analyzeSingleMove(move, controller.signal),
          );

          const batchResults = await Promise.allSettled(promises);

          // Process results
          batchResults.forEach((result, index) => {
            const move = batch[index];

            if (result.status === "fulfilled" && result.value) {
              resultsMap.set(move.san, result.value);
            } else if (result.status === "rejected") {
              logger.warn("[useBatchMoveQuality] Move analysis failed", {
                move: move.san,
                error: result.reason,
              });
            }
          });

          // Update state with progress
          if (!controller.signal.aborted) {
            setState((prev) => ({
              ...prev,
              results: new Map(resultsMap),
              completed: prev.completed + batch.length,
            }));
          }
        }

        // Final state update
        if (!controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            results: resultsMap,
          }));

          logger.info("[useBatchMoveQuality] Batch analysis completed", {
            successCount: resultsMap.size,
            totalCount: moves.length,
          });
        }

        return resultsMap;
      } catch (error) {
        if (controller.signal.aborted) {
          logger.warn("[useBatchMoveQuality] Batch analysis aborted");
          throw new Error("Batch analysis aborted");
        }

        const errorObj =
          error instanceof Error ? error : new Error("Unknown error occurred");

        logger.error("[useBatchMoveQuality] Batch analysis failed", errorObj);

        // Update state with error
        if (abortControllerRef.current === controller) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorObj,
          }));
        }

        throw errorObj;
      }
    },
    [],
  );

  /**
   * Clear current analysis results
   */
  const clearResults = useCallback(() => {
    setState({
      results: new Map(),
      isLoading: false,
      error: null,
      completed: 0,
      total: 0,
    });
  }, []);

  return {
    /** Map of move SAN to quality result */
    results: state.results,
    /** Whether any analysis is in progress */
    isLoading: state.isLoading,
    /** Error from analysis */
    error: state.error,
    /** Analysis progress (completed/total) */
    progress: {
      completed: state.completed,
      total: state.total,
      percentage: state.total > 0 ? (state.completed / state.total) * 100 : 0,
    },
    /** Analyze batch of moves */
    analyzeMoveBatch,
    /** Clear current results */
    clearResults,
  };
};

/**
 * Analyze a single move with the unified service
 * @private
 */
async function analyzeSingleMove(
  move: MoveToAnalyze,
  signal: AbortSignal,
): Promise<SimplifiedMoveQualityResult | null> {
  try {
    if (signal.aborted) {
      return null;
    }

    // Calculate FEN after the move if not provided
    const fenAfter =
      move.fenAfter ||
      (() => {
        const chess = new Chess(move.fenBefore);
        const moveResult = chess.move(move.san);
        return moveResult ? chess.fen() : null;
      })();

    if (!fenAfter) {
      return {
        quality: "unknown" as const,
        reason: "Invalid move",
        isTablebaseAnalysis: false,
      };
    }

    // Get tablebase evaluations
    const [evalBefore, evalAfter] = await Promise.all([
      tablebaseService.getEvaluation(move.fenBefore),
      tablebaseService.getEvaluation(fenAfter),
    ]);

    // Check if both positions have tablebase data
    if (
      !evalBefore.isAvailable ||
      !evalAfter.isAvailable ||
      !evalBefore.result ||
      !evalAfter.result
    ) {
      return {
        quality: "unknown" as const,
        reason: "No tablebase data",
        isTablebaseAnalysis: false,
      };
    }

    // Assess move quality
    const result = assessTablebaseMoveQuality(
      evalBefore.result.wdl,
      evalAfter.result.wdl,
    );

    return result;
  } catch (error) {
    logger.error("[useBatchMoveQuality] Single move analysis failed", error);
    return null;
  }
}

/**
 * Create batches of moves for controlled parallel processing
 * @private
 */
function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches;
}
