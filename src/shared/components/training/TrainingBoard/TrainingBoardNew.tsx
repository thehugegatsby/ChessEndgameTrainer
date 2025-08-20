/**
 * @file Interactive chess training board component (NEW ARCHITECTURE)
 * @module components/training/TrainingBoard
 * 
 * Simplified training board using the new clean architecture
 */

'use client';

import React, { useCallback, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useTraining, useTrainingBoard } from '../../../../hooks/useTraining';
import type { Square } from 'chess.js';

interface TrainingBoardProps {
  category?: string;
  onSessionComplete?: () => void;
  boardSize?: number;
}

export function TrainingBoard({ 
  category, 
  onSessionComplete,
  boardSize = 600 
}: TrainingBoardProps) {
  const training = useTraining({ 
    category, 
    autoStartSession: true 
  });
  
  const board = useTrainingBoard(training);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  
  // Get current chess position
  const position = training.getChessSnapshot().fen;
  
  // Handle piece drag
  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square) => {
    return board.handlePieceDrop(sourceSquare, targetSquare);
  }, [board]);
  
  // Handle square clicks
  const onSquareClick = useCallback((square: Square) => {
    board.handleSquareClick(square);
  }, [board]);
  
  // Handle promotion dialog
  const renderPromotionDialog = () => {
    if (!board.promotionSquare) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          <h3 className="text-lg font-semibold mb-4">Bauernumwandlung</h3>
          <div className="flex gap-4">
            <button 
              onClick={() => board.handlePromotion('q')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Dame
            </button>
            <button 
              onClick={() => board.handlePromotion('r')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Turm
            </button>
            <button 
              onClick={() => board.handlePromotion('b')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Läufer
            </button>
            <button 
              onClick={() => board.handlePromotion('n')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Springer
            </button>
          </div>
          <button 
            onClick={board.cancelPromotion}
            className="mt-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  };
  
  // Render feedback message
  const renderFeedback = () => {
    if (!training.feedback) return null;
    
    const bgColor = training.feedback.type === 'success' 
      ? 'bg-green-100 border-green-400 text-green-700'
      : training.feedback.type === 'error'
      ? 'bg-red-100 border-red-400 text-red-700'
      : 'bg-blue-100 border-blue-400 text-blue-700';
    
    return (
      <div className={`mb-4 px-4 py-3 border rounded ${bgColor}`}>
        {training.feedback.message}
      </div>
    );
  };
  
  // Render session stats
  const renderStats = () => {
    const stats = training.sessionStats;
    
    return (
      <div className="flex gap-4 text-sm text-gray-600">
        <span>Züge: {stats.moveCount}</span>
        <span>Korrekt: {stats.correctMoves}</span>
        <span>Genauigkeit: {stats.accuracy}%</span>
      </div>
    );
  };
  
  // Render control buttons
  const renderControls = () => {
    return (
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => training.startSession(category)}
          disabled={training.isLoading || training.state === 'waitingForPlayer'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Neue Position
        </button>
        
        <button
          onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Brett drehen
        </button>
        
        {training.isComplete && (
          <button
            onClick={() => {
              training.nextPosition();
              onSessionComplete?.();
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Nächste Position
          </button>
        )}
      </div>
    );
  };
  
  // Loading state
  if (training.isLoading && !training.hasPosition) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Position wird geladen...</div>
      </div>
    );
  }
  
  // Error state
  if (training.error && !training.hasPosition) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 mb-4">{training.error}</div>
        <button 
          onClick={() => training.startSession(category)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center">
      {renderFeedback()}
      
      <div className="mb-4">
        {renderStats()}
      </div>
      
      <div className="relative">
        {training.isThinking && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-10">
            <div className="bg-white px-4 py-2 rounded shadow">
              Gegner denkt...
            </div>
          </div>
        )}
        
        <Chessboard
          position={position}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          boardOrientation={boardOrientation}
          boardWidth={boardSize}
          arePiecesDraggable={training.canMove}
          customSquareStyles={{
            ...(board.selectedSquare && {
              [board.selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
            }),
            ...board.highlightedSquares.reduce((acc, sq) => ({
              ...acc,
              [sq]: { backgroundColor: 'rgba(0, 255, 0, 0.2)' }
            }), {})
          }}
        />
      </div>
      
      {renderPromotionDialog()}
      {renderControls()}
      
      {/* Training info */}
      {training.currentPosition && (
        <div className="mt-4 text-sm text-gray-600">
          <div>Kategorie: {training.currentPosition.category}</div>
          <div>Schwierigkeit: {training.currentPosition.difficulty}/10</div>
          <div>Status: {training.state}</div>
        </div>
      )}
    </div>
  );
}