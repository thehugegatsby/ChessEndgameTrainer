/**
 * @file ChessTestData.ts
 * @description Central test data library - Single source of truth for all chess test data
 * 
 * IMPORTANT: This is the ONLY place where chess test data should be defined!
 * All test files should import test data from here.
 * 
 * Structure:
 * - TEST_POSITIONS: Pure FEN strings for position tests
 * - TEST_SCENARIOS: Single move tests with expectations
 * - TEST_SEQUENCES: Multi-move sequences for integration tests
 * 
 * Keywords for search: FEN, chess positions, test data, scenarios, sequences,
 * KPK, KQK, checkmate, stalemate, castling, en passant, promotion
 */

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

interface TestMove {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n' | 'Q' | 'R' | 'B' | 'N' | 'D' | 'T' | 'L' | 'S';
}

interface TestScenario {
  id: string;
  fen: string;
  testMove: TestMove;
  description: string;
  expectations: {
    moveAccepted: boolean;
    moveQuality?: 'optimal' | 'suboptimal' | 'mistake' | 'blunder';
    trainingContinues?: boolean;
    mistakeIncremented?: boolean;
    gameCompleted?: boolean;
    showErrorDialog?: boolean;
    showToast?: {
      type: 'success' | 'error' | 'warning' | 'info';
      message?: string;
    };
    positionEvaluation?: {
      wdl?: number;
      category?: string;
    };
  };
}

interface TestSequence {
  id: string;
  startFen: string;
  moves: string[];
  description: string;
  expectedOutcome: 'win' | 'draw' | 'loss';
  expectations: {
    finalToast?: {
      type: 'success' | 'error' | 'warning' | 'info';
      message?: string;
    };
    gameCompleted?: boolean;
    trainingContinues?: boolean;
    finalPositionEvaluation?: {
      wdl?: number;
      category?: string;
    };
    expectedMistakes?: number;
  };
}

// =============================================================================
// TEST POSITIONS - Pure FEN Strings
// =============================================================================

export const TEST_POSITIONS = {
  // === STANDARD POSITIONS ===
  // Standard-Ausgangsstellung - Tests für Spielinitialisierung und Zugvalidierung
  STARTING_POSITION: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  // Leeres Brett - Tests für Edge-Cases und minimale Positionen
  EMPTY_BOARD: '8/8/8/8/8/8/8/8 w - - 0 1',

  // === ENDGAME POSITIONS ===
  // King + Pawn vs King - Tests für Bauernendspiel-Bewertung und optimale Zugpfade
  KPK_BASIC_WIN: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  // Alternatives KPK-Gewinnstellung - Tests verschiedener Königspositionen
  KPK_WINNING: '8/8/8/8/8/4K3/4P3/4k3 w - - 0 1',
  // KPK-Remisstellung - Tests für Draw-Erkennung im Bauernendspiel
  KPK_DRAWING: '8/8/8/8/8/4k3/4P3/7K w - - 0 1',
  // KPK Weiß am Zug - Tests für Zugreihenfolge in Endspielanalyse
  KPK_WHITE_TO_MOVE: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  // KPK Schwarz am Zug - Tests für Verteidigungsstrategien
  KPK_BLACK_TO_MOVE: '8/8/8/4k3/4P3/4K3/8/8 b - - 0 1',
  // KPK zentraler Bauer - Tests für verschiedene Bauernstellungen
  KPK_CENTRAL: '8/8/8/4k3/4P3/4K3/8/8 w - - 0 1',
  // KPK Remis-Variante - Tests für komplexere Draw-Situationen
  KPK_DRAW_POSITION: '8/8/8/8/4k3/4P3/4K3/8 w - - 0 1',

  // King + Queen vs King - Tests für Damenendspiel und Mattführung
  KQK_TABLEBASE_WIN: '8/8/8/8/3K4/8/7Q/4k3 w - - 0 1',
  // Einfache KQK-Gewinnstellung - Tests für grundlegende Mattmuster
  KQK_WIN: '8/8/8/8/8/8/1Q6/K3k3 w - - 0 1',
  // KQK mit Schwarz am Zug - Tests für Verteidigung im Damenendspiel
  KQK_BLACK_TO_MOVE: '8/8/8/8/8/8/1Q6/4k1K1 b - - 0 1',

  // King vs King - Tests für Remis durch unzureichendes Material
  KK_DRAW: '8/8/8/8/8/8/8/K3k3 w - - 0 1',
  // Könige diagonal - Tests für King vs King Endspiele
  KK_DIAGONAL: 'K7/8/k7/8/8/8/8/8 w - - 0 1',
  // Nur Könige - Tests für automatische Remis-Erkennung
  INSUFFICIENT_MATERIAL: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',

  // King + Rook vs King - Tests für Turmendspiel und 50-Züge-Regel
  KRK_TABLEBASE_DRAW: '8/8/8/8/8/7R/4K1k1/8 b - - 40 80',
  // Turmendspiel - Tests für Turm-Mattführung
  ROOK_ENDGAME: '8/8/1K6/8/8/8/2k5/4R3 w - - 0 1',

  // King + Knight vs King - Tests für theoretisches Remis
  KNK_DRAW: '8/8/8/8/8/8/1N6/K3k3 w - - 0 1',

  // Weitere Endspiele
  // Damenendspiel komplex - Tests für komplexe Damenmanöver
  QUEEN_ENDGAME: '8/8/8/8/5K2/2q5/8/4k3 w - - 0 1',
  // Ausgeglichene Stellung - Tests für neutrale Bewertungen
  EQUAL_POSITION: '8/8/3k4/6r1/8/8/1KR5/8 w - - 0 1',
  // Lucena-Stellung - Tests für klassische Endspieltheorie
  LUCENA: '1K6/1P1k4/8/8/8/8/1R6/8 w - - 0 1',
  // Komplexes Endspiel - Tests für schwierige Bewertungssituationen
  COMPLEX_ENDGAME: '8/2k5/8/2KP4/8/8/8/8 w - - 0 1',

  // === GAME STATE POSITIONS ===
  // Schachmatt durch Dame - Tests für Matt-Erkennung und Spielende-Behandlung
  CHECKMATE_POSITION: '4k3/4Q3/3K4/8/8/8/8/8 b - - 0 1',

  // Patt-Stellung - Tests für Stalemate-Erkennung und Remis-Deklaration
  STALEMATE_POSITION: 'k7/P7/K7/8/8/8/8/8 b - - 0 1',

  // Schach-Stellungen - Tests für Check-Erkennung und Zugzwang
  CHECK_POSITION: 'rnbkqbnr/pppp1ppp/8/6Q1/8/8/PPPPPPPP/RNB1KBNR b KQkq - 0 1',
  // Schwarz im Schach - Tests für UI-Schach-Anzeige und erzwungene Züge
  BLACK_IN_CHECK: 'rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',
  // König im Schach - Tests für komplexe Schach-Situationen
  KING_IN_CHECK: 'r3k2r/ppp2ppp/8/8/8/8/PPP1qPPP/R3K2R w KQkq - 0 1',

  // === SPECIAL RULES POSITIONS ===
  // Rochade verfügbar - Tests für Rochade-Erkennung und -Ausführung
  CASTLING_AVAILABLE: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
  // Keine Rochade-Rechte - Tests für Rochade-Verbot und FEN-Parsing
  CASTLING_NO_RIGHTS: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1',
  // Rochade deaktiviert - Tests für verschiedene Rochade-Szenarien
  CASTLING_DISABLED: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1',

  // En Passant verfügbar - Tests für En-Passant-Erkennung und -Ausführung
  EN_PASSANT_POSITION: 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',
  // Komplexe En-Passant-Situation - Tests für fortgeschrittene En-Passant-Szenarien
  EN_PASSANT_COMPLEX: 'rnbqkb1r/ppp2ppp/5n2/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 4',

  // Bauernumwandlung Weiß - Tests für Promotion-Dialog und Figurenwahl
  WHITE_PROMOTION: '8/4P3/8/8/8/8/8/4k1K1 w - - 0 1',
  // Alternative Promotion-Stellung - Tests für verschiedene Umwandlungsszenarien
  PAWN_PROMOTION_WHITE: '8/4P3/8/8/8/8/8/4k1K1 w - - 0 1',
  // Bauer vor Umwandlung - Tests für Promotion-Vorbereitung
  PAWN_PROMOTION_READY: '8/4P3/8/8/8/8/8/4k1K1 w - - 0 1',
  // Schwarze Bauernumwandlung - Tests für schwarze Promotion-Logik
  BLACK_PROMOTION: '4k1K1/8/8/8/8/8/4p3/8 b - - 0 1',

  // === OPENING POSITIONS ===
  // Nach 1.e4 - Tests für Eröffnungszüge und Zugvalidierung
  OPENING_AFTER_E4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  // Nach 1.e4 e5 - Tests für symmetrische Eröffnungen
  OPENING_AFTER_E4_E5: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  // Nach 1.e4 e5 2.Nf3 - Tests für Springerentwicklung
  OPENING_AFTER_E4_E5_NF3: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
  // Weißer Vorteil - Tests für positive Stellungsbewertung
  WHITE_ADVANTAGE: 'rnbqkbnr/ppppp2p/6P1/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3',
  // Schwarzer Vorteil - Tests für negative Stellungsbewertung
  BLACK_ADVANTAGE: 'rnbqkbnr/ppp2ppp/8/4p3/4p2P/7N/PPPP1PP1/RNBQKB1R b KQkq - 1 4',

  // === COMPLEX POSITIONS ===
  // Komplexes Mittelspiel - Tests für schwierige Positionsbewertungen
  COMPLEX_MIDDLE_GAME: 'r2qkb1r/pp2nppp/3p1n2/2pP4/2P1P3/2N2N2/PP1B1PPP/R2QK2R w KQkq c6 0 8',

  // === INVALID/TEST POSITIONS ===
  // Ungültige FEN - Tests für Fehlerbehandlung bei invaliden Eingaben
  INVALID_FEN: 'invalid fen string',
  // Leere FEN - Tests für Empty-String-Behandlung
  EMPTY_FEN: '',
  // Fehlerhafte FEN - Tests für Parsing-Robustheit bei malformed Input
  MALFORMED_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR X KQkq - 0 1',

  // === API TEST POSITIONS ===
  // Echte API-Testposition - Tests für Live-Tablebase-Integration
  REAL_API_KPK: '4k3/8/3K4/4P3/8/8/8/8 w - - 0 1',

  // === BRIDGE TRAINER POSITIONS (from TestScenarios.ts) ===
  // Zickzack-Technik - König läuft im Zickzack nach vorne, Turm schützt von hinten
  BRIDGE_ZICKZACK: '2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1',
  // Turm positionieren - Turm erst auf die 4. oder 5. Reihe bringen, dann Brücke bauen
  BRIDGE_POSITIONING: '2K2k2/2P5/8/8/8/8/1r6/4R3 w - - 0 1',
  // König abdrängen - König steht noch zentral, erst abdrängen dann Brücke bauen
  BRIDGE_DEFLECTION: '2K1k3/2P5/8/8/8/8/1r6/7R w - - 0 1',
  // Fortgeschrittene KPK-Stellung - Tests für Opposition und Bauernumwandlung
  KPK_ADVANCED_POSITION: '8/3k4/8/3K4/3P4/8/8/8 w - - 0 1',

  // === FIREBASE TRAINING POSITIONS (from trainPositions.ts) ===
  // Opposition Grundlagen - Original Firebase Position 1
  FIREBASE_OPPOSITION_BASIC: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
  // Fortgeschrittene KPK-Position - Original Firebase Position 2
  FIREBASE_KPK_ADVANCED: '8/3k4/8/4K3/3P4/8/8/8 w - - 0 1',

  // === COMMONLY USED TEST POSITIONS (migrated from various tests) ===
  // Nach 1.e4 - Tests für Eröffnungszüge von verschiedenen Tests
  AFTER_E4_POSITION: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  // Nach 1.e4 e5 - Tests für symmetrische Antworten
  AFTER_E4_E5_POSITION: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
  // En Passant Test - Alternative En Passant Position
  EN_PASSANT_TEST_WHITE: 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',
  // En Passant Test Black - Tests für schwarze En Passant
  EN_PASSANT_TEST_BLACK: 'rnbqkbnr/pppp1ppp/8/8/3Pp3/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 2',
  // Rochade Test - Zusätzliche Rochade-Position
  CASTLING_TEST_POSITION: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
  // Keine Rochade-Rechte - Tests für deaktivierte Rochade
  NO_CASTLING_RIGHTS: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1',
  // Hohe Zugzähler - Tests für große Zugzahlen
  HIGH_MOVE_COUNTERS: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 99 150',
  // Minimale gültige Position - König vs König
  MINIMAL_VALID_POSITION: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
  // Dame vs leeres Brett - Tests für Materialvorteil
  QUEEN_VS_EMPTY: '8/8/8/8/8/8/4K3/4k2Q w - - 0 1',
  // Türme ausgeglichen - Tests für gleiche Materialverteilung
  ROOKS_EQUAL: '8/8/8/8/8/4r3/4K3/4k2R w - - 0 1',
  // Gesundheitscheck-Position - API-Tests
  API_HEALTH_CHECK: '8/8/8/8/8/8/8/K7 w - - 0 1',
  // Leeres Brett Test - Tests für leeres Brett
  EMPTY_BOARD_TEST: '8/8/8/8/8/8/8/8 w - - 0 1',
  // Analysedienst Test - AnalysisService-Tests
  ANALYSIS_SERVICE_TEST: '8/8/8/8/k7/8/8/K5R1 w - - 0 1',
  // Bewegungsstrategie Test - MoveStrategy-Tests
  MOVE_STRATEGY_TEST: 'K7/P7/k7/8/8/8/8/8 w - - 0 1',
  // Schachmatt-Setup - Tests für Mattstellungen
  CHECKMATE_SETUP: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',
  // Zu viele Bauern - Validierungs-Tests
  TOO_MANY_PAWNS: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPPP/RNBQKBNR w KQkq - 0 1',
  // Ungültiger Halbzug - Validierungs-Tests
  INVALID_HALFMOVE: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - abc 1',
  // Ungültiger Vollzug - Validierungs-Tests
  INVALID_FULLMOVE: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0',
  // Ungültiges Brett - Validierungs-Tests
  INVALID_BOARD: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN w KQkq - 0 1',
} as const;

// =============================================================================
// TEST SCENARIOS - Single Move Tests with Expectations
// =============================================================================

export const TEST_SCENARIOS: Record<string, TestScenario> = {
  WHITE_PLAYS_BEST_TABLEBASE_MOVE: {
    id: 'WHITE_PLAYS_BEST_TABLEBASE_MOVE',
    fen: TEST_POSITIONS.KPK_BASIC_WIN,
    testMove: {
      from: 'e6',
      to: 'd6',
    },
    description: '1.Kd6 - Best tablebase move',
    expectations: {
      moveAccepted: true,
      moveQuality: 'optimal',
      trainingContinues: true,
      positionEvaluation: {
        wdl: 2,
        category: 'win',
      },
    },
  },

  WIN_POSITION_BECOMES_DRAW: {
    id: 'WIN_POSITION_BECOMES_DRAW',
    fen: TEST_POSITIONS.KPK_BASIC_WIN,
    testMove: {
      from: 'e6',
      to: 'd5',
    },
    description: '1.Kd5 - Blunder that throws away the win',
    expectations: {
      moveAccepted: true,
      moveQuality: 'blunder',
      showErrorDialog: true,
      mistakeIncremented: true,
      trainingContinues: false,
      showToast: {
        type: 'error',
        message: 'This move throws away the win!',
      },
      positionEvaluation: {
        wdl: 0,
        category: 'draw',
      },
    },
  },

  GERMAN_PROMOTION_D_FOR_QUEEN: {
    id: 'GERMAN_PROMOTION_D_FOR_QUEEN',
    fen: '8/5P2/8/8/k7/8/K7/8 w - - 0 1',
    testMove: {
      from: 'f7',
      to: 'f8',
      promotion: 'D',
    },
    description: '1.f8D - Pawn promotion using German notation',
    expectations: {
      moveAccepted: true,
      moveQuality: 'optimal',
      trainingContinues: false,
      gameCompleted: true,
      showToast: {
        type: 'success',
        message: 'Bauernumwandlung zu Dame! Training erfolgreich abgeschlossen!',
      },
      positionEvaluation: {
        wdl: 2,
        category: 'win',
      },
    },
  },

  WHITE_TRIES_ILLEGAL_MOVE: {
    id: 'WHITE_TRIES_ILLEGAL_MOVE',
    fen: TEST_POSITIONS.KPK_BASIC_WIN,
    testMove: {
      from: 'e6',
      to: 'h5',
    },
    description: 'Kh5 - Illegal king move (too far)',
    expectations: {
      moveAccepted: false,
      trainingContinues: true,
      showToast: {
        type: 'error',
        message: 'Invalid move',
      },
    },
  },

  BLACK_FINDS_BEST_DEFENSE_DTM: {
    id: 'BLACK_FINDS_BEST_DEFENSE_DTM',
    fen: '2k5/8/8/4PK2/8/8/8/8 b - - 2 3',
    testMove: {
      from: 'c8',
      to: 'd7',
    },
    description: 'Kd7 - Best defensive move in losing position',
    expectations: {
      moveAccepted: true,
      moveQuality: 'optimal',
      trainingContinues: true,
      positionEvaluation: {
        wdl: -2,
        category: 'loss',
      },
    },
  },

  KPK_ENDGAME_PROGRESSION: {
    id: 'KPK_ENDGAME_PROGRESSION',
    fen: '5k2/2K5/8/4P3/8/8/8/8 b - - 3 2',
    testMove: {
      from: 'f8',
      to: 'e7',
    },
    description: 'Ke7 - Black king move in KPK progression',
    expectations: {
      moveAccepted: true,
      trainingContinues: true,
      positionEvaluation: {
        wdl: -2,
        category: 'loss',
      },
    },
  },
};

// =============================================================================
// TEST SEQUENCES - Multi-Move Tests
// =============================================================================

export const TEST_SEQUENCES: Record<string, TestSequence> = {
  PAWN_PROMOTION_TO_WIN_SEQUENCE: {
    id: 'PAWN_PROMOTION_TO_WIN_SEQUENCE',
    startFen: TEST_POSITIONS.KPK_BASIC_WIN,
    moves: [
      'e6-d6',   // 1. Kd6 (optimal)
      'e8-f7',   // 1... Kf7 (opponent response)
      'd6-d7',   // 2. Kd7 (advance king)
      'f7-f8',   // 2... Kf8 (opponent retreat)
      'e5-e6',   // 3. e6 (advance pawn)
      'f8-e8',   // 3... Ke8 (opponent blocks)
      'e6-e7',   // 4. e7 (pawn to 7th rank)
      'e8-d7',   // 4... Kd7 (opponent moves away)
      'e7-e8=Q', // 5. e8=Q+ (promotion to queen - auto-win!)
    ],
    description: 'Complete pawn promotion sequence from KPK basic position ending in automatic win',
    expectedOutcome: 'win',
    expectations: {
      finalToast: {
        type: 'success',
        message: 'Bauernumwandlung',
      },
      gameCompleted: true,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 2,
        category: 'win',
      },
      expectedMistakes: 0,
    },
  },

  PAWN_PROMOTION_TO_DRAW_SEQUENCE: {
    id: 'PAWN_PROMOTION_TO_DRAW_SEQUENCE',
    startFen: TEST_POSITIONS.KPK_BASIC_WIN,
    moves: [
      'e6-d5',   // 1. Kd5 (blunder - throws away win)
      'e8-d7',   // 1... Kd7 (opponent improves)
      'e5-e6',   // 2. e6+ (forced)
      'd7-d8',   // 2... Kd8 (king retreats)
      'd5-d6',   // 3. Kd6 (trying to support)
      'd8-e8',   // 3... Ke8 (opposition)
      'e6-e7',   // 4. e7 (pawn advances)
      'e8-f7',   // 4... Kf7 (side step - now draw)
      'e7-e8=Q', // 5. e8=Q (promotion but position is drawn)
    ],
    description: 'Pawn promotion sequence with early blunder leading to theoretical draw',
    expectedOutcome: 'draw',
    expectations: {
      finalToast: {
        type: 'error',
        message: 'blunder',
      },
      gameCompleted: false,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 0,
        category: 'draw',
      },
      expectedMistakes: 1,
    },
  },

  // === BRIDGE TRAINER SEQUENCES (from TestScenarios.ts) ===
  BRIDGE_ZICKZACK_SEQUENCE: {
    id: 'BRIDGE_ZICKZACK_SEQUENCE',
    startFen: TEST_POSITIONS.BRIDGE_ZICKZACK,
    moves: ['Kd7', 'Kf8', 'Kc6', 'Ke7', 'Kb5', 'Kd6', 'Re6+', 'Kd5', 'c8=Q'],
    description: 'Zickzack-Technik - König läuft im Zickzack nach vorne, Turm schützt von hinten',
    expectedOutcome: 'win',
    expectations: {
      finalToast: {
        type: 'success',
        message: 'Bauernumwandlung durch Brückenbau',
      },
      gameCompleted: true,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 2,
        category: 'win',
      },
      expectedMistakes: 0,
    },
  },

  BRIDGE_POSITIONING_SEQUENCE: {
    id: 'BRIDGE_POSITIONING_SEQUENCE',
    startFen: TEST_POSITIONS.BRIDGE_POSITIONING,
    moves: ['Re4', 'Kd8', 'Kd7', 'Kc8', 'Kc6', 'Kd8', 'Kb5', 'Kc7', 'Re7+', 'Kd6', 'c8=Q'],
    description: 'Turm positionieren - Turm erst auf die 4. oder 5. Reihe bringen, dann Brücke bauen',
    expectedOutcome: 'win',
    expectations: {
      finalToast: {
        type: 'success',
        message: 'Bauernumwandlung durch Turmpositionierung',
      },
      gameCompleted: true,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 2,
        category: 'win',
      },
      expectedMistakes: 0,
    },
  },

  BRIDGE_DEFLECTION_SEQUENCE: {
    id: 'BRIDGE_DEFLECTION_SEQUENCE',
    startFen: TEST_POSITIONS.BRIDGE_DEFLECTION,
    moves: ['Re1+', 'Kf8', 'Re4', 'Kf7', 'Kd7', 'Kf8', 'Kc6', 'Ke7', 'Kb5', 'Kd6', 'Re6+', 'Kd5', 'c8=Q'],
    description: 'König abdrängen - König mit Turmschach abdrängen, dann Brücke bauen',
    expectedOutcome: 'win',
    expectations: {
      finalToast: {
        type: 'success',
        message: 'Bauernumwandlung durch Königsabdrängung',
      },
      gameCompleted: true,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 2,
        category: 'win',
      },
      expectedMistakes: 0,
    },
  },

  KPK_ADVANCED_SEQUENCE: {
    id: 'KPK_ADVANCED_SEQUENCE',
    startFen: TEST_POSITIONS.KPK_ADVANCED_POSITION,
    moves: ['Kd6', 'Ke8', 'd5', 'Kf7', 'Kd7', 'Kf6', 'd6', 'Kf7', 'Kd8', 'Kf8', 'd7+', 'Kf7', 'd8=Q'],
    description: 'Fortgeschrittene KPK-Stellung - Opposition und Bauernumwandlung',
    expectedOutcome: 'win',
    expectations: {
      finalToast: {
        type: 'success',
        message: 'Perfekte Opposition und Bauernführung',
      },
      gameCompleted: true,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 2,
        category: 'win',
      },
      expectedMistakes: 0,
    },
  },

  // === FIREBASE TRAINING SEQUENCES (from trainPositions.ts) ===
  FIREBASE_TRAIN_1_WIN: {
    id: 'FIREBASE_TRAIN_1_WIN',
    startFen: TEST_POSITIONS.FIREBASE_OPPOSITION_BASIC,
    moves: ['Kd6', 'Kf8', 'e6', 'Ke8', 'e7', 'Kd7', 'Kf7', 'Kd6', 'e8=Q+'],
    description: 'Firebase Position 1 - Optimal play mit korrekter Opposition',
    expectedOutcome: 'win',
    expectations: {
      finalToast: {
        type: 'success',
        message: 'Opposition erfolgreich angewendet',
      },
      gameCompleted: true,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 2,
        category: 'win',
      },
      expectedMistakes: 0,
    },
  },

  FIREBASE_TRAIN_1_WIN_TO_DRAW: {
    id: 'FIREBASE_TRAIN_1_WIN_TO_DRAW',
    startFen: TEST_POSITIONS.FIREBASE_OPPOSITION_BASIC,
    moves: ['Kd5'],
    description: 'Firebase Position 1 - Sofortiger Blunder mit Kd5 wirft Gewinn weg',
    expectedOutcome: 'draw',
    expectations: {
      finalToast: {
        type: 'error',
        message: 'Blunder - Gewinn weggeworfen',
      },
      gameCompleted: false,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 0,
        category: 'draw',
      },
      expectedMistakes: 1,
    },
  },

  FIREBASE_TRAIN_2_WIN: {
    id: 'FIREBASE_TRAIN_2_WIN',
    startFen: TEST_POSITIONS.FIREBASE_KPK_ADVANCED,
    moves: ['Kd5', 'Ke7', 'Kc6', 'Ke8', 'Kc7', 'Ke7', 'd5', 'Kf6', 'd6', 'Ke6', 'd7', 'Ke7', 'd8=D'],
    description: 'Firebase Position 2 - Perfekte Technik zur Bauernunterstützung',
    expectedOutcome: 'win',
    expectations: {
      finalToast: {
        type: 'success',
        message: 'Bauernunterstützung perfekt ausgeführt',
      },
      gameCompleted: true,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 2,
        category: 'win',
      },
      expectedMistakes: 0,
    },
  },

  FIREBASE_TRAIN_2_WIN_TO_DRAW: {
    id: 'FIREBASE_TRAIN_2_WIN_TO_DRAW',
    startFen: TEST_POSITIONS.FIREBASE_KPK_ADVANCED,
    moves: ['d5'],
    description: 'Firebase Position 2 - Vorzeitiger Bauernvorstoß d5 wirft Gewinn weg',
    expectedOutcome: 'draw',
    expectations: {
      finalToast: {
        type: 'error',
        message: 'Zu früher Bauernvorstoß',
      },
      gameCompleted: false,
      trainingContinues: false,
      finalPositionEvaluation: {
        wdl: 0,
        category: 'draw',
      },
      expectedMistakes: 1,
    },
  },
};

// =============================================================================
// FIREBASE TRAINING SCENARIOS (trainPositions.ts compatibility)
// =============================================================================

/**
 * Move sequence for a training scenario (compatible with trainPositions.ts)
 */
export interface MoveSequence {
  /** Sequence identifier */
  id: string;
  /** Human readable description */
  description: string;
  /** Array of moves in algebraic notation */
  moves: string[];
  /** Expected final outcome */
  expectedOutcome: 'win' | 'draw' | 'loss';
  /** Expected mistakes during sequence */
  expectedMistakes?: number;
}

/**
 * Training scenario with real Firebase position (compatible with trainPositions.ts)
 */
export interface TrainScenario {
  /** Position ID from Firebase */
  id: number;
  /** Position title from Firebase */
  title: string;
  /** Position description */
  description: string;
  /** FEN position string */
  fen: string;
  /** Available move sequences for this position */
  sequences: Record<string, MoveSequence>;
}

/**
 * Real training positions from Firebase with move sequences
 * 
 * This replaces the old trainPositions.ts data with the same interface
 * for seamless migration of existing tests.
 */
export const TRAIN_SCENARIOS: Record<string, TrainScenario> = {
  /** Training Position 1: Opposition Grundlagen */
  TRAIN_1: {
    id: 1,
    title: 'Opposition Grundlagen',
    description: 'King + Pawn vs King - Opposition fundamentals',
    fen: TEST_POSITIONS.FIREBASE_OPPOSITION_BASIC, // '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1'

    sequences: {
      WIN: {
        id: 'WIN',
        description: 'Optimal play - White wins with correct opposition',
        moves: ['Kd6', 'Kf8', 'e6', 'Ke8', 'e7', 'Kd7', 'Kf7', 'Kd6', 'e8=Q+'],
        expectedOutcome: 'win',
        expectedMistakes: 0,
      },

      WIN_TO_DRAW_MOVE_1: {
        id: 'WIN_TO_DRAW_MOVE_1',
        description: 'Immediate blunder - Kd5 throws away the win',
        moves: ['Kd5'],
        expectedOutcome: 'draw',
        expectedMistakes: 1,
      },

      WIN_TO_DRAW_MOVE_2: {
        id: 'WIN_TO_DRAW_MOVE_2',
        description: 'Late blunder - good start then Kd5 mistake',
        moves: ['Kd6', 'Kd8', 'Kd5'],
        expectedOutcome: 'draw',
        expectedMistakes: 1, // Only the last move is mistake
      },

      PAWN_PROMOTION_TO_DRAW: {
        id: 'PAWN_PROMOTION_TO_DRAW',
        description: 'Suboptimal play leads to draw despite pawn promotion to queen',
        moves: ['Kd6', 'Kf7', 'Kc7', 'Kg6', 'e6', 'Kf6', 'e7', 'Kf7', 'e8=Q+'], // White allows black king to escape
        expectedOutcome: 'draw',
        expectedMistakes: 1,
      },
    },
  },

  /** Training Position 2: Advanced KPK */
  TRAIN_2: {
    id: 2,
    title: 'König und Bauer vs König - Fortgeschritten',
    description: 'Advanced K+P vs K position - White to win',
    fen: TEST_POSITIONS.FIREBASE_KPK_ADVANCED, // '8/3k4/8/4K3/3P4/8/8/8 w - - 0 1'

    sequences: {
      WIN: {
        id: 'WIN',
        description: 'Perfect technique - support pawn advance',
        moves: [
          'Kd5',
          'Ke7',
          'Kc6',
          'Ke8',
          'Kc7',
          'Ke7',
          'd5',
          'Kf6',
          'd6',
          'Ke6',
          'd7',
          'Ke7',
          'd8=D',
        ],
        expectedOutcome: 'win',
        expectedMistakes: 0,
      },

      WIN_TO_DRAW_MOVE_1: {
        id: 'WIN_TO_DRAW_MOVE_1',
        description: 'Immediate blunder - premature pawn advance d5',
        moves: ['d5'], // Only the blunder move
        expectedOutcome: 'draw',
        expectedMistakes: 1,
      },

      WIN_TO_DRAW_MOVE_2: {
        id: 'WIN_TO_DRAW_MOVE_2',
        description: 'Good start then blunder - Kc4 throws away the win',
        moves: ['Kd5', 'Ke7', 'Kc4'], // Good start then blunder
        expectedOutcome: 'draw',
        expectedMistakes: 1,
      },

      BLACK_FINDS_BEST_DEFENSE: {
        id: 'BLACK_FINDS_BEST_DEFENSE',
        description: 'Black plays best defense - Ke8 gives DTM 25 vs DTM 23',
        moves: ['Kd5', 'Ke7', 'Kc6', 'Ke8'], // White Kd5, Black Ke7, White Kc6, Black best defense Ke8 (DTM 25)
        expectedOutcome: 'win', // Still win for white but longest resistance
        expectedMistakes: 0,
      },
    },
  },
};

/**
 * Get training scenario by position ID
 *
 * @param positionId - Firebase position ID (1, 2, etc.)
 * @returns Training scenario or null if not found
 */
export function getTrainScenario(positionId: number): TrainScenario | null {
  const scenario = Object.values(TRAIN_SCENARIOS).find(s => s.id === positionId);
  return scenario || null;
}

/**
 * Get all available training position IDs
 *
 * @returns Array of available position IDs
 */
export function getAvailableTrainPositions(): number[] {
  return Object.values(TRAIN_SCENARIOS)
    .map(s => s.id)
    .sort((a, b) => a - b);
}

/**
 * Get move sequence by position ID and sequence type
 *
 * @param positionId - Firebase position ID
 * @param sequenceType - Sequence identifier (WIN, WIN_TO_DRAW, etc.)
 * @returns Move sequence or null if not found
 */
export function getMoveSequence(positionId: number, sequenceType: string): MoveSequence | null {
  const scenario = getTrainScenario(positionId);
  if (!scenario || !scenario.sequences[sequenceType]) {
    return null;
  }
  return scenario.sequences[sequenceType];
}

/**
 * Helper function for E2E tests - get URL with move sequence
 *
 * @param positionId - Training position ID
 * @param sequenceType - Move sequence type
 * @returns URL string for E2E testing
 *
 * @example
 * ```typescript
 * const url = getE2EUrl(1, 'WIN');
 * // Returns: '/train/1?moves=Kd6,Kf8,e6,Ke8,e7,Kd7,Kf7,Kd6,e8=Q+'
 * ```
 */
export function getE2EUrl(positionId: number, sequenceType: string): string {
  const sequence = getMoveSequence(positionId, sequenceType);
  if (!sequence) {
    throw new Error(`Sequence not found: position ${positionId}, type ${sequenceType}`);
  }

  const movesParam = sequence.moves.join(',');
  return `/train/${positionId}?moves=${movesParam}`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type TestPositionKey = keyof typeof TEST_POSITIONS;
export type TestScenarioKey = keyof typeof TEST_SCENARIOS;
export type TestSequenceKey = keyof typeof TEST_SEQUENCES;

export type { TestMove, TestScenario, TestSequence };