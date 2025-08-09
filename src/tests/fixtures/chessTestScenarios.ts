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

export const ChessTestScenarios = {
  WHITE_PLAYS_BEST_TABLEBASE_MOVE,
  WIN_POSITION_BECOMES_DRAW,
  GERMAN_PROMOTION_D_FOR_QUEEN,
  WHITE_TRIES_ILLEGAL_MOVE,
  // More test scenarios will be added here...
} as const;