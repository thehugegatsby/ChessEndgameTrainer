import React from "react";
import { Chessboard as ReactChessboard } from "react-chessboard";
import type { PieceDropHandlerArgs } from "react-chessboard";

/**
 *
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
 *
 * @param root0
 * @param root0.fen
 * @param root0.onPieceDrop
 * @param root0.boardWidth
 * @param root0.arePiecesDraggable
 */
export /**
 *
 */
const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  onPieceDrop,
  boardWidth = 400,
  arePiecesDraggable = true,
}) => {
  // Convert our onPieceDrop handler to match react-chessboard v5 API
  /**
   *
   * @param args
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
    <div data-testid="chessboard">
      <ReactChessboard
        options={{
          position: fen,
          onPieceDrop: onPieceDrop ? handlePieceDrop : undefined,
          boardStyle: { width: `${boardWidth}px`, height: `${boardWidth}px` },
          allowDragging: arePiecesDraggable,
        }}
      />
    </div>
  );
};
