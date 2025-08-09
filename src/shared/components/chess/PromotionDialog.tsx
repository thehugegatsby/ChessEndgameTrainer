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

import React, { useEffect, useRef } from "react";
import pieces from "react-chess-pieces/dist/svg-index";

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
 * Piece SVG components for chess pieces from react-chess-pieces
 */
const PIECE_SVGS = {
  white: {
    q: pieces.Q, // White Queen
    r: pieces.R, // White Rook
    b: pieces.B, // White Bishop
    n: pieces.N, // White Knight
  },
  black: {
    q: pieces.q, // Black Queen
    r: pieces.r, // Black Rook
    b: pieces.b, // Black Bishop
    n: pieces.n, // Black Knight
  },
} as const;

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
  color: _color,
  position,
  onSelect,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeydown = (e: KeyboardEvent) => {
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

    const handleClickOutside = (e: MouseEvent) => {
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
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Use white pieces for better visibility on gray circles like Lichess
  const pieceComponents = PIECE_SVGS.white;

  // Calculate square size based on board width (assuming 800px board)
  const squareSize = 800 / 8; // 100px per square
  
  return (
    <>
      {/* Board dimming overlay like Lichess */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.60)] z-40" />
      
      {/* Queen - positioned on target square */}
      <button
        ref={dialogRef}
        onClick={() => onSelect("q")}
        data-promotion-button="true"
        className="absolute z-50 w-24 h-24 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors shadow-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
        title="Dame (Q)"
      >
        <pieceComponents.q className="w-16 h-16" />
      </button>

      {/* Rook - one square below */}
      <button
        onClick={() => onSelect("r")}
        data-promotion-button="true"
        className="absolute z-50 w-24 h-24 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors shadow-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y + squareSize}px`,
          transform: "translate(-50%, -50%)",
        }}
        title="Turm (R)"
      >
        <pieceComponents.r className="w-16 h-16" />
      </button>

      {/* Bishop - two squares below */}
      <button
        onClick={() => onSelect("b")}
        data-promotion-button="true"
        className="absolute z-50 w-24 h-24 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors shadow-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y + squareSize * 2}px`,
          transform: "translate(-50%, -50%)",
        }}
        title="Läufer (B)"
      >
        <pieceComponents.b className="w-16 h-16" />
      </button>

      {/* Knight - three squares below */}
      <button
        onClick={() => onSelect("n")}
        data-promotion-button="true"
        className="absolute z-50 w-24 h-24 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors shadow-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y + squareSize * 3}px`,
          transform: "translate(-50%, -50%)",
        }}
        title="Springer (N)"
      >
        <pieceComponents.n className="w-16 h-16" />
      </button>
    </>
  );
};