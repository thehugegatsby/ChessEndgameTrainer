/**
 * Position Factory
 * Generates test positions with faker for dynamic test data
 */

import { faker } from '@faker-js/faker';
import { EndgamePosition } from '@shared/types/endgame';

export class PositionFactory {
  private static idCounter = 1000; // Start from 1000 to avoid conflicts with fixtures

  /**
   * Create a single position with optional overrides
   */
  static create(overrides: Partial<EndgamePosition> = {}): EndgamePosition {
    const id = overrides.id || this.idCounter++;
    
    return {
      id,
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      fen: this.generateRandomFEN(),
      category: faker.helpers.arrayElement(['king-pawn', 'rook-pawn', 'queen-endgames']),
      difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced', 'master']),
      targetMoves: faker.number.int({ min: 1, max: 10 }),
      hints: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => 
        faker.lorem.sentence()
      ),
      solution: this.generateRandomMoves(faker.number.int({ min: 1, max: 5 })),
      sideToMove: faker.helpers.arrayElement(['white', 'black']),
      goal: faker.helpers.arrayElement(['win', 'draw', 'defend']),
      ...overrides
    };
  }

  /**
   * Create multiple positions
   */
  static createMany(count: number, overrides: Partial<EndgamePosition> = {}): EndgamePosition[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create positions for a specific category
   */
  static createForCategory(category: string, count: number): EndgamePosition[] {
    return this.createMany(count, { category });
  }

  /**
   * Create a progression of positions (increasing difficulty)
   */
  static createProgression(baseTitle: string, count: number): EndgamePosition[] {
    const difficulties: EndgamePosition['difficulty'][] = ['beginner', 'intermediate', 'advanced', 'master'];
    
    return Array.from({ length: count }, (_, index) => {
      const difficultyIndex = Math.floor((index / count) * difficulties.length);
      
      return this.create({
        title: `${baseTitle} - Level ${index + 1}`,
        difficulty: difficulties[Math.min(difficultyIndex, difficulties.length - 1)],
        targetMoves: index + 1
      });
    });
  }

  /**
   * Generate a random valid FEN string
   */
  private static generateRandomFEN(): string {
    // Common endgame FENs as templates
    const templates = [
      '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', // KPK
      '8/8/8/8/8/8/P7/K2k4 w - - 0 1', // KPK
      '8/2k5/8/2K5/2P5/8/8/8 w - - 0 1', // KPK
      'R7/8/8/8/8/8/8/K2k4 w - - 0 1', // KRK
      '8/8/8/8/8/8/8/K2k2Q1 w - - 0 1', // KQK
      '4k3/R7/8/8/8/8/8/4K3 w - - 0 1', // KRK
    ];
    
    return faker.helpers.arrayElement(templates);
  }

  /**
   * Generate random chess moves
   */
  private static generateRandomMoves(count: number): string[] {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const pieces = ['K', 'Q', 'R', 'B', 'N', ''];
    
    return Array.from({ length: count }, () => {
      const piece = faker.helpers.arrayElement(pieces);
      const fromFile = faker.helpers.arrayElement(files);
      const fromRank = faker.helpers.arrayElement(ranks);
      const toFile = faker.helpers.arrayElement(files);
      const toRank = faker.helpers.arrayElement(ranks);
      
      return `${piece}${fromFile}${fromRank}-${toFile}${toRank}`;
    });
  }

  /**
   * Create specific endgame scenarios
   */
  static createScenario(type: 'opposition' | 'triangulation' | 'bridge' | 'zugzwang'): EndgamePosition {
    const scenarios = {
      opposition: {
        title: 'Opposition Study',
        fen: '4k3/8/4K3/8/8/8/8/8 w - - 0 1',
        hints: ['Take the opposition', 'Control key squares'],
        solution: ['Ke6-e7']
      },
      triangulation: {
        title: 'Triangulation Technique',
        fen: '8/8/8/3k4/8/2KP4/8/8 w - - 0 1',
        hints: ['Use triangulation', 'Lose a tempo'],
        solution: ['Kc3-c2', 'Kc2-c3', 'Kc3-d2']
      },
      bridge: {
        title: 'Bridge Building',
        fen: '1K6/1P6/8/8/8/8/r7/1k6 b - - 0 1',
        hints: ['Build a bridge with your rook'],
        solution: ['Ra2-a8+', 'Kb8-c7', 'Ra8-a7']
      },
      zugzwang: {
        title: 'Zugzwang Position',
        fen: '8/8/8/3k4/3P4/3K4/8/8 b - - 0 1',
        hints: ['Any move worsens your position'],
        solution: ['Kd5-c6', 'Kd3-e4']
      }
    };

    const scenario = scenarios[type];
    
    return this.create({
      ...scenario,
      category: 'king-pawn',
      difficulty: type === 'opposition' ? 'beginner' : 'advanced',
      goal: 'win'
    });
  }

  /**
   * Reset ID counter (useful between test suites)
   */
  static resetIdCounter(): void {
    this.idCounter = 1000;
  }
}