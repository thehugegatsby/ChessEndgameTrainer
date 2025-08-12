/**
 * TablebaseService - Main Service Implementation
 * 
 * Orchestrates the tablebase functionality by combining
 * the API client and transformer. This service is stateless
 * and relies on React Query for caching.
 */

import type {
  TablebaseServiceInterface,
  TablebaseEvaluation,
  TablebaseMove,
  TablebaseApiResponse,
} from '../types/interfaces';
import { TablebaseError } from '../types/interfaces';
import { FenUtils } from '../types/models';
import { tablebaseApiClient, ApiError } from './TablebaseApiClient';
import { tablebaseTransformer } from './TablebaseTransformer';

export class TablebaseService implements TablebaseServiceInterface {
  /**
   * Evaluate a chess position
   * 
   * @param fen - Position in FEN notation
   * @returns Evaluation from the player's perspective
   * @throws {TablebaseError} for various error conditions
   */
  async evaluate(fen: string): Promise<TablebaseEvaluation> {
    try {
      // Validate FEN
      tablebaseTransformer.validateFen(fen);
      
      // Query API
      const apiResponse = await tablebaseApiClient.query(fen);
      
      // Transform to player's perspective
      const evaluation = tablebaseTransformer.normalizePositionEvaluation(
        apiResponse,
        fen
      );
      
      return evaluation;
      
    } catch (error) {
      // Convert errors to TablebaseError
      throw this.handleError(error);
    }
  }

  /**
   * Get the best moves for a position
   * 
   * @param fen - Position in FEN notation
   * @param limit - Maximum number of moves to return
   * @returns Best moves from the player's perspective
   * @throws {TablebaseError} for various error conditions
   */
  async getBestMoves(fen: string, limit: number = 3): Promise<TablebaseMove[]> {
    try {
      // Validate FEN
      tablebaseTransformer.validateFen(fen);
      
      // Query API
      const apiResponse = await tablebaseApiClient.query(fen);
      
      // Transform moves to player's perspective
      const moves = this.transformMoves(apiResponse, fen);
      
      // Sort moves by quality
      const sortedMoves = this.sortMovesByQuality(moves);
      
      // Return top moves
      return sortedMoves.slice(0, limit);
      
    } catch (error) {
      // Convert errors to TablebaseError
      throw this.handleError(error);
    }
  }

  /**
   * Transform API moves to domain moves with correct perspective
   */
  private transformMoves(
    apiResponse: TablebaseApiResponse,
    fen: string
  ): TablebaseMove[] {
    const isBlackToMove = FenUtils.isBlackToMove(fen);
    
    return apiResponse.moves.map(apiMove => {
      // Transform perspective for this move
      const outcome = tablebaseTransformer.normalizeMoveEvaluation(
        apiMove.wdl,
        isBlackToMove
      );
      
      return {
        uci: apiMove.uci,
        san: apiMove.san,
        outcome,
        dtm: apiMove.dtm ?? undefined,
        dtz: apiMove.dtz ?? undefined,
      };
    });
  }

  /**
   * Sort moves by quality (best first)
   * 
   * Sorting logic:
   * 1. Group by outcome (wins > draws > losses)
   * 2. Within wins: prefer faster mate (lower DTM)
   * 3. Within losses: prefer slower mate (higher DTM) for better defense
   * 4. Within draws: no particular ordering
   */
  private sortMovesByQuality(moves: TablebaseMove[]): TablebaseMove[] {
    return [...moves].sort((a, b) => {
      // First, sort by outcome
      const outcomeOrder = { win: 3, draw: 2, loss: 1 };
      const outcomeDiff = outcomeOrder[b.outcome] - outcomeOrder[a.outcome];
      
      if (outcomeDiff !== 0) {
        return outcomeDiff;
      }
      
      // Within the same outcome, use DTM for tie-breaking
      if (a.outcome === 'win') {
        // For wins: prefer faster mate (lower DTM)
        const aDtm = a.dtm ?? Infinity;
        const bDtm = b.dtm ?? Infinity;
        return aDtm - bDtm;
      }
      
      if (a.outcome === 'loss') {
        // For losses: prefer slower mate (higher DTM) - better defense
        const aDtm = a.dtm ?? -Infinity;
        const bDtm = b.dtm ?? -Infinity;
        return bDtm - aDtm;
      }
      
      // For draws: maintain original order
      return 0;
    });
  }

  /**
   * Convert various errors to TablebaseError
   */
  private handleError(error: unknown): TablebaseError {
    // Already a TablebaseError
    if (error instanceof TablebaseError) {
      return error;
    }
    
    // API errors
    if (error instanceof ApiError) {
      if (error.status === 404 || error.code === 'NOT_FOUND') {
        return new TablebaseError(
          'Position not in tablebase',
          'NOT_FOUND'
        );
      }
      
      if (error.code === 'TIMEOUT') {
        return new TablebaseError(
          'Tablebase service temporarily unavailable',
          'UNAVAILABLE'
        );
      }
      
      return new TablebaseError(
        error.message,
        'API_ERROR'
      );
    }
    
    // Validation errors
    if (error instanceof Error && error.message.includes('FEN')) {
      return new TablebaseError(
        error.message,
        'INVALID_FEN'
      );
    }
    
    // Generic errors
    if (error instanceof Error) {
      return new TablebaseError(
        error.message,
        'API_ERROR'
      );
    }
    
    // Unknown errors
    return new TablebaseError(
      'An unknown error occurred',
      'API_ERROR'
    );
  }
}

// Export singleton instance
export const tablebaseService = new TablebaseService();