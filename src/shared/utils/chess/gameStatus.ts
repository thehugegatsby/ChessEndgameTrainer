/**
 * @file Game status utilities for chess endgame training
 * @module utils/chess/gameStatus
 *
 * @description
 * Utilities for determining game state information including whose turn it is,
 * training objectives (win/draw/defend), and automatic objective detection
 * based on material balance. Provides localized (German) display strings
 * for UI integration.
 *
 * @remarks
 * Key features:
 * - Turn detection from FEN with German localization
 * - Automatic objective inference from material balance
 * - Support for manual objective override
 * - Visual indicators (emojis) for turn display
 * - Heuristic-based position evaluation
 *
 * The objective detection uses simple but effective heuristics based on
 * material counting and common endgame patterns.
 */

import { Chess } from 'chess.js';

/**
 * Complete game status information
 *
 * @interface GameStatus
 * @description
 * Comprehensive status object containing turn information and training
 * objectives for the current position.
 *
 * @property {'white' | 'black'} sideToMove - Which side has the move
 * @property {string} sideToMoveDisplay - Localized turn display (German)
 * @property {'win' | 'draw' | 'defend'} objective - Training goal for the position
 * @property {string} objectiveDisplay - Localized objective text (German)
 * @property {string} icon - Visual indicator emoji for the side to move
 */
export interface GameStatus {
  sideToMove: 'white' | 'black';
  sideToMoveDisplay: string;
  objective: 'win' | 'draw' | 'defend';
  objectiveDisplay: string;
  icon: string;
}

/**
 * Get current game status from FEN
 *
 * @function getGameStatus
 * @param {string} fen - FEN string representing the current position
 * @param {'win' | 'draw' | 'defend'} [goalFromData] - Optional manual objective override
 * @returns {GameStatus} Complete status information for the position
 *
 * @description
 * Analyzes a chess position to determine turn information and training
 * objectives. Supports both automatic objective detection through material
 * analysis and manual override for specific training scenarios.
 *
 * @example
 * ```typescript
 * // Automatic objective detection
 * const status = getGameStatus('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
 * // { sideToMove: 'white', sideToMoveDisplay: 'Weiß am Zug', ... }
 *
 * // Manual objective override
 * const status = getGameStatus('8/8/8/8/8/8/8/K6k w - - 0 1', 'draw');
 * // { ..., objective: 'draw', objectiveDisplay: 'Ziel: Remis' }
 * ```
 *
 * @remarks
 * Falls back to safe defaults if FEN is invalid. The automatic objective
 * detection uses detectObjective() which applies heuristics based on
 * material balance and endgame patterns.
 */
export function getGameStatus(fen: string, goalFromData?: 'win' | 'draw' | 'defend'): GameStatus {
  const chess = new Chess();

  try {
    chess.load(fen);
  } catch {
    // Fallback for invalid FEN - error details not needed
    return {
      sideToMove: 'white',
      sideToMoveDisplay: 'Weiß am Zug',
      objective: 'win',
      objectiveDisplay: 'Ziel: Gewinn',
      icon: '🟢',
    };
  }

  const turn = chess.turn();
  const sideToMove = turn === 'w' ? 'white' : 'black';

  // Display based on turn
  const sideToMoveDisplay = turn === 'w' ? 'Weiß am Zug' : 'Schwarz am Zug';

  const icon = turn === 'w' ? '🟢' : '⚫';

  // Objective detection
  const objective = goalFromData || detectObjective(fen);
  const objectiveDisplay = getObjectiveDisplay(objective);

  return {
    sideToMove,
    sideToMoveDisplay,
    objective,
    objectiveDisplay,
    icon,
  };
}

/**
 * Auto-detect objective from position characteristics
 *
 * @function detectObjective
 * @private
 * @param {string} fen - FEN string to analyze
 * @returns {'win' | 'draw' | 'defend'} Detected objective
 *
 * @description
 * Uses heuristic rules to infer the most likely training objective
 * based on material balance and endgame characteristics. The algorithm
 * prioritizes common endgame patterns and material imbalances.
 *
 * @remarks
 * Heuristic rules applied:
 * 1. Material advantage ≥3 points → 'win'
 * 2. Pawn endgame with extra pawn → 'win'
 * 3. K+P vs K → 'win'
 * 4. Equal material → 'draw'
 * 5. Default → 'win' (for learning purposes)
 *
 * Material values: Pawn=1, Knight/Bishop=3, Rook=5, Queen=9
 *
 * @example
 * ```typescript
 * // K+P vs K - typically winning
 * detectObjective('8/8/8/8/8/8/P7/K6k w - - 0 1'); // 'win'
 *
 * // Equal material - typically drawing
 * detectObjective('8/8/8/8/8/8/p7/K6k w - - 0 1'); // 'draw'
 * ```
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

  /**
   * Standard piece values for material calculation
   * @private
   */
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
  if (
    (whiteMaterial === 1 && blackMaterial === 0) ||
    (whiteMaterial === 0 && blackMaterial === 1)
  ) {
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
 *
 * @function getObjectiveDisplay
 * @private
 * @param {'win' | 'draw' | 'defend'} objective - Training objective
 * @returns {string} Localized objective text in German
 *
 * @description
 * Converts internal objective codes to user-friendly German text
 * for display in the training interface.
 *
 * @example
 * ```typescript
 * getObjectiveDisplay('win');    // 'Ziel: Gewinn'
 * getObjectiveDisplay('draw');   // 'Ziel: Remis'
 * getObjectiveDisplay('defend'); // 'Ziel: Verteidigen'
 * ```
 *
 * @remarks
 * German translations:
 * - win → "Gewinn" (victory)
 * - draw → "Remis" (draw)
 * - defend → "Verteidigen" (defend)
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
