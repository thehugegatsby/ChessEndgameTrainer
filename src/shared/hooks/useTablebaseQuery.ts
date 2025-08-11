/**
 * @file React Query hooks for Tablebase operations
 * @description Wraps TablebaseService with React Query for optimal caching and data fetching
 */

import { useQuery, useQueryClient, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { tablebaseService } from '@shared/services/TablebaseService';
import type { TablebaseEvaluation, TablebaseMovesResult } from '@shared/services/TablebaseService';
import { getLogger } from '@shared/services/logging';

const logger = getLogger().setContext('useTablebaseQuery');

/**
 * Query key factory for tablebase operations
 */
export const tablebaseKeys = {
  all: ['tablebase'] as const,
  evaluations: () => [...tablebaseKeys.all, 'evaluation'] as const,
  evaluation: (fen: string) => [...tablebaseKeys.evaluations(), fen] as const,
  moves: () => [...tablebaseKeys.all, 'moves'] as const,
  topMoves: (fen: string, limit: number) => [...tablebaseKeys.moves(), 'top', fen, limit] as const,
};

/**
 * Hook to get tablebase evaluation for a position
 * @param fen - Position in FEN notation
 * @param options - React Query options
 * @returns Tablebase evaluation with React Query state
 */
export function useTablebaseEvaluation(
  fen: string | null,
  options?: Partial<UseQueryOptions<TablebaseEvaluation, Error>>
): UseQueryResult<TablebaseEvaluation, Error> {
  return useQuery({
    queryKey: fen ? tablebaseKeys.evaluation(fen) : [],
    queryFn: async () => {
      if (!fen) {
        throw new Error('FEN is required for tablebase evaluation');
      }

      logger.debug('Fetching tablebase evaluation', { fen });
      const result = await tablebaseService.getEvaluation(fen);
      
      // Log result for debugging
      if (result.isAvailable) {
        logger.debug('Tablebase evaluation success', { 
          fen, 
          category: result.result?.category,
          wdl: result.result?.wdl
        });
      } else {
        logger.debug('Tablebase evaluation not available', { fen, error: result.error });
      }
      
      return result;
    },
    enabled: Boolean(fen),
    staleTime: 30 * 60 * 1000, // 30 minutes (tablebase data is immutable)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry if the position is simply not in tablebase (not an error)
      if (error.message.includes('404') || error.message.includes('not in tablebase')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    ...options,
  });
}

/**
 * Hook to get top moves from tablebase
 * @param fen - Position in FEN notation  
 * @param limit - Maximum number of moves to return
 * @param options - React Query options
 * @returns Top moves with React Query state
 */
export function useTablebaseTopMoves(
  fen: string | null,
  limit: number = 3,
  options?: Partial<UseQueryOptions<TablebaseMovesResult, Error>>
): UseQueryResult<TablebaseMovesResult, Error> {
  return useQuery({
    queryKey: fen ? tablebaseKeys.topMoves(fen, limit) : [],
    queryFn: async () => {
      if (!fen) {
        throw new Error('FEN is required for tablebase moves');
      }

      logger.debug('Fetching tablebase top moves', { fen, limit });
      const result = await tablebaseService.getTopMoves(fen, limit);
      
      // Log result for debugging
      if (result.isAvailable) {
        logger.debug('Tablebase moves success', { 
          fen, 
          moveCount: result.moves?.length || 0,
          topMove: result.moves?.[0]?.san
        });
      } else {
        logger.debug('Tablebase moves not available', { fen, error: result.error });
      }
      
      return result;
    },
    enabled: Boolean(fen),
    staleTime: 30 * 60 * 1000, // 30 minutes (tablebase data is immutable)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry if the position is simply not in tablebase
      if (error.message.includes('404') || error.message.includes('not in tablebase')) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
}

/**
 * Hook to prefetch tablebase evaluation for a position
 * @returns Prefetch function
 */
export function usePrefetchTablebaseEvaluation() {
  const queryClient = useQueryClient();
  
  return (fen: string) => {
    queryClient.prefetchQuery({
      queryKey: tablebaseKeys.evaluation(fen),
      queryFn: () => tablebaseService.getEvaluation(fen),
      staleTime: 30 * 60 * 1000,
    });
  };
}

/**
 * Hook to get tablebase service metrics
 * @returns Service metrics
 */
export function useTablebaseMetrics(): UseQueryResult<{ cacheHitRate: number; totalApiCalls: number; errorBreakdown: Record<string, number>; dedupedRequests: number }, Error> {
  return useQuery({
    queryKey: [...tablebaseKeys.all, 'metrics'],
    queryFn: () => tablebaseService.getMetrics(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}