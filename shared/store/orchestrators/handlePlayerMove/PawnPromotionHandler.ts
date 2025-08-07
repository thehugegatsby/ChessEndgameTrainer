/**
 * @file Pawn promotion handler module
 * @module store/orchestrators/handlePlayerMove/PawnPromotionHandler
 *
 * @description
 * Comprehensive pawn promotion management for chess endgame training.
 * Handles detection, evaluation, auto-win scenarios, and future UI integration
 * with sophisticated tablebase analysis for optimal training feedback.
 *
 * @remarks
 * **Core Functionality:**
 * - Detects pawn promotion moves using chess.js flags and properties
 * - Evaluates promotion outcomes using tablebase analysis
 * - Identifies auto-win scenarios for immediate training completion
 * - Provides foundation for future promotion choice UI
 *
 * **Tablebase Integration:**
 * - WDL perspective conversion for accurate player evaluation
 * - Category analysis (mate, win) for auto-win detection
 * - Error resilient evaluation with graceful fallbacks
 *
 * **Training Flow Integration:**
 * - Seamless integration with move orchestration
 * - Automatic training completion for winning promotions
 * - User feedback through German localized messages
 *
 * **Future Extensibility:**
 * - Designed for promotion choice UI implementation
 * - Supports all promotion pieces (Q, R, N, B)
 * - Modular architecture for easy UI integration
 *
 * @example
 * ```typescript
 * const promotionHandler = new PawnPromotionHandler();
 *
 * // Check if move involves promotion
 * const promotionInfo = promotionHandler.checkPromotion(validatedMove);
 * if (promotionInfo.isPromotion) {
 *   // Evaluate if promotion leads to auto-win
 *   const isAutoWin = await promotionHandler.evaluatePromotionOutcome(
 *     fenAfter,
 *     validatedMove.color
 *   );
 *
 *   if (isAutoWin) {
 *     await promotionHandler.handleAutoWin(api, { ...promotionInfo, isAutoWin: true });
 *   }
 * }
 * ```
 */

import type { ValidatedMove } from "@shared/types/chess";
import { chessService } from "@shared/services/ChessService";
import { tablebaseService } from "@shared/services/TablebaseService";
import { getLogger } from "@shared/services/logging";
import type { StoreApi } from "../types";
import { handleTrainingCompletion } from "./move.completion";

/**
 * Information about a pawn promotion move
 * @interface PromotionInfo
 */
export interface PromotionInfo {
  /** Whether the move involves pawn promotion */
  isPromotion: boolean;
  /** The piece the pawn was promoted to */
  promotionPiece?: "q" | "r" | "n" | "b";
  /** Source square of the promoting pawn */
  from?: string;
  /** Target square where promotion occurs */
  to?: string;
  /** Whether promotion leads to immediate win */
  isAutoWin?: boolean;
  /** Move description for display purposes */
  moveDescription?: string;
}

/**
 * Available promotion choice with German localization
 * @interface PromotionChoice
 */
export interface PromotionChoice {
  /** Single character piece identifier */
  piece: "q" | "r" | "n" | "b";
  /** German label for the piece */
  label: string;
  /** German description of piece capabilities */
  description: string;
}

/**
 * Complete set of promotion pieces with German localization
 * @constant PROMOTION_CHOICES
 * @description Provides user-friendly German labels and descriptions for all promotion pieces
 */
export const PROMOTION_CHOICES: PromotionChoice[] = [
  {
    piece: "q",
    label: "Dame",
    description: "Stärkste Figur - kann in alle Richtungen ziehen",
  },
  { piece: "r", label: "Turm", description: "Zieht horizontal und vertikal" },
  {
    piece: "n",
    label: "Springer",
    description: "Zieht in L-Form, kann über Figuren springen",
  },
  { piece: "b", label: "Läufer", description: "Zieht diagonal" },
];

/**
 * Advanced pawn promotion handler with tablebase integration
 * @class PawnPromotionHandler
 *
 * @description
 * Manages all aspects of pawn promotion in chess endgame training:
 *
 * **Detection & Analysis:**
 * - Identifies promotion moves using chess.js move flags
 * - Validates promotion piece types
 * - Extracts move coordinates for UI display
 *
 * **Outcome Evaluation:**
 * - Uses tablebase analysis to evaluate promotion results
 * - Converts WDL values to player perspective for accurate assessment
 * - Detects auto-win scenarios (forced mate, winning positions)
 * - Handles immediate checkmate detection
 *
 * **Training Integration:**
 * - Triggers automatic training completion for winning promotions
 * - Provides user feedback through localized messages
 * - Integrates seamlessly with move orchestration flow
 *
 * **Future UI Support:**
 * - Foundation for promotion choice dialog implementation
 * - Supports all promotion pieces with German localization
 * - Modular architecture for easy UI component integration
 *
 * @remarks
 * The handler uses sophisticated WDL (Win/Draw/Loss) perspective conversion:
 * - Tablebase returns WDL from white's perspective
 * - Values are converted to promoting player's perspective
 * - Auto-win detection considers both WDL values and result categories
 *
 * @example
 * ```typescript
 * const handler = new PawnPromotionHandler();
 *
 * // Complete promotion workflow
 * const promotionInfo = handler.checkPromotion(move);
 * if (promotionInfo.isPromotion) {
 *   const isAutoWin = await handler.evaluatePromotionOutcome(fen, 'w');
 *   if (isAutoWin) {
 *     await handler.handleAutoWin(api, { ...promotionInfo, isAutoWin: true });
 *   }
 * }
 *
 * // Get piece label for UI
 * const label = handler.getPromotionPieceLabel('q'); // Returns: "Dame"
 * ```
 */
export class PawnPromotionHandler {
  /**
   * Checks if a move involves pawn promotion
   *
   * @param move - The validated move that was executed
   * @returns Promotion information
   */
  checkPromotion(move: ValidatedMove): PromotionInfo {
    // chess.js sets the 'promotion' property in the move object
    // and flags contain 'p' for promotion
    const isPromotion = move.flags && move.flags.includes("p");

    if (!isPromotion) {
      return { isPromotion: false };
    }

    getLogger().debug("[PawnPromotion] Promotion detected:", {
      from: move.from,
      to: move.to,
      piece: move.piece,
      promotion: move.promotion,
      flags: move.flags,
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
  async evaluatePromotionOutcome(
    currentFen: string,
    promotingColor: "w" | "b",
  ): Promise<boolean> {
    try {
      // Basic FEN validation
      if (!currentFen || !currentFen.includes(" ")) {
        getLogger().warn("[PawnPromotion] Invalid FEN format:", currentFen);
        return false;
      }
      // Check if game is immediately over after promotion
      if (chessService.isGameOver()) {
        const isCheckmate = chessService.isCheckmate();
        getLogger().debug("[PawnPromotion] Game over after promotion:", {
          isCheckmate,
          fen: currentFen.split(" ")[0],
        });
        return isCheckmate; // Checkmate = auto-win
      }

      // Use tablebase to evaluate the resulting position
      const evaluation = await tablebaseService
        .getEvaluation(currentFen)
        .catch(() => ({ isAvailable: false }));

      if (
        evaluation.isAvailable &&
        "result" in evaluation &&
        evaluation.result &&
        "wdl" in evaluation.result &&
        typeof evaluation.result.wdl === "number"
      ) {
        // Check if promotion created a winning position from promoting player's perspective
        // WDL is from white's perspective: positive = good for white, negative = good for black
        const wdlFromPromotingPlayerPerspective =
          promotingColor === "w"
            ? evaluation.result.wdl
            : -evaluation.result.wdl;
        const isWinning = wdlFromPromotingPlayerPerspective > 0;

        getLogger().debug("[PawnPromotion] Tablebase evaluation:", {
          wdl: evaluation.result.wdl,
          wdlFromPromotingPlayerPerspective,
          promotingColor,
          category: evaluation.result.category,
          isWinning,
          fen: currentFen.split(" ")[0],
        });

        // Consider it an auto-win if it's a forced mate or other winning category
        // Categories like 'mate', 'win', etc. indicate definitive winning scenarios
        const category = evaluation.result.category;
        const isAutoWinCategory = !!(
          category &&
          typeof category === "string" &&
          (category.includes("mate") || category.includes("win"))
        );
        return isWinning && isAutoWinCategory;
      }

      return false;
    } catch (error) {
      getLogger().error(
        "[PawnPromotion] Error evaluating promotion outcome:",
        error,
      );
      return false;
    }
  }

  /**
   * Handles auto-win scenario after promotion
   *
   * @param api - Store API for state updates
   * @param promotionInfo - Information about the promotion
   */
  async handleAutoWin(
    api: StoreApi,
    promotionInfo: PromotionInfo,
  ): Promise<void> {
    getLogger().info(
      "[PawnPromotion] Auto-win detected - completing training session",
    );

    const { setState } = api;

    // Show celebration dialog instead of toast
    const promotionPieceLabel = promotionInfo.promotionPiece
      ? this.getPromotionPieceLabel(promotionInfo.promotionPiece)
      : "Dame"; // Default to queen if undefined
    setState((draft) => {
      draft.training.moveSuccessDialog = {
        isOpen: true,
        promotionPiece: promotionPieceLabel,
        moveDescription: promotionInfo.moveDescription,
      };
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
    callback: (piece: "q" | "r" | "n" | "b") => void,
  ): void {
    getLogger().debug("[PawnPromotion] Showing promotion dialog:", {
      from,
      to,
    });

    const { setState } = api;

    // For now, just auto-promote to queen and call callback
    // TODO: Implement actual promotion choice UI
    const chosenPiece: "q" | "r" | "n" | "b" = "q";

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
  isValidPromotionPiece(
    piece: string | undefined,
  ): piece is "q" | "r" | "n" | "b" {
    return typeof piece === "string" && ["q", "r", "n", "b"].includes(piece);
  }

  /**
   * Gets promotion piece label for UI display
   *
   * @param piece - Promotion piece character
   * @returns German label for the piece
   */
  getPromotionPieceLabel(piece: "q" | "r" | "n" | "b"): string {
    const choice = PROMOTION_CHOICES.find((c) => c.piece === piece);
    return choice?.label || piece.toUpperCase();
  }
}
