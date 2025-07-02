import React from 'react';
import { Chessboard } from 'react-chessboard';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { Move } from 'chess.js';
import { EvaluationDisplay } from '../EvaluationDisplay';

interface ChessboardContainerProps {
  currentFen: string;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square) => boolean;
  isGameFinished: boolean;
  resetKey: number;
  
  // Evaluation overlay props
  lastEvaluation?: {
    evaluation: number;
    mateInMoves?: number;
  } | null;
  history: Move[];
  showLastEvaluation: boolean;
  
  // Optional customization
  boardWidth?: number;
}

/**
 * Modular ChessboardContainer component
 * Handles chessboard rendering and evaluation overlay display
 * Isolated from complex game logic and state management
 */
export const ChessboardContainer: React.FC<ChessboardContainerProps> = ({
  currentFen,
  onPieceDrop,
  isGameFinished,
  resetKey,
  lastEvaluation,
  history,
  showLastEvaluation,
  boardWidth = 500
}) => {
  const lastMove = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="relative">
      {/* Chessboard */}
      <div key={`board-${resetKey}`} className="chessboard-container">
        <Chessboard
          position={currentFen}
          onPieceDrop={onPieceDrop}
          boardWidth={boardWidth}
          arePiecesDraggable={!isGameFinished}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          }}
        />
      </div>

      {/* Evaluation Overlay */}
      {lastEvaluation && showLastEvaluation && lastMove && (
        <EvaluationDisplay
          evaluation={lastEvaluation.evaluation}
          mateInMoves={lastEvaluation.mateInMoves}
          move={lastMove.san || ''}
          isVisible={showLastEvaluation}
        />
      )}
    </div>
  );
}; 