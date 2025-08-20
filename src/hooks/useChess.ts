import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChessService } from '../core/services/chess.service';
import type { ChessSnapshot, Result, ChessMove } from '../core/types';
import type { Move } from 'chess.js';

/**
 * React hook for chess game state management
 * Provides reactive chess state and move handling
 */
export function useChess(initialFen?: string) {
  // Create chess service instance (memoized)
  const chess = useMemo(() => new ChessService(initialFen), []);
  
  // State for reactive updates
  const [snapshot, setSnapshot] = useState<ChessSnapshot>(() => chess.getSnapshot());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to chess state changes
  useEffect(() => {
    const unsubscribe = chess.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
      setError(null); // Clear error on successful state change
    });
    
    // Set initial snapshot
    setSnapshot(chess.getSnapshot());
    
    return unsubscribe;
  }, [chess]);

  // ========== Actions ==========
  
  const makeMove = useCallback((moveInput: string): boolean => {
    setError(null);
    
    // Handle both UCI and SAN input
    let result: Result<Move, any>;
    
    if (moveInput.match(/^[a-h][1-8][a-h][1-8][qrbn]?$/i)) {
      // UCI format
      result = chess.makeMove(moveInput);
    } else {
      // Try as SAN
      const uciResult = chess.sanToUci(moveInput);
      if (uciResult.ok) {
        result = chess.makeMove(uciResult.value);
      } else {
        result = uciResult as any;
      }
    }
    
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    
    return true;
  }, [chess]);

  const loadFen = useCallback((fen: string): boolean => {
    setError(null);
    setIsLoading(true);
    
    const result = chess.loadFen(fen);
    
    setIsLoading(false);
    
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    
    return true;
  }, [chess]);

  const undoMove = useCallback((): boolean => {
    const result = chess.undoMove();
    
    if (!result.ok) {
      setError(result.error.message);
      return false;
    }
    
    return true;
  }, [chess]);

  const reset = useCallback(() => {
    chess.reset();
    setError(null);
  }, [chess]);

  const isValidMove = useCallback((moveInput: string): boolean => {
    // Handle both UCI and SAN
    if (moveInput.match(/^[a-h][1-8][a-h][1-8][qrbn]?$/i)) {
      return chess.isValidMove(moveInput);
    }
    
    // Try to convert SAN to UCI
    const uciResult = chess.sanToUci(moveInput);
    return uciResult.ok && chess.isValidMove(uciResult.value);
  }, [chess]);

  const getLegalMovesFrom = useCallback((square: string): string[] => {
    return chess.getLegalMovesFrom(square);
  }, [chess]);

  // ========== Computed Properties ==========
  
  const canUndo = snapshot.history.length > 0;
  const isPlayerTurn = snapshot.turn === 'w'; // Assuming player is white
  const moveCount = snapshot.history.length;
  
  // ========== Return API ==========
  
  return {
    // State
    ...snapshot,
    isLoading,
    error,
    
    // Computed
    canUndo,
    isPlayerTurn,
    moveCount,
    
    // Actions
    makeMove,
    loadFen,
    undoMove,
    reset,
    isValidMove,
    getLegalMovesFrom,
    
    // Service instance (for advanced use)
    chess
  };
}

/**
 * Hook for chess board interaction
 * Handles square selection and move making
 */
export function useChessBoard(chess: ReturnType<typeof useChess>) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [lastMoveSquares, setLastMoveSquares] = useState<[string, string] | null>(null);

  // Update last move squares when chess state changes
  useEffect(() => {
    if (chess.lastMove) {
      setLastMoveSquares([chess.lastMove.from, chess.lastMove.to]);
    }
  }, [chess.lastMove]);

  const handleSquareClick = useCallback((square: string) => {
    // If no square selected, select this one
    if (!selectedSquare) {
      // Only select if there are pieces that can move from here
      const moves = chess.getLegalMovesFrom(square);
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
    const isPromotion = checkIfPromotion(selectedSquare, square, chess.fen);
    
    if (isPromotion) {
      // For now, auto-promote to queen
      // In production, would show promotion dialog
      const success = chess.makeMove(`${moveUci}q`);
      if (success) {
        setSelectedSquare(null);
        setHighlightedSquares([]);
      }
    } else {
      const success = chess.makeMove(moveUci);
      if (success) {
        setSelectedSquare(null);
        setHighlightedSquares([]);
      } else {
        // Invalid move, select new square if it has pieces
        const moves = chess.getLegalMovesFrom(square);
        if (moves.length > 0) {
          setSelectedSquare(square);
          setHighlightedSquares(moves.map(m => m.slice(2, 4)));
        } else {
          setSelectedSquare(null);
          setHighlightedSquares([]);
        }
      }
    }
  }, [selectedSquare, chess]);

  const handlePieceDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    const moveUci = `${sourceSquare}${targetSquare}`;
    
    // Check if this is a pawn promotion
    const isPromotion = checkIfPromotion(sourceSquare, targetSquare, chess.fen);
    
    if (isPromotion) {
      // Auto-promote to queen for drag & drop
      return chess.makeMove(`${moveUci}q`);
    }
    
    return chess.makeMove(moveUci);
  }, [chess]);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setHighlightedSquares([]);
  }, []);

  return {
    selectedSquare,
    highlightedSquares,
    lastMoveSquares,
    handleSquareClick,
    handlePieceDrop,
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