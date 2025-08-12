/**
 * React Query Hooks for Tablebase functionality
 * 
 * These hooks provide the React integration layer with
 * caching, loading states, and error handling via React Query.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { tablebaseService } from '../services/TablebaseService';
import type { TablebaseEvaluation, TablebaseMove } from '../types/interfaces';
import { TablebaseError } from '../types/interfaces';

/**
 * Query key factory for tablebase operations
 */
export const tablebaseQueryKeys = {
  all: ['tablebase'] as const,
  
  evaluation: (fen: string) => 
    [...tablebaseQueryKeys.all, 'evaluation', fen] as const,
  
  moves: (fen: string, limit: number) => 
    [...tablebaseQueryKeys.all, 'moves', fen, limit] as const,
};

/**
 * Hook to get tablebase evaluation for a position
 * 
 * @param fen - Position in FEN notation
 * @param options - Additional React Query options
 * @returns Query result with evaluation data
 * 
 * @example
 * const { data, isLoading, error } = useTablebaseEvaluation(fen);
 * 
 * if (isLoading) return <Skeleton />;
 * if (error) return <ErrorMessage />;
 * if (data) return <div>{data.outcome}</div>;
 */
export function useTablebaseEvaluation(
  fen: string | null,
  options?: Partial<UseQueryOptions<TablebaseEvaluation, TablebaseError>>
): ReturnType<typeof useQuery<TablebaseEvaluation, TablebaseError>> {
  return useQuery({
    queryKey: fen ? tablebaseQueryKeys.evaluation(fen) : ['disabled'],
    
    queryFn: async () => {
      if (!fen) {
        throw new TablebaseError('FEN is required', 'INVALID_FEN');
      }
      
      return tablebaseService.evaluate(fen);
    },
    
    enabled: Boolean(fen),
    
    // Tablebase data is immutable - cache forever
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    
    // Retry strategy
    retry: (failureCount, error) => {
      // Don't retry if position is not in tablebase
      if (error.code === 'NOT_FOUND') {
        return false;
      }
      
      // Don't retry on invalid FEN
      if (error.code === 'INVALID_FEN') {
        return false;
      }
      
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    
    ...options,
  });
}

/**
 * Hook to get best moves from tablebase
 * 
 * @param fen - Position in FEN notation
 * @param limit - Maximum number of moves to return
 * @param options - Additional React Query options
 * @returns Query result with moves data
 * 
 * @example
 * const { data: moves, isLoading } = useTablebaseMoves(fen, 5);
 * 
 * if (moves) {
 *   moves.forEach(move => {
 *     console.log(`${move.san}: ${move.outcome}`);
 *   });
 * }
 */
export function useTablebaseMoves(
  fen: string | null,
  limit: number = 3,
  options?: Partial<UseQueryOptions<TablebaseMove[], TablebaseError>>
): ReturnType<typeof useQuery<TablebaseMove[], TablebaseError>> {
  return useQuery({
    queryKey: fen ? tablebaseQueryKeys.moves(fen, limit) : ['disabled'],
    
    queryFn: async () => {
      if (!fen) {
        throw new TablebaseError('FEN is required', 'INVALID_FEN');
      }
      
      return tablebaseService.getBestMoves(fen, limit);
    },
    
    enabled: Boolean(fen),
    
    // Tablebase data is immutable - cache forever
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    
    // Retry strategy (same as evaluation)
    retry: (failureCount, error) => {
      if (error.code === 'NOT_FOUND' || error.code === 'INVALID_FEN') {
        return false;
      }
      return failureCount < 2;
    },
    
    ...options,
  });
}

/**
 * Combined hook for both evaluation and moves
 * Useful when you need both pieces of data
 * 
 * @example
 * const { evaluation, moves, isLoading, error } = useTablebase(fen);
 */
export function useTablebase(
  fen: string | null,
  moveLimit: number = 3
): {
  evaluation: TablebaseEvaluation | undefined;
  moves: TablebaseMove[] | undefined;
  isLoading: boolean;
  isEvaluationLoading: boolean;
  isMovesLoading: boolean;
  error: TablebaseError | null;
  evaluationError: TablebaseError | null;
  movesError: TablebaseError | null;
} {
  const evaluationQuery = useTablebaseEvaluation(fen);
  const movesQuery = useTablebaseMoves(fen, moveLimit);
  
  return {
    evaluation: evaluationQuery.data,
    moves: movesQuery.data,
    isLoading: evaluationQuery.isLoading || movesQuery.isLoading,
    isEvaluationLoading: evaluationQuery.isLoading,
    isMovesLoading: movesQuery.isLoading,
    error: evaluationQuery.error || movesQuery.error,
    evaluationError: evaluationQuery.error,
    movesError: movesQuery.error,
  };
}