/**
 * @fileoverview Legacy Test Positions - Clean Data Without Type Pollution  
 * @description Minimal test positions using clean EndgamePosition type
 * @version 3.0.0 - Type Pollution Elimination
 * 
 * REPLACES:
 * - TestScenario interface (with test-specific pollution)
 * - Complex FenToScenarioMap registry
 * - Registry-based lookup overhead
 * 
 * NOW USES:
 * - Clean EndgamePosition type only
 * - Simple array-based storage
 * - Direct lookup without maps
 */

import type { EndgamePosition } from '@shared/types/endgame';

/**
 * Clean test positions using production EndgamePosition type
 * No test-specific fields, no type pollution
 */
export const LEGACY_TEST_POSITIONS: EndgamePosition[] = [
  // Position 1: "Opposition Grundlagen" from Firebase
  {
    id: 1,
    title: 'Opposition Grundlagen',
    description: 'Opposition Grundlagen - Lerne das fundamentale Konzept der Opposition in Bauernendspielen',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    category: 'endgame',
    difficulty: 'beginner',
    targetMoves: 11,
    sideToMove: 'white',
    goal: 'win',
    hints: [
      'Verwende die Opposition um den gegnerischen König zu verdrängen',
      'Kf6 oder Kd6 sind gleichwertige Züge',
      'Der Bauer auf e5 entscheidet das Spiel'
    ],
    solution: [
      'Kf6', 'Kf8', 'e6', 'Ke8', 'e7', 'Kd7', 'Kf7', 'Kd6', 'e8=Q', 'Kd5', 'Qe7'
    ],
    nextPositionId: undefined
  }
];

/**
 * Simple lookup functions without complex registry overhead
 */
export function findPositionById(id: number): EndgamePosition | null {
  return LEGACY_TEST_POSITIONS.find(pos => pos.id === id) || null;
}

export function findPositionByFen(fen: string): EndgamePosition | null {
  // Normalize FEN for comparison (ignore move counters)
  const normalizedFen = normalizeFen(fen);
  return LEGACY_TEST_POSITIONS.find(pos => normalizeFen(pos.fen) === normalizedFen) || null;
}

export function getAllPositions(): EndgamePosition[] {
  return [...LEGACY_TEST_POSITIONS];
}

/**
 * Simple FEN normalization without complex utilities
 */
function normalizeFen(fen: string): string {
  const parts = fen.trim().split(/\s+/);
  if (parts.length >= 4) {
    return parts.slice(0, 4).join(' '); // position + side + castling + en passant
  }
  return fen;
}

/**
 * Legacy compatibility exports
 * These maintain compatibility with existing test code during migration
 */
export const TestPositions = {
  POSITION_1_OPPOSITION_BASICS: LEGACY_TEST_POSITIONS[0]
};

export const FenToPositionMap = new Map<string, EndgamePosition>(
  LEGACY_TEST_POSITIONS.map(pos => [pos.fen, pos])
);