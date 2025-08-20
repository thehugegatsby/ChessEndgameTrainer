import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TrainingCoordinator } from '../core/training.coordinator';
import { ChessService } from '../core/services/chess.service';
import { TablebaseService } from '../core/services/tablebase.service';
import { PositionService } from '../core/services/position.service';
import { db } from '../firebase/config';
import type { TrainingSnapshot, Position } from '../core/types';

interface TrainingOptions {
  category?: string;
  difficulty?: number;
  autoStartSession?: boolean;
}

/**
 * React hook for training session management
 * Provides complete training flow with tablebase integration
 */
export function useTraining(options: TrainingOptions = {}) {
  // Create services and coordinator (memoized)
  const services = useMemo(() => {
    const chess = new ChessService();
    const tablebase = new TablebaseService();
    const positions = new PositionService(db);
    
    return {
      chess,
      tablebase,
      positions,
      coordinator: new TrainingCoordinator(chess, tablebase, positions)
    };
  }, []);

  // State
  const [snapshot, setSnapshot] = useState<TrainingSnapshot>(() => 
    services.coordinator.getSnapshot()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState(services.coordinator.getSessionStats());
  
  // Track if we should auto-start
  const hasAutoStarted = useRef(false);

  // Subscribe to training state changes
  useEffect(() => {
    const unsubscribe = services.coordinator.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
      setSessionStats(services.coordinator.getSessionStats());
      
      // Clear error on state change (unless it's an error state)
      if (newSnapshot.feedback?.type !== 'error') {
        setError(null);
      }
    });
    
    // Set initial snapshot
    setSnapshot(services.coordinator.getSnapshot());
    
    return unsubscribe;
  }, [services.coordinator]);

  // Auto-start session if requested
  useEffect(() => {
    if (options.autoStartSession && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startSession();
    }
  }, [options.autoStartSession]);

  // ========== Actions ==========
  
  const startSession = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);
    
    const result = await services.coordinator.startNewSession(category || options.category);
    
    setIsLoading(false);
    
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    
    return true;
  }, [services.coordinator, options.category]);

  const makeMove = useCallback(async (moveInput: string) => {
    setError(null);
    
    const result = await services.coordinator.handlePlayerMove(moveInput);
    
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    
    return true;
  }, [services.coordinator]);

  const nextPosition = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await services.coordinator.loadNextPosition(options.category);
    
    setIsLoading(false);
    
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    
    return true;
  }, [services.coordinator, options.category]);

  const resetSession = useCallback(async () => {
    return startSession(options.category);
  }, [startSession, options.category]);

  // ========== Chess State Access ==========
  
  const getChessSnapshot = useCallback(() => {
    return services.chess.getSnapshot();
  }, [services.chess]);

  const getFen = useCallback(() => {
    return services.chess.getFen();
  }, [services.chess]);

  const isValidMove = useCallback((moveInput: string): boolean => {
    // Handle both UCI and SAN
    if (moveInput.match(/^[a-h][1-8][a-h][1-8][qrbn]?$/i)) {
      return services.chess.isValidMove(moveInput);
    }
    
    // Try to convert SAN to UCI
    const uciResult = services.chess.sanToUci(moveInput);
    return uciResult.ok && services.chess.isValidMove(uciResult.value);
  }, [services.chess]);

  const getLegalMovesFrom = useCallback((square: string): string[] => {
    return services.chess.getLegalMovesFrom(square);
  }, [services.chess]);

  // ========== Computed Properties ==========
  
  const isReady = snapshot.state !== 'idle' && snapshot.state !== 'loading';
  const canMove = snapshot.state === 'waitingForPlayer';
  const isThinking = snapshot.state === 'opponentThinking';
  const isComplete = snapshot.state === 'sessionComplete';
  const hasPosition = !!snapshot.currentPosition;
  
  // ========== Return API ==========
  
  return {
    // State
    ...snapshot,
    isLoading,
    error,
    sessionStats,
    
    // Computed
    isReady,
    canMove,
    isThinking,
    isComplete,
    hasPosition,
    
    // Actions
    startSession,
    makeMove,
    nextPosition,
    resetSession,
    
    // Chess access
    getChessSnapshot,
    getFen,
    isValidMove,
    getLegalMovesFrom,
    
    // Service instances (for advanced use)
    services
  };
}

/**
 * Hook for training board interaction
 * Combines chess board interaction with training flow
 */
export function useTrainingBoard(training: ReturnType<typeof useTraining>) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [promotionSquare, setPromotionSquare] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);

  // Handle square clicks for move making
  const handleSquareClick = useCallback(async (square: string) => {
    // Only allow moves when it's player's turn
    if (!training.canMove) {
      return;
    }
    
    // If no square selected, select this one
    if (!selectedSquare) {
      const moves = training.getLegalMovesFrom(square);
      if (moves.length > 0) {
        setSelectedSquare(square);
        setHighlightedSquares(moves.map(m => m.slice(2, 4))); // Extract 'to' squares
      }
      return;
    }
    
    // If clicking the same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setHighlightedSquares([]);
      return;
    }
    
    // Try to make a move
    const moveUci = `${selectedSquare}${square}`;
    
    // Check if this is a pawn promotion
    if (checkIfPromotion(selectedSquare, square, training.getFen())) {
      // Store pending move and show promotion dialog
      setPendingMove({ from: selectedSquare, to: square });
      setPromotionSquare(square);
      return;
    }
    
    // Make the move
    const success = await training.makeMove(moveUci);
    if (success) {
      setSelectedSquare(null);
      setHighlightedSquares([]);
    } else {
      // Invalid move, try selecting new square
      const moves = training.getLegalMovesFrom(square);
      if (moves.length > 0) {
        setSelectedSquare(square);
        setHighlightedSquares(moves.map(m => m.slice(2, 4)));
      } else {
        setSelectedSquare(null);
        setHighlightedSquares([]);
      }
    }
  }, [selectedSquare, training]);

  // Handle drag & drop
  const handlePieceDrop = useCallback(async (sourceSquare: string, targetSquare: string): Promise<boolean> => {
    if (!training.canMove) {
      return false;
    }
    
    const moveUci = `${sourceSquare}${targetSquare}`;
    
    // Check if this is a pawn promotion
    if (checkIfPromotion(sourceSquare, targetSquare, training.getFen())) {
      // For drag & drop, auto-promote to queen
      return await training.makeMove(`${moveUci}q`);
    }
    
    return await training.makeMove(moveUci);
  }, [training]);

  // Handle promotion choice
  const handlePromotion = useCallback(async (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingMove) return;
    
    const moveUci = `${pendingMove.from}${pendingMove.to}${piece}`;
    await training.makeMove(moveUci);
    
    // Clear promotion state
    setPromotionSquare(null);
    setPendingMove(null);
    setSelectedSquare(null);
    setHighlightedSquares([]);
  }, [pendingMove, training]);

  const cancelPromotion = useCallback(() => {
    setPromotionSquare(null);
    setPendingMove(null);
    setSelectedSquare(null);
    setHighlightedSquares([]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setHighlightedSquares([]);
  }, []);

  return {
    selectedSquare,
    highlightedSquares,
    promotionSquare,
    handleSquareClick,
    handlePieceDrop,
    handlePromotion,
    cancelPromotion,
    clearSelection
  };
}

// Helper function to check if a move is a pawn promotion
function checkIfPromotion(from: string, to: string, fen: string): boolean {
  const piece = getPieceAt(from, fen);
  const rank = to[1];
  
  // Check if it's a pawn moving to the last rank
  return (piece === 'P' && rank === '8') || (piece === 'p' && rank === '1');
}

// Helper to get piece at square from FEN
function getPieceAt(square: string, fen: string): string | null {
  const [position] = fen.split(' ');
  if (!position) return null;
  const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rankChar = square[1];
  if (!rankChar) return null;
  const rank = 8 - parseInt(rankChar); // 8=0, 7=1, etc.
  
  const rows = position.split('/');
  const row = rows[rank];
  if (!row) return null;
  
  let currentFile = 0;
  for (const char of row) {
    if (/\d/.test(char)) {
      currentFile += parseInt(char);
    } else {
      if (currentFile === file) {
        return char;
      }
      currentFile++;
    }
  }
  
  return null;
}