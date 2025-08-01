/**
 * @fileoverview Clean Test Positions - Fresh Start
 * @description Minimal test positions with CORRECT FENs using unified EndgamePosition type
 */

import { EndgamePosition } from '@shared/types/endgame';

export interface EngineMove {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

export interface TestInteraction {
  userMove: EngineMove;
  expectedEngineResponse: EngineMove;
  expectedEvaluation?: number;
  expectedMate?: number;
}

// DELETED: TestScenario interface - use EndgamePosition instead
// If you need TestScenario compatibility, use the conversion functions below

/**
 * REAL TEST POSITIONS from Firebase Database
 * Each position verified with actual data
 * USING DEDICATED TestScenario TYPE (extends EndgamePosition)
 */
export const TestPositions: Record<string, TestScenario> = {
  // Position 1: "Opposition Grundlagen" from Firebase
  // FEN: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1"
  // White K+P vs Black K, White to move, goal: win, mate in #11
  POSITION_1_OPPOSITION_BASICS: {
    id: "1", // TestScenario uses string IDs
    title: 'Opposition Grundlagen',
    description: 'Opposition Grundlagen - Lerne das fundamentale Konzept der Opposition in Bauernendspielen',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', // REAL FEN from Firebase
    category: 'endgame',
    difficulty: 'beginner',
    targetMoves: 11, // Mate in 11 moves
    sideToMove: 'white',
    goal: 'win',
    hints: [
      'Verwende die Opposition um den gegnerischen König zu verdrängen',
      'Kf6 oder Kd6 sind gleichwertige Züge',
      'Der Bauer auf e5 entscheidet das Spiel'
    ],
    solution: [
      'Kf6', 'Kf8', 'e6', 'Ke8', 'e7', 'Kd7', 'Kf7', 'Kd6', 'e8=Q', 'Kd5', 'Qe7', 'mate'
    ],
    // nextPositionId is omitted (undefined) for JSON serialization compatibility
    // TEST-SPECIFIC FIELDS
    initialExpectedMove: { from: 'e6', to: 'f6' }, // Kf6 (gleichwertig mit Kd6)
    expectsDrawEvaluation: false // This is a win for White!
  },

  // Position 9: "Zickzack-Technik" Brückenbau-Trainer (was 12)
  // FEN: "2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1"  
  // White K+P+R vs Black K+R, White to move, goal: win using bridge technique
  POSITION_9_BRIDGE_ZICKZACK: {
    id: "9", // TestScenario uses string IDs
    title: 'Zickzack-Technik',
    description: 'König läuft im Zickzack nach vorne, Turm schützt von hinten',
    fen: '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1', // From homepage bridgeTrainerLessons
    category: 'endgame',
    difficulty: 'beginner',
    targetMoves: 8, // Estimated moves to win
    sideToMove: 'white',
    goal: 'win',
    hints: [
      'König läuft im Zickzack nach vorne',
      'Turm schützt von hinten',
      'Kd7, Kc6, Kb5 sind die Schlüsselzüge'
    ],
    solution: [
      'Kd7', 'Kf8', 'Kc6', 'Ke7', 'Kb5', 'Kd6', 'Re6+', 'Kd5', 'c8=Q'
    ],
    // TEST-SPECIFIC FIELDS
    initialExpectedMove: { from: 'c8', to: 'd7' }, // Kd7 (Zickzack beginnen)
    expectsDrawEvaluation: false // This is a win for White!
  },

  // Position 10: "Turm positionieren" Brückenbau-Trainer (was 13)
  // FEN: "2K2k2/2P5/8/8/8/8/1r6/4R3 w - - 0 1"
  // White K+P+R vs Black K+R, White to move, goal: win by positioning rook first
  POSITION_10_BRIDGE_POSITIONING: {
    id: "10", // TestScenario uses string IDs
    title: 'Turm positionieren',
    description: 'Turm erst auf die 4. oder 5. Reihe bringen, dann Brücke bauen',
    fen: '2K2k2/2P5/8/8/8/8/1r6/4R3 w - - 0 1', // From homepage bridgeTrainerLessons
    category: 'endgame',
    difficulty: 'beginner',
    targetMoves: 10, // Estimated moves to win
    sideToMove: 'white',
    goal: 'win',
    hints: [
      'Turm auf die 4. oder 5. Reihe positionieren',
      'Re4 oder Re5 sind gute Züge',
      'Dann normale Brückenbau-Technik anwenden'
    ],
    solution: [
      'Re4', 'Kd8', 'Kd7', 'Kc8', 'Kc6', 'Kd8', 'Kb5', 'Kc7', 'Re7+', 'Kd6', 'c8=Q'
    ],
    // TEST-SPECIFIC FIELDS
    initialExpectedMove: { from: 'e1', to: 'e4' }, // Re4 (Turm positionieren)
    expectsDrawEvaluation: false // This is a win for White!
  },

  // Position 11: "König abdrängen" Brückenbau-Trainer (was 14)
  // FEN: "2K1k3/2P5/8/8/8/8/1r6/7R w - - 0 1"
  // White K+P+R vs Black K+R, White to move, goal: win by deflecting king first
  POSITION_11_BRIDGE_DEFLECTION: {
    id: "11", // TestScenario uses string IDs
    title: 'König abdrängen',
    description: 'König steht noch zentral - erst abdrängen, dann Brücke bauen',
    fen: '2K1k3/2P5/8/8/8/8/1r6/7R w - - 0 1', // From homepage bridgeTrainerLessons
    category: 'endgame',
    difficulty: 'intermediate',
    targetMoves: 12, // Estimated moves to win
    sideToMove: 'white',
    goal: 'win',
    hints: [
      'König mit einem Turmschach abdrängen',
      'Re1+ zwingt den König auf f8',
      'Dann Turm positionieren und Brücke bauen'
    ],
    solution: [
      'Re1+', 'Kf8', 'Re4', 'Kf7', 'Kd7', 'Kf8', 'Kc6', 'Ke7', 'Kb5', 'Kd6', 'Re6+', 'Kd5', 'c8=Q'
    ],
    // TEST-SPECIFIC FIELDS
    initialExpectedMove: { from: 'h1', to: 'e1' }, // Re1+ (König abdrängen)
    expectsDrawEvaluation: false // This is a win for White!
  }
};

/**
 * Legacy position ID mapping
 */
export const PositionIdMap = new Map<number, keyof typeof TestPositions>([
  [1, 'POSITION_1_OPPOSITION_BASICS'],
  [9, 'POSITION_9_BRIDGE_ZICKZACK'],    // Was 12
  [10, 'POSITION_10_BRIDGE_POSITIONING'], // Was 13
  [11, 'POSITION_11_BRIDGE_DEFLECTION']   // Was 14
]);

/**
 * Get test position by legacy position ID
 * Converts TestScenario to EndgamePosition (removing test-specific fields)
 */
export function getPositionByPositionId(positionId: number): EndgamePosition | null {
  const positionKey = PositionIdMap.get(positionId);
  if (!positionKey) return null;
  
  const scenario = TestPositions[positionKey];
  // Convert TestScenario to EndgamePosition
  return {
    id: parseInt(scenario.id),
    title: scenario.title,
    description: scenario.description,
    fen: scenario.fen,
    category: scenario.category,
    difficulty: scenario.difficulty,
    targetMoves: scenario.targetMoves,
    hints: scenario.hints,
    solution: scenario.solution,
    sideToMove: scenario.sideToMove,
    goal: scenario.goal,
    nextPositionId: scenario.nextPositionId
  };
}

/**
 * Test-specific scenario interface
 * Extends EndgamePosition with test-only fields to avoid production type pollution
 */
export interface TestScenario extends Omit<EndgamePosition, 'id'> {
  id: string; // Override to be string for test scenarios
  initialExpectedMove: EngineMove;
  expectsDrawEvaluation: boolean;
}

/**
 * Get test scenario by legacy position ID (DEPRECATED - use getPositionByPositionId)
 */
export function getScenarioByPositionId(positionId: number): TestScenario | null {
  const positionKey = PositionIdMap.get(positionId);
  if (!positionKey) return null;
  const position = TestPositions[positionKey];
  
  // Return the complete TestScenario (TestPositions already stores TestScenario objects)
  return position;
}

/**
 * Utility functions
 */
export class TestPositionUtils {
  static normalizeFen(fen: string): string {
    const parts = fen.trim().split(/\s+/);
    if (parts.length >= 4) {
      return parts.slice(0, 4).join(' ');
    }
    return fen;
  }
  
  static getPosition(id: keyof typeof TestPositions): EndgamePosition {
    const scenario = TestPositions[id];
    if (!scenario) {
      throw new Error(`Test position not found: ${id}`);
    }
    
    // Convert TestScenario to EndgamePosition
    return {
      id: parseInt(scenario.id),
      title: scenario.title,
      description: scenario.description,
      fen: scenario.fen,
      category: scenario.category,
      difficulty: scenario.difficulty,
      targetMoves: scenario.targetMoves,
      hints: scenario.hints,
      solution: scenario.solution,
      sideToMove: scenario.sideToMove,
      goal: scenario.goal,
      nextPositionId: scenario.nextPositionId
    };
  }
  
  static getPositionByFen(fen: string): EndgamePosition | null {
    const scenario = Object.values(TestPositions).find(position => position.fen === fen);
    if (!scenario) return null;
    
    // Convert TestScenario to EndgamePosition
    return {
      id: parseInt(scenario.id),
      title: scenario.title,
      description: scenario.description,
      fen: scenario.fen,
      category: scenario.category,
      difficulty: scenario.difficulty,
      targetMoves: scenario.targetMoves,
      hints: scenario.hints,
      solution: scenario.solution,
      sideToMove: scenario.sideToMove,
      goal: scenario.goal,
      nextPositionId: scenario.nextPositionId
    };
  }

  // DEPRECATED METHODS - use getPosition/getPositionByFen instead
  static getScenario(id: keyof typeof TestPositions): TestScenario {
    const position = TestPositions[id];
    if (!position) {
      throw new Error(`Test position not found: ${id}`);
    }
    
    // Return the complete TestScenario (TestPositions already stores TestScenario objects)
    return position;
  }
  
  static getScenarioByFen(fen: string): TestScenario | null {
    const position = Object.values(TestPositions).find(pos => pos.fen === fen);
    if (!position) return null;
    
    // Return the complete TestScenario (TestPositions already stores TestScenario objects)
    return position;
  }
}

/**
 * Reverse lookup map for fast FEN-to-position mapping
 */
export const FenToPositionMap = new Map<string, EndgamePosition>(
  Object.values(TestPositions).map(scenario => [scenario.fen, {
    id: parseInt(scenario.id),
    title: scenario.title,
    description: scenario.description,
    fen: scenario.fen,
    category: scenario.category,
    difficulty: scenario.difficulty,
    targetMoves: scenario.targetMoves,
    hints: scenario.hints,
    solution: scenario.solution,
    sideToMove: scenario.sideToMove,
    goal: scenario.goal,
    nextPositionId: scenario.nextPositionId
  }])
);

/**
 * Reverse lookup map for fast FEN-to-scenario mapping (DEPRECATED - use FenToPositionMap)
 */
export const FenToScenarioMap = new Map<string, TestScenario>(
  Object.values(TestPositions).map(position => [position.fen, position])
);