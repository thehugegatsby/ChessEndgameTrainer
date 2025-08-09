# Unified Chess Test Fixture Architecture

## Problem Analysis

We currently have **4 fragmented scenario systems** across the codebase:

1. **Basic FENs** (`fenPositions.ts`) - Static positions
2. **Move Sequences** (`fenPositions.ts`) - WIN TO DRAW scenarios
3. **E2E Scenarios** (`promotionScenarios.ts`) - Test configurations
4. **Training Scenarios** (`TestScenarios.ts`) - Complete endgame solutions

## Unified Architecture Proposal

### 🏗️ **Core Structure: TestFenAsset**

```typescript
interface TestFenAsset {
  // STORED metadata (not derived)
  id: string;
  name: string;
  description: string;
  tags: string[];

  // Position data with EXPLICIT piece placement
  startFen: string;
  pieceLayout: PieceLayout; // NEW: Explicit piece description for safety

  // Scenario data (optional)
  moveSequence?: MoveScenario;

  // Training data (optional)
  training?: TrainingData;

  // Test configuration (optional)
  testConfig?: TestConfiguration;
}

interface PieceLayout {
  white: PiecePositions;
  black: PiecePositions;
  toMove: "white" | "black";
  castling?: CastlingRights;
  enPassant?: string;
  halfmove?: number;
  fullmove?: number;
}

interface PiecePositions {
  king: string; // e.g. "e1"
  queens?: string[]; // e.g. ["d1"]
  rooks?: string[]; // e.g. ["a1", "h1"]
  bishops?: string[]; // e.g. ["c1", "f1"]
  knights?: string[]; // e.g. ["b1", "g1"]
  pawns?: string[]; // e.g. ["a2", "b2", "c2", ...]
}

interface CastlingRights {
  whiteKingside?: boolean;
  whiteQueenside?: boolean;
  blackKingside?: boolean;
  blackQueenside?: boolean;
}

interface MoveScenario {
  moves: string[];
  checkpoints?: PositionCheckpoint[];
  expectedOutcome: "win" | "draw" | "loss" | "continue";
  outcomeAfterMove?: number; // Which move triggers the outcome
}

interface PositionCheckpoint {
  afterMove: number;
  fen: string;
  wdl?: number;
  dtm?: number;
  category?: string;
  description?: string;
}

interface TrainingData {
  difficulty: "beginner" | "intermediate" | "advanced";
  endgameType: string;
  targetMoves: number;
  goal: "win" | "draw" | "defend";
  hints: string[];
  solution: string[];
}

interface TestConfiguration {
  usage: "unit" | "integration" | "e2e" | "all";
  expectations?: TestExpectation[];
  mockConfig?: MockConfiguration;
}
```

### 📚 **Scenario Categories**

#### **1. WIN-TO-DRAW Scenarios**

```typescript
const WIN_TO_DRAW_KPK: TestFenAsset = {
  id: "kpk-win-to-draw-classic",
  name: "KPK: Winning Position Thrown Away",
  description:
    "White has winning opposition but plays wrong move leading to draw",
  tags: ["kpk", "win-to-draw", "opposition", "mistakes"],

  startFen: "K7/P7/k7/8/8/8/8/8 w - - 0 1",

  // EXPLICIT piece layout for safety
  pieceLayout: {
    white: {
      king: "a8", // White King on a8
      pawns: ["a7"], // White Pawn on a7
    },
    black: {
      king: "a6", // Black King on a6
    },
    toMove: "white",
    castling: {}, // No castling rights
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1,
  },

  moveSequence: {
    moves: [
      "Ka8", // ERROR! Wrong move, loses the win
      "Ka6", // Black gains opposition
      "Kb8", // Forced
      "Kb6", // Draw position reached
    ],
    checkpoints: [
      {
        afterMove: 0,
        fen: "1K6/P7/k7/8/8/8/8/8 b - - 1 1",
        wdl: 0, // Now draw instead of win
        category: "draw",
        description: "White has thrown away the win",
      },
    ],
    expectedOutcome: "draw",
    outcomeAfterMove: 0,
  },

  training: {
    difficulty: "intermediate",
    endgameType: "KPK",
    targetMoves: 1, // User should avoid this mistake
    goal: "win",
    hints: ["Korrekt wäre Kb8 mit Opposition"],
    solution: ["Kb8", "Kd6", "Kc7"], // Correct winning line
  },
};
```

#### **2. DRAW-TO-WIN Scenarios**

```typescript
const DRAW_TO_WIN_KPK: TestFenAsset = {
  id: "kpk-draw-to-win-mistake",
  name: "KPK: Defense Error Leads to Loss",
  description:
    "Black has drawing position but makes mistake allowing white to win",
  tags: ["kpk", "draw-to-win", "defensive-error", "opposition"],

  startFen: "8/8/8/3k4/8/2KP4/8/8 w - - 0 1",

  // EXPLICIT piece layout for safety
  pieceLayout: {
    white: {
      king: "c3", // White King on c3
      pawns: ["d3"], // White Pawn on d3
    },
    black: {
      king: "d5", // Black King on d5
    },
    toMove: "white",
    castling: {}, // No castling rights
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1,
  },

  moveSequence: {
    moves: [
      "Kd4", // White advances
      "Ke6??", // ERROR! Black moves wrong, loses draw
      "Kc5", // White gains winning opposition
      "Kd7", // Forced retreat
      "Kb6", // White supports pawn
      "d4", // Pawn advances - now winning
    ],
    expectedOutcome: "win", // For white (opponent made mistake)
    outcomeAfterMove: 1,
  },

  training: {
    difficulty: "advanced",
    endgameType: "KPK",
    goal: "defend", // User should defend the draw
    hints: ["Kd5 hält das Remis, nie Ke6!"],
    solution: ["Kd4", "Kd5!", "Kc4", "Kc6"], // Correct drawing defense
  },
};
```

#### **3. Promotion Scenarios with German Notation**

```typescript
const GERMAN_PROMOTION_SCENARIO: TestFenAsset = {
  id: "promotion-german-dame",
  name: "German Promotion: Dame (Queen)",
  description: 'Test German notation "D" for Dame (Queen) promotion',
  tags: ["promotion", "german-notation", "dame", "e2e"],

  startFen: "8/5P2/8/8/k7/8/K7/8 w - - 0 1",

  // EXPLICIT piece layout for safety
  pieceLayout: {
    white: {
      king: "a2", // White King on a2
      pawns: ["f7"], // White Pawn on f7 (ready to promote)
    },
    black: {
      king: "a5", // Black King on a5
    },
    toMove: "white",
    castling: {}, // No castling rights
    enPassant: undefined,
    halfmove: 0,
    fullmove: 1,
  },

  moveSequence: {
    moves: ["f7f8D"], // German notation! (from-to-piece format)
    expectedOutcome: "continue",
  },

  testConfig: {
    usage: "e2e",
    expectations: [
      {
        type: "move-accepted",
        afterMove: 0,
        data: { moveNotation: "f7f8D", normalizedTo: "f8=Q" },
      },
    ],
  },
};
```

### 🔄 **Migration Strategy**

1. **Create unified `testFixtures.ts`** with new structure
2. **Migration helpers** to convert existing formats
3. **Backward compatibility** during transition period
4. **Gradual adoption** across test suites

### 📊 **Benefits**

- ✅ **Single Source of Truth** for all scenarios
- ✅ **Rich metadata** without derived/computed values
- ✅ **WIN-TO-DRAW scenarios** properly modeled
- ✅ **German notation** support built-in
- ✅ **EXPLICIT piece layout** prevents FEN misinterpretation
- ✅ **Flexible test configurations**
- ✅ **Easy discovery** by tags and categories
- ✅ **Comprehensive training data**
- ✅ **FEN validation** through explicit piece positions

### 🚀 **Implementation Plan**

1. **Design validation** with user feedback
2. **Core interface** implementation
3. **Key scenarios** migration (WIN-TO-DRAW first)
4. **Test suite** updates
5. **Legacy cleanup** once migration complete

---

**Question for review:** Should we proceed with this unified architecture?
