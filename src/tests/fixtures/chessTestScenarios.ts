/**
 * @file Chess Test Scenarios Database
 * @description Clean, minimal chess test scenarios focused on specific move sequences and outcomes
 * 
 * Features:
 * - Test-scenario based naming (not chess-theory based)
 * - Explicit piece layout for safety
 * - Move sequences with expected code behavior
 * - Minimal structure - only what tests need
 */

/**
 * Chess test scenario structure with move and code expectations
 */
export interface ChessTestScenario {
  /** Test scenario identifier (e.g. WHITE_MAKES_OPTIMAL_MOVE) */
  id: string;
  /** FEN position string */
  fen: string;
  /** Explicit piece layout for validation safety */
  pieceLayout: PieceLayout;
  /** The move to test in this scenario */
  testMove: TestMove;
  /** Expected code behavior for this test scenario */
  expectations: TestExpectations;
}

/**
 * Move to be tested
 */
export interface TestMove {
  /** Move in object format */
  from: string;
  to: string;
  promotion?: string;
  /** Alternative: move in string notation (e.g. "e2e4", "f7f8D") */
  notation?: string;
  /** Human readable description */
  description: string;
}

/**
 * Expected code behavior and outcomes
 */
export interface TestExpectations {
  /** Should the move be accepted by chess.js */
  moveAccepted: boolean;
  
  /** UI reactions */
  showErrorDialog?: boolean;
  showToast?: {
    type: 'success' | 'error' | 'warning' | 'info';
    message?: string;  // Expected message content (partial match)
  };
  
  /** Game state changes */
  trainingContinues?: boolean;     // Training session continues normally
  mistakeIncremented?: boolean;    // Mistake counter increases by 1
  gameCompleted?: boolean;         // Training session completes
  
  /** Position analysis changes */
  positionEvaluation?: {
    wdl?: number;                  // Expected WDL value after move
    category?: string;             // Expected category ('win', 'draw', etc.)
  };
  
  /** Move quality assessment */
  moveQuality?: 'optimal' | 'suboptimal' | 'mistake' | 'blunder';
}

export interface PieceLayout {
  white: PiecePositions;
  black: PiecePositions;
  toMove: 'white' | 'black';
  castling?: CastlingRights;
  enPassant?: string;
  halfmove?: number;
  fullmove?: number;
}

export interface PiecePositions {
  king: string;           // e.g. "e1"
  queens?: string[];      // e.g. ["d1"]
  rooks?: string[];       // e.g. ["a1", "h1"] 
  bishops?: string[];     // e.g. ["c1", "f1"]
  knights?: string[];     // e.g. ["b1", "g1"]
  pawns?: string[];       // e.g. ["a2", "b2", "c2", ...]
}

export interface CastlingRights {
  whiteKingside?: boolean;
  whiteQueenside?: boolean;
  blackKingside?: boolean;
  blackQueenside?: boolean;
}

// =============================================================================
// MOVE SEQUENCE INTERFACES
// =============================================================================

/**
 * Chess move sequence for E2E testing with multiple moves
 */
export interface ChessMoveSequence {
  /** Sequence identifier (e.g. PAWN_PROMOTION_TO_WIN) */
  id: string;
  /** Starting FEN position */
  startFen: string;
  /** Array of moves in sequence (e.g. ["e6-d6", "e8-f7", "e7-e8=Q"]) */
  moves: string[];
  /** Human readable description */
  description: string;
  /** Expected final outcome */
  expectedOutcome: 'win' | 'draw' | 'loss';
  /** Expected code behavior for the sequence */
  expectations: SequenceExpectations;
}

/**
 * Expected behavior for move sequences
 */
export interface SequenceExpectations {
  /** Final toast message expected */
  finalToast?: {
    type: 'success' | 'error' | 'warning' | 'info';
    message?: string;  // Expected message content (partial match)
  };
  
  /** Should game/training be completed */
  gameCompleted?: boolean;
  
  /** Should training session continue */
  trainingContinues?: boolean;
  
  /** Expected final position evaluation */
  finalPositionEvaluation?: {
    wdl?: number;
    category?: string;
  };
  
  /** Number of mistakes expected during sequence */
  expectedMistakes?: number;
}

// =============================================================================
// CHESS TEST SCENARIOS DATABASE
// =============================================================================

/**
 * Position where white plays best tablebase move (Kd6)
 */
export const WHITE_PLAYS_BEST_TABLEBASE_MOVE: ChessTestScenario = {
  id: 'WHITE_PLAYS_BEST_TABLEBASE_MOVE',
  fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  
  pieceLayout: {
    white: {
      king: 'e6',     // Weißer König auf e6
      pawns: ['e5']   // Weißer Bauer auf e5
    },
    black: {
      king: 'e8'      // Schwarzer König auf e8
    },
    toMove: 'white',
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false
    },
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1
  },
  
  testMove: {
    from: 'e6',
    to: 'd6',
    description: '1.Kd6 - Best tablebase move'
  },
  
  expectations: {
    moveAccepted: true,
    trainingContinues: true,
    moveQuality: 'optimal',
    // No toast for optimal moves - just continue silently
    positionEvaluation: {
      wdl: 2,  // Still winning for white
      category: 'win'
    }
  }
};

/**
 * Same position but white makes mistake leading to draw (Kd5)
 */
export const WIN_POSITION_BECOMES_DRAW: ChessTestScenario = {
  id: 'WIN_POSITION_BECOMES_DRAW',
  fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  
  pieceLayout: {
    white: {
      king: 'e6',     // Weißer König auf e6
      pawns: ['e5']   // Weißer Bauer auf e5
    },
    black: {
      king: 'e8'      // Schwarzer König auf e8
    },
    toMove: 'white',
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false
    },
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1
  },
  
  testMove: {
    from: 'e6',
    to: 'd5',
    description: '1.Kd5 - Blunder that throws away the win'
  },
  
  expectations: {
    moveAccepted: true,           // Move is legal
    showErrorDialog: true,        // But shows mistake dialog
    mistakeIncremented: true,     // Mistake counter +1
    trainingContinues: false,     // Training paused for dialog
    moveQuality: 'blunder',
    showToast: {
      type: 'error',
      message: 'This move throws away the win!'
    },
    positionEvaluation: {
      wdl: 0,                     // Win (2) becomes Draw (0)
      category: 'draw'
    }
  }
};

/**
 * Position where white pawn can promote using German notation "D"
 */
export const GERMAN_PROMOTION_D_FOR_QUEEN: ChessTestScenario = {
  id: 'GERMAN_PROMOTION_D_FOR_QUEEN',
  fen: '8/5P2/8/8/k7/8/K7/8 w - - 0 1',
  
  pieceLayout: {
    white: {
      king: 'a2',     // Weißer König auf a2
      pawns: ['f7']   // Weißer Bauer auf f7 (ready to promote)
    },
    black: {
      king: 'a4'      // Schwarzer König auf a4
    },
    toMove: 'white',
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false
    },
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1
  },
  
  testMove: {
    from: 'f7',
    to: 'f8',
    promotion: 'D',  // German notation for Dame (Queen)
    notation: 'f7f8D',
    description: '1.f8D - Pawn promotion using German notation'
  },
  
  expectations: {
    moveAccepted: true,           // German notation should be accepted
    trainingContinues: false,     // Training stops - goal achieved!
    gameCompleted: true,          // Training session completes successfully
    moveQuality: 'optimal',
    showToast: {
      type: 'success',
      message: 'Bauernumwandlung zu Dame! Training erfolgreich abgeschlossen!'
    },
    positionEvaluation: {
      wdl: 2,                     // Position should be winning after promotion
      category: 'win'
    }
  }
};

/**
 * All chess test scenarios database
 */
/**
 * Position where white tries an illegal move (Kh5 from e6)
 */
export const WHITE_TRIES_ILLEGAL_MOVE: ChessTestScenario = {
  id: 'WHITE_TRIES_ILLEGAL_MOVE',
  fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  
  pieceLayout: {
    white: {
      king: 'e6',     // Weißer König auf e6
      pawns: ['e5']   // Weißer Bauer auf e5
    },
    black: {
      king: 'e8'      // Schwarzer König auf e8
    },
    toMove: 'white',
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false
    },
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1
  },
  
  testMove: {
    from: 'e6',
    to: 'h5',        // Illegal move - King cannot jump like this
    description: 'Kh5 - Illegal king move (too far)'
  },
  
  expectations: {
    moveAccepted: false,        // chess.js should reject this
    moveQuality: undefined,     // Can't assess quality of invalid move
    trainingContinues: true,    // No training disruption for invalid moves
    showToast: {
      type: 'error',
      message: 'Invalid move'  // Error feedback to user
    }
  }
};

/**
 * Scenario for testing FEN position changes (no move, just position switch)
 */
export const FEN_CHANGE_TO_KPK_POSITION: ChessTestScenario = {
  id: 'FEN_CHANGE_TO_KPK_POSITION',
  fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  
  pieceLayout: {
    white: {
      king: 'e6',     // Weißer König auf e6
      pawns: ['e5']   // Weißer Bauer auf e5
    },
    black: {
      king: 'e8'      // Schwarzer König auf e8
    },
    toMove: 'white',
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false
    },
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1
  },
  
  testMove: {
    from: '',           // No move - just position change
    to: '',
    description: 'FEN position change to KPK endgame'
  },
  
  expectations: {
    moveAccepted: true,         // Position is valid
    trainingContinues: true,    // No disruption from position change
    // Hook should process position passively without triggering actions
    positionEvaluation: {
      wdl: 2,                  // Winning position for white
      category: 'win'
    }
  }
};

// =============================================================================
// CHESS MOVE SEQUENCES DATABASE
// =============================================================================

/**
 * Complete pawn promotion sequence leading to automatic win
 */
export const PAWN_PROMOTION_TO_WIN_SEQUENCE: ChessMoveSequence = {
  id: 'PAWN_PROMOTION_TO_WIN_SEQUENCE',
  startFen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', // TRAIN1_KPK_BASIC
  moves: [
    "e6-d6",    // 1. Kd6 (optimal)
    "e8-f7",    // 1... Kf7 (opponent response)
    "d6-d7",    // 2. Kd7 (advance king)
    "f7-f8",    // 2... Kf8 (opponent retreat) 
    "e5-e6",    // 3. e6 (advance pawn)
    "f8-e8",    // 3... Ke8 (opponent blocks)
    "e6-e7",    // 4. e7 (pawn to 7th rank)
    "e8-d7",    // 4... Kd7 (opponent moves away)
    "e7-e8=Q"   // 5. e8=Q+ (promotion to queen - auto-win!)
  ],
  description: 'Complete pawn promotion sequence from KPK basic position ending in automatic win',
  expectedOutcome: 'win',
  expectations: {
    finalToast: {
      type: 'success',
      message: 'Bauernumwandlung'  // German promotion success message
    },
    gameCompleted: true,
    trainingContinues: false,
    finalPositionEvaluation: {
      wdl: 2,  // Win for white after queen promotion
      category: 'win'
    },
    expectedMistakes: 0  // Perfect play sequence
  }
};

/**
 * Pawn promotion sequence leading to draw (suboptimal play)
 */
export const PAWN_PROMOTION_TO_DRAW_SEQUENCE: ChessMoveSequence = {
  id: 'PAWN_PROMOTION_TO_DRAW_SEQUENCE',
  startFen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1', // TRAIN1_KPK_BASIC
  moves: [
    "e6-d5",    // 1. Kd5 (blunder - throws away win)
    "e8-d7",    // 1... Kd7 (opponent improves)
    "e5-e6",    // 2. e6+ (forced)
    "d7-d8",    // 2... Kd8 (king retreats)
    "d5-d6",    // 3. Kd6 (trying to support)
    "d8-e8",    // 3... Ke8 (opposition)
    "e6-e7",    // 4. e7 (pawn advances)
    "e8-f7",    // 4... Kf7 (side step - now draw)
    "e7-e8=Q"   // 5. e8=Q (promotion but position is drawn)
  ],
  description: 'Pawn promotion sequence with early blunder leading to theoretical draw',
  expectedOutcome: 'draw',
  expectations: {
    finalToast: {
      type: 'error',
      message: 'blunder'  // Error message for throwing away win
    },
    gameCompleted: false,
    trainingContinues: false, // Training paused due to mistake
    finalPositionEvaluation: {
      wdl: 0,  // Draw after suboptimal play
      category: 'draw'
    },
    expectedMistakes: 1  // One blunder (Kd5)
  }
};

/**
 * Position where black is losing and must find best defense (DTM testing)
 */
export const BLACK_FINDS_BEST_DEFENSE_DTM: ChessTestScenario = {
  id: 'BLACK_FINDS_BEST_DEFENSE_DTM',
  fen: '2k5/8/8/4PK2/8/8/8/8 b - - 2 3',
  
  pieceLayout: {
    white: {
      king: 'f5',      // Weißer König auf f5
      pawns: ['e5']    // Weißer Bauer auf e5
    },
    black: {
      king: 'c8'       // Schwarzer König auf c8 (losing position)
    },
    toMove: 'black',
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false
    },
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1
  },
  
  testMove: {
    from: 'c8',
    to: 'd7',           // Best defense move (DTM -27, longest resistance)
    description: 'Kd7 - Best defensive move in losing position'
  },
  
  expectations: {
    moveAccepted: true,
    moveQuality: 'optimal',    // Best defense counts as optimal
    trainingContinues: true,
    positionEvaluation: {
      wdl: -2,                 // Black is losing
      category: 'loss'
    }
  }
};

/**
 * KPK endgame progression scenarios for integration testing
 */
export const KPK_ENDGAME_PROGRESSION: ChessTestScenario = {
  id: 'KPK_ENDGAME_PROGRESSION',
  fen: '5k2/2K5/8/4P3/8/8/8/8 b - - 3 2',
  
  pieceLayout: {
    white: {
      king: 'c7',      // Weißer König auf c7
      pawns: ['e5']    // Weißer Bauer auf e5
    },
    black: {
      king: 'f8'       // Schwarzer König auf f8
    },
    toMove: 'black',
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false
    },
    enPassant: undefined,
    halfmove: 3,
    fullmove: 2
  },
  
  testMove: {
    from: 'f8',
    to: 'e7',
    description: 'Ke7 - Black king move in KPK progression'
  },
  
  expectations: {
    moveAccepted: true,
    trainingContinues: true,
    positionEvaluation: {
      wdl: -2,                 // Black is losing
      category: 'loss'
    }
  }
};

export const ChessTestScenarios = {
  WHITE_PLAYS_BEST_TABLEBASE_MOVE,
  WIN_POSITION_BECOMES_DRAW,
  GERMAN_PROMOTION_D_FOR_QUEEN,
  WHITE_TRIES_ILLEGAL_MOVE,
  FEN_CHANGE_TO_KPK_POSITION,
  BLACK_FINDS_BEST_DEFENSE_DTM,
  KPK_ENDGAME_PROGRESSION,
  // More test scenarios will be added here...
} as const;

export const ChessMoveSequences = {
  PAWN_PROMOTION_TO_WIN_SEQUENCE,
  PAWN_PROMOTION_TO_DRAW_SEQUENCE,
  // More move sequences will be added here...
} as const;

// =============================================================================
// LEGACY COMPATIBILITY HELPERS
// =============================================================================

/**
 * Helper function for legacy tests that need KPK progression data
 * Provides compatibility with old getKPKProgression() function
 */
export function getKPKProgression() {
  return {
    positions: [
      {
        fen: 'K7/P7/k7/8/8/8/8/8 w - - 0 1',
        description: 'Initial winning KPK position',
        expectedDtm: 28,
        expectedWdl: 2,
      },
      {
        fen: '1K6/P7/k7/8/8/8/8/8 b - - 1 1',
        description: 'After Kb8 (still winning)',
        expectedDtm: 27,
        expectedWdl: 2,
      },
      {
        fen: KPK_ENDGAME_PROGRESSION.fen,
        description: KPK_ENDGAME_PROGRESSION.testMove.description,
        expectedDtm: 25,
        expectedWdl: 2,
      }
    ]
  };
}

/**
 * Helper function for legacy tests that need opening sequence data
 * Provides compatibility with old getOpeningSequence() function
 */
export function getOpeningSequence() {
  return {
    startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e2-e4", "e7-e5", "g1-f3"],
    description: "Classic opening sequence: 1.e4 e5 2.Nf3",
    expectedResult: 'continue' as const,
    tags: ['opening', 'ui-test', 'move-flow'],
    positions: [
      {
        after: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        move: "e4",
        description: "After 1.e4"
      },
      {
        after: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", 
        move: "e5",
        description: "After 1...e5"
      },
      {
        after: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
        move: "Nf3", 
        description: "After 2.Nf3"
      }
    ]
  };
}