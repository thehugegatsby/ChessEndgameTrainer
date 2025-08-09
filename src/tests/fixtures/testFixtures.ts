/**
 * @file Unified Chess Test Fixture Database
 * @description Single source of truth for all chess positions, scenarios, and training data
 * 
 * Features:
 * - Explicit piece layout for safety (prevents FEN misinterpretation)
 * - WIN-TO-DRAW and DRAW-TO-WIN scenarios
 * - German notation support
 * - Rich metadata without derived values
 * - Flexible test configurations
 */

/**
 * Core fixture structure with explicit piece placement
 */
export interface TestFenAsset {
  // STORED metadata (not derived)
  id: string;
  name: string;
  description: string;
  tags: string[];
  
  // Position data with EXPLICIT piece placement for safety
  startFen: string;
  pieceLayout: PieceLayout;
  
  // Scenario data (optional)
  moveSequence?: MoveScenario;
  
  // Training data (optional) 
  training?: TrainingData;
  
  // Test configuration (optional)
  testConfig?: TestConfiguration;
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

export interface MoveScenario {
  moves: string[];
  checkpoints?: PositionCheckpoint[];
  expectedOutcome: 'win' | 'draw' | 'loss' | 'continue';
  outcomeAfterMove?: number; // Which move triggers the outcome
}

export interface PositionCheckpoint {
  afterMove: number;
  fen: string;
  wdl?: number;
  dtm?: number;
  category?: string;
  description?: string;
}

export interface TrainingData {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  endgameType: string;
  targetMoves: number;
  goal: 'win' | 'draw' | 'defend';
  hints: string[];
  solution: string[];
}

export interface TestConfiguration {
  usage: 'unit' | 'integration' | 'e2e' | 'all';
  expectations?: TestExpectation[];
  mockConfig?: MockConfiguration;
}

export interface TestExpectation {
  type: 'move-accepted' | 'toast' | 'modal' | 'store';
  afterMove: number;
  data: any;
}

export interface MockConfiguration {
  tablebaseResponses?: any;
  mockType?: 'success' | 'error' | 'timeout';
}

// =============================================================================
// TEST FIXTURES DATABASE
// =============================================================================

/**
 * Classic KPK position - Opposition fundamentals
 * White King + Pawn vs Black King
 * This is the most basic winning endgame position for training
 */
export const KPK_OPPOSITION_BASIC: TestFenAsset = {
  id: 'kpk-opposition-basic',
  name: 'KPK: Opposition Grundlagen',
  description: 'Klassische KPK-Position mit Opposition - Weiß am Zug gewinnt',
  tags: ['kpk', 'opposition', 'basic', 'winning', 'endgame'],
  
  startFen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  
  // EXPLICIT piece layout for absolute safety
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
  
  training: {
    difficulty: 'beginner',
    endgameType: 'KPK',
    targetMoves: 11, // Mate in 11
    goal: 'win',
    hints: [
      'Nutze die Opposition um den schwarzen König zu verdrängen',
      'Kf6 oder Kd6 sind gleichwertige Züge',
      'Der Bauer auf e5 entscheidet das Spiel'
    ],
    solution: [
      'Kf6',   // 1. Kf6 (gains opposition)
      'Kf8',   // 1... Kf8 (forced)
      'e6',    // 2. e6 (advance pawn)
      'Ke8',   // 2... Ke8 (forced)
      'e7',    // 3. e7 (advance pawn)
      'Kd7',   // 3... Kd7 (trying to blockade)
      'Kf7',   // 4. Kf7 (supporting pawn)
      'Kd6',   // 4... Kd6 (desperate try)
      'e8=Q',  // 5. e8=Q (promotion!)
      'Kd5',   // 5... Kd5
      'Qe7',   // 6. Qe7 (checkmate)
    ]
  },
  
  testConfig: {
    usage: 'all',
    expectations: [
      {
        type: 'store',
        afterMove: 0,
        data: { storePath: 'training.isSuccess', expectedValue: false }
      }
    ]
  }
};

/**
 * All test fixtures database
 */
export const TestFixtures = {
  KPK_OPPOSITION_BASIC,
  // More fixtures will be added here...
} as const;


