/**
 * Game Status Utilities for Chess Endgame Training
 * Provides turn display and objective detection
 */

import { Chess } from 'chess.js';

export interface GameStatus {
  sideToMove: 'white' | 'black';
  sideToMoveDisplay: string;
  objective: 'win' | 'draw' | 'defend';
  objectiveDisplay: string;
  icon: string;
}

/**
 * Get current game status from FEN
 */
export function getGameStatus(fen: string, goalFromData?: 'win' | 'draw' | 'defend'): GameStatus {
  const chess = new Chess();
  
  try {
    chess.load(fen);
  } catch (error) {
    // Fallback for invalid FEN
    return {
      sideToMove: 'white',
      sideToMoveDisplay: 'Weiß am Zug',
      objective: 'win',
      objectiveDisplay: 'Ziel: Gewinn',
      icon: '🟢'
    };
  }

  const turn = chess.turn();
  const sideToMove = turn === 'w' ? 'white' : 'black';
  
  // Display based on turn
  const sideToMoveDisplay = turn === 'w' 
    ? 'Weiß am Zug' 
    : 'Schwarz am Zug';
    
  const icon = turn === 'w' ? '🟢' : '⚫';

  // Objective detection
  const objective = goalFromData || detectObjective(fen);
  const objectiveDisplay = getObjectiveDisplay(objective);

  return {
    sideToMove,
    sideToMoveDisplay,
    objective,
    objectiveDisplay,
    icon
  };
}

/**
 * Auto-detect objective from position characteristics
 */
function detectObjective(fen: string): 'win' | 'draw' | 'defend' {
  const chess = new Chess();
  chess.load(fen);
  
  // Count material
  const board = chess.board();
  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whiteHasPawns = false;
  let blackHasPawns = false;
  
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  
  for (const row of board) {
    for (const square of row) {
      if (square) {
        const value = pieceValues[square.type];
        if (square.color === 'w') {
          whiteMaterial += value;
          if (square.type === 'p') whiteHasPawns = true;
        } else {
          blackMaterial += value;
          if (square.type === 'p') blackHasPawns = true;
        }
      }
    }
  }
  
  // Heuristic rules for objective detection
  const materialDiff = whiteMaterial - blackMaterial;
  
  // Strong material advantage usually means winning
  if (Math.abs(materialDiff) >= 3) {
    return 'win';
  }
  
  // Pawn endgames with extra pawn often winning
  if (whiteHasPawns && blackHasPawns && Math.abs(materialDiff) >= 1) {
    return 'win';
  }
  
  // King + Pawn vs King is usually winning
  if ((whiteMaterial === 1 && blackMaterial === 0) || 
      (whiteMaterial === 0 && blackMaterial === 1)) {
    return 'win';
  }
  
  // Equal material often draw
  if (materialDiff === 0) {
    return 'draw';
  }
  
  // Default to win for learning purposes
  return 'win';
}

/**
 * Get display text for objective
 */
function getObjectiveDisplay(objective: 'win' | 'draw' | 'defend'): string {
  switch (objective) {
    case 'win':
      return 'Ziel: Gewinn';
    case 'draw':
      return 'Ziel: Remis';
    case 'defend':
      return 'Ziel: Verteidigen';
    default:
      return 'Ziel: Gewinn';
  }
}

/**
 * Get short status for compact display
 */
export function getShortGameStatus(fen: string, goalFromData?: 'win' | 'draw' | 'defend'): string {
  const status = getGameStatus(fen, goalFromData);
  const turn = status.sideToMove === 'white' ? 'Weiß' : 'Schwarz';
  const objective = status.objective === 'win' ? 'Gewinn' : 
                   status.objective === 'draw' ? 'Remis' : 'Verteidigen';
  
  return `${turn} • ${objective}`;
}