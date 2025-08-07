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

import React from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
// Using any for react-chessboard types due to missing type definitions
type PieceDropHandlerArgs = any;

/**
 * Props for the Chessboard component
 * 
 * @interface ChessboardProps
 * 
 * @property {string} fen - FEN string representing the chess position
 * @property {(sourceSquare: string, targetSquare: string, piece: string) => boolean} [onPieceDrop] - Callback for piece drop events
 * @property {number} [boardWidth=400] - Width of the chess board in pixels
 * @property {boolean} [arePiecesDraggable=true] - Whether pieces can be dragged
 */
interface ChessboardProps {
  fen: string;
  onPieceDrop?: (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) => boolean;
  boardWidth?: number;
  arePiecesDraggable?: boolean;
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
  boardWidth = 400,
  arePiecesDraggable = true,
}) => {
  /**
   * Adapts piece drop events to react-chessboard v5 API
   * 
   * @param {PieceDropHandlerArgs} args - Drop event arguments from react-chessboard
   * @returns {boolean} Whether the move should be allowed
   * 
   * @description
   * Converts the react-chessboard v5 API format to the simplified format
   * expected by the application's move handlers. Extracts the relevant
   * data and calls the provided onPieceDrop callback.
   */
  const handlePieceDrop = (args: PieceDropHandlerArgs): boolean => {
    if (!onPieceDrop || !args.targetSquare) return false;
    return onPieceDrop(
      args.sourceSquare,
      args.targetSquare,
      args.piece.pieceType,
    );
  };

  return (
    <ReactChessboard
      options={{
        position: fen,
        onPieceDrop: onPieceDrop ? handlePieceDrop : undefined,
        boardStyle: { width: `${boardWidth}px`, height: `${boardWidth}px` },
        allowDragging: arePiecesDraggable,
      }}
    />
  );
};
