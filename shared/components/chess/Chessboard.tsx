import React from 'react';
import { Chessboard as ReactChessboard } from 'react-chessboard';
import type { Piece, Square } from 'react-chessboard/dist/chessboard/types';

interface ChessboardProps {
  fen: string;
  onPieceDrop?: (sourceSquare: Square, targetSquare: Square, piece: Piece) => boolean;
  boardWidth?: number;
  arePiecesDraggable?: boolean;
}

export const Chessboard: React.FC<ChessboardProps> = ({ fen, onPieceDrop, boardWidth = 400, arePiecesDraggable = true }) => {
  return (
    <div data-testid="chessboard">
      <ReactChessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        boardWidth={boardWidth}
        arePiecesDraggable={arePiecesDraggable}
      />
    </div>
  );
}; 