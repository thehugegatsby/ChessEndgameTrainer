/**
 * @file Game service wrappers for orchestrator use
 * @module services/orchestrator/game
 *
 * @description
 * Provides non-hook game service wrappers for use in orchestrators and other
 * non-React contexts. These wrappers provide direct access to game services
 * without requiring React hooks or component context.
 *
 * @remarks
 * Orchestrators run outside of React component context and cannot use hooks.
 * These wrappers provide a clean interface for accessing game services from
 * orchestrator code without dynamic imports or direct service references.
 */

import { ChessEngine } from '@domains/game/engine/ChessEngine';
import { MoveService } from '@domains/game/services/MoveService';
import type { MakeMoveResult, MoveInput } from '@domains/game/services/MoveServiceInterface';

// Create singleton instances for orchestrator use
const chessEngine = new ChessEngine();
const moveService = new MoveService(chessEngine);

/**
 * Orchestrator-friendly wrapper for move service
 *
 * Provides move functionality without requiring React hooks or dynamic imports.
 * Designed for use in store orchestrators and other non-React contexts.
 */
export class OrchestratorMoveService {
  /**
   * Make a user move with comprehensive result data
   *
   * @param currentFen - Current position FEN
   * @param move - Move to make
   * @returns Promise resolving to move result with all derived state
   */
  static makeUserMove(currentFen: string, move: MoveInput): MakeMoveResult {
    return moveService.makeUserMove(currentFen, move);
  }
}

/**
 * Re-export for convenience
 */
export const orchestratorMoveService = OrchestratorMoveService;