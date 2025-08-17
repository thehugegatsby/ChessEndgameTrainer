/**
 * @file Service wrappers for orchestrator use
 * @module services/orchestrator
 *
 * @description
 * Provides non-hook service wrappers for use in orchestrators and other
 * non-React contexts. These wrappers provide direct access to services
 * without requiring React hooks or component context.
 *
 * @remarks
 * Orchestrators run outside of React component context and cannot use hooks.
 * These wrappers provide a clean interface for accessing services from
 * orchestrator code without dynamic imports or direct service references.
 */

import { tablebaseService } from '@domains/evaluation';
import type { TablebaseEvaluation, TablebaseMovesResult } from '@shared/types/tablebase';

/**
 * Orchestrator-friendly wrapper for tablebase service
 *
 * Provides tablebase functionality without requiring React hooks or dynamic imports.
 * Designed for use in store orchestrators and other non-React contexts.
 */
export class OrchestratorTablebaseService {
  /**
   * Get tablebase evaluation for a position
   *
   * @param fen - Position in FEN notation
   * @returns Promise resolving to tablebase evaluation
   */
  static getEvaluation(fen: string): Promise<TablebaseEvaluation> {
    return tablebaseService.getEvaluation(fen);
  }

  /**
   * Get top moves from tablebase for a position
   *
   * @param fen - Position in FEN notation
   * @param limit - Maximum number of moves to return (default: 10)
   * @returns Promise resolving to tablebase moves
   */
  static getTopMoves(fen: string, limit: number = 10): Promise<TablebaseMovesResult> {
    return tablebaseService.getTopMoves(fen, limit);
  }

  /**
   * Check if a position has tablebase data available
   *
   * @param fen - Position in FEN notation
   * @returns Promise resolving to availability status
   */
  static async isAvailable(fen: string): Promise<boolean> {
    const response = await tablebaseService.getEvaluation(fen);
    return response.isAvailable;
  }

  /**
   * Get metrics from the tablebase service
   *
   * @returns Service metrics including cache stats
   */
  static getMetrics(): {
    cacheHitRate: number;
    totalApiCalls: number;
    errorBreakdown: Record<string, number>;
    dedupedRequests: number;
  } {
    return tablebaseService.getMetrics();
  }

  /**
   * Clear the tablebase cache
   *
   * Useful for testing or when memory needs to be freed.
   */
  static clearCache(): void {
    tablebaseService.clearCache();
  }
}

/**
 * Re-export for convenience
 */
export const orchestratorTablebase = OrchestratorTablebaseService;
