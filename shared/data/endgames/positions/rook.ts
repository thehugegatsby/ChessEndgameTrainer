import { EndgamePosition } from '../types';

export const rookEndgames: EndgamePosition[] = [
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

  {
    id: 8,
    title: "Brückenbau Meisterklasse",
    description: "Lerne die klassische Brückenbau-Technik Schritt für Schritt. Die Tablebase zeigt andere optimale Züge, aber wir fokussieren auf die universelle Technik.",
    fen: "2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1",
    category: "rook",
    difficulty: "intermediate",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: [
        "Turm als Brücke für den König nutzen",
        "Zickzack-Lauf des Königs (Kd7-Kc6-Kb5)",
        "Turm schützt vor seitlichen Schachs",
        "König unterstützt Bauernumwandlung"
      ],
      commonMistakes: [
        "Turm zu passiv spielen",
        "König nicht aktiv genug einbeziehen",
        "Brücke zur falschen Zeit bauen",
        "Tablebase-Züge blind folgen ohne Verständnis"
      ],
      keyPrinciples: [
        "Technik vor Geschwindigkeit",
        "Universelle Muster lernen",
        "Sicher vor perfekt"
      ]
    },
    specialContent: {
      keySquares: ["d4", "c6", "b5"],
      specificTips: [
        "WICHTIG: Kd7! ist der Lehrzug - er zeigt die Brückenbau-Technik",
        "Tablebase mag Tc4/Te5 bevorzugen, aber Kd7 ist didaktisch wertvoller",
        "Nach Kd7 folgt Kc6-Kb5 mit Turmbrücke auf der 4. Reihe",
        "Diese Technik funktioniert in vielen ähnlichen Stellungen"
      ],
      criticalMoves: ["Kd7!", "Kc6", "Kb5", "Tc4"],
      historicalNote: "Die Brückenbau-Technik ist eine der wichtigsten Methoden im Turmendspiel"
    },
    tags: ["bridge-building", "teaching-priority", "universal-technique", "must-know"]
  },

  // Brückenbau-Trainer Lektionen
  {
    id: 12,
    title: "Brückenbau-Trainer: Zickzack laufen",
    description: "König läuft im Zickzack nach vorne, Turm schützt von hinten. Lerne die fundamentale Brückenbau-Technik.",
    fen: "2K5/2P2k2/8/8/4R3/8/1r6/8 w - - 0 1",
    category: "rook",
    difficulty: "beginner",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: [
        "König im Zickzack nach vorne bewegen (Kd7-Kc6-Kb5)",
        "Turm als Schutzschild von hinten nutzen",
        "Sichere Bauernumwandlung erreichen"
      ],
      commonMistakes: [
        "König zu langsam vorwärts bewegen",
        "Turm nicht als Schutz nutzen",
        "Zickzack-Muster nicht beachten"
      ],
      keyPrinciples: [
        "König führt den Angriff",
        "Turm schützt von hinten",
        "Zickzack verhindert Schachs"
      ]
    },
    specialContent: {
      keySquares: ["d7", "c6", "b5"],
      specificTips: [
        "LEHRZUG: Kd7! - König geht vorwärts im Zickzack",
        "Nach Kd7 folgt Kc6, dann Kb5",
        "Turm auf e4 schützt vor seitlichen Schachs",
        "Dies ist Schritt 1 der Brückenbau-Technik"
      ],
      criticalMoves: ["Kd7!", "Kc6", "Kb5"],
      historicalNote: "Zickzack-Lauf ist die Basis aller Brückenbau-Techniken"
    },
    // Brückenbau-spezifische Hinweise für Glühbirne
    bridgeHints: [
      "1. König Zick-Zack laufen (Kd7-Kc6-Kb5)",
      "2. Schach mit dem Turm blocken"
    ],
    tags: ["bridge-trainer", "step-1", "zickzack", "beginner-friendly"]
  },

  {
    id: 13,
    title: "Brückenbau-Trainer: Turm positionieren",
    description: "Turm erst auf die 4. oder 5. Reihe bringen, dann Brücke bauen. Lerne die Vorbereitung für den Zickzack-Lauf.",
    fen: "2K2k2/2P5/8/8/8/8/1r6/4R3 w - - 0 1",
    category: "rook",
    difficulty: "beginner",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: [
        "Turm auf 4. oder 5. Reihe positionieren",
        "Optimale Turmposition für Brückenbau finden",
        "Dann wie Schritt 1 fortfahren"
      ],
      commonMistakes: [
        "Turm auf falscher Reihe lassen",
        "Zu früh mit dem König vorgehen",
        "Turmpositionierung unterschätzen"
      ],
      keyPrinciples: [
        "Vorbereitung vor Ausführung",
        "Turm schafft die Basis",
        "Dann Zickzack-Technik anwenden"
      ]
    },
    specialContent: {
      keySquares: ["e4", "e5"],
      specificTips: [
        "LEHRZUG: Re4 oder Re5 - Turm optimal positionieren",
        "4. Reihe ist oft ideal für Brückenbau",
        "Nach Turmpositionierung folgt Kd7-Kc6-Kb5",
        "Dies ist Schritt 2 der Brückenbau-Technik"
      ],
      criticalMoves: ["Re4!", "Re5", "dann Kd7"],
      historicalNote: "Turmpositionierung ist entscheidend für erfolgreichen Brückenbau"
    },
    // Brückenbau-spezifische Hinweise für Glühbirne
    bridgeHints: [
      "1. Turm auf der 4. oder 5. Reihe positionieren",
      "2. König Zick-Zack laufen (Kd7-Kc6-Kb5)", 
      "3. Schach mit dem Turm blocken"
    ],
    tags: ["bridge-trainer", "step-2", "rook-positioning", "preparation"]
  },

  {
    id: 14,
    title: "Brückenbau-Trainer: König abdrängen",
    description: "König steht noch zentral - erst abdrängen, dann Brücke bauen. Lerne die Vorbereitung bei zentralem gegnerischen König.",
    fen: "2K1k3/2P5/8/8/8/8/1r6/7R w - - 0 1",
    category: "rook",
    difficulty: "intermediate",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: [
        "Gegnerischen König von der Mitte abdrängen",
        "Turm optimal positionieren für Abdrängen",
        "Dann Brückenbau-Technik anwenden"
      ],
      commonMistakes: [
        "Sofort mit Brückenbau beginnen",
        "Gegnerischen König ignorieren",
        "Falsche Reihenfolge der Züge"
      ],
      keyPrinciples: [
        "Abdrängen vor Brückenbau",
        "Zentrale Könige sind gefährlich",
        "Schritt für Schritt vorgehen"
      ]
    },
    specialContent: {
      keySquares: ["e1", "e4", "f8"],
      specificTips: [
        "LEHRZUG: Re1+! - König mit Schach abdrängen",
        "Nach Re1+ Kf8 folgt Re4 (Positionierung)",
        "Dann normale Brückenbau-Technik anwenden",
        "Dies ist Schritt 3 der Brückenbau-Technik"
      ],
      criticalMoves: ["Re1+!", "Kf8", "Re4"],
      historicalNote: "Königsabdrängung ist oft der erste Schritt im Brückenbau"
    },
    // Brückenbau-spezifische Hinweise für Glühbirne
    bridgeHints: [
      "1. König mit einem Turmschach abdrängen",
      "2. Turm auf der 4. oder 5. Reihe positionieren",
      "3. König Zick-Zack laufen (Kd7-Kc6-Kb5)",
      "4. Schach mit dem Turm blocken"
    ],
    tags: ["bridge-trainer", "step-3", "king-deflection", "advanced-preparation"]
  },

  {
    id: 15,
    title: "Brückenbau-Trainer: Vorbereitung komplett",
    description: "König steht zentral, Turm muss erst optimal positioniert werden. Lerne die komplette Vorbereitung für Brückenbau.",
    fen: "8/2K1k3/2P5/8/8/1r6/8/7R w - - 0 1",
    category: "rook",
    difficulty: "intermediate",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: [
        "Turm optimal positionieren",
        "Gegnerischen König abdrängen", 
        "Dann komplette Brückenbau-Technik ausführen"
      ],
      commonMistakes: [
        "Schlechte Turmpositionierung",
        "König zu früh vorgehen",
        "Reihenfolge der Schritte verwechseln"
      ],
      keyPrinciples: [
        "Erst Turm, dann König",
        "Schritt für Schritt vorgehen",
        "Alle Techniken kombinieren"
      ]
    },
    specialContent: {
      keySquares: ["h4", "e4", "f7"],
      specificTips: [
        "LEHRZUG: Rh4! - Turm auf 4. Reihe positionieren",
        "Nach Rh4 folgt Re4 (zentrale Position)",
        "Dann Königsabdrängung mit Re1+ Kf7",
        "Dies ist Schritt 4 der Brückenbau-Technik"
      ],
      criticalMoves: ["Rh4!", "Re4", "Re1+"],
      historicalNote: "Kombination aller Brückenbau-Elemente in einer Stellung"
    },
    // Brückenbau-spezifische Hinweise für Glühbirne
    bridgeHints: [
      "1. Turm optimal vorbereiten (Rh4-Re4)",
      "2. König mit einem Turmschach abdrängen", 
      "3. Turm auf der 4. oder 5. Reihe positionieren",
      "4. König Zick-Zack laufen (Kd7-Kc6-Kb5)",
      "5. Schach mit dem Turm blocken"
    ],
    tags: ["bridge-trainer", "step-4", "complete-preparation", "intermediate"]
  },

  {
    id: 16,
    title: "Brückenbau-Trainer: Meisterprüfung",
    description: "Die ultimative Herausforderung - alle Brückenbau-Techniken in einer komplexen Stellung anwenden.",
    fen: "3k4/8/2K5/2P5/8/8/1r6/7R w - - 0 1",
    category: "rook",
    difficulty: "advanced",
    goal: "win",
    sideToMove: "white",
    material: {
      white: "K+R+P",
      black: "K+R"
    },
    baseContent: {
      strategies: [
        "Komplette Brückenbau-Sequenz ausführen",
        "Alle gelernten Techniken anwenden",
        "Sichere Bauernumwandlung erreichen"
      ],
      commonMistakes: [
        "Ungeduld bei der Ausführung",
        "Einzelne Schritte überspringen",
        "Nicht systematisch vorgehen"
      ],
      keyPrinciples: [
        "Systematisches Vorgehen",
        "Alle Schritte in richtiger Reihenfolge",
        "Sicherheit vor Geschwindigkeit"
      ]
    },
    specialContent: {
      keySquares: ["h4", "e4", "c7", "b6"],
      specificTips: [
        "MEISTERPRÜFUNG: Wende alle gelernten Techniken an",
        "1. Turm positionieren (Rh4-Re4)",
        "2. König abdrängen wenn nötig", 
        "3. Zickzack-Lauf ausführen (Kc7-Kb6-Ka5)",
        "Dies ist die finale Brückenbau-Prüfung"
      ],
      criticalMoves: ["Rh4!", "Re4", "Kc7", "Kb6"],
      historicalNote: "Ultimative Brückenbau-Herausforderung für Fortgeschrittene"
    },
    // Brückenbau-spezifische Hinweise für Glühbirne
    bridgeHints: [
      "1. Komplette Turm-Vorbereitung ausführen",
      "2. König optimal abdrängen wenn zentral",
      "3. Turm auf der 4. oder 5. Reihe positionieren", 
      "4. König Zick-Zack laufen systematisch",
      "5. Alle Schachs mit dem Turm blocken",
      "6. Sichere Bauernumwandlung erreichen"
    ],
    tags: ["bridge-trainer", "step-5", "master-test", "advanced", "final-exam"]
  }
];