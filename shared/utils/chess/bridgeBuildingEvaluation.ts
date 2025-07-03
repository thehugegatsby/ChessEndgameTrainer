import { 
  EnhancedEvaluationDisplay,
  MoveQualityClass,
  RobustnessTag
} from '@shared/types';

/**
 * Special evaluation for Bridge Building training positions
 * Prioritizes didactic value over computer-optimal moves
 */

interface BridgeBuildingMove {
  move: string;
  category: 'didactic' | 'alternative' | 'incorrect';
  qualityClass: MoveQualityClass;
  feedback: string;
  shouldContinue: boolean;
}

// Position-specific move evaluations for Bridge Building scenarios
const BRIDGE_BUILDING_POSITIONS: Record<string, BridgeBuildingMove[]> = {
  // Starting position: 2K5/2P2k2/8/8/4R3/8/1r6/8 w
  '2K5/2P2k2/8/8/4R3/8/1r6/8 w': [
    {
      move: 'Kd7',
      category: 'didactic',
      qualityClass: 'optimal',
      feedback: 'Exzellent! Kd7 ist der Schlüsselzug. Du beginnst mit dem klassischen Brückenbau - der sicherste und lehrreichste Weg zum Sieg. Diese Methode funktioniert in vielen ähnlichen Stellungen.',
      shouldContinue: true
    },
    {
      move: 'Rc4',
      category: 'alternative',
      qualityClass: 'sicher',
      feedback: 'Gut gesehen! Rc4 führt ebenfalls zum Gewinn. Für diese Lektion konzentrieren wir uns aber auf die universelle "Brückenbau"-Technik mit dem König-Zickzack. Sie ist leichter zu merken und in mehr Situationen anwendbar. Versuchen wir den Zug, der die Brücke für den König vorbereitet.',
      shouldContinue: false
    },
    {
      move: 'Re5',
      category: 'alternative',
      qualityClass: 'sicher',
      feedback: 'Richtig erkannt! Re5 gewinnt auch. Die Tablebase mag diesen Zug bevorzugen, aber für unser Training ist der König-Zickzack (Kd7) didaktisch wertvoller. Lass uns die klassische Technik üben!',
      shouldContinue: false
    },
    {
      move: 'Re1',
      category: 'alternative',
      qualityClass: 'sicher',
      feedback: 'Re1 ist ein solider Gewinnzug. Aber die Brückenbau-Technik beginnt traditionell mit Kd7. Diese Methode ist universeller und in mehr Stellungen anwendbar. Versuche es nochmal!',
      shouldContinue: false
    }
  ],
  
  // After Kd7 Rb7: 3K4/1rP1k3/8/8/4R3/8/8/8 w
  '3K4/1rP1k3/8/8/4R3/8/8/8 w': [
    {
      move: 'Kc6',
      category: 'didactic', 
      qualityClass: 'optimal',
      feedback: 'Perfekt! Der König setzt seinen Zickzack-Lauf fort. Kc6 bereitet die finale Brücke vor. Der schwarze Turm kann nicht mehr effektiv stören.',
      shouldContinue: true
    },
    {
      move: 'Rc4',
      category: 'alternative',
      qualityClass: 'sicher',
      feedback: 'Rc4 gewinnt auch, aber wir wollen erst den König optimal platzieren. Kc6 ist der nächste Schritt im Brückenbau-Plan.',
      shouldContinue: false
    }
  ],
  
  // After Kc6 Rb1: 8/2PK4/8/4k3/4R3/8/8/1r6 w
  '8/2PK4/8/4k3/4R3/8/8/1r6 w': [
    {
      move: 'Kb5',
      category: 'didactic',
      qualityClass: 'optimal',
      feedback: 'Ausgezeichnet! Jetzt ist der König bereit für die Brücke. Als nächstes kommt der entscheidende Turmzug.',
      shouldContinue: true
    },
    {
      move: 'Rc4',
      category: 'alternative',
      qualityClass: 'sicher',
      feedback: 'Rc4 ist verfrüht. Erst Kb5, dann die Brücke mit Rc4. Die Reihenfolge ist wichtig für das Verständnis!',
      shouldContinue: false
    }
  ],
  
  // After Kb5 Rb1+: 8/2P5/8/1K2k3/4R3/8/8/1r6 w
  '8/2P5/8/1K2k3/4R3/8/8/1r6 w': [
    {
      move: 'Rc4',
      category: 'didactic',
      qualityClass: 'optimal',
      feedback: 'Brillant! Die Brücke ist gebaut! Der Turm auf c4 schützt den König vor Schachs von der Seite. Jetzt kann c8=Q nicht mehr verhindert werden.',
      shouldContinue: true
    },
    {
      move: 'Ka4',
      category: 'incorrect',
      qualityClass: 'fehler',
      feedback: 'Ka4? Das gibt die Kontrolle auf. Jetzt kann Schwarz mit Schachs den Bauern aufhalten. Die Brücke muss JETZT mit Rc4 gebaut werden!',
      shouldContinue: false
    }
  ]
};

/**
 * Evaluate moves for Bridge Building training
 * Returns enhanced evaluation with didactic feedback
 */
export function evaluateBridgeBuildingMove(
  fen: string,
  move: string
): BridgeBuildingMove | null {
  const fenKey = fen.split(' - ')[0] + ' w'; // Normalize FEN for lookup
  const positionMoves = BRIDGE_BUILDING_POSITIONS[fenKey];
  
  if (!positionMoves) {
    return null; // Not a tracked bridge building position
  }
  
  // Find the specific move evaluation
  const moveEval = positionMoves.find(m => 
    m.move.toLowerCase() === move.toLowerCase() ||
    m.move === move
  );
  
  if (moveEval) {
    return moveEval;
  }
  
  // Default for untracked moves in bridge building positions
  return {
    move: move,
    category: 'incorrect',
    qualityClass: 'fehler',
    feedback: 'Dieser Zug hilft nicht beim Brückenbau. Denk daran: König-Zickzack (Kd7-Kc6-Kb5) gefolgt von der Turmbrücke (Rc4).',
    shouldContinue: false
  };
}

/**
 * Convert Bridge Building evaluation to Enhanced Display format
 */
export function bridgeBuildingToEnhancedDisplay(
  bridgeEval: BridgeBuildingMove
): EnhancedEvaluationDisplay {
  const displayMap: Record<MoveQualityClass, { text: string; className: string; color: string; bgColor: string }> = {
    optimal: { 
      text: '🟢', 
      className: 'eval-optimal',
      color: 'var(--success-text)',
      bgColor: 'var(--success-bg)'
    },
    sicher: { 
      text: '✅', 
      className: 'eval-sicher',
      color: 'var(--success-text)',
      bgColor: 'var(--success-bg)'
    },
    umweg: { 
      text: '🟡', 
      className: 'eval-umweg',
      color: 'var(--warning-text)',
      bgColor: 'var(--warning-bg)'
    },
    riskant: { 
      text: '⚠️', 
      className: 'eval-riskant',
      color: 'var(--warning-text)',
      bgColor: 'var(--warning-bg)'
    },
    fehler: { 
      text: '🚨', 
      className: 'eval-fehler',
      color: 'var(--error-text)',
      bgColor: 'var(--error-bg)'
    }
  };
  
  const display = displayMap[bridgeEval.qualityClass];
  
  return {
    text: display.text,
    className: display.className,
    color: display.color,
    bgColor: display.bgColor,
    qualityClass: bridgeEval.qualityClass,
    educationalTip: bridgeEval.feedback
  };
}