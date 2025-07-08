import React from 'react';
import { Chessboard } from 'react-chessboard';

export default function TestChessboard() {
  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl mb-4 text-black">Test Chessboard</h1>
        <div style={{ width: '400px' }}>
          <Chessboard 
            position="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            arePiecesDraggable={true}
          />
        </div>
      </div>
    </div>
  );
}