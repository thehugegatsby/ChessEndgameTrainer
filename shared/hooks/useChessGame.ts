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
  const [game, setGame] = useState(() => new Chess(initialFen));
  const [history, setHistory] = useState<Move[]>([]);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [currentFen, setCurrentFen] = useState(initialFen);
  const [currentPgn, setCurrentPgn] = useState('');
  
  const gameRef = useRef(game);
  const historyRef = useRef<Move[]>([]);
  
  useEffect(() => {
    gameRef.current = game;
  }, [game]);
  
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
      
      // Reuse existing game instance instead of creating new one
      setGame(currentGame);
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
    // Optimization: reuse existing game if possible
    const currentGameCopy = new Chess(gameRef.current.fen());
    currentGameCopy.reset();
    currentGameCopy.load(initialFen);
    
    // Apply moves up to the target index
    for (let i = 0; i <= moveIndex && i < historyRef.current.length; i++) {
      const move = historyRef.current[i];
      currentGameCopy.move(move);
    }
    
    setGame(currentGameCopy);
    setCurrentFen(currentGameCopy.fen());
    setCurrentPgn(currentGameCopy.pgn());
    setIsGameFinished(false);
    
    onPositionChange?.(currentGameCopy.fen(), currentGameCopy.pgn());
  }, [initialFen, onPositionChange]);

  const resetGame = useCallback(() => {
    const newGame = new Chess(initialFen);
    setGame(newGame);
    setHistory([]);
    setIsGameFinished(false);
    setCurrentFen(initialFen);
    setCurrentPgn('');
    
    onPositionChange?.(initialFen, '');
  }, [initialFen, onPositionChange]);

  const undoMove = useCallback((): boolean => {
    if (history.length === 0) return false;
    
    const newHistory = history.slice(0, -1);
    const tempGame = new Chess(initialFen);
    
    newHistory.forEach(move => tempGame.move(move));
    
    setGame(tempGame);
    setHistory(newHistory);
    setCurrentFen(tempGame.fen());
    setCurrentPgn(tempGame.pgn());
    setIsGameFinished(false);
    
    onPositionChange?.(tempGame.fen(), tempGame.pgn());
    return true;
  }, [history, initialFen, onPositionChange]);

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