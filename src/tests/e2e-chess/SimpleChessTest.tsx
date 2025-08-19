/**
 * @file Simple Chess Test Component
 * @description Minimal test to verify chess.js + react-chessboard work together
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

const SimpleChessTest: React.FC = () => {
  // Initialize chess.js with Opposition Grundlagen position
  const [chess] = useState(() => new Chess('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'));
  const [gamePosition, setGamePosition] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  console.log('🔍 SimpleChessTest render:', {
    currentFen: gamePosition,
    chessFen: chess.fen(),
    turn: chess.turn(),
    moves: chess.moves()
  });

  // Force re-render helper
  const forceUpdate = useCallback(() => {
    setGamePosition(chess.fen());
  }, [chess]);

  // Move handler - v5 API format (with piece object)
  const onPieceDrop = useCallback(({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }) => {
    console.log('🎯 Move attempt:', { piece: piece?.pieceType, from: sourceSquare, to: targetSquare });
    
    if (!targetSquare) {
      console.log('❌ Move failed: No target square');
      return false;
    }
    
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen
      });
      
      if (move) {
        console.log('✅ Move successful:', move);
        forceUpdate();
        return true;
      } else {
        console.log('❌ Move failed: Invalid move');
        return false;
      }
    } catch (error) {
      console.log('❌ Move error:', error);
      return false;
    }
  }, [chess, forceUpdate]);

  // Click-to-move handler - v5 API format
  const onSquareClick = useCallback(({ square }: { square: string }) => {
    console.log('🎯 Square clicked:', { square, selectedSquare });
    
    if (selectedSquare === null) {
      // First click - select piece
      setSelectedSquare(square);
      console.log('✅ Square selected:', square);
    } else if (selectedSquare === square) {
      // Same square clicked - deselect
      setSelectedSquare(null);
      console.log('❌ Square deselected:', square);
    } else {
      // Second click - try to move
      try {
        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q' // Always promote to queen
        });
        
        if (move) {
          console.log('✅ Click move successful:', move);
          forceUpdate();
          setSelectedSquare(null);
        } else {
          console.log('❌ Click move failed: Invalid move');
          setSelectedSquare(square); // Select new square instead
        }
      } catch (error) {
        console.log('❌ Click move error:', error);
        setSelectedSquare(square); // Select new square instead
      }
    }
  }, [chess, forceUpdate, selectedSquare]);

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Chess Test</h1>
      <div className="mb-4">
        <p><strong>Current FEN:</strong> {gamePosition}</p>
        <p><strong>Turn:</strong> {chess.turn() === 'w' ? 'White' : 'Black'}</p>
        <p><strong>Valid moves:</strong> {chess.moves().length}</p>
        {selectedSquare && (
          <p><strong>Selected:</strong> {selectedSquare}</p>
        )}
      </div>
      
      <div 
        style={{ width: '400px', height: '400px' }}
        data-testid="simple-chess-board"
        data-fen={gamePosition}
        data-handler-bound={Boolean(onPieceDrop).toString()}
      >
        <Chessboard
          options={{
            position: gamePosition,
            onPieceDrop: onPieceDrop,
            onSquareClick: onSquareClick,
            allowDragging: true,
            id: 'simple-chess-test'
          }}
        />
      </div>
      
      <button 
        onClick={() => {
          chess.reset();
          chess.load('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
          setSelectedSquare(null);
          forceUpdate();
        }}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Reset Position
      </button>
    </div>
  );
};

export default SimpleChessTest;