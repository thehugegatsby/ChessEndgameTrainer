/**
 * @file Centralized Training Service
 * @module services/TrainingService
 * 
 * @description
 * Single source of truth for chess training move execution and completion logic.
 * This service unifies the move execution paths between UI interactions and E2E tests,
 * ensuring that all post-move business logic (completion checks, streak increments, etc.)
 * runs consistently regardless of the entry point.
 * 
 * @remarks
 * This service replaces the scattered move execution logic and ensures that:
 * - UI interactions via useTrainingSession
 * - E2E test interactions via TestApiService  
 * - Any future integrations (admin tools, etc.)
 * All go through the same complete business logic pipeline.
 */

import { getLogger } from '@shared/services/logging/Logger';
import { chessService } from '@shared/services/ChessService';
import type { StoreApi } from '@shared/store/StoreContext';
import type { ValidatedMove } from '@shared/types/chess';

const logger = getLogger().setContext('TrainingService');

/**
 * Move result interface for TrainingService operations
 */
export interface TrainingMoveResult {
  success: boolean;
  error?: string;
}

/**
 * Completion callback type for training events
 */
export type TrainingCompletionCallback = (success: boolean) => void;

/**
 * Centralized training service for move execution and completion logic
 * 
 * @description
 * This service provides a single, unified entry point for all training-related
 * move operations. It ensures that completion logic (streak increments, training
 * end detection, etc.) runs consistently across all execution paths.
 */
export class TrainingService {
  /**
   * Execute a training move with complete business logic pipeline
   * 
   * @param api - Zustand store API for state access and updates
   * @param move - Chess move to execute (string format like "e2-e4" or "e7-e8=Q")
   * @param onComplete - Optional callback for training completion events
   * @returns Promise resolving to move execution result
   * 
   * @description
   * This is the single source of truth for training move execution. It:
   * 1. Delegates to training actions for move validation and orchestration
   * 2. Checks for training completion after orchestrators have run
   * 3. Triggers completion callbacks (including streak increments)
   * 4. Ensures consistent behavior across UI and test environments
   */
  async executeMove(
    api: StoreApi,
    move: string,
    onComplete?: TrainingCompletionCallback
  ): Promise<TrainingMoveResult> {
    logger.debug('🎯 TrainingService.executeMove called', { move });

    try {
      // Phase 1: Execute move through training orchestrators
      // This runs all the game logic, move validation, quality evaluation, 
      // pawn promotion handling, etc. and updates the store state
      logger.debug('📋 Delegating to store handlePlayerMove action');
      
      // Parse move into the format expected by handlePlayerMove
      let moveObj: { from: string; to: string; promotion?: string } | string;
      
      if (move.includes("-")) {
        // Format: 'e2-e4' or 'e7-e8=D'
        const [from, toPart] = move.split("-");
        if (!from || !toPart) {
          throw new Error(`Invalid move format: ${move}`);
        }
        if (toPart.includes("=")) {
          const parts = toPart.split("=");
          const to = parts[0];
          let promotion = parts[1];
          
          // Guard against undefined to/promotion from array access
          if (!to) {
            throw new Error(`Invalid promotion move format: ${move}`);
          }
          
          // Convert German to English notation
          if (promotion === "D") promotion = "q"; // Dame -> Queen
          if (promotion === "T") promotion = "r"; // Turm -> Rook
          if (promotion === "L") promotion = "b"; // Läufer -> Bishop
          if (promotion === "S") promotion = "n"; // Springer -> Knight
          
          // Guard against undefined promotion for exactOptionalPropertyTypes
          if (promotion) {
            moveObj = { from, to, promotion };
          } else {
            moveObj = { from, to };
          }
        } else {
          moveObj = { from, to: toPart };
        }
      } else {
        // SAN notation - pass as string
        moveObj = move;
      }
      
      // Access the handlePlayerMove action from the root store state
      // In the Zustand store, actions are defined at the root level
      const state = api.getState();
      logger.debug('📋 Calling handlePlayerMove with moveObj', { moveObj });
      const moveResult = await state.handlePlayerMove(moveObj);
      
      if (!moveResult) {
        logger.warn('❌ Move execution failed', { move, moveObj });
        return { success: false, error: 'Move execution failed' };
      }

      logger.debug('✅ Move executed successfully, checking completion status');

      // Phase 2: Check for training completion after orchestrators have run
      // The orchestrators (especially PawnPromotionHandler) may have set
      // isGameFinished and isSuccess flags
      const currentState = api.getState();
      const { game: gameState, training: trainingState } = currentState;
      
      logger.debug('🔍 Training completion check', {
        isGameFinished: gameState.isGameFinished,
        isSuccess: trainingState.isSuccess,
        willCallOnComplete: gameState.isGameFinished && trainingState.isSuccess
      });

      // Phase 3: Trigger completion callbacks if training is finished
      if (gameState.isGameFinished && trainingState.isSuccess) {
        logger.info('🎉 Training completed successfully - calling onComplete(true)');
        onComplete?.(true);
      } else if (gameState.isGameFinished && !trainingState.isSuccess) {
        // Training ended unsuccessfully
        logger.info('❌ Training ended unsuccessfully - calling onComplete(false)');
        onComplete?.(false);
      } else {
        logger.debug('🔄 Training continues - no completion callback needed');
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('💥 TrainingService.executeMove failed', { move, error: errorMessage });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Get current game state for debugging/testing
   * 
   * @param api - Zustand store API
   * @returns Current game state snapshot
   */
  getGameState(api: StoreApi): {
    fen: string;
    turn: 'w' | 'b';
    moveCount: number;
    pgn: string;
    isGameOver: boolean;
    gameOverReason: string | undefined;
    history: ValidatedMove[];
    evaluation: undefined;
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    lastMove: ValidatedMove | undefined;
  } {
    const state = api.getState();
    return {
      fen: state.game.currentFen || chessService.getFen(),
      turn: chessService.turn(),
      moveCount: state.game.moveHistory.length,
      pgn: state.game.currentPgn || chessService.getPgn(),
      isGameOver: chessService.isGameOver(),
      gameOverReason: (() => {
        if (!chessService.isGameOver()) return undefined;
        if (chessService.isCheckmate()) return 'checkmate';
        if (chessService.isDraw()) return 'draw';
        if (chessService.isStalemate()) return 'stalemate';
        return 'unknown';
      })(),
      history: chessService.getMoveHistory(),
      evaluation: undefined, // Could be extended if needed
      isCheck: chessService.isCheck(),
      isCheckmate: chessService.isCheckmate(),
      isDraw: chessService.isDraw(),
      lastMove: state.game.moveHistory.length > 0 
        ? state.game.moveHistory[state.game.moveHistory.length - 1]
        : undefined,
    };
  }
}

/**
 * Singleton instance of TrainingService
 * Export this to ensure all parts of the application use the same instance
 */
export const trainingService = new TrainingService();