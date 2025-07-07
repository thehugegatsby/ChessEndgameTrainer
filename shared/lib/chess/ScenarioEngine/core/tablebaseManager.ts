/**
 * @fileoverview Tablebase Management for ScenarioEngine
 * Handles tablebase queries, move analysis, and WDL perspective correction
 */

import { Chess } from 'chess.js';
import { TablebaseService } from '../tablebaseService';
import type { TablebaseInfo } from '../types';

/**
 * Tablebase integration methods
 * Manages tablebase queries and move analysis with proper WDL perspective handling
 */
export class TablebaseManager {
  private tablebaseService: TablebaseService;

  constructor(tablebaseService: TablebaseService) {
    this.tablebaseService = tablebaseService;
  }

  /**
   * Gets tablebase information for a position
   */
  async getTablebaseInfo(fen: string): Promise<TablebaseInfo> {
    return this.tablebaseService.getTablebaseInfo(fen);
  }

  /**
   * Gets tablebase moves for a position
   * 
   * AI_NOTE: CRITICAL BUG FIXED HERE - WDL values from tablebase API are ALWAYS from
   * White's perspective, but after making a move, we need the perspective of who just moved.
   * Line 46: We negate the WDL to get current player's perspective.
   * This was causing Black's best defensive moves to show as mistakes!
   * See: /shared/utils/chess/EVALUATION_LOGIC_LEARNINGS.md for full details
   */
  async getTablebaseMoves(fen: string, count: number): Promise<Array<{
    move: string;
    wdl: number;
    dtm?: number;
    evaluation: string;
  }>> {
    try {
      const tempChess = new Chess(fen);
      const legalMoves = tempChess.moves({ verbose: true });
      
      const tablebaseMoves = [];

      // Check more moves than requested to find best ones
      const movesToCheck = Math.min(legalMoves.length, count * 3);
      
      for (const move of legalMoves.slice(0, movesToCheck)) {
        tempChess.move(move);
        const positionAfterMove = tempChess.fen();
        
        try {
          const info = await this.tablebaseService.getTablebaseInfo(positionAfterMove);
          
          if (info && info.isTablebasePosition && info.result?.wdl !== undefined) {
            // WDL values are from perspective of position after move
            // We need to negate to get from current player's perspective
            const wdlFromCurrentPlayer = -info.result.wdl;
            tablebaseMoves.push({
              move: move.san,
              wdl: wdlFromCurrentPlayer,
              dtm: info.result.dtz ?? undefined,
              evaluation: wdlFromCurrentPlayer === 2 ? 'Win' : wdlFromCurrentPlayer === -2 ? 'Loss' : 'Draw'
            });
          }
        } catch (moveError) {
          // Continue with next move if this one fails
        }
        
        tempChess.undo();
      }

      // Sort by WDL (wins first, then draws, then losses)
      return tablebaseMoves.sort((a, b) => b.wdl - a.wdl).slice(0, count);
    } catch (error) {
      return [];
    }
  }

  /**
   * Checks if position is in tablebase range
   */
  isTablebasePosition(fen: string): boolean {
    const pieces = this.countPieces(fen);
    return pieces <= 7;
  }

  /**
   * Counts pieces on the board
   */
  private countPieces(fen: string): number {
    const boardPart = fen.split(' ')[0];
    return (boardPart.match(/[pnbrqkPNBRQK]/g) || []).length;
  }

  /**
   * Gets cache statistics from tablebase service
   */
  getCacheStats(): { size: number; maxSize: number } {
    return this.tablebaseService.getCacheStats();
  }

  /**
   * Clears tablebase cache
   */
  clearCache(): void {
    this.tablebaseService.clearCache();
  }
}