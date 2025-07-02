import React, { useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';

interface MoveHandlerProps {
  game: Chess;
  isGameFinished: boolean;
  onMoveResult: (success: boolean, move?: Move, newFen?: string, newPgn?: string) => void;
  onError: (error: string) => void;
  onWarning: (warning: string) => void;
}

export const useMoveHandler = ({ 
  game, 
  isGameFinished, 
  onMoveResult, 
  onError, 
  onWarning 
}: MoveHandlerProps) => {
  const isProcessingMoveRef = useRef(false);

  const isValidSquare = useCallback((square: string): boolean => {
    return typeof square === 'string' && 
           square.length === 2 && 
           /^[a-h][1-8]$/.test(square);
  }, []);

  const handleMove = useCallback(async (move: { from: string; to: string; promotion?: string }) => {
    // Early validation checks
    if (!move || typeof move.from !== 'string' || typeof move.to !== 'string') {
      return false;
    }

    if (!isValidSquare(move.from) || !isValidSquare(move.to)) {
      return false;
    }
    
    if (isProcessingMoveRef.current) {
      return false;
    }
    
    if (isGameFinished) {
      return false;
    }
    
    // Set processing flag
    isProcessingMoveRef.current = true;
    
    try {
      const currentFen = game.fen();
      const testGame = new Chess(currentFen);
      
      let moveResult: Move | null = null;
      
      try {
        moveResult = testGame.move(move);
      } catch (error: any) {
        onError(`Ungültiger Zug: ${error?.message || 'Unbekannter Fehler'}`);
        return false;
      }

      if (moveResult === null) {
        return false;
      }
    
      const fenAfter = testGame.fen();
      const pgnAfter = testGame.pgn();
      
      onMoveResult(true, moveResult, fenAfter, pgnAfter);
      return true;
      
    } catch (error: any) {
      console.error('Move processing failed:', error);
      onError(error?.message || 'Zug konnte nicht verarbeitet werden');
      return false;
    } finally {
      isProcessingMoveRef.current = false;
    }
  }, [game, isGameFinished, isValidSquare, onMoveResult, onError]);

  return {
    handleMove,
    isProcessingMove: isProcessingMoveRef.current
  };
}; 