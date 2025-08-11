/**
 * Position Factory
 * Creates test positions with realistic data
 */

import { type EndgamePosition } from "@shared/types/endgame";

export class PositionFactory {
  private static idCounter = 1000;

  /**
   * Create a basic endgame position
   */
  static createEndgame(
    overrides: Partial<EndgamePosition> = {},
  ): EndgamePosition {
    const id = overrides.id || this.idCounter++;

    return {
      id,
      title: `Test Position ${id}`,
      fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
      solution: ["e2e4", "e8e7", "e1e2"],
      targetMoves: 3,
      description: `Test description for position ${id}`,
      hints: ["Think about advancing the pawn"],
      difficulty: "beginner",
      category: "basic-checkmates",
      sideToMove: "white",
      goal: "win",
      ...overrides,
    };
  }

  /**
   * Create a rook endgame position
   */
  static createRookEndgame(
    overrides: Partial<EndgamePosition> = {},
  ): EndgamePosition {
    return this.createEndgame({
      category: "rook-endgames",
      fen: "8/8/8/8/8/3k4/8/R3K3 w - - 0 1",
      title: "Rook vs King Endgame",
      description: "Basic rook endgame technique",
      hints: ["Cut off the king first"],
      difficulty: "intermediate",
      ...overrides,
    });
  }

  /**
   * Create a pawn endgame position
   */
  static createPawnEndgame(
    overrides: Partial<EndgamePosition> = {},
  ): EndgamePosition {
    return this.createEndgame({
      category: "pawn-endgames",
      fen: "8/p7/8/8/8/8/P7/8 w - - 0 1",
      title: "King and Pawn vs King and Pawn",
      description: "Critical pawn endgame position",
      hints: ["Opposition is key"],
      difficulty: "advanced",
      targetMoves: 5,
      ...overrides,
    });
  }

  /**
   * Create multiple positions
   */
  static createMany(
    count: number,
    overrides: Partial<EndgamePosition> = {},
  ): EndgamePosition[] {
    return Array.from({ length: count }, () => this.createEndgame(overrides));
  }

  /**
   * Create a position with specific FEN
   */
  static fromFEN(
    fen: string,
    overrides: Partial<EndgamePosition> = {},
  ): EndgamePosition {
    return this.createEndgame({
      fen,
      ...overrides,
    });
  }

  /**
   * Reset ID counter (useful for tests)
   */
  static resetIdCounter(): void {
    this.idCounter = 1000;
  }
}
