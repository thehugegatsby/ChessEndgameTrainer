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
import { getFen, turn, getPgn, isGameOver, isCheckmate, isDraw, isStalemate, isCheck } from '@shared/utils/chess-logic';
import type { StoreApi } from '@shared/store/StoreContext';
import type { ValidatedMove } from '@shared/types/chess';
import { GameStateService } from '@domains/game/services/GameStateService';

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

      if (move.includes('-')) {
        // Format: 'e2-e4' or 'e7-e8=D'
        const [from, toPart] = move.split('-');
        if (!from || !toPart) {
          throw new Error(`Invalid move format: ${move}`);
        }
        if (toPart.includes('=')) {
          const parts = toPart.split('=');
          const to = parts[0];
          let promotion = parts[1];

          // Guard against undefined to/promotion from array access
          if (!to) {
            throw new Error(`Invalid promotion move format: ${move}`);
          }

          // Convert German to English notation
          if (promotion === 'D') promotion = 'q'; // Dame -> Queen
          if (promotion === 'T') promotion = 'r'; // Turm -> Rook
          if (promotion === 'L') promotion = 'b'; // Läufer -> Bishop
          if (promotion === 'S') promotion = 'n'; // Springer -> Knight

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
        // SAN notation detected - skip for now, will be fixed in B5.6
        if (typeof move === 'string' && move.match(/^[a-h1-8KQRNBP]/)) {
          logger.warn('SAN notation not yet supported, pending B5.6 implementation', { move });
          return { success: false, error: 'SAN notation wird in B5.6 implementiert' };
        }
        // Pass string as-is for other formats
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
        willCallOnComplete: gameState.isGameFinished && trainingState.isSuccess,
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
        error: errorMessage,
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
    const currentFen = state.game.currentFen || getFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const currentPgn = state.game.currentPgn || getPgn('');
    
    return {
      fen: currentFen,
      turn: turn(currentFen),
      moveCount: state.game.moveHistory.length,
      pgn: currentPgn,
      isGameOver: isGameOver(currentFen),
      gameOverReason: (() => {
        if (!isGameOver(currentFen)) return undefined;
        if (isCheckmate(currentFen)) return 'checkmate';
        if (isStalemate(currentFen)) return 'stalemate';
        if (isDraw(currentFen)) return 'draw';
        return 'unknown';
      })(),
      history: state.game.moveHistory || [],
      evaluation: undefined, // Could be extended if needed
      isCheck: isCheck(currentFen),
      isCheckmate: isCheckmate(currentFen),
      isDraw: isDraw(currentFen),
      lastMove:
        state.game.moveHistory.length > 0
          ? state.game.moveHistory[state.game.moveHistory.length - 1]
          : undefined,
    };
  }

  /**
   * Calculate whether it's the player's turn based on current game state
   * 
   * @param {string} fen - Current game position in FEN notation
   * @param {'w' | 'b'} playerColor - The color the player is controlling
   * @returns {boolean} True if it's the player's turn to move
   * 
   * @remarks
   * This method combines pure chess logic (FEN parsing) with training context
   * (player color) to determine turn state. It delegates the FEN parsing to
   * GameStateService and applies training-specific logic here.
   * 
   * This follows the "Fat Service, Thin Slice" pattern where business logic
   * is centralized in services rather than scattered across slices.
   * 
   * @example
   * ```typescript
   * const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
   * const playerColor = 'w'; // Player controls white
   * const isPlayerTurn = trainingService.calculateIsPlayerTurn(fen, playerColor);
   * // Returns false because it's black's turn but player controls white
   * ```
   */
  calculateIsPlayerTurn(fen: string, playerColor: 'w' | 'b'): boolean {
    const currentTurn = GameStateService.getTurnFromFen(fen);
    return currentTurn === playerColor;
  }
}

/**
 * Singleton instance of TrainingService
 * Export this to ensure all parts of the application use the same instance
 */
export const trainingService = new TrainingService();
