import { Chess } from 'chess.js';

export interface EndgamePosition {
  id: number;
  title: string;
  description: string;
  fen: string;
  category: 'pawn' | 'rook' | 'queen' | 'minor' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goal: 'win' | 'draw' | 'defend';
  sideToMove: 'white' | 'black';
  
  // Material classification for advanced menu
  material: {
    white: string;  // e.g. "K+P", "K+R", "K+Q"
    black: string;  // e.g. "K", "K+P", "K+R"
  };
  
  // Hybrid WikiPanel content
  baseContent?: {
    strategies?: string[];
    commonMistakes?: string[];
    keyPrinciples?: string[];
  };
  
  // Individual additions for special positions
  specialContent?: {
    keySquares?: string[];
    criticalMoves?: string[];
    historicalNote?: string;
    specificTips?: string[];
  };
  
  tags: string[];
  
  // User progress tracking
  userRating?: number;
  timesPlayed?: number;
  successRate?: number;
}

export interface EndgameSubcategory {
  id: string;
  name: string;
  material: string;        // "K+P vs K", "K+2P vs K+P", etc.
  icon: string;           // Chess symbols
  positions: EndgamePosition[];
}

export interface EndgameCategory {
  id: string;
  name: string;
  description: string;
  icon: string;           // ♙, ♜, ♛, ♞, ♝
  subcategories: EndgameSubcategory[];
  positions: EndgamePosition[];  // For backward compatibility
}

// All endgame positions with your provided data
export const allEndgamePositions: EndgamePosition[] = [
  // Pawn Endgames
  {
    id: 1,
    title: "Opposition Grundlagen",
    description: "Lerne das fundamentale Konzept der Opposition in Bauernendspielen. Weiß muss die Opposition erobern um zu gewinnen.",
    fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    category: "pawn",
    difficulty: "beginner",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+P",
      black: "K"
    },
    baseContent: {
      strategies: ["König vor den Bauern bringen", "Opposition erobern oder behalten", "Gegnerischen König abdrängen"],
      commonMistakes: ["Bauern zu früh vorschieben", "Opposition verlieren", "König zu passiv spielen"],
      keyPrinciples: ["König ist wichtiger als Bauer", "Opposition entscheidet über Gewinn", "Aktivität vor Material"]
    },
    specialContent: {
      keySquares: ["d6", "e6", "f6"],
      specificTips: ["Ziehe den König vorwärts um Raum zu gewinnen", "Lass den Gegner zuerst ziehen wenn möglich"],
      criticalMoves: ["Kf6", "Ke6", "Kd6"]
    },
    tags: ["opposition", "must-know", "fundamental", "king-activity"]
  },
  
  {
    id: 2,
    title: "Opposition Fortgeschritten",
    description: "Erweiterte Opposition-Technik mit seitlicher Königsstellung. Weiß muss präzise spielen um zu gewinnen.",
    fen: "8/8/8/4k3/8/8/4PK2/8 w - - 0 1",
    category: "pawn",
    difficulty: "intermediate",
    goal: "win", 
    sideToMove: "white",
    material: {
      white: "K+P",
      black: "K"
    },
    baseContent: {
      strategies: ["König vor den Bauern bringen", "Opposition erobern oder behalten", "Gegnerischen König abdrängen"],
      commonMistakes: ["Bauern zu früh vorschieben", "Opposition verlieren", "König zu passiv spielen"],
      keyPrinciples: ["König ist wichtiger als Bauer", "Opposition entscheidet über Gewinn", "Aktivität vor Material"]
    },
    specialContent: {
      specificTips: ["Nutze die seitliche Position des Königs", "Zwinge den schwarzen König zu entscheiden"],
      criticalMoves: ["Ke3", "Kf3", "e4"]
    },
    tags: ["opposition", "intermediate", "king-activity", "pawn-push"]
  },

  {
    id: 3,
    title: "Entfernte Opposition",
    description: "Opposition bei größerer Distanz zwischen den Königen. Berechne präzise um den Durchbruch zu schaffen.",
    fen: "5k2/8/8/8/1P6/8/8/3K4 w - - 0 1",
    category: "pawn",
    difficulty: "intermediate",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+P",
      black: "K"
    },
    baseContent: {
      strategies: ["König vor den Bauern bringen", "Opposition erobern oder behalten", "Gegnerischen König abdrängen"],
      commonMistakes: ["Bauern zu früh vorschieben", "Opposition verlieren", "König zu passiv spielen"],
      keyPrinciples: ["König ist wichtiger als Bauer", "Opposition entscheidet über Gewinn", "Aktivität vor Material"]
    },
    specialContent: {
      specificTips: ["Berechne die Königsdistanz genau", "Der nähere König gewinnt meist"],
      criticalMoves: ["Kc2", "Kb2", "b5"]
    },
    tags: ["opposition", "distant-opposition", "calculation", "king-race"]
  },

  // Rook Endgames  
  {
    id: 4,
    title: "Brückenbau Technik",
    description: "Die fundamentale Brückenbau-Technik im Turmendspiel. Weiß gewinnt durch geschickte Turmmanöver.",
    fen: "2K1k3/2P5/8/8/8/6R1/1r6/8 w - - 0 1",
    category: "rook",
    difficulty: "intermediate", 
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: ["Turm aktivieren", "Brücke bauen", "König einbeziehen", "Schach geben zur richtigen Zeit"],
      commonMistakes: ["Passiver Turm", "König zu weit entfernt", "Falsches Timing beim Schach"],
      keyPrinciples: ["Turm von hinten", "König unterstützt Freibauer", "Aktivität vor Material"]
    },
    specialContent: {
      specificTips: ["Baue eine Brücke für den König", "Nutze den Turm als Schild"],
      criticalMoves: ["Rg4", "Rc4", "Kd7"]
    },
    tags: ["bridge-building", "rook-activity", "king-support", "must-know"]
  },

  {
    id: 5,
    title: "Philidor Verteidigung",
    description: "Die berühmte Philidor-Stellung. Schwarz hält Remis durch passive Verteidigung mit dem Turm.",
    fen: "2k5/7R/6r1/2KP4/8/8/8/8 b - - 0 1",
    category: "rook",
    difficulty: "advanced",
    goal: "draw",
    sideToMove: "black",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: ["Turm aktivieren", "Brücke bauen", "König einbeziehen", "Schach geben zur richtigen Zeit"],
      commonMistakes: ["Passiver Turm", "König zu weit entfernt", "Falsches Timing beim Schach"],
      keyPrinciples: ["Turm von hinten", "König unterstützt Freibauer", "Aktivität vor Material"]
    },
    specialContent: {
      specificTips: ["Halte den Turm passiv auf der 6. Reihe", "Verhindere den Königsvormarsch"],
      criticalMoves: ["Rg1", "Rg2", "Kd7"],
      historicalNote: "Benannt nach André Philidor (1726-1795), dem ersten großen Schachtheoretiker"
    },
    tags: ["philidor", "passive-defense", "draw", "historical", "must-know"]
  },

  {
    id: 6,
    title: "Passive Turmverteidigung",
    description: "Klassische passive Verteidigung im Turmendspiel. Schwarz hält durch präzise Verteidigung Remis.",
    fen: "1kr5/8/7R/KP6/8/8/8/8 b - - 0 1",
    category: "rook",
    difficulty: "intermediate",
    goal: "draw", 
    sideToMove: "black",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: ["Turm aktivieren", "Brücke bauen", "König einbeziehen", "Schach geben zur richtigen Zeit"],
      commonMistakes: ["Passiver Turm", "König zu weit entfernt", "Falsches Timing beim Schach"],
      keyPrinciples: ["Turm von hinten", "König unterstützt Freibauer", "Aktivität vor Material"]
    },
    specialContent: {
      specificTips: ["Halte den Turm hinter dem Freibauer", "Gib Schach wenn der König zu aktiv wird"],
      criticalMoves: ["Rc1+", "Rb1+", "Kc7"]
    },
    tags: ["passive-defense", "rook-behind", "draw", "defensive-technique"]
  },
  
  // Neue Triangulation-Stellung
  {
    id: 7,
    title: "Triangulation",
    description: "Klassische Triangulation-Technik um Zugzwang zu erzeugen. Weiß muss 'ein Tempo verlieren' um zu gewinnen.",
    fen: "2k5/8/p1P5/P2K4/8/8/8/8 w - - 0 1",
    category: "pawn",
    difficulty: "advanced",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+2P",
      black: "K+P"
    },
    baseContent: {
      strategies: ["König vor den Bauern bringen", "Opposition erobern oder behalten", "Gegnerischen König abdrängen"],
      commonMistakes: ["Bauern zu früh vorschieben", "Opposition verlieren", "König zu passiv spielen"],
      keyPrinciples: ["König ist wichtiger als Bauer", "Opposition entscheidet über Gewinn", "Aktivität vor Material"]
    },
    specialContent: {
      keySquares: ["d5", "c5", "c4"],
      specificTips: [
        "Verwende Triangulation: Kd5-Kc4-Kc5-Kd5 um Zugzwang zu erzeugen", 
        "Zwinge den schwarzen König zu entscheiden",
        "Das Ziel ist es, die gleiche Stellung mit dem Gegner am Zug zu erreichen"
      ],
      criticalMoves: ["Kc4!", "Kc5", "Kd5"],
      historicalNote: "Triangulation ist eine fundamentale Endgame-Technik um Tempo zu verlieren"
    },
    tags: ["triangulation", "zugzwang", "advanced-opposition", "tempo", "must-know", "calculation"]
  }
];

// Create subcategories based on material
function createSubcategories(category: string): EndgameSubcategory[] {
  const positions = allEndgamePositions.filter(p => p.category === category);
  const materialGroups = new Map<string, EndgamePosition[]>();
  
  positions.forEach(pos => {
    const materialKey = `${pos.material.white} vs ${pos.material.black}`;
    if (!materialGroups.has(materialKey)) {
      materialGroups.set(materialKey, []);
    }
    materialGroups.get(materialKey)!.push(pos);
  });
  
  return Array.from(materialGroups.entries()).map(([material, positions]) => ({
    id: `${category}-${material.replace(/\+/g, '').replace(/\s/g, '-').toLowerCase()}`,
    name: material,
    material,
    icon: getIconForMaterial(material),
    positions
  }));
}

function getIconForMaterial(material: string): string {
  if (material.includes('K+P vs K')) return '♙♟ vs ♙';
  if (material.includes('K+2P vs K+P')) return '♙♟♟ vs ♙♟';
  if (material.includes('K+R+P vs K+R')) return '♜♙ vs ♜';
  return '♙♟';
}

// Categories with new structure
export const endgameCategories: EndgameCategory[] = [
  {
    id: "pawn",
    name: "Bauernendspiele", 
    description: "Fundamentale Endspiele mit Bauern und Königen",
    icon: "♙",
    subcategories: createSubcategories("pawn"),
    positions: allEndgamePositions.filter(p => p.category === "pawn")
  },
  {
    id: "rook",
    name: "Turmendspiele",
    description: "Wichtige Endspiele mit Türmen", 
    icon: "♜",
    subcategories: createSubcategories("rook"),
    positions: allEndgamePositions.filter(p => p.category === "rook")
  }
];

// Utility functions
export function getPositionById(id: number): EndgamePosition | undefined {
  return allEndgamePositions.find(p => p.id === id);
}

export function getPositionsByCategory(category: string): EndgamePosition[] {
  return allEndgamePositions.filter(p => p.category === category);
}

export function validateFen(fen: string): boolean {
  try {
    const chess = new Chess();
    chess.load(fen);
    return true;
  } catch {
    return false;
  }
}

// Export for backward compatibility
export const chapters = endgameCategories; 