/**
 * @fileoverview Type definitions for E2E test helpers
 * @description Shared types for GamePlayer, PuzzleSolver, and other helpers
 */

/**
 * Error that occurred during move sequence execution
 */
export interface SequenceError {
  /** The move that failed */
  move: string;
  /** Reason for failure */
  reason: string;
  /** Index in the move sequence (0-based) */
  moveIndex: number;
}

/**
 * Options for playing moves
 */
export interface PlayOptions {
  /** Starting position FEN (default: initial position) */
  startPositionFen?: string;
  /** Delay between moves in milliseconds */
  delayBetweenMoves?: number;
  /** Stop on first error (default: true) */
  stopOnError?: boolean;
  /** Use SAN notation (default: false) */
  useSAN?: boolean;
}

/**
 * Result of playing a move sequence
 */
export interface PlayResult {
  /** Whether all moves were played successfully */
  success: boolean;
  /** Final position as FEN */
  finalFen: string;
  /** Errors encountered during play */
  errors: SequenceError[];
  /** Number of moves successfully played */
  movesPlayed: number;
  /** Total duration in milliseconds */
  duration: number;
}

/**
 * Result of playing a full game
 */
export interface GameResult extends PlayResult {
  /** Game outcome */
  outcome: '1-0' | '0-1' | '1/2-1/2' | '*' | 'ongoing';
  /** Final PGN of the game */
  finalPgn: string;
  /** Whether game ended in checkmate */
  isCheckmate: boolean;
  /** Whether game ended in stalemate */
  isStalemate: boolean;
  /** Whether game is a draw */
  isDraw: boolean;
}

/**
 * Options for puzzle solving
 */
export interface PuzzleOptions {
  /** Time limit in milliseconds */
  timeLimit?: number;
  /** Whether to expect checkmate */
  expectCheckmate?: boolean;
  /** Allow alternative solutions */
  allowAlternatives?: boolean;
  /** Delay between moves */
  delayBetweenMoves?: number;
}

/**
 * Result of puzzle solving attempt
 */
export interface PuzzleResult {
  /** Whether puzzle was solved correctly */
  success: boolean;
  /** Feedback message */
  feedback: string;
  /** Moves played during attempt */
  movesPlayed: string[];
  /** Final position as FEN */
  finalPosition: string;
  /** Time elapsed in milliseconds */
  timeElapsed: number;
  /** Whether the expected goal was achieved */
  goalAchieved: boolean;
}

/**
 * Options for engine analysis
 */
export interface AnalysisOptions {
  /** Search depth */
  depth?: number;
  /** Time for analysis in milliseconds */
  time?: number;
  /** Number of principal variations */
  multiPV?: number;
}

/**
 * Result of engine analysis
 */
export interface AnalysisResult {
  /** Best move in SAN notation */
  bestMove: string;
  /** Evaluation in centipawns (100 = 1 pawn advantage for white) */
  evaluation: number;
  /** Search depth reached */
  depth: number;
  /** Top variations found */
  lines: Array<{
    move: string;
    evaluation: number;
    continuation: string[];
  }>;
  /** Whether this is a known opening book move */
  isBookMove: boolean;
  /** Whether position is checkmate */
  isMate: boolean;
  /** Mate in N moves (positive = we have mate, negative = we're getting mated) */
  mateIn?: number;
}