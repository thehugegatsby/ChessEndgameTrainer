/**
 * @file Pawn promotion dialog component
 * @module components/chess/PromotionDialog
 *
 * @description
 * A modal dialog for selecting pawn promotion pieces, styled like Lichess.org.
 * Shows four promotion options (Queen, Rook, Bishop, Knight) in a vertical layout
 * with circular buttons and piece symbols.
 *
 * @remarks
 * Key features:
 * - Lichess.org-style vertical layout
 * - Circular piece buttons with hover effects
 * - Handles both white and black promotions
 * - Click outside to cancel (defaults to Queen)
 * - Keyboard support (Escape to cancel)
 * - Positioned relative to the promotion square
 */

import React, { useEffect } from "react";
import { UI_MULTIPLIERS } from '@shared/constants/multipliers';
import { DURATIONS } from '@shared/constants/time.constants';
import { ChessPiece, type PieceId } from './ChessPiece';

/**
 * Promotion piece types
 */
export type PromotionPiece = "q" | "r" | "b" | "n";

/**
 * Props for the PromotionDialog component
 */
interface PromotionDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Color of the promoting pawn ('w' for white, 'b' for black) */
  color: "w" | "b";
  /** Position of the promotion square for dialog placement */
  position: {
    x: number;
    y: number;
  };
  /** Callback when a promotion piece is selected */
  onSelect: (piece: PromotionPiece) => void;
  /** Callback when promotion is cancelled */
  onCancel: () => void;
}


/**
 * Pawn promotion dialog component
 *
 * @component
 * @description
 * Displays a modal dialog for pawn promotion selection, styled to match
 * Lichess.org's promotion dialog. Shows four circular buttons in a vertical
 * layout with piece symbols, positioned near the promotion square.
 *
 * @example
 * ```tsx
 * <PromotionDialog
 *   isOpen={showPromotion}
 *   color="w"
 *   position={{ x: 300, y: 100 }}
 *   onSelect={(piece) => handlePromotion(piece)}
 *   onCancel={() => setShowPromotion(false)}
 * />
 * ```
 */
export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  isOpen,
  color,
  position,
  onSelect,
  onCancel,
}) => {

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onCancel();
      }
      // Keyboard shortcuts like Lichess
      else if (e.key === "q" || e.key === "Q") {
        onSelect("q");
      } else if (e.key === "r" || e.key === "R") {
        onSelect("r");
      } else if (e.key === "b" || e.key === "B") {
        onSelect("b");
      } else if (e.key === "n" || e.key === "N") {
        onSelect("n");
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onSelect, onCancel]);

  // Handle click outside to cancel - but only on the parent container
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent): void => {
      // Check if click is outside all promotion buttons
      const target = e.target as Node;
      const allButtons = document.querySelectorAll('[data-promotion-button="true"]');
      
      let clickedOnButton = false;
      allButtons.forEach(button => {
        if (button.contains(target)) {
          clickedOnButton = true;
        }
      });
      
      // Only cancel if not clicking on a promotion button
      if (!clickedOnButton) {
        onCancel();
      }
    };

    // Delay to prevent immediate closing when the promotion dialog opens
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, DURATIONS.ANIMATION.FAST);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Calculate square size based on board width (assuming 800px board)
  const BOARD_WIDTH = 8 * UI_MULTIPLIERS.ANIMATION_BASE; // 800px
  const SQUARES_PER_ROW = 8;
  const squareSize = BOARD_WIDTH / SQUARES_PER_ROW; // 100px per square

  const promotionPieces: { piece: PromotionPiece; title: string; pieceId: PieceId }[] = [
    { piece: "q", title: "Dame (Q)", pieceId: `${color}Q` as PieceId },
    { piece: "r", title: "Turm (R)", pieceId: `${color}R` as PieceId },
    { piece: "b", title: "Läufer (B)", pieceId: `${color}B` as PieceId },
    { piece: "n", title: "Springer (N)", pieceId: `${color}N` as PieceId },
  ];
  
  return (
    <>
      {/* Board dimming overlay like Lichess */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.60)] z-40" />
      
      {promotionPieces.map(({ piece, title, pieceId }, index) => {
        return (
          <button
            key={piece}
            onClick={() => onSelect(piece)}
            data-promotion-button="true"
            className="absolute z-50 w-20 h-20 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:scale-105"
            style={{
              left: `${position.x}px`,
              top: `${position.y + squareSize * index}px`,
              transform: "translate(-50%, -50%)",
            }}
            title={title}
          >
            <ChessPiece 
              piece={pieceId}
              size={56}
              style={{ 
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
              }}
            />
          </button>
        );
      })}
    </>
  );
};