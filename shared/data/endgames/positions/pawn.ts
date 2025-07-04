import { EndgamePosition } from '../types';

export const pawnEndgames: EndgamePosition[] = [
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