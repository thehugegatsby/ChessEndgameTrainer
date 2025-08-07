/**
 * @file Pawn promotion handler module
 * @module store/orchestrators/handlePlayerMove/PawnPromotionHandler
 * 
 * @description
 * Handles pawn promotion detection, UI interaction, and auto-win scenarios.
 * Designed for future promotion choice UI while handling current auto-queen behavior.
 */

import type { Move as ChessJsMove } from "chess.js";
import { chessService } from "@shared/services/ChessService";
import { tablebaseService } from "@shared/services/TablebaseService";
import { getLogger } from "@shared/services/logging";
import type { StoreApi } from "../types";
import { handleTrainingCompletion } from "./move.completion";

export interface PromotionInfo {
  isPromotion: boolean;
  promotionPiece?: 'q' | 'r' | 'n' | 'b';
  from?: string;
  to?: string;
  isAutoWin?: boolean;
}

export interface PromotionChoice {
  piece: 'q' | 'r' | 'n' | 'b';
  label: string;
  description: string;
}

/**
 * Available promotion pieces with descriptions
 */
export const PROMOTION_CHOICES: PromotionChoice[] = [
  { piece: 'q', label: 'Dame', description: 'Stärkste Figur - kann in alle Richtungen ziehen' },
  { piece: 'r', label: 'Turm', description: 'Zieht horizontal und vertikal' },
  { piece: 'n', label: 'Springer', description: 'Zieht in L-Form, kann über Figuren springen' },
  { piece: 'b', label: 'Läufer', description: 'Zieht diagonal' }
];

/**
 * Handles pawn promotion logic and future UI integration
 */
export class PawnPromotionHandler {

  /**
   * Checks if a move involves pawn promotion
   * 
   * @param move - The validated move that was executed
   * @returns Promotion information
   */
  checkPromotion(move: ChessJsMove): PromotionInfo {
    // chess.js sets the 'promotion' property in the move object
    // and flags contain 'p' for promotion
    const isPromotion = move.flags && move.flags.includes('p');
    
    if (!isPromotion) {
      return { isPromotion: false };
    }

    getLogger().debug("[PawnPromotion] Promotion detected:", {
      from: move.from,
      to: move.to,
      piece: move.piece,
      promotion: move.promotion,
      flags: move.flags
    });

    // Validate promotion piece type
    const promotionPiece = this.isValidPromotionPiece(move.promotion) 
      ? move.promotion 
      : undefined;

    return {
      isPromotion: true,
      promotionPiece,
      from: move.from,
      to: move.to,
      isAutoWin: false // Will be determined by evaluatePromotionOutcome
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
        getLogger().warn("[PawnPromotion] Invalid FEN format:", currentFen);
        return false;
      }
      // Check if game is immediately over after promotion
      if (chessService.isGameOver()) {
        const isCheckmate = chessService.isCheckmate();
        getLogger().debug("[PawnPromotion] Game over after promotion:", {
          isCheckmate,
          fen: currentFen.split(" ")[0]
        });
        return isCheckmate; // Checkmate = auto-win
      }

      // Use tablebase to evaluate the resulting position
      const evaluation = await tablebaseService
        .getEvaluation(currentFen)
        .catch(() => ({ isAvailable: false }));

      if (evaluation.isAvailable && evaluation.result) {
        // Check if promotion created a winning position from promoting player's perspective
        // WDL is from white's perspective: positive = good for white, negative = good for black
        const wdlFromPromotingPlayerPerspective = promotingColor === 'w' 
          ? evaluation.result.wdl 
          : -evaluation.result.wdl;
        const isWinning = wdlFromPromotingPlayerPerspective > 0;
        
        getLogger().debug("[PawnPromotion] Tablebase evaluation:", {
          wdl: evaluation.result.wdl,
          wdlFromPromotingPlayerPerspective,
          promotingColor,
          category: evaluation.result.category,
          isWinning,
          fen: currentFen.split(" ")[0]
        });

        // Consider it an auto-win if it's a forced mate or other winning category
        // Categories like 'mate', 'win', etc. indicate definitive winning scenarios
        const isAutoWinCategory = evaluation.result.category.includes('mate') || 
                                 evaluation.result.category.includes('win');
        return isWinning && isAutoWinCategory;
      }

      return false;
    } catch (error) {
      getLogger().error("[PawnPromotion] Error evaluating promotion outcome:", error);
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
    getLogger().info("[PawnPromotion] Auto-win detected - completing training session");
    
    const { setState } = api;
    
    // Show celebration toast
    setState((draft) => {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: `Gratulation! Bauernumwandlung führt zum Sieg!`,
        type: "success",
      });
    });

    // Complete training session as won
    await handleTrainingCompletion(api, true);
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
    getLogger().debug("[PawnPromotion] Showing promotion dialog:", { from, to });
    
    const { setState } = api;
    
    // For now, just auto-promote to queen and call callback
    // TODO: Implement actual promotion choice UI
    const chosenPiece: 'q' | 'r' | 'n' | 'b' = 'q';
    
    setState((draft) => {
      draft.ui.toasts.push({
        id: Date.now().toString(),
        message: `Bauernumwandlung: ${from}-${to} → Dame`,
        type: "info",
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