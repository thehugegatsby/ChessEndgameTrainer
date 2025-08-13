/**
 * @file Hook for move quality assessment with React Query
 * @module hooks/useMoveQuality
 *
 * @description
 * React Query-powered move quality analysis with automatic caching.
 * Provides controlled move quality analysis with optimal performance.
 * Uses parallel React Query hooks for position evaluations.
 *
 * @remarks
 * Key improvements over original:
 * - React Query caching eliminates duplicate API calls for same FEN positions
 * - Parallel query execution for better performance
 * - Built-in loading/error states from React Query
 * - Automatic deduplication of identical evaluation requests
 * - Smart retry logic for network failures
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTablebaseEvaluation } from "@shared/hooks/useTablebaseQuery";
import { assessTablebaseMoveQuality } from "@shared/utils/moveQuality";
import { Chess } from "chess.js";
import type { SimplifiedMoveQualityResult } from "../types/evaluation";
import { getLogger } from "@shared/services/logging";

const logger = getLogger().setContext('useMoveQuality');

/**
 * State interface for move quality analysis
 */
interface UseMoveQualityState {
  /** Current move quality result */
  data: SimplifiedMoveQualityResult | null;
  /** Whether analysis is in progress */
  isLoading: boolean;
  /** Error from analysis */
  error: Error | null;
  /** FEN positions being analyzed */
  currentAnalysis: {
    fenBefore: string;
    fenAfter: string;
    move: string;
  } | null;
}

/**
 * Hook for move quality assessment using React Query
 *
 * @description
 * Uses React Query hooks for position evaluations with automatic caching.
 * Provides better performance through parallel queries and deduplication.
 * 
 * Key benefits:
 * - FEN-based caching prevents duplicate API calls
 * - Parallel execution of before/after position evaluations
 * - React Query's built-in loading/error states
 * - Automatic retry logic for failed requests
 *
 * @returns {Object} Hook return object
 * @returns {SimplifiedMoveQualityResult | null} returns.data - Current move quality result
 * @returns {boolean} returns.isLoading - Whether analysis is in progress
 * @returns {Error | null} returns.error - Error from analysis if any
 * @returns {Function} returns.assessMove - Trigger function for move quality assessment
 * @returns {Function} returns.clearAnalysis - Clear current analysis data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, assessMove } = useMoveQuality();
 *
 * // Assess a move when user plays
 * const handleMove = async (move: string) => {
 *   try {
 *     const result = await assessMove(currentFen, move, 'w');
 *     if (result.quality === 'mistake') {
 *       showWarning(result.reason);
 *     }
 *   } catch (err) {
 *     console.error('Move assessment failed:', err);
 *   }
 * };
 * ```
 */
/**
 * Return type for useMoveQuality hook
 */
export type UseMoveQualityReturn = {
  readonly data: SimplifiedMoveQualityResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly assessMove: (fenBefore: string, move: string, playerPerspective: "w" | "b") => Promise<SimplifiedMoveQualityResult>;
  readonly clearAnalysis: () => void;
};

export const useMoveQuality = (): UseMoveQualityReturn => {
  const [state, setState] = useState<UseMoveQualityState>({
    data: null,
    isLoading: false,
    error: null,
    currentAnalysis: null,
  });

  // Abort controller for race condition protection
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate FEN after move
  const fenAfter = useMemo(() => {
    if (!state.currentAnalysis) return null;
    
    try {
      const chess = new Chess(state.currentAnalysis.fenBefore);
      const moveResult = chess.move(state.currentAnalysis.move);
      return moveResult ? chess.fen() : null;
    } catch {
      return null;
    }
  }, [state.currentAnalysis]);

  // React Query hooks for position evaluations
  const evalBefore = useTablebaseEvaluation(
    state.currentAnalysis?.fenBefore || null,
    { 
      enabled: Boolean(state.currentAnalysis?.fenBefore),
      staleTime: 30 * 60 * 1000, // 30 minutes - tablebase data is immutable
    }
  );

  const evalAfter = useTablebaseEvaluation(
    fenAfter,
    { 
      enabled: Boolean(fenAfter),
      staleTime: 30 * 60 * 1000, // 30 minutes - tablebase data is immutable
    }
  );

  // Track pending assessment promises
  const pendingAssessmentRef = useRef<{
    resolve: (result: SimplifiedMoveQualityResult) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
  } | null>(null);

  // Process query results
  useEffect(() => {
    if (!state.currentAnalysis) return;
    
    // Update loading state based on query states
    const isQueryLoading = evalBefore.isLoading || evalAfter.isLoading;
    const hasQueryError = evalBefore.isError || evalAfter.isError;
    
    if (hasQueryError) {
      const error = evalBefore.error || evalAfter.error || new Error("Query failed");
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        data: null,
      }));
      
      // Resolve pending assessment with error
      if (pendingAssessmentRef.current) {
        clearTimeout(pendingAssessmentRef.current.timeoutId);
        pendingAssessmentRef.current.reject(error as Error);
        pendingAssessmentRef.current = null;
      }
      return;
    }

    if (isQueryLoading) {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
      return;
    }

    // Process results when both queries complete
    if (evalBefore.data && evalAfter.data) {
      try {
        // Check if both positions have tablebase data
        if (!evalBefore.data.isAvailable || 
            !evalAfter.data.isAvailable ||
            !evalBefore.data.result || 
            !evalAfter.data.result) {
          
          const result: SimplifiedMoveQualityResult = {
            quality: "unknown",
            reason: "No tablebase data available",
            isTablebaseAnalysis: false,
          };
          
          setState(prev => ({
            ...prev,
            data: result,
            isLoading: false,
            error: null,
          }));
          
          // Resolve pending assessment
          if (pendingAssessmentRef.current) {
            clearTimeout(pendingAssessmentRef.current.timeoutId);
            pendingAssessmentRef.current.resolve(result);
            pendingAssessmentRef.current = null;
          }
          return;
        }

        // Calculate move quality using helper function
        const result = assessTablebaseMoveQuality(
          evalBefore.data.result.wdl,
          evalAfter.data.result.wdl,
        );

        // Log the calculation details
        const wdlChange = -evalAfter.data.result.wdl - evalBefore.data.result.wdl;
        logger.info("[useMoveQuality] Quality calculation details", {
          wdlBefore: evalBefore.data.result.wdl,
          wdlAfter: evalAfter.data.result.wdl,
          wdlChange,
          calculatedQuality: result.quality,
        });

        setState(prev => ({
          ...prev,
          data: result,
          isLoading: false,
          error: null,
        }));

        logger.info("[useMoveQuality] Move quality assessment completed", {
          quality: result.quality,
          reason: result.reason,
          isTablebaseAnalysis: result.isTablebaseAnalysis,
        });
        
        // Resolve pending assessment
        if (pendingAssessmentRef.current) {
          clearTimeout(pendingAssessmentRef.current.timeoutId);
          pendingAssessmentRef.current.resolve(result);
          pendingAssessmentRef.current = null;
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error("Analysis failed");
        setState(prev => ({
          ...prev,
          data: null,
          isLoading: false,
          error: errorObj,
        }));
        
        // Resolve pending assessment with error
        if (pendingAssessmentRef.current) {
          clearTimeout(pendingAssessmentRef.current.timeoutId);
          pendingAssessmentRef.current.reject(errorObj);
          pendingAssessmentRef.current = null;
        }
      }
    }
  }, [state.currentAnalysis, evalBefore.data, evalAfter.data, evalBefore.isLoading, evalAfter.isLoading, evalBefore.isError, evalAfter.isError, evalBefore.error, evalAfter.error]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (pendingAssessmentRef.current) {
        clearTimeout(pendingAssessmentRef.current.timeoutId);
        pendingAssessmentRef.current.reject(new Error("Component unmounted"));
        pendingAssessmentRef.current = null;
      }
    };
  }, []);

  /**
   * Assess move quality using React Query
   *
   * @param fenBefore - FEN position before the move
   * @param move - Move in SAN or UCI notation
   * @param playerPerspective - Player who made the move
   * @returns Promise resolving to move quality result
   * @throws Error if assessment fails
   */
  const assessMove = useCallback(
    (
      fenBefore: string,
      move: string,
      playerPerspective: "w" | "b",
    ): Promise<SimplifiedMoveQualityResult> => {
      // Abort previous request if running
      abortControllerRef.current?.abort();

      // Create new abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      logger.info("[useMoveQuality] Starting move quality assessment", {
        fenBefore: `${fenBefore.slice(0, 30)  }...`,
        move,
        playerPerspective,
      });

      // Validate move first
      try {
        const chess = new Chess(fenBefore);
        const moveResult = chess.move(move);
        if (!moveResult) {
          const result: SimplifiedMoveQualityResult = {
            quality: "unknown",
            reason: "Invalid move",
            isTablebaseAnalysis: false,
          };
          setState(prev => ({
            ...prev,
            data: result,
            isLoading: false,
            error: null,
            currentAnalysis: null,
          }));
          return Promise.resolve(result);
        }
      } catch {
        const result: SimplifiedMoveQualityResult = {
          quality: "unknown",
          reason: "Invalid move",
          isTablebaseAnalysis: false,
        };
        setState(prev => ({
          ...prev,
          data: result,
          isLoading: false,
          error: null,
          currentAnalysis: null,
        }));
        return Promise.resolve(result);
      }

      // Clean up any existing pending assessment
      if (pendingAssessmentRef.current) {
        clearTimeout(pendingAssessmentRef.current.timeoutId);
        pendingAssessmentRef.current.reject(new Error("Superseded by new assessment"));
        pendingAssessmentRef.current = null;
      }

      // Set up analysis - this will trigger the React Query hooks
      setState(prev => ({
        ...prev,
        currentAnalysis: {
          fenBefore,
          fenAfter: "", // Will be calculated by useMemo
          move,
        },
        isLoading: true,
        error: null,
        data: null,
      }));

      // Return a promise that resolves when analysis completes
      return new Promise((resolve, reject) => {
        // Handle abortion
        if (controller.signal.aborted) {
          resolve({
            quality: "unknown" as const,
            reason: "Assessment cancelled",
            isTablebaseAnalysis: false,
          });
          return;
        }

        // Set up timeout (30 seconds instead of 10)
        const timeoutId = setTimeout(() => {
          if (pendingAssessmentRef.current) {
            pendingAssessmentRef.current = null;
            reject(new Error("Move quality assessment timeout after 30 seconds"));
          }
        }, 30000);

        // Store the promise handlers
        pendingAssessmentRef.current = {
          resolve,
          reject,
          timeoutId,
        };

        // Listen for abort signal
        controller.signal.addEventListener('abort', () => {
          if (pendingAssessmentRef.current) {
            clearTimeout(pendingAssessmentRef.current.timeoutId);
            pendingAssessmentRef.current.resolve({
              quality: "unknown" as const,
              reason: "Assessment cancelled",
              isTablebaseAnalysis: false,
            });
            pendingAssessmentRef.current = null;
          }
        });
      });
    },
    [],
  );

  /**
   * Clear current analysis data
   */
  const clearAnalysis = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      data: null,
      isLoading: false,
      error: null,
      currentAnalysis: null,
    });
  }, []);

  return {
    /** Current move quality result */
    data: state.data,
    /** Whether analysis is in progress */
    isLoading: state.isLoading,
    /** Error from analysis */
    error: (() => {
      if (!state.error) return null;
      if (state.error instanceof Error) return state.error.message;
      return String(state.error);
    })(),
    /** Trigger function for move quality assessment */
    assessMove,
    /** Clear current analysis data */
    clearAnalysis,
  };
};