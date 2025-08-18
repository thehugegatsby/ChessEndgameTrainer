/**
 * Pawn promotion handler - detects and manages pawn promotions
 * @see docs/orchestrators/handlePlayerMove/PawnPromotionHandler.md
 */

import type { ValidatedMove } from '@shared/types/chess';
import { GameStateService } from '@domains/game/services/GameStateService';
import { ChessGameLogic } from '@domains/game/engine/ChessGameLogic';
import { orchestratorTablebase } from '@shared/services/orchestrator/OrchestratorServices';
import { getLogger } from '@shared/services/logging';
import type { StoreApi } from '../types';
import { handleTrainingCompletion } from './move.completion';

/** Information about a pawn promotion move */
export interface PromotionInfo {
  /** Whether the move involves pawn promotion */
  isPromotion: boolean;
  /** The piece the pawn was promoted to */
  promotionPiece?: 'q' | 'r' | 'n' | 'b';
  /** Source square of the promoting pawn */
  from?: string;
  /** Target square where promotion occurs */
  to?: string;
  /** Whether promotion leads to immediate win */
  isAutoWin?: boolean;
  /** Move description for display purposes */
  moveDescription?: string;
}

/** Promotion choice with German localization */
export interface PromotionChoice {
  /** Single character piece identifier */
  piece: 'q' | 'r' | 'n' | 'b';
  /** German label for the piece */
  label: string;
  /** German description of piece capabilities */
  description: string;
}

/** Promotion pieces with German labels */
export const PROMOTION_CHOICES: PromotionChoice[] = [
  {
    piece: 'q',
    label: 'Dame',
    description: 'Stärkste Figur - kann in alle Richtungen ziehen',
  },
  { piece: 'r', label: 'Turm', description: 'Zieht horizontal und vertikal' },
  {
    piece: 'n',
    label: 'Springer',
    description: 'Zieht in L-Form, kann über Figuren springen',
  },
  { piece: 'b', label: 'Läufer', description: 'Zieht diagonal' },
];

/** Handles pawn promotion detection and auto-win evaluation */
export class PawnPromotionHandler {
  /** Checks if move involves pawn promotion */
  checkPromotion(move: ValidatedMove): PromotionInfo {
    // chess.js sets the 'promotion' property in the move object
    // and flags contain 'p' for promotion
    const isPromotion = move.flags && move.flags.includes('p');

    if (!isPromotion) {
      return { isPromotion: false };
    }

    getLogger().debug('[PawnPromotion] Promotion detected:', {
      from: move.from,
      to: move.to,
      piece: move.piece,
      promotion: move.promotion,
      flags: move.flags,
    });

    // Validate promotion piece type
    const promotionPiece = this.isValidPromotionPiece(move.promotion) ? move.promotion : undefined;

    return {
      isPromotion: true,
      ...(promotionPiece !== undefined && { promotionPiece }),
      from: move.from,
      to: move.to,
      isAutoWin: false, // Will be determined by evaluatePromotionOutcome
      moveDescription: move.san, // Include SAN notation for display
    };
  }

  /**
   * Evaluates if a promotion leads to an immediate win
   *
   * @param currentFen - FEN position after promotion
   * @param promotingColor - Color of the player who promoted ('w' or 'b')
   * @returns Promise<boolean> - True if promotion leads to auto-win
   */
  async evaluatePromotionOutcome(currentFen: string, promotingColor: 'w' | 'b'): Promise<boolean> {
    try {
      // Basic FEN validation
      if (!currentFen || !currentFen.includes(' ')) {
        getLogger().warn('[PawnPromotion] Invalid FEN format:', currentFen);
        return false;
      }
      // Check if game is immediately over after promotion using GameStateService
      const tempChessGameLogic = new ChessGameLogic();
      tempChessGameLogic.loadFen(currentFen);
      const tempGameStateService = new GameStateService(tempChessGameLogic);
      
      if (tempGameStateService.isGameOver()) {
        const isCheckmateResult = tempGameStateService.isCheckmate();
        getLogger().debug('[PawnPromotion] Game over after promotion:', {
          isCheckmate: isCheckmateResult,
          fen: currentFen.split(' ')[0],
        });
        return isCheckmateResult; // Checkmate = auto-win
      }

      // Use tablebase to evaluate the resulting position
      const evaluation = await orchestratorTablebase
        .getEvaluation(currentFen)
        .catch(() => ({ isAvailable: false }));

      if (
        evaluation.isAvailable &&
        'result' in evaluation &&
        evaluation.result &&
        'wdl' in evaluation.result &&
        typeof evaluation.result.wdl === 'number'
      ) {
        // Check if promotion created a winning position from promoting player's perspective
        // WDL is from white's perspective: positive = good for white, negative = good for black
        const wdlFromPromotingPlayerPerspective =
          promotingColor === 'w' ? evaluation.result.wdl : -evaluation.result.wdl;
        const isWinning = wdlFromPromotingPlayerPerspective > 0;

        getLogger().debug('[PawnPromotion] Tablebase evaluation:', {
          wdl: evaluation.result.wdl,
          wdlFromPromotingPlayerPerspective,
          promotingColor,
          category: evaluation.result.category,
          isWinning,
          fen: currentFen.split(' ')[0],
        });

        // Consider it an auto-win if the position is winning for the promoting player
        // This matches the test expectations and business logic:
        // Any promotion leading to a winning position should complete training
        return isWinning;
      }

      return false;
    } catch (error) {
      getLogger().error('[PawnPromotion] Error evaluating promotion outcome:', error);
      return false;
    }
  }

  /**
   * Handles auto-win scenario after promotion
   *
   * @param api - Store API for state updates
   * @param promotionInfo - Information about the promotion
   */
  async handleAutoWin(api: StoreApi, promotionInfo: PromotionInfo): Promise<void> {
    getLogger().info('[PawnPromotion] Auto-win detected - completing training session');

    const { setState } = api;

    // Show celebration dialog instead of toast
    const promotionPieceLabel = promotionInfo.promotionPiece
      ? this.getPromotionPieceLabel(promotionInfo.promotionPiece)
      : 'Dame'; // Default to queen if undefined
    setState(draft => {
      draft.training.moveSuccessDialog = {
        isOpen: true,
        promotionPiece: promotionPieceLabel,
        ...(promotionInfo.moveDescription !== undefined && {
          moveDescription: promotionInfo.moveDescription,
        }),
      };

      // CRITICAL: End the training session immediately
      draft.training.isPlayerTurn = false;
      draft.training.isOpponentThinking = false;
      draft.training.isSuccess = true;

      // Mark game as finished so useTrainingSession calls onComplete(true) -> incrementStreak()
      draft.game.isGameFinished = true;
    });

    // Complete training session as won
    await handleTrainingCompletion(api, true);

    getLogger().info('[PawnPromotion] Training session completed successfully after promotion');
  }

  /**
   * Shows promotion choice dialog (for future UI implementation)
   *
   * @param api - Store API for state updates
   * @param from - Source square (e.g., "e7")
   * @param to - Target square (e.g., "e8")
   * @param callback - Callback to execute with chosen piece
   */
  showPromotionDialog(
    api: StoreApi,
    from: string,
    to: string,
    callback: (piece: 'q' | 'r' | 'n' | 'b') => void
  ): void {
    getLogger().debug('[PawnPromotion] Showing promotion dialog:', {
      from,
      to,
    });

    const { setState } = api;

    // Auto-promote to queen by default (UI handles user choice in Chessboard component)
    // The promotion dialog is shown in the Chessboard component which intercepts
    // promotion moves before they reach this handler
    const chosenPiece: 'q' | 'r' | 'n' | 'b' = 'q';

    setState(draft => {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: `Bauernumwandlung: ${from}-${to} → Dame`,
        type: 'info',
      });
    });

    callback(chosenPiece);
  }

  /**
   * Validates promotion piece choice
   *
   * @param piece - Promotion piece character (can be undefined)
   * @returns True if valid promotion piece
   */
  isValidPromotionPiece(piece: string | undefined): piece is 'q' | 'r' | 'n' | 'b' {
    return typeof piece === 'string' && ['q', 'r', 'n', 'b'].includes(piece);
  }

  /**
   * Gets promotion piece label for UI display
   *
   * @param piece - Promotion piece character
   * @returns German label for the piece
   */
  getPromotionPieceLabel(piece: 'q' | 'r' | 'n' | 'b'): string {
    const choice = PROMOTION_CHOICES.find(c => c.piece === piece);
    return choice?.label || piece.toUpperCase();
  }
}
