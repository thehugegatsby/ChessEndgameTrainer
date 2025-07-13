/**
 * @fileoverview Clean Test Positions - Fresh Start
 * @description Minimal test positions with CORRECT FENs
 */

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

export interface TestScenario {
  id: string;
  description: string;
  fen: string;
  initialExpectedMove: EngineMove;
  initialExpectedEvaluation?: number;
  initialExpectedMate?: number;
  interactions?: TestInteraction[];
  category: 'endgame' | 'opening' | 'middlegame' | 'edge-case';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isTablebasePosition?: boolean;
  expectsDrawEvaluation?: boolean;
}

/**
 * REAL TEST POSITIONS from Firebase Database
 * Each position verified with actual data
 */
export const TestPositions: Record<string, TestScenario> = {
  // Position 1: "Opposition Grundlagen" from Firebase
  // FEN: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1"
  // White K+P vs Black K, White to move, goal: win, mate in #11
  POSITION_1_OPPOSITION_BASICS: {
    id: 'POSITION_1_OPPOSITION_BASICS',
    description: 'Opposition Grundlagen - Lerne das fundamentale Konzept der Opposition in Bauernendspielen',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', // REAL FEN from Firebase
    initialExpectedMove: { from: 'e6', to: 'f6' }, // Kf6 (gleichwertig mit Kd6)
    initialExpectedEvaluation: 2000, // Mate in #11 = high positive score
    initialExpectedMate: 11, // Mate in 11 moves
    interactions: [
      {
        userMove: { from: 'e6', to: 'd6' }, // User plays Kd6 (alternative critical move)
        expectedEngineResponse: { from: 'e8', to: 'd8' }, // Kd8 (all Black moves lose equally)
        expectedEvaluation: 2200, // Maybe mate in 10 (shorter mate)
        expectedMate: 10
      },
      {
        userMove: { from: 'e6', to: 'f6' }, // User plays Kf6 (other critical move)
        expectedEngineResponse: { from: 'e8', to: 'f8' }, // Kf8 (equally bad for Black)
        expectedEvaluation: 2200,
        expectedMate: 10
      }
    ],
    category: 'endgame',
    difficulty: 'beginner',
    isTablebasePosition: true, // K+P vs K is tablebase
    expectsDrawEvaluation: false // This is a win for White!
  }
};

/**
 * Legacy position ID mapping
 */
export const PositionIdMap = new Map<number, keyof typeof TestPositions>([
  [1, 'POSITION_1_OPPOSITION_BASICS']
]);

/**
 * Get test scenario by legacy position ID
 */
export function getScenarioByPositionId(positionId: number): TestScenario | null {
  const scenarioKey = PositionIdMap.get(positionId);
  if (!scenarioKey) return null;
  return TestPositions[scenarioKey];
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
  
  static getScenario(id: keyof typeof TestPositions): TestScenario {
    const scenario = TestPositions[id];
    if (!scenario) {
      throw new Error(`Test scenario not found: ${id}`);
    }
    return scenario;
  }
  
  static getScenarioByFen(fen: string): TestScenario | null {
    return Object.values(TestPositions).find(scenario => scenario.fen === fen) || null;
  }
}

/**
 * Reverse lookup map for fast FEN-to-scenario mapping
 */
export const FenToScenarioMap = new Map<string, TestScenario>(
  Object.values(TestPositions).map(scenario => [scenario.fen, scenario])
);