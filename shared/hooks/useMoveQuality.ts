/**
 * Hook for on-demand move quality assessment
 * 
 * Provides controlled move quality analysis with loading/error states
 * Following clean architecture principles with trigger-based evaluation
 * 
 * Features:
 * - Race condition protection with AbortController
 * - Robust error handling with state management
 * - Automatic cleanup on unmount
 * 
 * @module useMoveQuality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { unifiedService } from './useEvaluation';
import type { MoveQualityResult } from '../types/evaluation';
import { Logger } from '../services/logging/Logger';

const logger = new Logger();

interface UseMoveQualityState {
  /** Current move quality result */
  data: MoveQualityResult | null;
  /** Whether analysis is in progress */
  isLoading: boolean;
  /** Error from analysis */
  error: Error | null;
}

/**
 * Hook for on-demand move quality assessment
 * 
 * Returns state and trigger function for controlled analysis
 * No automatic evaluation - only when assessMove is called
 * 
 * @returns Object with state and assessMove trigger function
 */
export const useMoveQuality = () => {
  const [state, setState] = useState<UseMoveQualityState>({
    data: null,
    isLoading: false,
    error: null,
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
   * Assess move quality on-demand
   * 
   * @param fenBefore - FEN position before the move
   * @param move - Move in SAN or UCI notation
   * @param playerPerspective - Player who made the move
   * @returns Promise resolving to move quality result
   * @throws Error if assessment fails
   */
  const assessMove = useCallback(async (
    fenBefore: string,
    move: string,
    playerPerspective: 'w' | 'b'
  ): Promise<MoveQualityResult> => {
    // Abort previous request if running
    abortControllerRef.current?.abort();
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Set loading state
    setState({ data: null, isLoading: true, error: null });
    
    try {
      logger.info('[useMoveQuality] Starting move quality assessment', {
        fenBefore: fenBefore.slice(0, 30) + '...',
        move,
        playerPerspective
      });

      // Call unified service for analysis
      const result = await unifiedService.assessMoveQuality(fenBefore, move, playerPerspective);
      
      // Only update state if request wasn't aborted
      if (!controller.signal.aborted) {
        setState({ data: result, isLoading: false, error: null });
        abortControllerRef.current = null; // Request completed
        
        logger.info('[useMoveQuality] Move quality assessment completed', {
          quality: result.quality,
          reason: result.reason,
          isTablebaseAnalysis: result.isTablebaseAnalysis
        });
      }
      
      return result;
    } catch (error) {
      if (controller.signal.aborted) {
        logger.warn('[useMoveQuality] Assessment aborted by new request');
        throw new Error('Assessment aborted by new request');
      }
      
      const errorObj = error instanceof Error ? error : new Error('Unknown error occurred');
      
      logger.error('[useMoveQuality] Move quality assessment failed', errorObj);
      
      // Only update state if this was the active request
      if (abortControllerRef.current === controller) {
        setState({ data: null, isLoading: false, error: errorObj });
      }
      
      throw errorObj;
    }
  }, []);

  /**
   * Clear current analysis data
   */
  const clearAnalysis = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    /** Current move quality result */
    data: state.data,
    /** Whether analysis is in progress */
    isLoading: state.isLoading,
    /** Error from analysis */
    error: state.error,
    /** Trigger function for move quality assessment */
    assessMove,
    /** Clear current analysis data */
    clearAnalysis,
  };
};

