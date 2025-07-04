import React, { useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react';
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
  boardWidth
}) => {
  const lastMove = history.length > 0 ? history[history.length - 1] : null;
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const [calculatedWidth, setCalculatedWidth] = useState(boardWidth || 800);

  // Dynamically calculate board width based on container size
  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      
      // Brett muss quadratisch sein - nimm die kleinere Dimension
      const maxBoardSize = Math.min(containerWidth, containerHeight);
      // RIESIGES BRETT: 99.8% der verfügbaren Größe, mindestens 800px
      const newWidth = Math.max(800, Math.floor(maxBoardSize * 0.998));
      
      // Update nur bei signifikanten Änderungen > 10px um Resize-Loops zu vermeiden
      setCalculatedWidth(prev => {
        if (Math.abs(prev - newWidth) > 10) {
          return newWidth;
        }
        return prev;
      });
    }
  }, []);

  // Use useEffect instead of useLayoutEffect for SSR compatibility
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  // Initial width calculation
  useIsomorphicLayoutEffect(() => {
    updateWidth();
  }, [updateWidth]);

  // ResizeObserver for more precise container size tracking
  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Längeres Debounce um Resize-Loops zu verhindern
      if (resizeTimeoutId.current) {
        clearTimeout(resizeTimeoutId.current);
      }
      resizeTimeoutId.current = setTimeout(() => {
        updateWidth();
      }, 200);
    });

    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (resizeTimeoutId.current) {
        clearTimeout(resizeTimeoutId.current);
      }
      resizeObserver.disconnect();
    };
  }, [updateWidth]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-1">
      {/* Chessboard */}
      <Chessboard
        key={`board-${resetKey}`}
        position={currentFen}
        onPieceDrop={onPieceDrop}
        boardWidth={boardWidth || calculatedWidth}
        arePiecesDraggable={!isGameFinished}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        }}
      />

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