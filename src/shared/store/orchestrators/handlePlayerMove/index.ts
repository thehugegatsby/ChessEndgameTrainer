/**
 * @file Handle player move orchestrator (refactored modular version)
 * @module store/orchestrators/handlePlayerMove
 *
 * @description
 * Clean orchestrator that coordinates player moves using specialized modules.
 * Demonstrates proper separation of concerns with focused responsibilities.
 *
 * @remarks
 * This orchestrator uses the following modules:
 * - MoveValidator: Move validation logic
 * - MoveQualityEvaluator: Tablebase quality analysis
 * - PawnPromotionHandler: Pawn promotion detection and handling
 * - MoveDialogManager: Dialog interactions (error, promotion, confirmation)
 * - OpponentTurnHandler: Opponent move scheduling and execution
 *
 * @example
 * ```typescript
 * const success = await handlePlayerMove(api, { from: "e2", to: "e4" });
 * ```
 */

import type { StoreApi } from '../types';
import type { Move as ChessJsMove } from 'chess.js';
import { turn, isGameOver } from '@shared/utils/chess-logic';
import { ErrorService } from '@shared/services/ErrorService';
import { getLogger } from '@shared/services/logging';
import { handleTrainingCompletion } from './move.completion';
import { orchestratorMoveService } from '@shared/services/orchestrator/OrchestratorGameServices';

// Import specialized modules
import { MoveValidator } from './MoveValidator';
import { MoveQualityEvaluator } from './MoveQualityEvaluator';
import { PawnPromotionHandler } from './PawnPromotionHandler';
import { EventBasedMoveDialogManager } from '../../../../features/training/events/EventBasedMoveDialogManager';
import { getOpponentTurnManager } from './OpponentTurnHandler';

// Re-export types for consumers
export type { MoveEvaluation, MoveExecutionResult } from './move.types';

// Re-export opponent turn manager for external use
export { getOpponentTurnManager };

/**
 * Dependencies for the handlePlayerMove orchestrator
 *
 * @interface HandlePlayerMoveDependencies
 *
 * @description
 * Allows dependency injection for better testability and flexibility.
 * All dependencies are optional and will use default implementations if not provided.
 */
export interface HandlePlayerMoveDependencies {
  moveValidator?: MoveValidator;
  moveQualityEvaluator?: MoveQualityEvaluator;
  pawnPromotionHandler?: PawnPromotionHandler;
  moveDialogManager?: EventBasedMoveDialogManager;
}

// Default module instances (event-driven)
const defaultDependencies: Required<HandlePlayerMoveDependencies> = {
  moveValidator: new MoveValidator(),
  moveQualityEvaluator: new MoveQualityEvaluator(),
  pawnPromotionHandler: new PawnPromotionHandler(),
  moveDialogManager: new EventBasedMoveDialogManager(),
};

/**
 * ✅ REMOVED: adaptMoveServiceResult adapter (B5.5.5 Phase 3A.1)
 * Now using rich MakeMoveResult directly for enhanced metadata access
 */

/**
 * Creates a handlePlayerMove function with injected dependencies
 *
 * @param {HandlePlayerMoveDependencies} [dependencies] - Optional custom dependencies
 * @returns {Function} A handlePlayerMove function with the specified dependencies
 *
 * @description
 * Factory function that creates a handlePlayerMove orchestrator with custom dependencies.
 * This enables better testability by allowing mock implementations to be injected.
 *
 * @example
 * ```typescript
 * // For testing with mocks
 * const mockValidator = new MockMoveValidator();
 * const handleMove = createHandlePlayerMove({ moveValidator: mockValidator });
 *
 * // For production (uses defaults)
 * const handleMove = createHandlePlayerMove();
 * ```
 */
export function createHandlePlayerMove(dependencies?: HandlePlayerMoveDependencies) {
  const deps = { ...defaultDependencies, ...dependencies };

  return async function handlePlayerMoveWithDeps(
    api: StoreApi,
    move: ChessJsMove | { from: string; to: string; promotion?: string } | string
  ): Promise<boolean> {
    const { getState, setState } = api;
    const state = getState();

    // Early validation - check if it's player's turn and no in-flight move
    if (
      !state.training.isPlayerTurn ||
      state.training.isOpponentThinking ||
      state.training.moveInFlight
    ) {
      getLogger().debug('[handlePlayerMove] Early return - busy or not player turn', {
        isPlayerTurn: state.training.isPlayerTurn,
        isOpponentThinking: state.training.isOpponentThinking,
        moveInFlight: state.training.moveInFlight,
      });
      return false;
    }

    try {
      setState(draft => {
        draft.ui.loading.position = true;
        draft.training.moveInFlight = true;
      });

      // Step 1: Validate move using MoveValidator
      const validationResult = deps.moveValidator.validateMove(move, state.game.currentFen);

      if (!validationResult.isValid) {
        setState(draft => {
          draft.ui.toasts.push({
            id: Date.now().toString(),
            message: validationResult.errorMessage || 'Invalid move',
            type: 'error',
          });
        });
        return false;
      }

      // Step 2: Get position before move for evaluation
      const fenBefore = state.game.currentFen;

      // Step 3: Apply move to game state using MoveService (direct rich result usage)
      const moveInput = typeof move === 'string' 
        ? { from: move.slice(0, 2), to: move.slice(2, 4), promotion: move.slice(4) }
        : move;
      const richMoveResult = orchestratorMoveService.makeUserMove(fenBefore, moveInput);

      // ✅ B5.5.5 Phase 3A.1: Direct rich result usage (no adapter)
      if (richMoveResult.error || !richMoveResult.newFen || !richMoveResult.move) {
        getLogger().error('[handlePlayerMove] Move execution failed:', richMoveResult.error || 'Unknown error');
        return false;
      }

      const validatedMove = richMoveResult.move;
      const fenAfter = richMoveResult.newFen;

      // ✅ Rich result already provides ValidatedMove - no conversion needed
      
      // Update game state
      setState(draft => {
        draft.game.currentFen = fenAfter;
        // Add move to history - already ValidatedMove from service
        draft.game.moveHistory.push(validatedMove);
        draft.game.currentMoveIndex = draft.game.moveHistory.length - 1;
      });

      // Step 4: Handle pawn promotion if applicable
      const promotionInfo = deps.pawnPromotionHandler.checkPromotion(validatedMove);
      if (promotionInfo.isPromotion) {
        getLogger().info('[handlePlayerMove] Pawn promotion detected:', promotionInfo);

        // Check if promotion leads to auto-win
        const isAutoWin = await deps.pawnPromotionHandler.evaluatePromotionOutcome(
          fenAfter,
          validatedMove.color
        );

        if (isAutoWin) {
          await deps.pawnPromotionHandler.handleAutoWin(api, {
            ...promotionInfo,
            isAutoWin: true,
          });
          return true; // Training completed
        }

        // Defer queen promotion success dialog until after quality check
        // to avoid conflicts with error dialog
      }

      // Step 5: Evaluate move quality using MoveQualityEvaluator
      // Pass current evaluation baseline if available and valid
      const boardBefore = fenBefore.split(' ').slice(0, 4).join(' ');
      const currentBaseline = state.training.evaluationBaseline;
      const baselineMatches = currentBaseline?.fen
        ? currentBaseline.fen.split(' ').slice(0, 4).join(' ') === boardBefore
        : false;
      const validBaseline =
        baselineMatches &&
        currentBaseline &&
        currentBaseline.wdl !== null &&
        currentBaseline.fen !== null
          ? { wdl: currentBaseline.wdl, fen: currentBaseline.fen }
          : null;
      const qualityResult = await deps.moveQualityEvaluator.evaluateMoveQuality(
        fenBefore,
        fenAfter,
        validatedMove,
        validBaseline
      );

      // Step 6: Show error dialog if move was suboptimal and outcome changed
      if (qualityResult.shouldShowErrorDialog) {
        // Set turn state before showing dialog so "Weiterspielen" can trigger opponent move
        const currentTurn = turn(fenAfter);
        const trainingColor = state.training.currentPosition?.colorToTrain?.charAt(0);

        if (currentTurn !== trainingColor) {
          getLogger().info(
            '[handlePlayerMove] Setting turn state for opponent before error dialog'
          );
          setState(draft => {
            draft.training.isPlayerTurn = false;
            draft.training.isOpponentThinking = false; // Not thinking yet, waiting for dialog
          });
        }

        deps.moveDialogManager.showMoveErrorDialog(
          qualityResult.wdlBefore || 0,
          qualityResult.wdlAfter || 0,
          qualityResult.bestMove,
          validatedMove.san, // The played move
          api.getState().game.currentMoveIndex // Current move number
        );

        getLogger().info(
          "[handlePlayerMove] Showing error dialog - opponent turn will be scheduled after 'Weiterspielen'"
        );
        return true;
      }

      // If this was a queen promotion and no error dialog is needed, show success
      if (promotionInfo.isPromotion && promotionInfo.promotionPiece === 'q') {
        const promotionPieceLabel = deps.pawnPromotionHandler.getPromotionPieceLabel('q');
        setState(draft => {
          draft.training.moveSuccessDialog = {
            isOpen: true,
            promotionPiece: promotionPieceLabel,
            ...(promotionInfo.moveDescription !== undefined && {
              moveDescription: promotionInfo.moveDescription,
            }),
          };
        });
      }

      // Step 7: Check if game is finished
      if (isGameOver(fenAfter)) {
        await handleTrainingCompletion(api, true);
        return true;
      }

      // Step 8: Handle opponent turn if needed
      const currentTurn = turn(fenAfter);
      const trainingColor = state.training.currentPosition?.colorToTrain?.charAt(0);

      if (currentTurn !== trainingColor) {
        getLogger().debug('[handlePlayerMove] Scheduling opponent turn');
        setState(draft => {
          draft.training.isPlayerTurn = false;
          draft.training.isOpponentThinking = true;
        });

        // Schedule opponent turn using dedicated handler
        getOpponentTurnManager().schedule(api);
      }

      return true;
    } catch (error) {
      getLogger().error('[handlePlayerMove] Error in orchestrator:', error);
      const userMessage = ErrorService.handleUIError(
        error instanceof Error ? error : new Error(String(error)),
        'MakeUserMove',
        {
          component: 'MakeUserMove',
          action: 'orchestrate',
        }
      );

      setState(draft => {
        draft.ui.toasts.push({
          id: Date.now().toString(),
          message: userMessage,
          type: 'error',
        });
      });

      getLogger().error('[handlePlayerMove] Move handling failed:', error);
      return false;
    } finally {
      // Clear loading state and move-in-flight flag
      setState(draft => {
        draft.ui.loading.position = false;
        draft.training.moveInFlight = false;
      });
    }
  };
}

/**
 * Handles a player move using modular orchestration (default implementation)
 *
 * @param {StoreApi} api - Store API for accessing state and actions
 * @param {ChessJsMove | {from: string; to: string; promotion?: string} | string} move - The move to make
 * @returns {Promise<boolean>} Whether the move was successful
 *
 * @remarks
 * This is the default implementation using standard dependencies.
 * For testing or custom implementations, use createHandlePlayerMove() instead.
 *
 * Modular flow using specialized handlers:
 * 1. Validate move using MoveValidator
 * 2. Apply move and update state
 * 3. Handle pawn promotion with PawnPromotionHandler
 * 4. Evaluate quality using MoveQualityEvaluator
 * 5. Show dialogs using MoveDialogManager
 * 6. Handle completion or opponent turn with OpponentTurnHandler
 *
 * @example
 * ```typescript
 * // Standard usage
 * const success = await handlePlayerMove(api, { from: "e2", to: "e4" });
 * ```
 */
export const handlePlayerMove = createHandlePlayerMove();
