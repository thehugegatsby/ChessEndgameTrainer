/**
 * @file Chess board wrapper component
 * @module components/chess/Chessboard
 *
 * @description
 * Wrapper component around react-chessboard library that provides a
 * standardized interface for displaying chess positions. Handles the
 * API differences and provides a consistent interface for the application.
 *
 * @remarks
 * Key features:
 * - FEN position display with configurable board size
 * - Piece drag and drop functionality
 * - API adapter for react-chessboard v5 compatibility
 * - Configurable piece dragging control
 * - Type-safe piece drop handling
 *
 * The component serves as an adapter layer between the application's
 * chess logic and the external react-chessboard library, ensuring
 * consistent behavior and easier upgrades.
 */

import React, { useEffect, useState } from "react";
import { 
  Chessboard as ReactChessboard,
  type PieceDropHandlerArgs,
  type SquareHandlerArgs
} from "react-chessboard";
import { PromotionDialog, type PromotionPiece } from "./PromotionDialog";

// Types for react-chessboard (library has incomplete TypeScript definitions)
type PieceType = "wP" | "wN" | "wB" | "wR" | "wQ" | "wK" | "bP" | "bN" | "bB" | "bR" | "bQ" | "bK";

/**
 * Promotion move data stored while waiting for piece selection
 */
interface PendingPromotion {
  from: string;
  to: string;
  piece: string;
}

/**
 * Props for the Chessboard component
 *
 * @interface ChessboardProps
 *
 * @property {string} fen - FEN string representing the chess position
 * @property {(sourceSquare: string, targetSquare: string, piece: string, promotion?: string) => boolean} [onPieceDrop] - Callback for piece drop events
 * @property {(square: string) => void} [onSquareClick] - Callback for square click events (for click-to-move support)
 * @property {(from: string, to: string) => boolean} [onPromotionCheck] - Check if a move is a promotion
 * @property {number} [boardWidth=400] - Width of the chess board in pixels
 * @property {boolean} [arePiecesDraggable=true] - Whether pieces can be dragged
 */
interface ChessboardProps {
  fen: string;
  onPieceDrop?: (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
    promotion?: string,
  ) => boolean;
  onSquareClick?: (args: { piece: PieceType | null; square: string }) => void;
  onPromotionCheck?: (from: string, to: string) => boolean;
  boardWidth?: number;
  arePiecesDraggable?: boolean;
  animationDuration?: number;
}

/**
 * Chess board wrapper component
 *
 * @component
 * @description
 * Wrapper around react-chessboard that provides a simplified interface
 * for displaying chess positions and handling piece movements. Adapts
 * the external library's API to match the application's requirements.
 *
 * @remarks
 * Component features:
 * - Displays chess positions from FEN strings
 * - Handles piece drag and drop with validation callback
 * - Configurable board dimensions and interaction
 * - Type-safe event handling with proper API conversion
 * - Consistent styling and behavior across the application
 *
 * The onPieceDrop callback receives the source square, target square,
 * and piece type, and should return true to allow the move or false
 * to reject it.
 *
 * @example
 * ```tsx
 * // Basic position display
 * <Chessboard fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
 *
 * // Interactive board with move handling
 * <Chessboard
 *   fen={currentFen}
 *   onPieceDrop={(from, to, piece) => {
 *     return handleMove(from, to);
 *   }}
 *   boardWidth={600}
 *   arePiecesDraggable={true}
 * />
 *
 * // Display-only board
 * <Chessboard
 *   fen={position}
 *   arePiecesDraggable={false}
 *   boardWidth={300}
 * />
 * ```
 *
 * @param {ChessboardProps} props - Board configuration and event handlers
 * @returns {JSX.Element} Rendered chess board component
 */
export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  onPieceDrop,
  onSquareClick,
  onPromotionCheck,
  boardWidth = 400,
  arePiecesDraggable = true,
  animationDuration = 200,
}) => {
  // Prevent SSR hydration mismatch by only rendering on client
  const [isClient, setIsClient] = useState(false);
  // Promotion dialog state
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [promotionPosition, setPromotionPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setIsClient(true);
  }, []);
  /**
   * Calculate board-relative position for promotion dialog
   */
  const getSquarePosition = (square: string): { x: number; y: number } => {
    const ASCII_LOWERCASE_A = 97;
    const file = square.charCodeAt(0) - ASCII_LOWERCASE_A; // a=0, b=1, etc.
    const rank = parseInt(square.charAt(1)) - 1; // 1=0, 2=1, etc.
    
    const BOARD_SIZE = 8;
    const squareSize = boardWidth / BOARD_SIZE;
    const SQUARE_CENTER_OFFSET = 0.5;
    const x = (file + SQUARE_CENTER_OFFSET) * squareSize;
    // Flip rank for display (rank 8 is at top)
    const MAX_RANK_INDEX = 7;
    const y = (MAX_RANK_INDEX - rank + SQUARE_CENTER_OFFSET) * squareSize;
    
    return { x, y };
  };

  /**
   * Handle promotion piece selection
   */
  const handlePromotionSelect = (piece: PromotionPiece): void => {
    if (!pendingPromotion || !onPieceDrop) {
      setPendingPromotion(null);
      return;
    }

    const success = onPieceDrop(
      pendingPromotion.from,
      pendingPromotion.to,
      pendingPromotion.piece,
      piece
    );

    if (success) {
      setPendingPromotion(null);
    }
  };

  /**
   * Handle promotion cancellation (defaults to Queen)
   */
  const handlePromotionCancel = (): void => {
    if (!pendingPromotion || !onPieceDrop) {
      setPendingPromotion(null);
      return;
    }

    // Default to Queen promotion
    const success = onPieceDrop(
      pendingPromotion.from,
      pendingPromotion.to,
      pendingPromotion.piece,
      "q"
    );

    if (success) {
      setPendingPromotion(null);
    }
  };

  /**
   * Adapts piece drop events to react-chessboard v5 API
   * Now handles promotion detection and dialog display
   */
  const handlePieceDrop = ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
    if (!targetSquare) return false;

    // Check if this is a promotion move first (before calling onPieceDrop)
    if (onPromotionCheck && onPromotionCheck(sourceSquare, targetSquare)) {
      // Store the pending promotion and show dialog
      setPendingPromotion({
        from: sourceSquare,
        to: targetSquare,
        piece: String(piece.pieceType),
      });
      
      // Calculate position for promotion dialog
      const position = getSquarePosition(targetSquare);
      setPromotionPosition(position);
      
      // Return true to accept the visual move, but don't call onPieceDrop yet
      return true;
    }

    // Normal move (not a promotion) - call the handler
    if (!onPieceDrop) return false;
    return onPieceDrop(sourceSquare, targetSquare, String(piece.pieceType));
  };

  const handleSquareClick = ({ piece, square }: SquareHandlerArgs): void => {
    if (!onSquareClick) return;
    onSquareClick({
      piece: piece as PieceType | null,
      square,
    });
  };

  // Render placeholder during SSR to avoid hydration mismatch
  if (!isClient) {
    return (
      <div
        style={{
          width: `${boardWidth}px`,
          height: `${boardWidth}px`,
          backgroundColor: "#f0d9b5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Empty board placeholder during SSR */}
      </div>
    );
  }

  // Determine promotion color from the pending move
  const promotionColor = pendingPromotion?.piece.charAt(0).toLowerCase() === 'w' ? 'w' : 'b';

  return (
    <div className="relative chess-board-container">
      <ReactChessboard
        options={{
          position: fen,
          ...(onPieceDrop && { onPieceDrop: handlePieceDrop }),
          ...(onSquareClick && { onSquareClick: handleSquareClick }),
          boardStyle: { 
            width: `${boardWidth}px`, 
            height: `${boardWidth}px`,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          allowDragging: arePiecesDraggable,
          animationDurationInMs: animationDuration,
          // Standard chess board colors
          darkSquareStyle: {
            backgroundColor: '#b58863',
          },
          lightSquareStyle: {
            backgroundColor: '#f0d9b5',
          },
        }}
      />
      
      {/* Promotion Dialog */}
      <PromotionDialog
        isOpen={Boolean(pendingPromotion)}
        color={promotionColor}
        position={promotionPosition}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </div>
  );
};
