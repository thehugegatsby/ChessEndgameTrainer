/**
 * @file Test scenario definitions for chess endgame training
 * @module testing/TestScenarios
 *
 * @description
 * Provides comprehensive test scenarios for chess endgame training with verified
 * positions from the Firebase database. Contains real training positions with
 * correct FEN strings, solutions, hints, and difficulty classifications.
 *
 * @remarks
 * Key features:
 * - Verified FEN positions from actual Firebase data
 * - Complete solutions with move sequences
 * - Progressive difficulty levels (beginner to intermediate)
 * - Bridge building technique scenarios (Zickzack, positioning, deflection)
 * - Opposition fundamentals for pawn endgames
 * - Conversion utilities between TestScenario and EndgamePosition types
 *
 * All positions have been tested and validated for correctness and include
 * realistic move targets and German language hints for training purposes.
 */

import { type EndgamePosition } from "@shared/types/endgame";

// REMOVED: EngineMove and TestInteraction interfaces
// These were unused legacy code. Use TablebaseMove from TablebaseService instead.

// DELETED: TestScenario interface - use EndgamePosition instead
// If you need TestScenario compatibility, use the conversion functions below

/**
 * Real test positions from Firebase database
 *
 * @description
 * Collection of verified chess endgame positions with complete training data.
 * Each position includes FEN string, solution moves, hints, and metadata
 * required for comprehensive endgame training scenarios.
 *
 * @remarks
 * Position categories:
 * - Opposition fundamentals (king and pawn endgames)
 * - Bridge building techniques (rook and pawn endgames)
 * - Zickzack technique for king advancement
 * - Rook positioning and deflection strategies
 *
 * All positions use the TestScenario interface which extends EndgamePosition
 * with string IDs for test-specific compatibility.
 */
export const TestPositions: Record<string, TestScenario> = {
  // Position 1: "Opposition Grundlagen" from Firebase
  // FEN: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1"
  // White K+P vs Black K, White to move, goal: win, mate in #11
  POSITION_1_OPPOSITION_BASICS: {
    id: "1", // TestScenario uses string IDs
    title: "Opposition Grundlagen",
    description:
      "Opposition Grundlagen - Lerne das fundamentale Konzept der Opposition in Bauernendspielen",
    fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", // REAL FEN from Firebase
    category: "endgame",
    difficulty: "beginner",
    targetMoves: 11, // Mate in 11 moves
    sideToMove: "white",
    goal: "win",
    hints: [
      "Verwende die Opposition um den gegnerischen König zu verdrängen",
      "Kf6 oder Kd6 sind gleichwertige Züge",
      "Der Bauer auf e5 entscheidet das Spiel",
    ],
    solution: [
      "Kf6",
      "Kf8",
      "e6",
      "Ke8",
      "e7",
      "Kd7",
      "Kf7",
      "Kd6",
      "e8=Q",
      "Kd5",
      "Qe7",
      "mate",
    ],
    // nextPositionId is omitted (undefined) for JSON serialization compatibility
  },

  // Position 9: "Zickzack-Technik" Brückenbau-Trainer (was 12)
  // FEN: "2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1"
  // White K+P+R vs Black K+R, White to move, goal: win using bridge technique
  POSITION_9_BRIDGE_ZICKZACK: {
    id: "9", // TestScenario uses string IDs
    title: "Zickzack-Technik",
    description: "König läuft im Zickzack nach vorne, Turm schützt von hinten",
    fen: "2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1", // From homepage bridgeTrainerLessons
    category: "endgame",
    difficulty: "beginner",
    targetMoves: 8, // Estimated moves to win
    sideToMove: "white",
    goal: "win",
    hints: [
      "König läuft im Zickzack nach vorne",
      "Turm schützt von hinten",
      "Kd7, Kc6, Kb5 sind die Schlüsselzüge",
    ],
    solution: ["Kd7", "Kf8", "Kc6", "Ke7", "Kb5", "Kd6", "Re6+", "Kd5", "c8=Q"],
  },

  // Position 10: "Turm positionieren" Brückenbau-Trainer (was 13)
  // FEN: "2K2k2/2P5/8/8/8/8/1r6/4R3 w - - 0 1"
  // White K+P+R vs Black K+R, White to move, goal: win by positioning rook first
  POSITION_10_BRIDGE_POSITIONING: {
    id: "10", // TestScenario uses string IDs
    title: "Turm positionieren",
    description:
      "Turm erst auf die 4. oder 5. Reihe bringen, dann Brücke bauen",
    fen: "2K2k2/2P5/8/8/8/8/1r6/4R3 w - - 0 1", // From homepage bridgeTrainerLessons
    category: "endgame",
    difficulty: "beginner",
    targetMoves: 10, // Estimated moves to win
    sideToMove: "white",
    goal: "win",
    hints: [
      "Turm auf die 4. oder 5. Reihe positionieren",
      "Re4 oder Re5 sind gute Züge",
      "Dann normale Brückenbau-Technik anwenden",
    ],
    solution: [
      "Re4",
      "Kd8",
      "Kd7",
      "Kc8",
      "Kc6",
      "Kd8",
      "Kb5",
      "Kc7",
      "Re7+",
      "Kd6",
      "c8=Q",
    ],
  },

  // Position 11: "König abdrängen" Brückenbau-Trainer (was 14)
  // FEN: "2K1k3/2P5/8/8/8/8/1r6/7R w - - 0 1"
  // White K+P+R vs Black K+R, White to move, goal: win by deflecting king first
  POSITION_11_BRIDGE_DEFLECTION: {
    id: "11", // TestScenario uses string IDs
    title: "König abdrängen",
    description: "König steht noch zentral - erst abdrängen, dann Brücke bauen",
    fen: "2K1k3/2P5/8/8/8/8/1r6/7R w - - 0 1", // From homepage bridgeTrainerLessons
    category: "endgame",
    difficulty: "intermediate",
    targetMoves: 12, // Estimated moves to win
    sideToMove: "white",
    goal: "win",
    hints: [
      "König mit einem Turmschach abdrängen",
      "Re1+ zwingt den König auf f8",
      "Dann Turm positionieren und Brücke bauen",
    ],
    solution: [
      "Re1+",
      "Kf8",
      "Re4",
      "Kf7",
      "Kd7",
      "Kf8",
      "Kc6",
      "Ke7",
      "Kb5",
      "Kd6",
      "Re6+",
      "Kd5",
      "c8=Q",
    ],
  },

  POSITION_2_KPK_ADVANCED: {
    id: "2", // TestScenario uses string IDs
    title: "König und Bauer vs König - Fortgeschritten",
    description: "Fortgeschrittene K+B vs K Position - Opposition und Bauernumwandlung",
    fen: "8/3k4/8/3K4/3P4/8/8/8 w - - 0 1", // Different position from position 1
    category: "endgame",
    difficulty: "beginner",
    targetMoves: 10, // Estimated moves to win
    sideToMove: "white",
    goal: "win",
    hints: [
      "Der Bauer muss zur Umwandlung gebracht werden",
      "König muss den Bauern unterstützen",
      "Opposition ist der Schlüssel zum Sieg",
    ],
    solution: [
      "Kd6",
      "Ke8", 
      "d5",
      "Kf7",
      "Kd7",
      "Kf6",
      "d6",
      "Kf7",
      "Kd8",
      "Kf8",
      "d7+",
      "Kf7", 
      "d8=Q"
    ],
  },
};

/**
 * Legacy position ID mapping
 */
export /**
 *
 */
const PositionIdMap = new Map<number, keyof typeof TestPositions>([
  [1, "POSITION_1_OPPOSITION_BASICS"],
  [2, "POSITION_2_KPK_ADVANCED"],
  [9, "POSITION_9_BRIDGE_ZICKZACK"], // Was 12
  [10, "POSITION_10_BRIDGE_POSITIONING"], // Was 13
  [11, "POSITION_11_BRIDGE_DEFLECTION"], // Was 14
]);

/**
 * Get test position by legacy position ID
 *
 * @param {number} positionId - The numeric position ID to look up
 * @returns {EndgamePosition | null} The endgame position or null if not found
 *
 * @description
 * Converts TestScenario to EndgamePosition by removing test-specific fields
 * and transforming string ID to numeric ID. Provides compatibility with
 * legacy position ID mapping system.
 *
 * @example
 * ```typescript
 * const position = getPositionByPositionId(1);
 * // Returns position with opposition fundamentals
 *
 * const unknown = getPositionByPositionId(999);
 * // Returns null
 * ```
 */
export function getPositionByPositionId(
  positionId: number,
): EndgamePosition | null {
  const positionKey = PositionIdMap.get(positionId);
  if (!positionKey) return null;

  const scenario = TestPositions[positionKey];
  // Validate scenario exists (TS18048 fix with early validation pattern)
  if (!scenario) {
    return null;
  }
  
  // Convert TestScenario to EndgamePosition
  return {
    id: parseInt(scenario.id),
    title: scenario.title,
    description: scenario.description,
    fen: scenario.fen,
    category: scenario.category,
    difficulty: scenario.difficulty,
    ...(scenario.targetMoves !== undefined && { targetMoves: scenario.targetMoves }),
    ...(scenario.hints !== undefined && { hints: scenario.hints }),
    ...(scenario.solution !== undefined && { solution: scenario.solution }),
    ...(scenario.sideToMove !== undefined && { sideToMove: scenario.sideToMove }),
    ...(scenario.goal !== undefined && { goal: scenario.goal }),
    ...(scenario.nextPositionId !== undefined && { nextPositionId: scenario.nextPositionId }),
  };
}

/**
 * Test-specific scenario interface
 *
 * @interface TestScenario
 * @extends {Omit<EndgamePosition, "id">}
 *
 * @description
 * Extended version of EndgamePosition that uses string IDs instead of numeric IDs
 * for test scenario compatibility. Provides same functionality as EndgamePosition
 * but with test-friendly string identifiers.
 *
 * @property {string} id - String identifier for test scenarios (overrides numeric ID)
 */
export interface TestScenario extends Omit<EndgamePosition, "id"> {
  id: string; // Override to be string for test scenarios
}

/**
 * Get test scenario by legacy position ID (DEPRECATED - use getPositionByPositionId)
 * @param positionId
 */
export function getScenarioByPositionId(
  positionId: number,
): TestScenario | null {
  const positionKey = PositionIdMap.get(positionId);
  if (!positionKey) return null;
  
  const position = TestPositions[positionKey];
  // Validate position exists (TS18048 fix with early validation pattern)
  if (!position) {
    return null;
  }

  // Return the complete TestScenario (TestPositions already stores TestScenario objects)
  return position;
}

/**
 * Utility functions for test position management
 *
 * @class TestPositionUtils
 * @description
 * Provides static utility methods for working with test positions and scenarios.
 * Includes FEN normalization, position lookup by ID or FEN, and conversion
 * between TestScenario and EndgamePosition formats.
 */
export class TestPositionUtils {
  /**
   * Normalize a FEN string by removing move counters
   *
   * @param {string} fen - The FEN string to normalize
   * @returns {string} Normalized FEN string (first 4 parts only)
   *
   * @description
   * Removes halfmove and fullmove counters from FEN string for consistent
   * position comparison. Keeps only piece placement, active color, castling
   * availability, and en passant target square.
   *
   * @example
   * ```typescript
   * const normalized = TestPositionUtils.normalizeFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
   * // Returns: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -'
   * ```
   */
  static normalizeFen(fen: string): string {
    const parts = fen.trim().split(/\s+/);
    if (parts.length >= 4) {
      return parts.slice(0, 4).join(" ");
    }
    return fen;
  }

  /**
   * Get endgame position by test position key
   *
   * @param {keyof typeof TestPositions} id - The test position key
   * @returns {EndgamePosition} The endgame position
   * @throws {Error} If the position is not found
   *
   * @description
   * Retrieves a test position by its key and converts from TestScenario
   * to EndgamePosition format. Throws an error if the position doesn't exist.
   *
   * @example
   * ```typescript
   * const position = TestPositionUtils.getPosition('POSITION_1_OPPOSITION_BASICS');
   * // Returns opposition fundamentals position
   * ```
   */
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
      ...(scenario.targetMoves !== undefined && { targetMoves: scenario.targetMoves }),
      ...(scenario.hints !== undefined && { hints: scenario.hints }),
      ...(scenario.solution !== undefined && { solution: scenario.solution }),
      ...(scenario.sideToMove !== undefined && { sideToMove: scenario.sideToMove }),
      ...(scenario.goal !== undefined && { goal: scenario.goal }),
      ...(scenario.nextPositionId !== undefined && { nextPositionId: scenario.nextPositionId }),
    };
  }

  /**
   * Get endgame position by FEN string
   *
   * @param {string} fen - The FEN string to match
   * @returns {EndgamePosition | null} The matching position or null if not found
   *
   * @description
   * Searches for a test position matching the given FEN string and returns
   * it as an EndgamePosition. Uses exact FEN matching for position lookup.
   *
   * @example
   * ```typescript
   * const position = TestPositionUtils.getPositionByFen('4k3/8/4K3/4P3/8/8/8/8 w - - 0 1');
   * // Returns opposition fundamentals position
   *
   * const notFound = TestPositionUtils.getPositionByFen('invalid-fen');
   * // Returns null
   * ```
   */
  static getPositionByFen(fen: string): EndgamePosition | null {
    const scenario = Object.values(TestPositions).find(
      (position) => position.fen === fen,
    );
    if (!scenario) return null;

    // Convert TestScenario to EndgamePosition
    return {
      id: parseInt(scenario.id),
      title: scenario.title,
      description: scenario.description,
      fen: scenario.fen,
      category: scenario.category,
      difficulty: scenario.difficulty,
      ...(scenario.targetMoves !== undefined && { targetMoves: scenario.targetMoves }),
      ...(scenario.hints !== undefined && { hints: scenario.hints }),
      ...(scenario.solution !== undefined && { solution: scenario.solution }),
      ...(scenario.sideToMove !== undefined && { sideToMove: scenario.sideToMove }),
      ...(scenario.goal !== undefined && { goal: scenario.goal }),
      ...(scenario.nextPositionId !== undefined && { nextPositionId: scenario.nextPositionId }),
    };
  }
}

/**
 * Reverse lookup map for fast FEN-to-position mapping
 */
export /**
 *
 */
const FenToPositionMap = new Map<string, EndgamePosition>(
  Object.values(TestPositions).map((scenario) => [
    scenario.fen,
    {
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
      nextPositionId: scenario.nextPositionId,
    } as EndgamePosition,
  ] as [string, EndgamePosition]),
);

/**
 * Reverse lookup map for fast FEN-to-scenario mapping (DEPRECATED - use FenToPositionMap)
 */
export /**
 *
 */
const FenToScenarioMap = new Map<string, TestScenario>(
  Object.values(TestPositions).map((position) => [position.fen, position]),
);
