/**
 * Test Scenario Definitions
 * Predefined data sets for different testing scenarios
 */

import { EndgamePosition, EndgameCategory, EndgameChapter } from '@shared/types/endgame';

export interface TestScenarioDefinition {
  name: string;
  description: string;
  positions: EndgamePosition[];
  categories: EndgameCategory[];
  chapters: EndgameChapter[];
  userCount: number;
}

export const SCENARIO_DEFINITIONS: Record<string, TestScenarioDefinition> = {
  empty: {
    name: 'Empty Database',
    description: 'Clean state with no data',
    positions: [],
    categories: [],
    chapters: [],
    userCount: 0
  },

  basic: {
    name: 'Basic Training Data',
    description: 'Essential positions for basic functionality testing',
    positions: [
      {
        id: 1,
        title: 'Opposition Basics',
        description: 'Learn the fundamental concept of opposition',
        fen: '4k3/8/4K3/8/8/8/8/8 w - - 0 1',
        category: 'king-pawn',
        difficulty: 'beginner',
        targetMoves: 1,
        hints: ['Opposition is key'],
        solution: ['Ke6-e7'],
        sideToMove: 'white',
        goal: 'win'
      },
      {
        id: 2,
        title: 'Advanced Opposition',
        description: 'Master more complex opposition patterns',
        fen: '8/8/4k3/8/8/4K3/8/8 w - - 0 1',
        category: 'king-pawn',
        difficulty: 'intermediate',
        targetMoves: 3,
        hints: ['Use opposition to control key squares'],
        solution: ['Ke3-e4', 'Ke4-e5', 'Ke5-d6'],
        sideToMove: 'white',
        goal: 'win'
      }
    ],
    categories: [
      {
        id: 'king-pawn',
        name: 'King and Pawn',
        description: 'Fundamental king and pawn endgames',
        icon: '♔',
        positions: [],
        subcategories: []
      }
    ],
    chapters: [
      {
        id: 'opposition-basics',
        name: 'Opposition Fundamentals',
        description: 'Learn the basics of opposition',
        category: 'king-pawn',
        lessons: [],
        totalLessons: 5
      }
    ],
    userCount: 2
  },

  advanced: {
    name: 'Advanced Training Data',
    description: 'Complex positions for comprehensive testing',
    positions: [
      {
        id: 12,
        title: 'Brückenbau',
        description: 'Build a bridge for your rook',
        fen: '1K6/1P6/8/8/8/8/r7/1k6 b - - 0 1',
        category: 'rook-pawn',
        difficulty: 'advanced',
        targetMoves: 5,
        hints: ['Create a bridge with your rook'],
        solution: ['Ra2-a8+', 'Kb8-c7', 'Ra8-a7', 'Kb1-b2', 'Ra7-b7'],
        sideToMove: 'black',
        goal: 'draw'
      },
      {
        id: 13,
        title: 'Queen vs Pawn',
        description: 'Queen endgame technique',
        fen: '8/8/8/8/8/8/k1K5/q7 w - - 0 1',
        category: 'queen-pawn',
        difficulty: 'advanced',
        targetMoves: 10,
        hints: ['Check distance is key'],
        solution: [],
        sideToMove: 'white',
        goal: 'draw'
      }
    ],
    categories: [
      {
        id: 'rook-pawn',
        name: 'Rook and Pawn',
        description: 'Rook endgames with pawns',
        icon: '♜',
        positions: [],
        subcategories: []
      },
      {
        id: 'queen-pawn',
        name: 'Queen and Pawn',
        description: 'Queen endgames with pawns',
        icon: '♕',
        positions: [],
        subcategories: []
      }
    ],
    chapters: [
      {
        id: 'bridge-building',
        name: 'Bridge Building Technique',
        description: 'Master the bridge building technique',
        category: 'rook-pawn',
        lessons: [],
        totalLessons: 3
      }
    ],
    userCount: 5
  },

  'edge-cases': {
    name: 'Edge Case Testing',
    description: 'Unusual positions and error conditions for robustness testing',
    positions: [
      {
        id: 999,
        title: 'Invalid Position Test',
        description: 'Test position with unusual characteristics',
        fen: '8/8/8/8/8/8/8/K6k w - - 50 100', // 50-move rule
        category: 'test-only',
        difficulty: 'advanced',
        targetMoves: 0,
        hints: ['This is a test position'],
        solution: [],
        sideToMove: 'white',
        goal: 'draw'
      }
    ],
    categories: [
      {
        id: 'test-only',
        name: 'Test Category',
        description: 'Category for testing purposes only',
        icon: '🧪',
        positions: [],
        subcategories: []
      }
    ],
    chapters: [],
    userCount: 1
  }
};

export type ScenarioName = keyof typeof SCENARIO_DEFINITIONS;