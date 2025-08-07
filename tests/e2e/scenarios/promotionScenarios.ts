/**
 * @fileoverview Chess promotion scenarios for E2E testing
 * 
 * This file contains predefined test scenarios for testing chess pawn
 * promotion functionality, including automatic win detection, different
 * promotion pieces, and various outcome scenarios.
 * 
 * @example
 * ```typescript
 * import { promotionScenarios } from './promotionScenarios';
 * 
 * const runner = new SequenceRunner(page);
 * await runner.executeSequence(promotionScenarios.promotionToWin);
 * ```
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { SequenceConfig, expectation } from '../helpers/sequenceRunner';

/**
 * Test scenario: Pawn promotion leading to automatic win detection
 * 
 * This scenario plays a king and pawn endgame sequence that leads to
 * pawn promotion. The promotion should trigger automatic win detection
 * with a success toast message and training completion.
 * 
 * @constant {SequenceConfig}
 * @example
 * ```typescript
 * const runner = new SequenceRunner(page);
 * await runner.executeSequence(promotionToWin);
 * ```
 */
export const promotionToWin: SequenceConfig = {
  name: "Pawn Promotion Auto-Win",
  description: "King and pawn endgame where promotion leads to automatic win detection",
  moves: [
    "e6-d6",   // 1. Kd6
    "e8-f7",   // 1... Kf7
    "d6-d7",   // 2. Kd7  
    "f7-f8",   // 2... Kf8
    "e5-e6",   // 3. e6
    "f8-g8",   // 3... Kg8
    "e6-e7",   // 4. e7
    "g8-f7",   // 4... Kf7
    "e7-e8=Q"  // 5. e8=Q+ (promotion!)
  ],
  expectations: [
    // After promotion move, expect success toast
    expectation.successToast("Umwandlung", 8), // After move 9 (0-indexed = 8)
    
    // Training should complete successfully
    expectation.trainingSuccess(),
    
    // Completion modal should open
    expectation.modalOpen("completion")
  ],
  setup: {
    startFen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    mockTablebase: true
  }
};

/**
 * Test scenario: Pawn promotion that should NOT trigger auto-win (draw)
 * 
 * This scenario tests a promotion that results in a draw position,
 * ensuring that automatic win detection does not trigger incorrectly.
 * 
 * @constant {SequenceConfig}
 */
export const promotionToDraw: SequenceConfig = {
  name: "Pawn Promotion to Draw",
  description: "Promotion that results in draw, should NOT trigger auto-completion",
  moves: [
    "e6-d6",   // 1. Kd6
    "e8-f7",   // 1... Kf7
    "d6-c7",   // 2. Kc7 (different line leading to draw)
    "f7-g7",   // 2... Kg7
    "e5-e6",   // 3. e6
    "g7-f6",   // 3... Kf6
    "e6-e7",   // 4. e7
    "f6-f7",   // 4... Kf7
    "e7-e8=Q"  // 5. e8=Q (promotion but draw)
  ],
  expectations: [
    // Should NOT have success toast after promotion
    // (We'll need to implement negative expectations)
    
    // Training should NOT complete automatically
    expectation.storeState("training.isSuccess", false),
    
    // No completion modal
    expectation.modalClosed()
  ],
  setup: {
    startFen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    mockTablebase: false // Mock will return draw
  }
};

/**
 * Test scenario: Promotion specifically to Queen piece
 * 
 * Tests that promotion to Queen shows the correct German message ("Dame")
 * and triggers appropriate success feedback.
 * 
 * @constant {SequenceConfig}
 */
export const promotionToQueen: SequenceConfig = {
  name: "Promotion to Queen",
  description: "Test promotion specifically to Queen piece",
  moves: [
    // Setup moves to reach promotion
    "e6-d6", "e8-f7", "d6-d7", "f7-f8", 
    "e5-e6", "f8-g8", "e6-e7", "g8-f7",
    "e7-e8=Q"  // Promote to Queen
  ],
  expectations: [
    expectation.successToast("Dame", 8), // Should mention "Dame" (Queen in German)
    expectation.trainingSuccess()
  ],
  setup: {
    startFen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    mockTablebase: true
  }
};

/**
 * Test scenario: Promotion specifically to Rook piece
 * 
 * Tests that promotion to Rook shows the correct German message ("Turm")
 * and triggers appropriate success feedback.
 * 
 * @constant {SequenceConfig}
 */
export const promotionToRook: SequenceConfig = {
  name: "Promotion to Rook", 
  description: "Test promotion to Rook piece",
  moves: [
    "e6-d6", "e8-f7", "d6-d7", "f7-f8",
    "e5-e6", "f8-g8", "e6-e7", "g8-f7", 
    "e7-e8=R"  // Promote to Rook
  ],
  expectations: [
    expectation.successToast("Turm", 8), // Should mention "Turm" (Rook in German)
    expectation.trainingSuccess()
  ],
  setup: {
    startFen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    mockTablebase: true
  }
};

/**
 * Collection of all promotion test scenarios
 * 
 * @constant {Object.<string, SequenceConfig>}
 * @example
 * ```typescript
 * // Run all promotion tests
 * for (const [name, scenario] of Object.entries(promotionScenarios)) {
 *   await runner.executeSequence(scenario);
 * }
 * 
 * // Or run a specific test
 * await runner.executeSequence(promotionScenarios.promotionToWin);
 * ```
 */
export const promotionScenarios = {
  /** Promotion scenario that should trigger automatic win */
  promotionToWin,
  
  /** Promotion scenario that should NOT trigger automatic win (draw) */
  promotionToDraw,
  
  /** Promotion to Queen with German message verification */
  promotionToQueen,
  
  /** Promotion to Rook with German message verification */
  promotionToRook
};