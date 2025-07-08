import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Chess, Move } from 'chess.js';
import { ErrorService } from '@shared/services/errorService';
import { validateAndSanitizeFen } from '@shared/utils/fenValidator';

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
  // Validate and sanitize initial FEN
  const validation = validateAndSanitizeFen(initialFen);
  const validatedInitialFen = validation.isValid ? validation.sanitized : initialFen;
  
  if (!validation.isValid) {
    ErrorService.handleChessEngineError(new Error(`Invalid initial FEN: ${validation.errors.join(', ')}`), {
      component: 'useChessGame',
      action: 'validateInitialFen',
      additionalData: { fen: initialFen }
    });
  }
  
  // Use a ref to store the actual game instance to maintain stable reference
  const gameRef = useRef<Chess>(new Chess(validatedInitialFen));
  
  // State for tracking game state changes
  const [gameVersion, setGameVersion] = useState(0); // Used to trigger re-renders when game state changes
  const [history, setHistory] = useState<Move[]>([]);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [currentFen, setCurrentFen] = useState(validatedInitialFen);
  const [currentPgn, setCurrentPgn] = useState('');
  
  // Stable game instance that doesn't change reference
  const game = useMemo(() => gameRef.current, [gameVersion]);
  
  const historyRef = useRef<Move[]>([]);
  
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const makeMove = useCallback(async (move: { from: string; to: string; promotion?: string }): Promise<boolean> => {
    if (isGameFinished) return false;
    
    try {
      const currentGame = gameRef.current;
      let moveResult;
      
      try {
        moveResult = currentGame.move(move);
      } catch (error) {
        // Invalid move - just return false without crashing
        return false;
      }
      
      if (moveResult === null) {
        return false;
      }
      
      const newFen = currentGame.fen();
      const newPgn = currentGame.pgn();
      
      // Update state and trigger re-render with stable game reference
      setGameVersion(v => v + 1); // This triggers useMemo to return the same gameRef.current
      setHistory(prev => [...prev, moveResult]);
      setCurrentFen(newFen);
      setCurrentPgn(newPgn);
      
      // Check game end conditions
      if (currentGame.isGameOver()) {
        setIsGameFinished(true);
        onComplete?.(true);
      }
      
      onPositionChange?.(newFen, newPgn);
      return true;
      
    } catch (error) {
      ErrorService.handleChessEngineError(error as Error, {
        component: 'useChessGame',
        action: 'makeMove',
        additionalData: { move }
      });
      return false;
    }
  }, [isGameFinished, onComplete, onPositionChange]);

  const jumpToMove = useCallback((moveIndex: number) => {
    // Reset game to initial position
    gameRef.current.reset();
    gameRef.current.load(validatedInitialFen);
    
    // Apply moves up to the target index
    for (let i = 0; i <= moveIndex && i < historyRef.current.length; i++) {
      const move = historyRef.current[i];
      gameRef.current.move(move);
    }
    
    // Update state with new position
    setGameVersion(v => v + 1);
    setCurrentFen(gameRef.current.fen());
    setCurrentPgn(gameRef.current.pgn());
    setIsGameFinished(false);
    
    onPositionChange?.(gameRef.current.fen(), gameRef.current.pgn());
  }, [validatedInitialFen, onPositionChange]);

  const resetGame = useCallback(() => {
    // Reset the existing game instance instead of creating a new one
    gameRef.current.reset();
    gameRef.current.load(validatedInitialFen);
    
    setGameVersion(v => v + 1);
    setHistory([]);
    setIsGameFinished(false);
    setCurrentFen(validatedInitialFen);
    setCurrentPgn('');
    
    onPositionChange?.(validatedInitialFen, '');
  }, [validatedInitialFen, onPositionChange]);

  const undoMove = useCallback((): boolean => {
    if (history.length === 0) return false;
    
    const newHistory = history.slice(0, -1);
    
    // Reset game and replay moves
    gameRef.current.reset();
    gameRef.current.load(validatedInitialFen);
    newHistory.forEach(move => gameRef.current.move(move));
    
    setGameVersion(v => v + 1);
    setHistory(newHistory);
    setCurrentFen(gameRef.current.fen());
    setCurrentPgn(gameRef.current.pgn());
    setIsGameFinished(false);
    
    onPositionChange?.(gameRef.current.fen(), gameRef.current.pgn());
    return true;
  }, [history, validatedInitialFen, onPositionChange]);

  return {
    game,
    history,
    isGameFinished,
    currentFen,
    currentPgn,
    makeMove,
    jumpToMove,
    resetGame,
    undoMove
  };
}; 