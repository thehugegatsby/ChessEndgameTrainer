export * from './result';

/**
 * Core domain types for the Chess Endgame Trainer
 */

// Chess position from Firebase
export interface Position {
  id: string;
  fen: string;
  category: string;           // "KPK", "KQK", etc.
  difficulty: number;         // 1-10
  sideToMove: 'w' | 'b';     // denormalized for queries
  pieceCount: number;        // for tablebase scope check
  tags: string[];            // ["mate-in-3", "basic"]
  source: 'curated' | 'lichess' | 'custom';
  createdAt: Date;
}

// Tablebase API response
export interface TablebaseResult {
  bestMove: string;  // UCI format: "e2e4"
  wdl: number;       // Win/Draw/Loss: 2/0/-2
  dtz?: number;      // Distance to Zero
}

// Chess game snapshot for UI updates
export interface ChessSnapshot {
  fen: string;
  turn: 'w' | 'b';
  legalMoves: string[];  // UCI format
  gameState: 'playing' | 'checkmate' | 'stalemate' | 'draw';
  history: string[];     // UCI moves
  inCheck: boolean;
  lastMove?: { from: string; to: string; promotion?: string };
}

// Training session state
export type TrainingState = 
  | 'idle'
  | 'loading'
  | 'waitingForPlayer'
  | 'validatingMove'
  | 'showingFeedback'
  | 'opponentThinking'
  | 'sessionComplete';

// Training session snapshot for UI
export interface TrainingSnapshot {
  state: TrainingState;
  currentPosition?: Position;
  feedback?: {
    type: 'success' | 'error' | 'hint';
    message: string;
  };
  opponentThinking: boolean;
  moveCount: number;
  correctMoves: number;
}

// Move representation (UCI format internally)
export interface ChessMove {
  from: string;      // e.g., "e2"
  to: string;        // e.g., "e4"
  promotion?: string; // e.g., "q" for queen
  san?: string;      // Standard Algebraic Notation for display
}

// Evaluation from tablebase
export interface MoveEvaluation {
  move: string;      // UCI format
  wdl: number;       // Win/Draw/Loss score
  dtz?: number;      // Distance to zero (moves to tablebase win/loss)
  quality: 'best' | 'good' | 'mistake' | 'blunder';
}