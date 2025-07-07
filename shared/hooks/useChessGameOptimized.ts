import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess, Move } from 'chess.js';
import { ErrorService } from '@shared/services/errorService';

interface UseChessGameOptions {
  initialFen: string;
  onComplete?: (success: boolean) => void;
  onPositionChange?: (fen: string, pgn: string) => void;
}

interface UseChessGameReturn {
  game: Chess;
  history: Move[];
  isGameFinished: boolean;
  currentFen: string;
  currentPgn: string;
  makeMove: (move: { from: string; to: string; promotion?: string }) => Promise<boolean>;
  jumpToMove: (moveIndex: number) => void;
  resetGame: () => void;
  undoMove: () => boolean;
}

export const useChessGame = ({ 
  initialFen, 
  onComplete, 
  onPositionChange 
}: UseChessGameOptions): UseChessGameReturn => {
  // Create a single Chess instance and keep it in a ref
  const gameRef = useRef<Chess>(new Chess(initialFen));
  
  // State for triggering re-renders
  const [gameState, setGameState] = useState(() => ({
    history: [] as Move[],
    isGameFinished: false,
    currentFen: initialFen,
    currentPgn: '',
    // Version counter to force re-renders when game mutates
    version: 0
  }));

  // Update game state helper - single setState call
  const updateGameState = useCallback(() => {
    const game = gameRef.current;
    setGameState(prev => ({
      history: game.history({ verbose: true }),
      isGameFinished: game.isGameOver(),
      currentFen: game.fen(),
      currentPgn: game.pgn(),
      version: prev.version + 1
    }));
  }, []);

  const makeMove = useCallback(async (move: { from: string; to: string; promotion?: string }): Promise<boolean> => {
    if (gameState.isGameFinished) return false;
    
    try {
      const game = gameRef.current;
      let moveResult;
      
      try {
        moveResult = game.move(move);
      } catch (error) {
        // Invalid move - just return false without crashing
        return false;
      }
      
      if (moveResult === null) {
        return false;
      }
      
      // Single state update
      updateGameState();
      
      // Check game end conditions
      if (game.isGameOver()) {
        onComplete?.(true);
      }
      
      onPositionChange?.(game.fen(), game.pgn());
      return true;
      
    } catch (error) {
      ErrorService.handleChessEngineError(error as Error, {
        component: 'useChessGameOptimized',
        action: 'makeMove',
        additionalData: { move }
      });
      return false;
    }
  }, [gameState.isGameFinished, onComplete, onPositionChange, updateGameState]);

  const jumpToMove = useCallback((moveIndex: number) => {
    const game = gameRef.current;
    
    // Get current history before reset
    const fullHistory = game.history({ verbose: true });
    
    // Reset game to initial position
    game.reset();
    game.load(initialFen);
    
    // Replay moves up to the target index
    for (let i = 0; i <= moveIndex && i < fullHistory.length; i++) {
      game.move(fullHistory[i]);
    }
    
    // Single state update
    updateGameState();
    onPositionChange?.(game.fen(), game.pgn());
  }, [initialFen, onPositionChange, updateGameState]);

  const resetGame = useCallback(() => {
    const game = gameRef.current;
    game.reset();
    game.load(initialFen);
    
    // Single state update
    updateGameState();
    onPositionChange?.(initialFen, '');
  }, [initialFen, onPositionChange, updateGameState]);

  const undoMove = useCallback((): boolean => {
    if (gameState.history.length === 0) return false;
    
    const game = gameRef.current;
    const lastMove = game.undo();
    
    if (lastMove === null) return false;
    
    // Single state update
    updateGameState();
    onPositionChange?.(game.fen(), game.pgn());
    return true;
  }, [gameState.history.length, onPositionChange, updateGameState]);

  // Update initial FEN if it changes
  useEffect(() => {
    const game = gameRef.current;
    if (game.fen() !== initialFen && gameState.history.length === 0) {
      game.load(initialFen);
      updateGameState();
    }
  }, [initialFen, gameState.history.length, updateGameState]);

  return {
    game: gameRef.current,
    history: gameState.history,
    isGameFinished: gameState.isGameFinished,
    currentFen: gameState.currentFen,
    currentPgn: gameState.currentPgn,
    makeMove,
    jumpToMove,
    resetGame,
    undoMove
  };
};